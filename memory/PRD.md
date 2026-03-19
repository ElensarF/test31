# ElensarTV - M3U IPTV Video Player

## Overview
ElensarTV is a full-stack M3U IPTV video player app. Built with Flutter frontend and FastAPI + MongoDB backend.

## Architecture
- **Frontend**: Flutter 3.41.5 (Dart 3.11.3) - Web + Android
- **Backend**: FastAPI (Python) with MongoDB
- **Video Playback**: HLS.js via iframe (web) / WebView (mobile)
- **Stream Resolution**: vavoo.to mediahubmx-resolve API

## Features (All Implemented ✅)
- M3U playlist parsing - 9,279 channels across 15 countries
- Vavoo.to stream resolver (HLS URL extraction)
- HLS video player with hls.js
- Channel browsing by 15 country categories
- Global channel search with debounce (400ms)
- Favorites management (add/remove)
- Watch history tracking
- Dark/Light theme toggle with persistence (SharedPreferences)
- Custom playlist management (URL import)
- Pagination on channel lists

## Navigation
- Bottom nav tabs: Ana Sayfa, Kategoriler, Ara, Favoriler, Ayarlar
- Stack screens: Channel List, Video Player, Add Playlist

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/channels | List channels (group, search, skip, limit) |
| GET | /api/channels/categories | Country categories with counts |
| POST | /api/channels/resolve | Resolve vavoo URL to HLS |
| GET | /api/player | HTML player page with hls.js |
| GET/POST/DELETE | /api/favorites | Favorites CRUD |
| GET/POST | /api/history | Watch history |
| GET/POST/DELETE | /api/playlists | Playlist management |

## Flutter App Structure
```
flutter_app/lib/
├── main.dart                     # App entry, theme, bottom nav
├── models/channel.dart           # Data models
├── services/api_service.dart     # HTTP API client
├── theme/app_theme.dart          # Theme + country colors
└── screens/
    ├── home_screen.dart          # History, categories, featured
    ├── categories_screen.dart    # Country grid
    ├── search_screen.dart        # Search with debounce
    ├── favorites_screen.dart     # Favorite channels
    ├── settings_screen.dart      # Theme, playlists, about
    ├── channel_list_screen.dart  # Channel list with pagination
    ├── player_screen.dart        # Video player
    └── add_playlist_screen.dart  # Add playlist by URL
```

## Status (2026-03-19)
- ✅ Flutter web build working on preview
- ✅ All 8 screens implemented and tested
- ✅ Backend 23/23 API tests passing
- ❌ APK build not possible in this container (arm64 + no binfmt_misc)
- GitHub Actions workflow created for APK builds

## APK Build
Use GitHub Actions workflow at `.github/workflows/build-apk.yml` or build locally:
```bash
cd flutter_app
flutter build apk --release
```

## Backlog
- EPG integration
- Channel sorting
- Picture-in-Picture
- Multi-language support
