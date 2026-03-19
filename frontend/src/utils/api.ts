const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getChannels: (p: { group?: string; search?: string; skip?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (p.group) q.set('group', p.group);
    if (p.search) q.set('search', p.search);
    q.set('skip', String(p.skip || 0));
    q.set('limit', String(p.limit || 50));
    return request(`/api/channels?${q}`);
  },
  getCategories: () => request('/api/channels/categories'),
  resolveChannel: (url: string) => request('/api/channels/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }),
  getFavorites: () => request('/api/favorites'),
  addFavorite: (ch: any) => request('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel_id: ch.id, channel_name: ch.name, channel_group: ch.group, channel_url: ch.url }),
  }),
  removeFavorite: (id: string) => request(`/api/favorites/${id}`, { method: 'DELETE' }),
  getHistory: () => request('/api/history'),
  addToHistory: (ch: any) => request('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel_id: ch.id, channel_name: ch.name, channel_group: ch.group, channel_url: ch.url }),
  }),
  getPlaylists: () => request('/api/playlists'),
  addPlaylist: (url: string, name: string) => request('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name }),
  }),
  deletePlaylist: (id: string) => request(`/api/playlists/${id}`, { method: 'DELETE' }),
};
