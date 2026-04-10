import { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ScrollView, Text, View } from 'react-native';
import { MusicPlayerControls } from '../components/MusicPlayerControls';
import { Playlist, MainStackParamList } from '../types';

type HomeScreenProps = NativeStackScreenProps<MainStackParamList, 'Home'> & {
  playlists: Playlist[];
};

export function HomeScreen({ playlists, route }: HomeScreenProps) {
  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === route.params?.playlistId),
    [playlists, route.params?.playlistId]
  );

  const tracks = useMemo(
    () =>
      (selectedPlaylist ? [selectedPlaylist] : playlists).flatMap((playlist) =>
        playlist.songs.map((song) => ({
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          audioUrl: song.audioUrl,
          albumArtUrl: song.albumArtUrl,
        }))
      ),
    [playlists, selectedPlaylist]
  );

  const featuredTrack = tracks[0];

  return (
    <View className="flex-1 bg-[#0F172A]">
      <ScrollView contentContainerClassName="px-5 pb-9">
        <View className="mb-4 mt-4">
          <Text className="mb-2 text-sm font-semibold text-[#E2E8F0]">Album Art</Text>
          <View className="h-64 overflow-hidden rounded-2xl border border-[#334155] bg-[#111827]">
            {featuredTrack?.albumArtUrl ? (
              <Image
                source={{ uri: featuredTrack.albumArtUrl }}
                resizeMode="cover"
                style={{ height: '100%', width: '100%' }}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-base font-semibold text-[#F8FAFC]">No Album Art Yet</Text>
                <Text className="mt-1 text-xs text-[#94A3B8]">
                  Artwork displays here when available
                </Text>
              </View>
            )}
          </View>
        </View>

        <MusicPlayerControls
          sessionId="home-all"
          tracks={tracks}
          progressPercent={74}
          isPlaying
        />
      </ScrollView>
    </View>
  );
}
