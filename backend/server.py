from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import uuid
import httpx
import subprocess
import asyncio
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ===== M3U Parser =====
def parse_m3u(content: str, playlist_id: str = "default") -> list:
    channels = []
    lines = content.strip().split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('#EXTINF:'):
            match = re.search(r'group-title="([^"]*)",(.*)', line)
            if match and i + 1 < len(lines):
                group = match.group(1).strip()
                name = match.group(2).strip()
                url = lines[i + 1].strip()
                if url and not url.startswith('#'):
                    channels.append({
                        'id': str(uuid.uuid4()),
                        'name': name,
                        'group': group,
                        'url': url,
                        'playlist_id': playlist_id
                    })
                i += 2
                continue
        i += 1
    return channels


# ===== Startup =====
@app.on_event("startup")
async def startup():
    count = await db.channels.count_documents({})
    if count == 0:
        m3u_path = ROOT_DIR / 'kanallar.m3u'
        if m3u_path.exists():
            content = m3u_path.read_text(encoding='utf-8')
            channels = parse_m3u(content, "default")
            if channels:
                await db.channels.insert_many(channels)
                await db.playlists.insert_one({
                    'id': 'default',
                    'name': 'ElensarTV Kanalları',
                    'source': 'builtin',
                    'channel_count': len(channels),
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
                logger.info(f"Seeded {len(channels)} channels")
    await db.channels.create_index("group")
    await db.channels.create_index([("name", 1)])
    await db.favorites.create_index("channel_id", unique=True)
    await db.watch_history.create_index([("watched_at", -1)])


# ===== Channel Endpoints =====
@api_router.get("/channels")
async def get_channels(
    group: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if group:
        query['group'] = group
    if search:
        query['name'] = {'$regex': search, '$options': 'i'}
    total = await db.channels.count_documents(query)
    channels = await db.channels.find(query, {'_id': 0}).skip(skip).limit(limit).to_list(limit)
    return {'channels': channels, 'total': total, 'skip': skip, 'limit': limit}


@api_router.get("/channels/categories")
async def get_categories():
    pipeline = [
        {'$group': {'_id': '$group', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    result = await db.channels.aggregate(pipeline).to_list(100)
    return [{'name': c['_id'], 'count': c['count']} for c in result]


@api_router.post("/channels/resolve")
async def resolve_channel(data: dict):
    url = data.get('url', '')
    if not url:
        raise HTTPException(status_code=400, detail="URL required")
    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            resp = await http.post(
                'https://vavoo.to/mediahubmx-resolve.json',
                headers={'User-Agent': 'MediaHubMX/2', 'Content-Type': 'application/json'},
                json={'language': 'tr', 'region': 'TR', 'url': url, 'clientVersion': '3.0.3'}
            )
            result = resp.json()
            if result and isinstance(result, list) and len(result) > 0:
                return {'stream_url': result[0].get('url', ''), 'name': result[0].get('name', '')}
            return {'error': 'Could not resolve', 'stream_url': ''}
    except Exception as e:
        logger.error(f"Resolve error: {e}")
        return {'error': str(e), 'stream_url': ''}


@api_router.get("/player", response_class=HTMLResponse)
async def player_page(stream_url: str):
    safe_url = stream_url.replace('"', '&quot;').replace("'", "\\'")
    html = f"""<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#000;width:100vw;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center}}
video{{width:100%;height:100%;object-fit:contain}}
#s{{color:#B0BEC5;position:absolute;font-family:-apple-system,sans-serif;font-size:15px;text-align:center;z-index:10}}
.err{{color:#FF5722}}
#playBtn{{position:absolute;z-index:20;width:80px;height:80px;border-radius:50%;background:rgba(255,87,34,0.9);border:none;cursor:pointer;display:none;align-items:center;justify-content:center}}
#playBtn:after{{content:'';display:block;width:0;height:0;margin-left:6px;border-style:solid;border-width:18px 0 18px 30px;border-color:transparent transparent transparent #fff}}
</style>
</head><body>
<div id="s">Yükleniyor...</div>
<button id="playBtn"></button>
<video id="v" controls playsinline muted></video>
<script>
var v=document.getElementById('v'),s=document.getElementById('s'),pb=document.getElementById('playBtn');
var streamUrl="{safe_url}";

v.addEventListener('playing',function(){{s.style.display='none';pb.style.display='none';v.muted=false}});
v.addEventListener('canplay',function(){{
  s.style.display='none';
  v.play().then(function(){{v.muted=false}}).catch(function(){{
    pb.style.display='flex';
  }});
}});

pb.addEventListener('click',function(){{
  v.muted=false;
  v.play();
  pb.style.display='none';
}});

function tryHls(){{
  if(typeof Hls!=='undefined'&&Hls.isSupported()){{
    console.log('Using HLS.js');
    var h=new Hls({{
      enableWorker:false,
      lowLatencyMode:false,
      maxBufferLength:30,
      maxMaxBufferLength:60,
      startLevel:-1,
      debug:false,
      progressive:true,
      forceKeyFrameOnDiscontinuity:true
    }});
    h.loadSource(streamUrl);
    h.attachMedia(v);

    var mediaErrorCount=0;
    h.on(Hls.Events.MANIFEST_PARSED,function(){{
      console.log('Manifest parsed');
      v.play().catch(function(){{pb.style.display='flex'}});
    }});
    h.on(Hls.Events.ERROR,function(event,data){{
      if(data.fatal){{
        if(data.type===Hls.ErrorTypes.MEDIA_ERROR){{
          mediaErrorCount++;
          if(mediaErrorCount<=3){{
            console.log('Media error recovery attempt '+mediaErrorCount);
            h.recoverMediaError();
          }}else{{
            console.log('Too many media errors, trying ffmpeg proxy...');
            h.destroy();
            tryFfmpegProxy();
          }}
        }}else if(data.type===Hls.ErrorTypes.NETWORK_ERROR){{
          h.startLoad();
        }}else{{
          s.className='err';
          s.textContent='Oynatma hatası';
          h.destroy();
        }}
      }}
    }});
  }}else if(v.canPlayType('application/vnd.apple.mpegurl')){{
    v.src=streamUrl;
    v.play().catch(function(){{pb.style.display='flex'}});
  }}else{{
    s.className='err';s.textContent='HLS desteklenmiyor';
  }}
}}

function tryFfmpegProxy(){{
  console.log('Using ffmpeg proxy fallback');
  s.textContent='Stream yeniden yükleniyor...';
  s.style.display='block';
  s.className='';
  var proxyUrl=window.location.origin+'/api/stream-proxy?url='+encodeURIComponent(streamUrl);
  v.src=proxyUrl;
  v.play().catch(function(){{pb.style.display='flex'}});
}}

tryHls();
</script>
</body></html>"""
    return HTMLResponse(content=html)


@api_router.get("/stream-proxy")
async def stream_proxy(stream_url: str = None, url: str = None):
    target_url = stream_url or url
    if not target_url:
        raise HTTPException(status_code=400, detail="URL required")

    async def generate():
        process = await asyncio.create_subprocess_exec(
            'ffmpeg',
            '-user_agent', 'libmpv',
            '-i', target_url,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-f', 'mpegts',
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
            '-y',
            'pipe:1',
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL
        )
        try:
            while True:
                chunk = await process.stdout.read(65536)
                if not chunk:
                    break
                yield chunk
        finally:
            try:
                process.kill()
            except Exception:
                pass

    return StreamingResponse(
        generate(),
        media_type='video/mp2t',
        headers={
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
        }
    )


# ===== Favorites =====
@api_router.get("/favorites")
async def get_favorites():
    return await db.favorites.find({}, {'_id': 0}).sort('created_at', -1).to_list(1000)


@api_router.post("/favorites")
async def add_favorite(data: dict):
    channel_id = data.get('channel_id')
    if await db.favorites.find_one({'channel_id': channel_id}):
        return {'message': 'Already exists'}
    doc = {
        'id': str(uuid.uuid4()),
        'channel_id': channel_id,
        'channel_name': data.get('channel_name', ''),
        'channel_group': data.get('channel_group', ''),
        'channel_url': data.get('channel_url', ''),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.favorites.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}


@api_router.delete("/favorites/{channel_id}")
async def remove_favorite(channel_id: str):
    result = await db.favorites.delete_one({'channel_id': channel_id})
    if result.deleted_count:
        return {'message': 'Removed'}
    raise HTTPException(status_code=404, detail="Not found")


# ===== Watch History =====
@api_router.get("/history")
async def get_history():
    return await db.watch_history.find({}, {'_id': 0}).sort('watched_at', -1).to_list(30)


@api_router.post("/history")
async def add_to_history(data: dict):
    channel_id = data.get('channel_id')
    await db.watch_history.delete_many({'channel_id': channel_id})
    doc = {
        'id': str(uuid.uuid4()),
        'channel_id': channel_id,
        'channel_name': data.get('channel_name', ''),
        'channel_group': data.get('channel_group', ''),
        'channel_url': data.get('channel_url', ''),
        'watched_at': datetime.now(timezone.utc).isoformat()
    }
    await db.watch_history.insert_one(doc)
    return {'message': 'Added'}


# ===== Playlists =====
@api_router.get("/playlists")
async def get_playlists():
    return await db.playlists.find({}, {'_id': 0}).to_list(100)


@api_router.post("/playlists")
async def add_playlist(data: dict):
    url = data.get('url', '')
    name = data.get('name', 'Custom Playlist')
    try:
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.get(url)
            content = resp.text
        playlist_id = str(uuid.uuid4())
        channels = parse_m3u(content, playlist_id)
        if not channels:
            raise HTTPException(status_code=400, detail="No channels found")
        await db.channels.insert_many(channels)
        doc = {
            'id': playlist_id, 'name': name, 'source': url,
            'channel_count': len(channels),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.playlists.insert_one(doc)
        return {'message': f'{len(channels)} kanal eklendi', 'playlist': {k: v for k, v in doc.items() if k != '_id'}}
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/playlists/upload")
async def upload_playlist(file: UploadFile = File(...)):
    content = await file.read()
    content_str = content.decode('utf-8')
    playlist_id = str(uuid.uuid4())
    channels = parse_m3u(content_str, playlist_id)
    if not channels:
        raise HTTPException(status_code=400, detail="No channels found")
    await db.channels.insert_many(channels)
    doc = {
        'id': playlist_id, 'name': file.filename or 'Uploaded',
        'source': 'upload', 'channel_count': len(channels),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.playlists.insert_one(doc)
    return {'message': f'{len(channels)} kanal eklendi', 'playlist': {k: v for k, v in doc.items() if k != '_id'}}


@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str):
    if playlist_id == 'default':
        raise HTTPException(status_code=400, detail="Cannot delete default")
    await db.channels.delete_many({'playlist_id': playlist_id})
    r = await db.playlists.delete_one({'id': playlist_id})
    if r.deleted_count:
        return {'message': 'Deleted'}
    raise HTTPException(status_code=404, detail="Not found")


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
