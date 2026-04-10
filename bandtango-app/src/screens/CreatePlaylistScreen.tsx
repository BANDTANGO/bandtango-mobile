import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MusicPlayerControls } from '../components/MusicPlayerControls';
import { MainStackParamList } from '../types';

const previewTracks = [
  {
    title: 'Late Night Intro',
    artist: 'The Echoes',
    duration: '3:56',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    title: 'Warm Lights',
    artist: 'Neon Anthem',
    duration: '4:08',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  },
  {
    title: 'Streetline',
    artist: 'Blue Tides',
    duration: '3:31',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
];

type CreatePlaylistScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CreatePlaylist'>;
  onCreatePlaylist: (payload: { name: string; description: string }) => void;
};

export function CreatePlaylistScreen({
  navigation,
  onCreatePlaylist,
}: CreatePlaylistScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }

    onCreatePlaylist({
      name: name.trim(),
      description: description.trim() || 'No description yet',
    });
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-transparent p-5">
      <Text className="mt-3 mb-2 text-sm font-semibold text-[#E2E8F0]">
        Playlist Name
      </Text>
      <TextInput
        className="rounded-[10px] border border-[#334155] bg-[#1E293B] px-3 py-2.5 text-[#F8FAFC]"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (error) {
            setError('');
          }
        }}
        placeholder="Late Night Set"
        placeholderTextColor="#64748B"
      />

      <Text className="mt-3 mb-2 text-sm font-semibold text-[#E2E8F0]">
        Description
      </Text>
      <TextInput
        className="min-h-[92px] rounded-[10px] border border-[#334155] bg-[#1E293B] px-3 py-2.5 text-[#F8FAFC]"
        value={description}
        onChangeText={setDescription}
        placeholder="Mood, venue, or rehearsal notes"
        placeholderTextColor="#64748B"
        multiline
        textAlignVertical="top"
      />

      {!!error && <Text className="mt-2.5 text-[#F87171]">{error}</Text>}

      <Pressable
        className="mt-6 items-center rounded-[10px] bg-blue-600 py-3"
        onPress={submit}
      >
        <Text className="text-[15px] font-semibold text-[#F8FAFC]">
          Save Playlist
        </Text>
      </Pressable>

      <MusicPlayerControls
        sessionId="create-preview"
        tracks={previewTracks}
        progressPercent={38}
        isPlaying={false}
      />
    </View>
  );
}
