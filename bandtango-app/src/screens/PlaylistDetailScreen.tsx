import { RouteProp } from '@react-navigation/native';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MusicPlayerControls } from '../components/MusicPlayerControls';
import { Playlist, MainStackParamList } from '../types';

type PlaylistDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'PlaylistDetail'>;
  playlist?: Playlist;
  onAddSong: (
    playlistId: string,
    payload: { title: string; artist: string; duration: string }
  ) => void;
  onRemoveSong: (playlistId: string, songId: string) => void;
};

export function PlaylistDetailScreen({
  route,
  playlist,
  onAddSong,
  onRemoveSong,
}: PlaylistDetailScreenProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState('');

  if (!playlist) {
    return (
      <View className="flex-1 bg-transparent px-[18px] pt-[14px]">
        <Text className="text-[#64748B]">Playlist not found.</Text>
      </View>
    );
  }

  const addSong = () => {
    if (!title.trim() || !artist.trim() || !duration.trim()) {
      return;
    }

    onAddSong(route.params.playlistId, {
      title: title.trim(),
      artist: artist.trim(),
      duration: duration.trim(),
    });
    setTitle('');
    setArtist('');
    setDuration('');
  };

  return (
    <View className="flex-1 bg-transparent px-[18px] pt-[14px]">
      <Text className="text-[26px] font-bold text-[#F8FAFC]">{playlist.name}</Text>
      <Text className="mt-1 mb-[14px] text-[#94A3B8]">{playlist.description}</Text>

      <View className="rounded-xl border border-[#334155] bg-[#1E293B] p-3">
        <Text className="mb-2 text-sm font-semibold text-[#E2E8F0]">Add Song</Text>
        <TextInput
          className="mb-2 rounded-[10px] border border-[#334155] bg-[#0F172A] px-2.5 py-2.5 text-[#F8FAFC]"
          placeholder="Song title"
          placeholderTextColor="#64748B"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          className="mb-2 rounded-[10px] border border-[#334155] bg-[#0F172A] px-2.5 py-2.5 text-[#F8FAFC]"
          placeholder="Artist"
          placeholderTextColor="#64748B"
          value={artist}
          onChangeText={setArtist}
        />
        <TextInput
          className="mb-2 rounded-[10px] border border-[#334155] bg-[#0F172A] px-2.5 py-2.5 text-[#F8FAFC]"
          placeholder="Duration (e.g. 3:45)"
          placeholderTextColor="#64748B"
          value={duration}
          onChangeText={setDuration}
        />
        <Pressable
          className="mt-0.5 items-center rounded-[10px] bg-blue-600 py-2.5"
          onPress={addSong}
        >
          <Text className="font-semibold text-[#F8FAFC]">Add to Playlist</Text>
        </Pressable>
      </View>

      <Text className="mt-4 mb-2 text-base font-semibold text-[#E2E8F0]">
        Songs ({playlist.songs.length})
      </Text>

      <FlatList
        data={playlist.songs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-5"
        renderItem={({ item }) => (
          <View className="mb-2.5 flex-row items-center justify-between rounded-xl border border-[#334155] bg-[#1E293B] p-3">
            <View>
              <Text className="mb-1 text-[15px] font-semibold text-[#F8FAFC]">
                {item.title}
              </Text>
              <Text className="text-[13px] text-[#94A3B8]">
                {item.artist} • {item.duration}
              </Text>
            </View>
            <Pressable
              className="rounded-lg border border-[#F87171] px-2.5 py-1.5"
              onPress={() => onRemoveSong(playlist.id, item.id)}
            >
              <Text className="text-xs font-semibold text-[#F87171]">Remove</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text className="text-[#64748B]">No songs yet.</Text>}
        ListFooterComponent={
          <MusicPlayerControls
            sessionId={`playlist-${playlist.id}`}
            tracks={playlist.songs.map((song) => ({
              title: song.title,
              artist: song.artist,
              duration: song.duration,
              audioUrl: song.audioUrl,
            }))}
            title="Set Preview"
            artist={playlist.name}
            progressPercent={66}
            isPlaying
          />
        }
      />
    </View>
  );
}
