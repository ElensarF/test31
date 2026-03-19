import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/channel.dart';
import 'player_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});
  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<Favorite> _favorites = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final favs = await ApiService.getFavorites();
      if (mounted) setState(() { _favorites = favs; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _removeFav(String channelId) async {
    try {
      await ApiService.removeFavorite(channelId);
      setState(() => _favorites.removeWhere((f) => f.channelId == channelId));
    } catch (e) { /* silent */ }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppTheme>();
    return Scaffold(
      backgroundColor: t.background,
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Favoriler', style: TextStyle(color: t.textPrimary, fontSize: 28, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('${_favorites.length} kanal', style: TextStyle(color: t.textSecondary, fontSize: 15)),
            ]),
          ),
          if (_loading)
            Expanded(child: Center(child: CircularProgressIndicator(color: t.brand)))
          else if (_favorites.isEmpty)
            Expanded(child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.heart_broken_outlined, color: t.textSecondary, size: 56),
              const SizedBox(height: 16),
              Text('Henüz favori yok', style: TextStyle(color: t.textPrimary, fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Kanalları izlerken favori olarak işaretleyin', style: TextStyle(color: t.textSecondary, fontSize: 15)),
            ])))
          else
            Expanded(
              child: RefreshIndicator(
                color: t.brand,
                onRefresh: _load,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _favorites.length,
                  itemBuilder: (ctx, i) {
                    final f = _favorites[i];
                    final color = countryColors[f.channelGroup] ?? t.brand;
                    return GestureDetector(
                      onTap: () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => PlayerScreen(id: f.channelId, name: f.channelName, group: f.channelGroup, url: f.channelUrl))),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(12)),
                        child: Row(children: [
                          Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
                            child: Center(child: Text(f.channelName.isNotEmpty ? f.channelName[0] : '?', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800))),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(f.channelName, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: t.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text(f.channelGroup, style: TextStyle(color: t.textSecondary, fontSize: 12)),
                          ])),
                          GestureDetector(
                            onTap: () => _removeFav(f.channelId),
                            child: Padding(padding: const EdgeInsets.all(8), child: Icon(Icons.favorite, color: t.error, size: 24)),
                          ),
                          const SizedBox(width: 4),
                          Icon(Icons.play_circle_outline, color: t.brand, size: 28),
                        ]),
                      ),
                    );
                  },
                ),
              ),
            ),
        ]),
      ),
    );
  }
}
