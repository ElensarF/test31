import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/channel.dart';
import 'player_screen.dart';

class ChannelListScreen extends StatefulWidget {
  final String group;
  const ChannelListScreen({super.key, required this.group});
  @override
  State<ChannelListScreen> createState() => _ChannelListScreenState();
}

class _ChannelListScreenState extends State<ChannelListScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  List<Channel> _channels = [];
  Set<String> _favoriteIds = {};
  int _total = 0;
  bool _loading = true;
  bool _loadingMore = false;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    try {
      final results = await Future.wait([
        ApiService.getChannels(group: widget.group, limit: 50),
        ApiService.getFavorites(),
      ]);
      final data = results[0] as Map<String, dynamic>;
      final favs = results[1] as List<Favorite>;
      if (mounted) {
        setState(() {
          _channels = (data['channels'] as List).map((e) => Channel.fromJson(e)).toList();
          _total = data['total'] ?? 0;
          _favoriteIds = favs.map((f) => f.channelId).toSet();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _channels.length >= _total) return;
    setState(() => _loadingMore = true);
    try {
      final data = await ApiService.getChannels(group: widget.group, search: _search.isNotEmpty ? _search : null, skip: _channels.length, limit: 50);
      if (mounted) {
        setState(() {
          _channels.addAll((data['channels'] as List).map((e) => Channel.fromJson(e)));
          _loadingMore = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _handleSearch(String text) async {
    _search = text;
    setState(() => _loading = true);
    try {
      final data = await ApiService.getChannels(group: widget.group, search: text.isNotEmpty ? text : null, limit: 50);
      if (mounted) {
        setState(() {
          _channels = (data['channels'] as List).map((e) => Channel.fromJson(e)).toList();
          _total = data['total'] ?? 0;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleFav(Channel ch) async {
    final isFav = _favoriteIds.contains(ch.id);
    try {
      if (isFav) {
        await ApiService.removeFavorite(ch.id);
        setState(() => _favoriteIds.remove(ch.id));
      } else {
        await ApiService.addFavorite(ch);
        setState(() => _favoriteIds.add(ch.id));
      }
    } catch (e) { /* silent */ }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppTheme>();
    final groupColor = countryColors[widget.group] ?? t.brand;
    return Scaffold(
      backgroundColor: t.background,
      body: SafeArea(
        child: Column(children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: t.border))),
            child: Column(children: [
              Row(children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: SizedBox(width: 44, height: 44, child: Icon(Icons.arrow_back, color: t.textPrimary, size: 26)),
                ),
                const SizedBox(width: 8),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(widget.group, style: TextStyle(color: t.textPrimary, fontSize: 24, fontWeight: FontWeight.w700)),
                  Text('$_total kanal', style: TextStyle(color: t.textSecondary, fontSize: 14)),
                ]),
              ]),
              const SizedBox(height: 14),
              Container(
                height: 44,
                decoration: BoxDecoration(color: t.surfaceHighlight, borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(children: [
                  Icon(Icons.search, color: t.textSecondary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: _handleSearch,
                      style: TextStyle(color: t.textPrimary, fontSize: 15),
                      decoration: InputDecoration(
                        hintText: 'Bu kategoride ara...',
                        hintStyle: TextStyle(color: t.textSecondary),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                ]),
              ),
            ]),
          ),
          // List
          if (_loading)
            Expanded(child: Center(child: CircularProgressIndicator(color: t.brand)))
          else
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _channels.length + (_loadingMore ? 1 : 0),
                itemBuilder: (ctx, i) {
                  if (i >= _channels.length) return Center(child: Padding(padding: const EdgeInsets.all(16), child: CircularProgressIndicator(color: t.brand)));
                  final ch = _channels[i];
                  final isFav = _favoriteIds.contains(ch.id);
                  return GestureDetector(
                    onTap: () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => PlayerScreen(id: ch.id, name: ch.name, group: ch.group, url: ch.url))),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(14)),
                      child: Row(children: [
                        Container(
                          width: 46, height: 46,
                          decoration: BoxDecoration(color: groupColor, borderRadius: BorderRadius.circular(12)),
                          child: Center(child: Text(ch.name.isNotEmpty ? ch.name[0] : '?', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800))),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(ch.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: t.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Row(children: [
                            Container(width: 7, height: 7, decoration: BoxDecoration(color: t.success, shape: BoxShape.circle)),
                            const SizedBox(width: 5),
                            Text('CANLI', style: TextStyle(color: t.success, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
                          ]),
                        ])),
                        GestureDetector(
                          onTap: () => _toggleFav(ch),
                          child: Padding(padding: const EdgeInsets.all(8), child: Icon(isFav ? Icons.favorite : Icons.favorite_border, color: isFav ? t.error : t.textSecondary, size: 22)),
                        ),
                        Icon(Icons.play_circle, color: t.brand, size: 32),
                      ]),
                    ),
                  );
                },
              ),
            ),
        ]),
      ),
    );
  }
}
