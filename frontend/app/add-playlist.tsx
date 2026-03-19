import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AddPlaylistScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const addByUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Hata', "Lütfen bir M3U URL'si girin");
      return;
    }
    setLoading(true);
    try {
      const result = await api.addPlaylist(url.trim(), name.trim() || 'Custom Playlist');
      Alert.alert('Başarılı', result.message || 'Playlist eklendi', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', "Playlist eklenemedi. URL'yi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'audio/x-mpegurl', 'application/x-mpegurl', 'audio/mpegurl'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setLoading(true);
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name || 'playlist.m3u',
          type: file.mimeType || 'text/plain',
        } as any);

        const resp = await fetch(`${BACKEND_URL}/api/playlists/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await resp.json();
        if (resp.ok) {
          Alert.alert('Başarılı', data.message || 'Playlist eklendi', [
            { text: 'Tamam', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('Hata', data.detail || 'Dosya yüklenemedi');
        }
        setLoading(false);
      }
    } catch (e) {
      Alert.alert('Hata', 'Dosya seçilemedi');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity testID="close-modal-btn" onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Playlist Ekle</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.form}>
          {/* URL Method */}
          <View style={[styles.methodCard, { backgroundColor: colors.surface }]}>
            <View style={styles.methodHeader}>
              <MaterialCommunityIcons name="link-variant" size={22} color={colors.brand} />
              <Text style={[styles.methodTitle, { color: colors.textPrimary }]}>URL ile Ekle</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Playlist Adı</Text>
              <TextInput
                testID="playlist-name-input"
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Örn: Spor Kanalları"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>M3U URL</Text>
              <TextInput
                testID="playlist-url-input"
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="https://example.com/playlist.m3u"
                placeholderTextColor={colors.textSecondary}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <TouchableOpacity
              testID="add-playlist-submit-btn"
              style={[styles.submitBtn, { backgroundColor: colors.brand, opacity: loading ? 0.7 : 1 }]}
              onPress={addByUrl}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="playlist-plus" size={22} color="#FFF" />
                  <Text style={styles.submitTxt}>URL ile Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>veya</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* File Upload */}
          <TouchableOpacity
            testID="upload-file-btn"
            style={[styles.uploadBtn, { backgroundColor: colors.surface, borderColor: colors.brand }]}
            onPress={pickFile}
            disabled={loading}
          >
            <MaterialCommunityIcons name="file-upload-outline" size={28} color={colors.brand} />
            <Text style={[styles.uploadTxt, { color: colors.textPrimary }]}>M3U Dosyası Yükle</Text>
            <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>Cihazınızdan dosya seçin</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  form: { paddingHorizontal: 20, paddingTop: 8 },
  methodCard: { borderRadius: 16, padding: 20 },
  methodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  methodTitle: { fontSize: 17, fontWeight: '700' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, borderWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 12, gap: 10, marginTop: 4 },
  submitTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 14, fontWeight: '500' },
  uploadBtn: { borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed' },
  uploadTxt: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  uploadHint: { fontSize: 13, marginTop: 4 },
});
