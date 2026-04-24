import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Playlist, MainStackParamList } from '../types';
import { useNowPlaying } from '../state/NowPlayingContext';

const LISTEN_BASE = 'http://localhost:7070';

type PlaylistsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Playlists'>;
  playlists: Playlist[];
  apiPlaylists: Playlist[];
  apiLoading: boolean;
  apiError: string;
};

const HOVER_BG = 'rgba(0, 202, 245, 0.08)';
const SELECTED_BG = 'rgba(0, 202, 245, 0.13)';
const SELECTED_BORDER = '#00CAF5';
const DEFAULT_BORDER = 'rgba(106, 120, 160, 0.85)';

function PlaylistRow({ onPress, last, selected, children }: { onPress?: () => void; last?: boolean; selected?: boolean; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => ({
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? SELECTED_BORDER : DEFAULT_BORDER,
        marginBottom: last ? 0 : 12,
      })}
    >
      {({ hovered }: any) => (
        <>
          <LinearGradient
            colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
            start={{ x: 1.0, y: 0.2 }}
            end={{ x: 0.5, y: 1.25 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {(hovered || selected) && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: selected ? SELECTED_BG : HOVER_BG }} pointerEvents="none" />
          )}
          <View style={{ padding: 14 }}>
            {children}
          </View>
        </>
      )}
    </Pressable>
  );
}

