import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../src/utils/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

function VideoPlayer({ streamUrl }: { streamUrl: string }) {
  // Use backend-served player page via iframe src (not srcDoc)
  // This avoids iframe sandbox/origin restrictions
  const playerUrl = `${BACKEND_URL}/api/player?stream_url=${encodeURIComponent(streamUrl)}`;

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <iframe
          src={playerUrl}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' } as any}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen"
        />
      </View>
    );
  }

  // Mobile: use WebView with the same backend URL
  const WebView = require('react-native-webview').default;
  return (
    <WebView
      testID="video-webview"
      source={{ uri: playerUrl }}
      style={styles.webview}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled={true}
      originWhitelist={['*']}
      allowsFullscreenVideo={true}
    />
  );
}

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ url: string; name: string; id: string; group: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    resolve();
    recordHistory();
    checkFav();
  }, []);

  const resolve = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.resolveChannel(params.url as string);
      if (r.stream_url) {
        setStreamUrl(r.stream_url);
      } else {
        setError(r.error || 'Stream çözümlenemedi');
      }
    } catch (e: any) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const recordHistory = async () => {
    try {
      await api.addToHistory({ id: params.id, name: params.name, group: params.group, url: params.url });
    } catch (e) { /* silent */ }
  };

  const checkFav = async () => {
    try {
      const favs = await api.getFavorites();
      setIsFav(favs.some((f: any) => f.channel_id === params.id));
    } catch (e) { /* silent */ }
  };

  const toggleFav = async () => {
    try {
      if (isFav) {
        await api.removeFavorite(params.id as string);
        setIsFav(false);
      } else {
        await api.addFavorite({ id: params.id, name: params.name, group: params.group, url: params.url });
        setIsFav(true);
      }
    } catch (e) { /* silent */ }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="player-back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text style={styles.channelName} numberOfLines={1}>{params.name}</Text>
          <Text style={styles.channelGroup}>{params.group}</Text>
        </View>
        <TouchableOpacity testID="player-fav-btn" style={styles.favBtn} onPress={toggleFav}>
          <MaterialCommunityIcons name={isFav ? 'heart' : 'heart-outline'} size={26} color={isFav ? '#FF5722' : '#FFF'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={styles.loadingTxt}>Stream çözümleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#FF5722" />
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity testID="retry-btn" style={styles.retryBtn} onPress={resolve}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
            <Text style={styles.retryTxt}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <VideoPlayer streamUrl={streamUrl} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#1a1a1a' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  titleArea: { flex: 1, marginHorizontal: 12 },
  channelName: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  channelGroup: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  favBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingTxt: { color: '#B0BEC5', fontSize: 15, marginTop: 16 },
  errorTxt: { color: '#FFF', fontSize: 16, marginTop: 16, textAlign: 'center', lineHeight: 22 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: '#FF5722', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50 },
  retryTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  webview: { flex: 1, backgroundColor: '#000' },
});
