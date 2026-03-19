import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/channel.dart';
import 'player_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  List<Channel> _results = [];
  int _total = 0;
  bool _loading = false;
  Timer? _debounce;

  void _onSearch(String text) {
    _debounce?.cancel();
    if (text.trim().isEmpty) {
      setState(() { _results = []; _total = 0; });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () async {
      setState(() => _loading = true);
      try {
        final data = await ApiService.getChannels(search: text, limit: 50);
        if (mounted) {
          setState(() {
            _results = (data['channels'] as List).map((e) => Channel.fromJson(e)).toList();
            _total = data['total'] ?? 0;
            _loading = false;
          });
        }
      } catch (e) {
        if (mounted) setState(() { _results = []; _loading = false; });
      }
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppTheme>();
    return Scaffold(
      backgroundColor: t.background,
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Text('Kanal Ara', style: TextStyle(color: t.textPrimary, fontSize: 28, fontWeight: FontWeight.w800)),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              height: 52,
              decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: t.border)),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(children: [
                Icon(Icons.search, color: t.textSecondary, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    onChanged: _onSearch,
                    style: TextStyle(color: t.textPrimary, fontSize: 16),
                    decoration: InputDecoration(
                      hintText: 'Kanal adı yazın...',
                      hintStyle: TextStyle(color: t.textSecondary),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                if (_controller.text.isNotEmpty)
                  GestureDetector(
                    onTap: () { _controller.clear(); _onSearch(''); },
                    child: Icon(Icons.cancel, color: t.textSecondary, size: 20),
                  ),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          if (_loading) Padding(padding: const EdgeInsets.only(top: 20), child: CircularProgressIndicator(color: t.brand)),
          if (!_loading && _controller.text.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(alignment: Alignment.centerLeft, child: Text('$_total sonuç bulundu', style: TextStyle(color: t.textSecondary, fontSize: 14))),
            ),
          const SizedBox(height: 8),
          Expanded(
            child: _results.isEmpty && !_loading && _controller.text.length > 2
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.tv_off, color: t.textSecondary, size: 48),
                    const SizedBox(height: 12),
                    Text('Kanal bulunamadı', style: TextStyle(color: t.textSecondary, fontSize: 16)),
                  ]))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _results.length,
                    itemBuilder: (ctx, i) {
                      final ch = _results[i];
                      final color = countryColors[ch.group] ?? t.brand;
                      return GestureDetector(
                        onTap: () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => PlayerScreen(id: ch.id, name: ch.name, group: ch.group, url: ch.url))),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(12)),
                          child: Row(children: [
                            Container(
                              width: 44, height: 44,
                              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
                              child: Center(child: Text(ch.name.isNotEmpty ? ch.name[0] : '?', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800))),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(ch.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: t.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 2),
                              Text(ch.group, style: TextStyle(color: t.textSecondary, fontSize: 12)),
                            ])),
                            Icon(Icons.play_circle_outline, color: t.brand, size: 28),
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
