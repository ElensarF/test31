import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class AddPlaylistScreen extends StatefulWidget {
  const AddPlaylistScreen({super.key});
  @override
  State<AddPlaylistScreen> createState() => _AddPlaylistScreenState();
}

class _AddPlaylistScreenState extends State<AddPlaylistScreen> {
  final _nameController = TextEditingController();
  final _urlController = TextEditingController();
  bool _loading = false;

  Future<void> _addByUrl() async {
    if (_urlController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("L\u00fctfen bir M3U URL'si girin")));
      return;
    }
    setState(() => _loading = true);
    try {
      final result = await ApiService.addPlaylist(_urlController.text.trim(), _nameController.text.trim().isNotEmpty ? _nameController.text.trim() : 'Custom Playlist');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'] ?? 'Playlist eklendi')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Playlist eklenemedi. URL'yi kontrol edin.")));
        setState(() => _loading = false);
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppTheme>();
    return Scaffold(
      backgroundColor: t.background,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: SizedBox(width: 44, height: 44, child: Center(child: Icon(Icons.close, color: t.textPrimary, size: 26))),
              ),
              Text('Playlist Ekle', style: TextStyle(color: t.textPrimary, fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(width: 44),
            ]),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: [
                const SizedBox(height: 8),
                // URL Method
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(16)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Icon(Icons.link, color: t.brand, size: 22),
                      const SizedBox(width: 10),
                      Text('URL ile Ekle', style: TextStyle(color: t.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
                    ]),
                    const SizedBox(height: 20),
                    Text('PLAYLIST ADI', style: TextStyle(color: t.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _nameController,
                      style: TextStyle(color: t.textPrimary, fontSize: 15),
                      decoration: InputDecoration(
                        hintText: '\u00d6rn: Spor Kanallar\u0131',
                        hintStyle: TextStyle(color: t.textSecondary),
                        filled: true,
                        fillColor: t.background,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: t.border)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: t.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: t.brand)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('M3U URL', style: TextStyle(color: t.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _urlController,
                      style: TextStyle(color: t.textPrimary, fontSize: 15),
                      keyboardType: TextInputType.url,
                      decoration: InputDecoration(
                        hintText: 'https://example.com/playlist.m3u',
                        hintStyle: TextStyle(color: t.textSecondary),
                        filled: true,
                        fillColor: t.background,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: t.border)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: t.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: t.brand)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _addByUrl,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: t.brand,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _loading
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                                Icon(Icons.playlist_add, size: 22),
                                SizedBox(width: 10),
                                Text('URL ile Ekle', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                              ]),
                      ),
                    ),
                  ]),
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}