export function PlaylistsScreen({ navigation, playlists, apiPlaylists, apiLoading, apiError }: PlaylistsScreenProps) {
  const [editMode, setEditMode] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const { setActiveHlsUrl, hlsAudioRef } = useNowPlaying();

  const handleApiPlaylistPress = async (playlist: Playlist) => {
    if (editMode) return;

    // Fetch the HLS URL before navigating so we can start the Audio element
    // inside the browser's user-activation window and guarantee autoplay works.
    try {
      const res = await fetch(`${LISTEN_BASE}/api/music-playlists/listen/${playlist.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('non-200');
      const data = await res.json() as { hls_url?: string };
      if (!data.hls_url) throw new Error('no hls_url');
      const full = data.hls_url.startsWith('http')
        ? data.hls_url
        : `${LISTEN_BASE}${data.hls_url}`;

      // Create and start the Audio element now, while still in the user-gesture
      // activation window. The fetch is on localhost so this is typically <200ms.
      const prevAudio = hlsAudioRef.current;
      if (prevAudio) { prevAudio.pause(); prevAudio.src = ''; }
      const audio = new (globalThis as unknown as { Audio: typeof Audio }).Audio(full);
      audio.preload = 'auto';
      hlsAudioRef.current = audio;
      setActiveHlsUrl(full);
      audio.play().catch(() => { /* LivePlayerCard retry will recover */ });

      // Navigate after play() is already in flight — card will adopt the element.
      navigation.navigate('Home', { playlistId: playlist.id, playlistName: playlist.name });
    } catch {
      // On failure, navigate anyway — HomeScreen's own listen fetch is a safety net.
      navigation.navigate('Home', { playlistId: playlist.id, playlistName: playlist.name });
    }
  };

  // Set navigation options for header buttons
  navigation.setOptions({
    headerRight: () => (
      <View className="flex-row gap-3 mr-4">
        <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155]">
          <Ionicons name="search" size={16} color="#F8FAFC" />
        </Pressable>
        <Pressable
          onPress={() => setEditMode((prev) => !prev)}
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: editMode ? '#00CAF5' : '#334155', backgroundColor: editMode ? 'rgba(0,202,245,0.15)' : '#1E293B' }}
        >
          <Ionicons name="pencil" size={16} color={editMode ? '#00CAF5' : '#F8FAFC'} />
        </Pressable>
        <Pressable
          className="w-8 h-8 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155]"
          onPress={() => navigation.navigate('AddPlaylist')}
        >
          <Text className="text-lg font-bold text-[#F8FAFC]">+</Text>
        </Pressable>
      </View>
    ),
    headerTitle: 'Playlists',
    headerStyle: {
      backgroundColor: '#0B1220',
    },
    headerTintColor: '#F8FAFC',
  });

  return (
    <View className="flex-1">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <ScrollView contentContainerClassName="px-5 pb-9 pt-4">

        {/* Local playlists */}
        {playlists.length > 0 && (
          <>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 }}>MY PLAYLISTS</Text>
            {playlists.map((playlist, index) => (
              <PlaylistRow
                key={playlist.id}
                last={index === playlists.length - 1}
                selected={selectedPlaylist === playlist.id}
                onPress={() => {
                  setSelectedPlaylist(selectedPlaylist === playlist.id ? null : playlist.id);
                  if (!editMode) navigation.navigate('Home', { playlistId: playlist.id, playlistName: playlist.name });
                }}
              >
                <View className="mb-1.5 flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-[#F8FAFC]">
                    {playlist.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text className="text-[13px] font-medium text-sky-400">
                      {playlist.songs.length} songs
                    </Text>
                    {editMode && (
                      <Pressable
                        onPress={() => navigation.navigate('PlaylistDetail', { playlistId: playlist.id })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(11,18,32,0.5)' }}
                      >
                        <Ionicons name="pencil-outline" size={12} color="#00CAF5" />
                        <Text style={{ color: '#00CAF5', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                <Text className="text-[13px] text-[#94A3B8]">{playlist.description}</Text>
              </PlaylistRow>
            ))}
          </>
        )}

        {/* API playlists */}
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: playlists.length > 0 ? 24 : 0, marginBottom: 10 }}>
          FROM SERVER
        </Text>

        {apiLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
            <ActivityIndicator size="small" color="#00CAF5" />
            <Text style={{ color: '#64748B', fontSize: 14 }}>Loading playlists…</Text>
          </View>
        )}

        {!!apiError && !apiLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(153,27,27,0.15)', borderRadius: 10, borderWidth: 1, borderColor: '#7f1d1d', padding: 12, marginBottom: 8 }}>
            <Ionicons name="alert-circle-outline" size={16} color="#FCA5A5" />
            <Text style={{ color: '#FCA5A5', fontSize: 13, flex: 1 }}>{apiError}</Text>
          </View>
        )}

        {!apiLoading && !apiError && apiPlaylists.length === 0 && (
          <Text style={{ color: '#475569', fontSize: 14, paddingVertical: 8 }}>No playlists found on server.</Text>
        )}

        {apiPlaylists.map((playlist, index) => (
          <PlaylistRow
            key={playlist.id}
            last={index === apiPlaylists.length - 1}
            selected={selectedPlaylist === playlist.id}
            onPress={() => {
              setSelectedPlaylist(selectedPlaylist === playlist.id ? null : playlist.id);
              handleApiPlaylistPress(playlist);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {playlist.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '500' }}>
                  {(Array.isArray(playlist.songs) ? playlist.songs : []).length} songs
                </Text>
                {playlist.url && !editMode ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="radio-outline" size={13} color="#00CAF5" />
                    <Text style={{ color: '#00CAF5', fontSize: 11, fontWeight: '600' }}>STREAM</Text>
                  </View>
                ) : null}
                {editMode && (
                  <Pressable
                    onPress={() => navigation.navigate('PlaylistDetail', { playlistId: playlist.id })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(11,18,32,0.5)' }}
                  >
                    <Ionicons name="pencil-outline" size={12} color="#00CAF5" />
                    <Text style={{ color: '#00CAF5', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                  </Pressable>
                )}
              </View>
            </View>
            {!!playlist.description && (
              <Text style={{ color: '#94A3B8', fontSize: 13 }} numberOfLines={2}>{playlist.description}</Text>
            )}
          </PlaylistRow>
        ))}
      </ScrollView>
    </View>
  );
}
