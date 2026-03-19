import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 20 * 2 - CARD_GAP) / 2;

const COUNTRY_META: Record<string, { color: string }> = {
  'Turkey': { color: '#E30A17' },
  'Germany': { color: '#FFCC00' },
  'Albania': { color: '#E41E20' },
  'Arabia': { color: '#006C35' },
  'France': { color: '#002395' },
  'United Kingdom': { color: '#012169' },
  'Italy': { color: '#008C45' },
  'Netherlands': { color: '#FF6600' },
  'Poland': { color: '#DC143C' },
  'Portugal': { color: '#006600' },
  'Romania': { color: '#002B7F' },
  'Russia': { color: '#0039A6' },
  'Spain': { color: '#AA151B' },
  'Bulgaria': { color: '#00966E' },
  'Balkans': { color: '#4A90D9' },
};

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error).finally(() => setLoading(false));
  }, []);

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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Kategoriler</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{categories.length} ülke</Text>
      </View>
      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: CARD_GAP }}
        renderItem={({ item }) => {
          const meta = COUNTRY_META[item.name] || { color: '#666' };
          return (
            <TouchableOpacity
              testID={`cat-card-${item.name}`}
              style={[styles.card, { backgroundColor: meta.color, width: CARD_WIDTH }]}
              onPress={() => router.push({ pathname: '/channel-list', params: { group: item.name } })}
              activeOpacity={0.8}
            >
              <Text style={styles.cardBigLetter}>{item.name.charAt(0)}</Text>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardCount}>{item.count} kanal</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 4 },
  grid: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { borderRadius: 16, padding: 20, marginBottom: CARD_GAP, minHeight: 110, justifyContent: 'flex-end', overflow: 'hidden' },
  cardBigLetter: { position: 'absolute', top: -8, right: 8, fontSize: 72, fontWeight: '900', color: 'rgba(255,255,255,0.15)' },
  cardName: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  cardCount: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
