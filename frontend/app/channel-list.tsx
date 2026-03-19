import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const COUNTRY_COLORS: Record<string, string> = {
  'Turkey': '#E30A17', 'Germany': '#FFCC00', 'Albania': '#E41E20',
  'Arabia': '#006C35', 'France': '#002395', 'United Kingdom': '#012169',
  'Italy': '#008C45', 'Netherlands': '#FF6600', 'Poland': '#DC143C',
  'Portugal': '#006600', 'Romania': '#002B7F', 'Russia': '#0039A6',
  'Spain': '#AA151B', 'Bulgaria': '#00966E', 'Balkans': '#4A90D9',
};

export default function ChannelListScreen() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [channels, setChannels] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const groupColor = COUNTRY_COLORS[group || ''] || colors.brand;

  const loadChannels = useCallback(async (skip = 0, searchText = '') => {
    try {
      const params: any = { group, skip, limit: 50 };
      if (searchText) params.search = searchText;
      const data = await api.getChannels(params);
      if (skip === 0) {
        setChannels(data.channels || []);
      } else {
        setChannels((prev) => [...prev, ...(data.channels || [])]);
      }
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    }
  }, [group]);

  useEffect(() => {
    (async () => {
      await loadChannels(0, '');
      try {
        const favs = await api.getFavorites();
        setFavoriteIds(new Set(favs.map((f: any) => f.channel_id)));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [loadChannels]);

  const loadMore = async () => {
    if (loadingMore || channels.length >= total) return;
    setLoadingMore(true);
    await loadChannels(channels.length, search);
    setLoadingMore(false);
  };

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setLoading(true);
    loadChannels(0, text).finally(() => setLoading(false));
  }, [loadChannels]);

  const toggleFav = async (ch: any) => {
    const isFav = favoriteIds.has(ch.id);
    try {
      if (isFav) {
        await api.removeFavorite(ch.id);
        setFavoriteIds((prev) => { const n = new Set(prev); n.delete(ch.id); return n; });
      } else {
        await api.addFavorite(ch);
        setFavoriteIds((prev) => new Set(prev).add(ch.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const playChannel = (ch: any) => {
    router.push({ pathname: '/player', params: { url: ch.url, name: ch.name, id: ch.id, group: ch.group } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{group}</Text>
            <Text style={[styles.headerCount, { color: colors.textSecondary }]}>{total} kanal</Text>
          </View>
        </View>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceHighlight }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            testID="channel-search-input"
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Bu kategoride ara..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} size="large" color={colors.brand} />
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item }) => (
            <TouchableOpacity testID={`ch-${item.id}`} style={[styles.row, { backgroundColor: colors.surface }]} onPress={() => playChannel(item)} activeOpacity={0.7}>
              <View style={[styles.chIcon, { backgroundColor: groupColor }]}>
                <Text style={styles.chInitial}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.chInfo}>
                <Text style={[styles.chName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTxt}>CANLI</Text>
                </View>
              </View>
              <TouchableOpacity testID={`fav-toggle-${item.id}`} onPress={() => toggleFav(item)} style={styles.favBtn}>
                <MaterialCommunityIcons
                  name={favoriteIds.has(item.id) ? 'heart' : 'heart-outline'}
                  size={22}
                  color={favoriteIds.has(item.id) ? colors.error : colors.textSecondary}
                />
              </TouchableOpacity>
              <MaterialCommunityIcons name="play-circle" size={32} color={colors.brand} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="television-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>Kanal bulunamadı</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, marginBottom: 14 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerInfo: { marginLeft: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerCount: { fontSize: 14, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 44, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8 },
  chIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  chInitial: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  chInfo: { flex: 1, marginLeft: 12 },
  chName: { fontSize: 15, fontWeight: '600' },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00C853' },
  liveTxt: { fontSize: 10, fontWeight: '700', color: '#00C853', letterSpacing: 1 },
  favBtn: { padding: 8, marginRight: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 16, marginTop: 12 },
});
