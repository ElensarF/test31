import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../services/api_service.dart';
import '../models/channel.dart';

class PlayerScreen extends StatefulWidget {
  final String id;
  final String name;
  final String group;
  final String url;

  const PlayerScreen({
    super.key,
    required this.id,
    required this.name,
    required this.group,
    required this.url,
  });

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  String _streamUrl = '';
  bool _loading = true;
  String _error = '';
  bool _isFav = false;

  @override
  void initState() {
    super.initState();
    _resolve();
    _recordHistory();
    _checkFav();
  }

  Future<void> _resolve() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final r = await ApiService.resolveChannel(widget.url);
      if (r['stream_url'] != null && (r['stream_url'] as String).isNotEmpty) {
        setState(() {
          _streamUrl = r['stream_url'];
          _loading = false;
        });
      } else {
        setState(() {
          _error = r['error'] ?? 'Stream \u00e7\u00f6z\u00fcmlenemedi';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Ba\u011flant\u0131 hatas\u0131';
        _loading = false;
      });
    }
  }

  Future<void> _recordHistory() async {
    try {
      await ApiService.addToHistory(
        Channel(
          id: widget.id,
          name: widget.name,
          group: widget.group,
          url: widget.url,
        ),
      );
    } catch (e) {
      /* silent */
    }
  }

  Future<void> _checkFav() async {
    try {
      final favs = await ApiService.getFavorites();
      if (mounted)
        setState(() => _isFav = favs.any((f) => f.channelId == widget.id));
    } catch (e) {
      /* silent */
    }
  }

  Future<void> _toggleFav() async {
    try {
      if (_isFav) {
        await ApiService.removeFavorite(widget.id);
        setState(() => _isFav = false);
      } else {
        await ApiService.addFavorite(
          Channel(
            id: widget.id,
            name: widget.name,
            group: widget.group,
            url: widget.url,
          ),
        );
        setState(() => _isFav = true);
      }
    } catch (e) {
      /* silent */
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Column(
        children: [
          // Header
          Container(
            color: const Color(0xFF1A1A1A),
            padding: EdgeInsets.fromLTRB(
              16,
              MediaQuery.of(context).padding.top + 8,
              16,
              12,
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const SizedBox(
                    width: 44,
                    height: 44,
                    child: Center(
                      child: Icon(
                        Icons.arrow_back,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.group,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: _toggleFav,
                  child: SizedBox(
                    width: 44,
                    height: 44,
                    child: Center(
                      child: Icon(
                        _isFav ? Icons.favorite : Icons.favorite_border,
                        color: _isFav ? const Color(0xFFFF5722) : Colors.white,
                        size: 26,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: _loading
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(
                          color: Color(0xFFFF5722),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Stream \u00e7\u00f6z\u00fcmleniyor...',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  )
                : _error.isNotEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: Color(0xFFFF5722),
                          size: 56,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _error,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 24),
                        GestureDetector(
                          onTap: _resolve,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 28,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFF5722),
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.refresh,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Tekrar Dene',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                : _buildPlayer(),
          ),
        ],
      ),
    );
  }

  Widget _buildPlayer() {
    final playerUrl = ApiService.getPlayerUrl(_streamUrl);
    if (kIsWeb) {
      // Web: use HtmlElementView with iframe
      return HtmlElementView(
        viewType: 'iframe-player-${widget.id}',
        onPlatformViewCreated: (_) {},
      );
    }
    // Mobile: show a simple message with the player URL info
    // In production, use webview_flutter or video_player
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.play_circle_filled,
            color: Color(0xFFFF5722),
            size: 80,
          ),
          const SizedBox(height: 16),
          const Text(
            'Stream haz\u0131r',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${widget.name} oynat\u0131l\u0131yor...',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 32),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF00C853),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'CANLI',
                      style: TextStyle(
                        color: Color(0xFF00C853),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Stream URL ba\u015far\u0131yla \u00e7\u00f6z\u00fcmlendi',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
