import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/channel.dart';

const String _baseUrl = String.fromEnvironment('BACKEND_URL', defaultValue: 'https://iptv-player-preview-1.preview.emergentagent.com');

class ApiService {
  static String get baseUrl => _baseUrl;

  static Future<Map<String, dynamic>> getChannels({String? group, String? search, int skip = 0, int limit = 50}) async {
    final params = <String, String>{'skip': '$skip', 'limit': '$limit'};
    if (group != null) params['group'] = group;
    if (search != null && search.isNotEmpty) params['search'] = search;
    final uri = Uri.parse('$_baseUrl/api/channels').replace(queryParameters: params);
    final res = await http.get(uri);
    return jsonDecode(res.body);
  }

  static Future<List<Category>> getCategories() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/channels/categories'));
    final list = jsonDecode(res.body) as List;
    return list.map((e) => Category.fromJson(e)).toList();
  }

  static Future<Map<String, dynamic>> resolveChannel(String url) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/channels/resolve'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'url': url}),
    );
    return jsonDecode(res.body);
  }

  static String getPlayerUrl(String streamUrl) {
    return '$_baseUrl/api/player?stream_url=${Uri.encodeComponent(streamUrl)}';
  }

  static Future<List<Favorite>> getFavorites() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/favorites'));
    final list = jsonDecode(res.body) as List;
    return list.map((e) => Favorite.fromJson(e)).toList();
  }

  static Future<void> addFavorite(Channel ch) async {
    await http.post(
      Uri.parse('$_baseUrl/api/favorites'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'channel_id': ch.id, 'channel_name': ch.name, 'channel_group': ch.group, 'channel_url': ch.url}),
    );
  }

  static Future<void> removeFavorite(String channelId) async {
    await http.delete(Uri.parse('$_baseUrl/api/favorites/$channelId'));
  }

  static Future<List<HistoryItem>> getHistory() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/history'));
    final list = jsonDecode(res.body) as List;
    return list.map((e) => HistoryItem.fromJson(e)).toList();
  }

  static Future<void> addToHistory(Channel ch) async {
    await http.post(
      Uri.parse('$_baseUrl/api/history'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'channel_id': ch.id, 'channel_name': ch.name, 'channel_group': ch.group, 'channel_url': ch.url}),
    );
  }

  static Future<List<Playlist>> getPlaylists() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/playlists'));
    final list = jsonDecode(res.body) as List;
    return list.map((e) => Playlist.fromJson(e)).toList();
  }

  static Future<Map<String, dynamic>> addPlaylist(String url, String name) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/playlists'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'url': url, 'name': name}),
    );
    return jsonDecode(res.body);
  }

  static Future<void> deletePlaylist(String id) async {
    await http.delete(Uri.parse('$_baseUrl/api/playlists/$id'));
  }
}
