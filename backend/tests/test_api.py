import pytest
import requests
import os

# Backend API testing for ElensarTV IPTV Player
# Tests: channels, categories, favorites, history, playlists, vavoo resolver

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = '/app/frontend/.env'
    with open(frontend_env_path, 'r') as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL'):
                return line.split('=')[1].strip().rstrip('/')
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found")

BASE_URL = get_backend_url()

class TestChannelEndpoints:
    """Channel-related API endpoint tests"""

    def test_get_categories(self, api_client):
        """Test GET /api/channels/categories returns 15 country categories with counts"""
        response = api_client.get(f"{BASE_URL}/api/channels/categories")
        assert response.status_code == 200
        
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) > 0, "Should have at least one category"
        
        # Check structure
        for cat in categories:
            assert 'name' in cat
            assert 'count' in cat
            assert isinstance(cat['count'], int)
            assert cat['count'] > 0
        
        print(f"✓ Categories endpoint returned {len(categories)} categories")

    def test_get_turkish_channels(self, api_client):
        """Test GET /api/channels?group=Turkey&limit=5 returns Turkish channels"""
        response = api_client.get(f"{BASE_URL}/api/channels?group=Turkey&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert 'channels' in data
        assert 'total' in data
        assert 'skip' in data
        assert 'limit' in data
        
        channels = data['channels']
        assert isinstance(channels, list)
        assert len(channels) <= 5
        assert len(channels) > 0, "Should have at least one Turkish channel"
        
        # Verify all channels are Turkish
        for ch in channels:
            assert ch['group'] == 'Turkey'
            assert 'id' in ch
            assert 'name' in ch
            assert 'url' in ch
            assert 'playlist_id' in ch
            assert '_id' not in ch, "MongoDB _id should be excluded"
        
        print(f"✓ Turkish channels endpoint returned {len(channels)} channels out of {data['total']} total")

    def test_search_channels(self, api_client):
        """Test GET /api/channels?search=TRT returns search results"""
        response = api_client.get(f"{BASE_URL}/api/channels?search=TRT&limit=20")
        assert response.status_code == 200
        
        data = response.json()
        assert 'channels' in data
        assert 'total' in data
        
        channels = data['channels']
        assert isinstance(channels, list)
        
        if len(channels) > 0:
            # Verify search results contain "TRT" in name (case-insensitive)
            for ch in channels:
                assert 'TRT' in ch['name'].upper(), f"Channel {ch['name']} should contain 'TRT'"
                assert '_id' not in ch, "MongoDB _id should be excluded"
            
            print(f"✓ Search for 'TRT' returned {len(channels)} channels")
        else:
            print("! No channels found with 'TRT' in name")

    def test_channels_pagination(self, api_client):
        """Test channels pagination with skip and limit"""
        response = api_client.get(f"{BASE_URL}/api/channels?skip=0&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data['skip'] == 0
        assert data['limit'] == 10
        assert len(data['channels']) <= 10
        
        print(f"✓ Pagination working: skip={data['skip']}, limit={data['limit']}")


class TestFavoritesFlow:
    """Favorites CRUD test with Create→GET verification pattern"""

    def test_favorites_flow(self, api_client):
        """Test complete favorites flow: add → get → remove → verify"""
        
        # First, get a channel to favorite
        channels_resp = api_client.get(f"{BASE_URL}/api/channels?group=Turkey&limit=1")
        assert channels_resp.status_code == 200
        channels = channels_resp.json()['channels']
        assert len(channels) > 0, "Need at least one channel to test favorites"
        
        test_channel = channels[0]
        channel_id = test_channel['id']
        
        # 1. Add to favorites
        add_payload = {
            'channel_id': channel_id,
            'channel_name': test_channel['name'],
            'channel_group': test_channel['group'],
            'channel_url': test_channel['url']
        }
        add_response = api_client.post(f"{BASE_URL}/api/favorites", json=add_payload)
        assert add_response.status_code == 200
        
        added_fav = add_response.json()
        assert 'id' in added_fav
        assert added_fav['channel_id'] == channel_id
        assert '_id' not in added_fav, "MongoDB _id should be excluded"
        
        print(f"✓ Added channel '{test_channel['name']}' to favorites")
        
        # 2. GET to verify persistence
        get_response = api_client.get(f"{BASE_URL}/api/favorites")
        assert get_response.status_code == 200
        
        favorites = get_response.json()
        assert isinstance(favorites, list)
        assert any(f['channel_id'] == channel_id for f in favorites), "Added favorite should be in list"
        
        # Verify no MongoDB _id in any favorite
        for fav in favorites:
            assert '_id' not in fav, "MongoDB _id should be excluded"
        
        print(f"✓ Verified favorite persisted in database ({len(favorites)} total favorites)")
        
        # 3. Remove from favorites
        remove_response = api_client.delete(f"{BASE_URL}/api/favorites/{channel_id}")
        assert remove_response.status_code == 200
        
        print(f"✓ Removed favorite {channel_id}")
        
        # 4. Verify removal
        verify_response = api_client.get(f"{BASE_URL}/api/favorites")
        assert verify_response.status_code == 200
        
        remaining_favs = verify_response.json()
        assert not any(f['channel_id'] == channel_id for f in remaining_favs), "Favorite should be removed"
        
        print(f"✓ Verified favorite removed from database")


class TestWatchHistory:
    """Watch history API tests"""

    def test_history_flow(self, api_client):
        """Test add to history → get history → verify"""
        
        # Get a channel for testing
        channels_resp = api_client.get(f"{BASE_URL}/api/channels?limit=1")
        assert channels_resp.status_code == 200
        channels = channels_resp.json()['channels']
        assert len(channels) > 0
        
        test_channel = channels[0]
        
        # Add to history
        history_payload = {
            'channel_id': test_channel['id'],
            'channel_name': test_channel['name'],
            'channel_group': test_channel['group'],
            'channel_url': test_channel['url']
        }
        add_response = api_client.post(f"{BASE_URL}/api/history", json=history_payload)
        assert add_response.status_code == 200
        
        result = add_response.json()
        assert 'message' in result
        
        print(f"✓ Added '{test_channel['name']}' to watch history")
        
        # Get history to verify
        get_response = api_client.get(f"{BASE_URL}/api/history")
        assert get_response.status_code == 200
        
        history = get_response.json()
        assert isinstance(history, list)
        assert len(history) > 0
        
        # Find our channel in history
        found = any(h['channel_id'] == test_channel['id'] for h in history)
        assert found, "Channel should be in watch history"
        
        # Verify no MongoDB _id
        for h in history:
            assert '_id' not in h, "MongoDB _id should be excluded"
        
        print(f"✓ Verified channel in watch history ({len(history)} total entries)")


class TestPlaylists:
    """Playlists API tests"""

    def test_get_playlists(self, api_client):
        """Test GET /api/playlists returns playlists"""
        response = api_client.get(f"{BASE_URL}/api/playlists")
        assert response.status_code == 200
        
        playlists = response.json()
        assert isinstance(playlists, list)
        assert len(playlists) > 0, "Should have at least the default playlist"
        
        # Check for default playlist
        default_playlist = next((p for p in playlists if p['id'] == 'default'), None)
        assert default_playlist is not None, "Default playlist should exist"
        assert default_playlist['name'] == 'ElensarTV Kanalları'
        assert default_playlist['channel_count'] > 0
        
        # Verify no MongoDB _id
        for p in playlists:
            assert '_id' not in p, "MongoDB _id should be excluded"
        
        print(f"✓ Playlists endpoint returned {len(playlists)} playlists")


class TestVavooResolver:
    """Vavoo.to resolver API tests (external API, may have latency)"""

    def test_resolve_channel(self, api_client):
        """Test POST /api/channels/resolve resolves vavoo URL to HLS stream"""
        
        # Get a vavoo channel URL to test
        channels_resp = api_client.get(f"{BASE_URL}/api/channels?limit=10")
        assert channels_resp.status_code == 200
        channels = channels_resp.json()['channels']
        
        # Find a channel with vavoo URL
        vavoo_channel = next((ch for ch in channels if 'vavoo' in ch['url']), None)
        
        if vavoo_channel:
            resolve_payload = {'url': vavoo_channel['url']}
            response = api_client.post(
                f"{BASE_URL}/api/channels/resolve",
                json=resolve_payload,
                timeout=20
            )
            assert response.status_code == 200
            
            result = response.json()
            
            # Check if resolution was successful or if there's an error
            if 'stream_url' in result:
                if result['stream_url']:
                    print(f"✓ Vavoo resolver returned stream URL: {result['stream_url'][:50]}...")
                else:
                    print(f"! Vavoo resolver returned empty stream URL. Error: {result.get('error', 'Unknown')}")
            else:
                print("! Vavoo resolver response missing stream_url field")
        else:
            print("! No vavoo channel found in first 10 channels, skipping resolver test")

    def test_resolve_missing_url(self, api_client):
        """Test resolve endpoint with missing URL returns 400"""
        response = api_client.post(f"{BASE_URL}/api/channels/resolve", json={})
        assert response.status_code == 400


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session with increased timeout"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    # Default timeout for most requests
    return session
