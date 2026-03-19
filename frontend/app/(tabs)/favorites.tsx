import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const COUNTRY_COLORS: Record<string, string> = {
  'Turkey': '#E30A17', 'Germany': '#FFCC00', 'Albania': '#E41E20',
  'Arabia': '#006C35', 'France': '#002395', 'United Kingdom': '#012169',
  'Italy': '#008C45', 'Netherlands': '#FF6600', 'Poland': '#DC143C',
  'Portugal': '#006600', 'Romania': '#002B7F', 'Russia': '#0039A6',
  'Spain': '#AA151B', 'Bulgaria': '#00966E', 'Balkans': '#4A90D9',
};

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFavorites().then(setFavorites).catch(console.error).finally(() => setLoading(false));
  }, []);

  const removeFav = async (channelId: string) => {
    try {
      await api.removeFavorite(channelId);
      setFavorites((prev) => prev.filter((f) => f.channel_id !== channelId));
    } catch (e) {
      console.error(e);
    }
  };

  const playChannel = (f: any) => {
    router.push({ pathname: '/player', params: { url: f.channel_url, name: f.channel_name, id: f.channel_id, group: f.channel_group } });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Favoriler</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>{favorites.length} kanal</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity testID={`fav-${item.channel_id}`} style={[styles.row, { backgroundColor: colors.surface }]} onPress={() => playChannel(item)} activeOpacity={0.7}>
            <View style={[styles.icon, { backgroundColor: COUNTRY_COLORS[item.channel_group] || colors.brand }]}>
              <Text style={styles.initial}>{item.channel_name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.channel_name}</Text>
              <Text style={[styles.group, { color: colors.textSecondary }]}>{item.channel_group}</Text>
            </View>
            <TouchableOpacity testID={`fav-remove-${item.channel_id}`} onPress={() => removeFav(item.channel_id)} style={styles.removeBtn}>
              <MaterialCommunityIcons name="heart" size={24} color={colors.error} />
            </TouchableOpacity>
            <MaterialCommunityIcons name="play-circle-outline" size={28} color={colors.brand} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="heart-off-outline" size={56} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Henüz favori yok</Text>
            <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>Kanalları izlerken favori olarak işaretleyin</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800' },
  count: { fontSize: 15, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  icon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  initial: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  group: { fontSize: 12, marginTop: 2 },
  removeBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyTxt: { fontSize: 15, marginTop: 8, textAlign: 'center' },
});
