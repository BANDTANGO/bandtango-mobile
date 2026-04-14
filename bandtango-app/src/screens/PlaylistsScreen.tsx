import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Playlist, MainStackParamList } from '../types';

type PlaylistsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Playlists'>;
  playlists: Playlist[];
};

function PlaylistRow({ onPress, last, children }: { onPress?: () => void; last?: boolean; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(106, 120, 160, 0.85)', marginBottom: last ? 0 : 12 }}
    >
      <LinearGradient
        colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
        start={{ x: 1.0, y: 0.2 }}
        end={{ x: 0.5, y: 1.25 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ padding: 14 }}>
        {children}
      </View>
    </Pressable>
  );
}

export function PlaylistsScreen({ navigation, playlists }: PlaylistsScreenProps) {
  const [editMode, setEditMode] = useState(false);

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

        {playlists.map((playlist, index) => (
          <PlaylistRow
            key={playlist.id}
            last={index === playlists.length - 1}
            onPress={() =>
              !editMode &&
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
      </ScrollView>
    </View>
  );
}
