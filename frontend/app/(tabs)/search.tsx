import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { useRouter } from 'expo-router';
import { useState, useRef, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const COUNTRY_COLORS: Record<string, string> = {
  'Turkey': '#E30A17', 'Germany': '#FFCC00', 'Albania': '#E41E20',
  'Arabia': '#006C35', 'France': '#002395', 'United Kingdom': '#012169',
  'Italy': '#008C45', 'Netherlands': '#FF6600', 'Poland': '#DC143C',
  'Portugal': '#006600', 'Romania': '#002B7F', 'Russia': '#0039A6',
  'Spain': '#AA151B', 'Bulgaria': '#00966E', 'Balkans': '#4A90D9',
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!text.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.getChannels({ search: text, limit: 50 });
        setResults(data.channels || []);
        setTotal(data.total || 0);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 400);
  }, []);

  const playChannel = (ch: any) => {
    Keyboard.dismiss();
    router.push({ pathname: '/player', params: { url: ch.url, name: ch.name, id: ch.id, group: ch.group } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Kanal Ara</Text>
      </View>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.textSecondary} />
        <TextInput
          testID="search-input"
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Kanal adı yazın..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={search}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity testID="search-clear-btn" onPress={() => search('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.brand} />}

      {!loading && query.length > 0 && (
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{total} sonuç bulundu</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity testID={`search-result-${item.id}`} style={[styles.row, { backgroundColor: colors.surface }]} onPress={() => playChannel(item)} activeOpacity={0.7}>
            <View style={[styles.icon, { backgroundColor: COUNTRY_COLORS[item.group] || colors.brand }]}>
              <Text style={styles.initial}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.group, { color: colors.textSecondary }]}>{item.group}</Text>
            </View>
            <MaterialCommunityIcons name="play-circle-outline" size={28} color={colors.brand} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && query.length > 2 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="television-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>Kanal bulunamadı</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 16, height: 52, borderRadius: 14, borderWidth: 1, gap: 10, marginBottom: 12 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  resultCount: { paddingHorizontal: 20, paddingBottom: 12, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  icon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  initial: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  group: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 16, marginTop: 12 },
});
