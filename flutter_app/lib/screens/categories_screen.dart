import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/channel.dart';
import 'channel_list_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});
  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<Category> _categories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final cats = await ApiService.getCategories();
      if (mounted) setState(() { _categories = cats; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
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
              Text('Kategoriler', style: TextStyle(color: t.textPrimary, fontSize: 28, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('${_categories.length} ülke', style: TextStyle(color: t.textSecondary, fontSize: 15)),
            ]),
          ),
          if (_loading)
            Expanded(child: Center(child: CircularProgressIndicator(color: t.brand)))
          else
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6),
                itemCount: _categories.length,
                itemBuilder: (ctx, i) {
                  final c = _categories[i];
                  final color = countryColors[c.name] ?? Colors.grey;
                  return GestureDetector(
                    onTap: () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => ChannelListScreen(group: c.name))),
                    child: Container(
                      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.all(20),
                      child: Stack(children: [
                        Positioned(top: -8, right: 0, child: Text(c.name.isNotEmpty ? c.name[0] : '', style: TextStyle(color: Colors.white.withValues(alpha: 0.15), fontSize: 72, fontWeight: FontWeight.w900))),
                        Column(mainAxisAlignment: MainAxisAlignment.end, crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(c.name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text('${c.count} kanal', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13)),
                        ]),
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
