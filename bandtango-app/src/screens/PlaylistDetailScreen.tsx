import { RouteProp } from '@react-navigation/native';
import { useState, useMemo } from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Playlist, MainStackParamList } from '../types';

// Mock catalog to search against
const SONG_CATALOG = [
  { title: 'Neon Lights', artist: 'The Echoes', duration: '3:42' },
  { title: 'Late Night Drive', artist: 'Blue Tides', duration: '4:11' },
  { title: 'Golden Hour', artist: 'Neon Anthem', duration: '3:55' },
  { title: 'Cityscape', artist: 'The Echoes', duration: '4:28' },
  { title: 'Faded Signal', artist: 'Riven', duration: '3:06' },
  { title: 'Warm Static', artist: 'Blue Tides', duration: '5:02' },
  { title: 'Drift', artist: 'Neon Anthem', duration: '3:30' },
  { title: 'Midnight Atlas', artist: 'Riven', duration: '4:49' },
  { title: 'Open Roads', artist: 'The Echoes', duration: '3:17' },
  { title: 'Solar Wind', artist: 'Kova', duration: '4:00' },
  { title: 'Echo Chamber', artist: 'Kova', duration: '3:38' },
  { title: 'Shallow Water', artist: 'Blue Tides', duration: '4:22' },
];

type PlaylistDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'PlaylistDetail'>;
  playlist?: Playlist;
  onAddSong: (
    playlistId: string,
    payload: { title: string; artist: string; duration: string; audioUrl?: string }
  ) => void;
  onRemoveSong: (playlistId: string, songId: string) => void;
};

export function PlaylistDetailScreen({
  route,
  playlist,
  onAddSong,
  onRemoveSong,
}: PlaylistDetailScreenProps) {
  const [query, setQuery] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SONG_CATALOG.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  if (!playlist) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 14 }}>
        <Text style={{ color: '#64748B' }}>Playlist not found.</Text>
      </View>
    );
  }

  const handleAdd = (song: { title: string; artist: string; duration: string }) => {
    onAddSong(route.params.playlistId, { ...song, audioUrl: audioUrl.trim() || undefined });
    setQuery('');
    setAudioUrl('');
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 14 }}>
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>

      <Text style={{ fontSize: 26, fontWeight: '700', color: '#F8FAFC' }}>{playlist.name}</Text>
      <Text style={{ marginTop: 4, marginBottom: 14, color: '#94A3B8' }}>{playlist.description}</Text>

      {/* Search panel */}
      <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B', padding: 12, marginBottom: 16 }}>
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Add Song</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: searchFocused ? '#F8FAFC' : '#334155', backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 8, gap: 8 }}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search songs or artists…"
            placeholderTextColor="#64748B"
            selectionColor="#F8FAFC"
            cursorColor="#F8FAFC"
            underlineColorAndroid="transparent"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ flex: 1, color: '#F8FAFC', fontSize: 14, outline: 'none' } as any}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="#64748B" />
            </Pressable>
          )}
        </View>

        {results.length > 0 && (
          <View style={{ marginTop: 8, gap: 6 }}>
            {results.map((song, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleAdd(song)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: '#334155' }}
              >
                <View>
                  <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: '600' }}>{song.title}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 1 }}>{song.artist} • {song.duration}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
              </Pressable>
            ))}
          </View>
        )}

        {query.trim().length > 0 && results.length === 0 && (
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 8 }}>No matches found.</Text>
        )}

        {/* Audio URL */}
        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 6 }}>Audio URL <Text style={{ color: '#475569', fontWeight: '400' }}>(optional)</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: urlFocused ? '#F8FAFC' : '#334155', backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 8, gap: 8 }}>
          <Ionicons name="link-outline" size={15} color="#64748B" />
          <TextInput
            value={audioUrl}
            onChangeText={setAudioUrl}
            placeholder="https://…"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            keyboardType="url"
            selectionColor="#F8FAFC"
            cursorColor="#F8FAFC"
            underlineColorAndroid="transparent"
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setUrlFocused(false)}
            style={{ flex: 1, color: '#F8FAFC', fontSize: 13, outline: 'none' } as any}
          />
          {!!audioUrl && (
            <Pressable onPress={() => setAudioUrl('')}>
              <Ionicons name="close-circle" size={15} color="#64748B" />
            </Pressable>
          )}
        </View>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '600', color: '#E2E8F0', marginBottom: 8 }}>
        Songs ({playlist.songs.length})
      </Text>

      <FlatList
        data={playlist.songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B', padding: 12, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#F8FAFC', marginBottom: 3 }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>{item.artist} • {item.duration}</Text>
              {!!item.audioUrl && (
                <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }} numberOfLines={1}>{item.audioUrl}</Text>
              )}
            </View>
            <Pressable
              onPress={() => onRemoveSong(playlist.id, item.id)}
              style={{ borderRadius: 8, borderWidth: 1, borderColor: '#F87171', paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#F87171' }}>Remove</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#64748B' }}>No songs yet.</Text>}
      />
    </View>
  );
}
