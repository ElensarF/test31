class Channel {
  final String id;
  final String name;
  final String group;
  final String url;
  final String playlistId;

  Channel({required this.id, required this.name, required this.group, required this.url, this.playlistId = ''});

  factory Channel.fromJson(Map<String, dynamic> json) => Channel(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    group: json['group'] ?? '',
    url: json['url'] ?? '',
    playlistId: json['playlist_id'] ?? '',
  );
}

class Category {
  final String name;
  final int count;

  Category({required this.name, required this.count});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    name: json['name'] ?? '',
    count: json['count'] ?? 0,
  );
}

class Favorite {
  final String id;
  final String channelId;
  final String channelName;
  final String channelGroup;
  final String channelUrl;

  Favorite({required this.id, required this.channelId, required this.channelName, required this.channelGroup, required this.channelUrl});

  factory Favorite.fromJson(Map<String, dynamic> json) => Favorite(
    id: json['id'] ?? '',
    channelId: json['channel_id'] ?? '',
    channelName: json['channel_name'] ?? '',
    channelGroup: json['channel_group'] ?? '',
    channelUrl: json['channel_url'] ?? '',
  );
}

class HistoryItem {
  final String id;
  final String channelId;
  final String channelName;
  final String channelGroup;
  final String channelUrl;

  HistoryItem({required this.id, required this.channelId, required this.channelName, required this.channelGroup, required this.channelUrl});

  factory HistoryItem.fromJson(Map<String, dynamic> json) => HistoryItem(
    id: json['id'] ?? '',
    channelId: json['channel_id'] ?? '',
    channelName: json['channel_name'] ?? '',
    channelGroup: json['channel_group'] ?? '',
    channelUrl: json['channel_url'] ?? '',
  );
}

class Playlist {
  final String id;
  final String name;
  final String source;
  final int channelCount;

  Playlist({required this.id, required this.name, required this.source, required this.channelCount});

  factory Playlist.fromJson(Map<String, dynamic> json) => Playlist(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    source: json['source'] ?? '',
    channelCount: json['channel_count'] ?? 0,
  );
}
