import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/channel.dart';
import 'channel_list_screen.dart';
import 'player_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Category> _categories = [];
  List<HistoryItem> _history = [];
  List<Channel> _featured = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService.getCategories(),
        ApiService.getHistory(),
        ApiService.getChannels(group: 'Turkey', limit: 8),
      ]);
      if (mounted) {
        setState(() {
          _categories = results[0] as List<Category>;
          _history = results[1] as List<HistoryItem>;
          final data = results[2] as Map<String, dynamic>;
          _featured = (data['channels'] as List).map((e) => Channel.fromJson(e)).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _playChannel(BuildContext ctx, {required String id, required String name, required String group, required String url}) {
    Navigator.push(ctx, MaterialPageRoute(builder: (_) => PlayerScreen(id: id, name: name, group: group, url: url)));
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppTheme>();
    if (_loading) {
      return Scaffold(
        backgroundColor: t.background,
        body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          CircularProgressIndicator(color: t.brand),
          const SizedBox(height: 12),
          Text('Kanallar yükleniyor...', style: TextStyle(color: t.textSecondary, fontSize: 16)),
        ])),
      );
    }
    return Scaffold(
      backgroundColor: t.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: t.brand,
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Row(children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: t.brand, borderRadius: BorderRadius.circular(12)),
                    child: const Center(child: Text('E', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800))),
                  ),
                  const SizedBox(width: 14),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('ElensarTV', style: TextStyle(color: t.textPrimary, fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                    Text('Canlı TV İzle', style: TextStyle(color: t.textSecondary, fontSize: 14)),
                  ]),
                ]),
              ),
              // History
              if (_history.isNotEmpty) ..._buildHistory(t),
              // Categories
              ..._buildCategories(t),
              // Featured
              ..._buildFeatured(t),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildHistory(AppTheme t) {
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Text('Son İzlenenler', style: TextStyle(color: t.textPrimary, fontSize: 22, fontWeight: FontWeight.w700)),
      ),
      SizedBox(
        height: 120,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: _history.length,
          itemBuilder: (ctx, i) {
            final h = _history[i];
            final color = countryColors[h.channelGroup] ?? t.brand;
            return GestureDetector(
              onTap: () => _playChannel(ctx, id: h.channelId, name: h.channelName, group: h.channelGroup, url: h.channelUrl),
              child: Container(
                width: 120, margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.all(14),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                    child: const Icon(Icons.tv, color: Colors.white, size: 22),
                  ),
                  const SizedBox(height: 10),
                  Text(h.channelName, maxLines: 2, overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: t.textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
                ]),
              ),
            );
          },
        ),
      ),
      const SizedBox(height: 32),
    ];
  }

  List<Widget> _buildCategories(AppTheme t) {
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Kategoriler', style: TextStyle(color: t.textPrimary, fontSize: 22, fontWeight: FontWeight.w700)),
        ]),
      ),
      SizedBox(
        height: 64,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: _categories.length,
          itemBuilder: (ctx, i) {
            final c = _categories[i];
            final color = countryColors[c.name] ?? t.surfaceHighlight;
            return GestureDetector(
              onTap: () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => ChannelListScreen(group: c.name))),
              child: Container(
                margin: const EdgeInsets.only(right: 10),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(16)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(c.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                  Text('${c.count} kanal', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ]),
              ),
            );
          },
        ),
      ),
      const SizedBox(height: 32),
    ];
  }

  List<Widget> _buildFeatured(AppTheme t) {
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Türk Kanalları', style: TextStyle(color: t.textPrimary, fontSize: 22, fontWeight: FontWeight.w700)),
          GestureDetector(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChannelListScreen(group: 'Turkey'))),
            child: Text('Tümünü Gör', style: TextStyle(color: t.brand, fontSize: 15, fontWeight: FontWeight.w600)),
          ),
        ]),
      ),
      ..._featured.map((ch) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
        child: GestureDetector(
          onTap: () => _playChannel(context, id: ch.id, name: ch.name, group: ch.group, url: ch.url),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: const Color(0xFFE30A17), borderRadius: BorderRadius.circular(12)),
                child: Center(child: Text(ch.name.isNotEmpty ? ch.name[0] : '?', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800))),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(ch.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: t.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Row(children: [
                  Container(width: 8, height: 8, decoration: BoxDecoration(color: t.success, shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text('CANLI', style: TextStyle(color: t.success, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
                ]),
              ])),
              Icon(Icons.play_circle, color: t.brand, size: 36),
            ]),
          ),
        ),
      )),
    ];
  }
}
