import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    api.getPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  const deletePlaylist = async (id: string, name: string) => {
    Alert.alert('Playlist Sil', `"${name}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePlaylist(id);
            setPlaylists((p) => p.filter((x) => x.id !== id));
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Ayarlar</Text>

        {/* Theme */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Görünüm</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name={isDark ? 'weather-night' : 'white-balance-sunny'} size={24} color={colors.brand} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{isDark ? 'Koyu Tema' : 'Açık Tema'}</Text>
            </View>
            <Switch testID="theme-toggle" value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#ccc', true: colors.brand }} thumbColor="#FFF" />
          </View>
        </View>

        {/* Playlists */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Playlistler</Text>
            <TouchableOpacity testID="add-playlist-btn" style={[styles.addBtn, { backgroundColor: colors.brand }]} onPress={() => router.push('/add-playlist')}>
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              <Text style={styles.addBtnTxt}>Ekle</Text>
            </TouchableOpacity>
          </View>
          {playlists.map((p: any) => (
            <View key={p.id} style={[styles.playlistRow, { borderColor: colors.border }]}>
              <View style={styles.playlistInfo}>
                <MaterialCommunityIcons name="playlist-play" size={24} color={colors.brand} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.playlistName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.playlistMeta, { color: colors.textSecondary }]}>{p.channel_count} kanal</Text>
                </View>
              </View>
              {p.id !== 'default' && (
                <TouchableOpacity testID={`del-playlist-${p.id}`} onPress={() => deletePlaylist(p.id, p.name)}>
                  <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* About */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Hakkında</Text>
          <View style={[styles.aboutRow, { borderColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Uygulama</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>ElensarTV</Text>
          </View>
          <View style={[styles.aboutRow, { borderColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Sürüm</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>1.0.0</Text>
          </View>
          <View style={[styles.aboutRow, { borderColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Platform</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>TVBox / Mobile</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', marginBottom: 24 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16, fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, gap: 6 },
  addBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  playlistRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1 },
  playlistInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playlistName: { fontSize: 15, fontWeight: '600' },
  playlistMeta: { fontSize: 12, marginTop: 2 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 0.5 },
  aboutLabel: { fontSize: 15 },
  aboutValue: { fontSize: 15, fontWeight: '600' },
});
