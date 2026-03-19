import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
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

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cats, hist, feat] = await Promise.all([
          api.getCategories(),
          api.getHistory(),
          api.getChannels({ group: 'Turkey', limit: 8 }),
        ]);
        if (active) {
          setCategories(cats);
          setHistory(hist);
          setFeatured(feat.channels || []);
          setLoading(false);
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const playChannel = (ch: any) => {
    router.push({
      pathname: '/player',
      params: {
        url: ch.url || ch.channel_url,
        name: ch.name || ch.channel_name,
        id: ch.id || ch.channel_id,
        group: ch.group || ch.channel_group,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={[styles.loadingTxt, { color: colors.textSecondary }]}>Kanallar yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
            <View>
              <Text style={[styles.appTitle, { color: colors.textPrimary }]}>ElensarTV</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Canlı TV İzle</Text>
            </View>
          </View>
        </View>

        {/* Recently Watched */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text testID="section-history" style={[styles.sectionTitle, { color: colors.textPrimary }]}>Son İzlenenler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
              {history.map((h: any) => (
                <TouchableOpacity
                  key={h.id}
                  testID={`history-${h.channel_id}`}
                  style={[styles.historyCard, { backgroundColor: colors.surface }]}
                  onPress={() => playChannel(h)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.historyIcon, { backgroundColor: COUNTRY_COLORS[h.channel_group] || colors.brand }]}>
                    <MaterialCommunityIcons name="television-classic" size={22} color="#FFF" />
                  </View>
                  <Text style={[styles.historyName, { color: colors.textPrimary }]} numberOfLines={2}>{h.channel_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Kategoriler</Text>
            <TouchableOpacity testID="see-all-cats-btn" onPress={() => router.push('/(tabs)/categories')}>
              <Text style={{ color: colors.brand, fontSize: 15, fontWeight: '600' }}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {categories.map((c: any) => (
              <TouchableOpacity
                key={c.name}
                testID={`cat-${c.name}`}
                style={[styles.catPill, { backgroundColor: COUNTRY_COLORS[c.name] || colors.surfaceHighlight }]}
                onPress={() => router.push({ pathname: '/channel-list', params: { group: c.name } })}
                activeOpacity={0.8}
              >
                <Text style={styles.catName}>{c.name}</Text>
                <Text style={styles.catCount}>{c.count} kanal</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Turkish Channels */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Türk Kanalları</Text>
            <TouchableOpacity testID="see-all-turkish-btn" onPress={() => router.push({ pathname: '/channel-list', params: { group: 'Turkey' } })}>
              <Text style={{ color: colors.brand, fontSize: 15, fontWeight: '600' }}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          {featured.map((ch: any) => (
            <TouchableOpacity
              key={ch.id}
              testID={`featured-${ch.id}`}
              style={[styles.chRow, { backgroundColor: colors.surface }]}
              onPress={() => playChannel(ch)}
              activeOpacity={0.7}
            >
              <View style={[styles.chIcon, { backgroundColor: '#E30A17' }]}>
                <Text style={styles.chInitial}>{ch.name.charAt(0)}</Text>
              </View>
              <View style={styles.chInfo}>
                <Text style={[styles.chName, { color: colors.textPrimary }]} numberOfLines={1}>{ch.name}</Text>
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTxt}>CANLI</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="play-circle" size={36} color={colors.brand} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { marginTop: 12, fontSize: 16 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 48, height: 48, borderRadius: 12 },
  appTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  section: { marginBottom: 32, paddingLeft: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingRight: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  historyCard: { width: 120, marginRight: 12, borderRadius: 14, padding: 14, alignItems: 'center' },
  historyIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  historyName: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  catPill: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, marginRight: 10, minWidth: 120 },
  catName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  catCount: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  chRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8, marginRight: 20 },
  chIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  chInitial: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  chInfo: { flex: 1, marginLeft: 14 },
  chName: { fontSize: 16, fontWeight: '600' },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  liveTxt: { fontSize: 11, fontWeight: '700', color: '#00C853', letterSpacing: 1 },
});
