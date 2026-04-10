import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Playlist, MainStackParamList } from '../types';

type PlaylistsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Playlists'>;
  playlists: Playlist[];
};

export function PlaylistsScreen({ navigation, playlists }: PlaylistsScreenProps) {
  // Set navigation options for header buttons
  navigation.setOptions({
    headerRight: () => (
      <View className="flex-row gap-3 mr-4">
        <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155]">
          <Ionicons name="search" size={16} color="#F8FAFC" />
        </Pressable>
        <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155]">
          <Ionicons name="pencil" size={16} color="#F8FAFC" />
        </Pressable>
        <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155]">
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
    <View className="flex-1 bg-[#0B1220]">
      <ScrollView contentContainerClassName="px-5 pb-9 pt-4">

        {playlists.map((playlist) => (
          <Pressable
            key={playlist.id}
            className="mb-3 rounded-2xl border border-[#334155] bg-[#1E293B] p-3.5"
            onPress={() =>
              navigation.navigate('Home', {
                playlistId: playlist.id,
                playlistName: playlist.name,
              })
            }
          >
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-base font-semibold text-[#F8FAFC]">
                {playlist.name}
              </Text>
              <Text className="text-[13px] font-medium text-sky-400">
                {playlist.songs.length} songs
              </Text>
            </View>
            <Text className="text-[13px] text-[#94A3B8]">{playlist.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
