import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import {
  DrawerActions,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import './global.css';
import { NowPlayingMiniBar } from './src/components/NowPlayingMiniBar';
import { seedPlaylists } from './src/data/seed';
import { AddPlaylistScreen } from './src/screens/AddPlaylistScreen';
import { CreatePlaylistScreen } from './src/screens/CreatePlaylistScreen';
import { AudioAgentScreen } from './src/screens/AudioAgentScreen';
import { DiscoveryLevelScreen } from './src/screens/DiscoveryLevelScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { GettingStartedScreen } from './src/screens/GettingStartedScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlaylistsScreen } from './src/screens/PlaylistsScreen';
import { PlaylistDetailScreen } from './src/screens/PlaylistDetailScreen';
import { HLSListeningScreen } from './src/screens/HLSListeningScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NowPlayingProvider } from './src/state/NowPlayingContext';
import { Playlist, RootStackParamList, Song } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<{
  MainStack: NavigatorScreenParams<RootStackParamList>;
}>();

function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView
      contentContainerStyle={{ flex: 1, backgroundColor: '#0B1220', paddingTop: 8 }}
    >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <View>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>
            MENU
          </Text>

          <Pressable
            style={{
              marginBottom: 10,
              borderColor: '#334155',
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            onPress={() => {
              navigation.navigate('MainStack', { screen: 'Home' });
              navigation.closeDrawer();
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Ionicons color="#F8FAFC" name="home-outline" size={18} />
              <View style={{ width: 8 }} />
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
                Home
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={{
              marginBottom: 10,
              borderColor: '#334155',
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            onPress={() => {
              navigation.navigate('MainStack', { screen: 'Playlists' });
              navigation.closeDrawer();
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Ionicons color="#F8FAFC" name="add-circle-outline" size={18} />
              <View style={{ width: 8 }} />
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
                Playlists
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={{
              marginBottom: 10,
              borderColor: '#334155',
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            onPress={() => {
              navigation.navigate('MainStack', { screen: 'DiscoveryLevel' });
              navigation.closeDrawer();
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Ionicons color="#F8FAFC" name="compass-outline" size={18} />
              <View style={{ width: 8 }} />
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
                Discovery Level
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={{
              marginBottom: 10,
              borderColor: '#334155',
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            onPress={() => {
              navigation.navigate('MainStack', { screen: 'AudioAgent' });
              navigation.closeDrawer();
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Ionicons color="#F8FAFC" name="headset-outline" size={18} />
              <View style={{ width: 8 }} />
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
                Audio Agent
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={{
              marginBottom: 10,
              borderColor: '#334155',
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            onPress={() => {
              navigation.navigate('MainStack', { screen: 'HLSListening' });
              navigation.closeDrawer();
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Ionicons color="#00CAF5" name="radio-outline" size={18} />
              <View style={{ width: 8 }} />
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
                Streaming
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={{
              marginBottom: 10,
              borderColor: '#334155',
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            onPress={() => {
              navigation.navigate('MainStack', { screen: 'Explore' });
              navigation.closeDrawer();
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Ionicons color="#F8FAFC" name="search-outline" size={18} />
              <View style={{ width: 8 }} />
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
                Explore
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          style={{
            marginBottom: 10,
            borderColor: '#334155',
            borderRadius: 12,
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
          onPress={() => {
            navigation.navigate('MainStack', { screen: 'Settings' });
            navigation.closeDrawer();
          }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <Ionicons color="#F8FAFC" name="settings-outline" size={18} />
            <View style={{ width: 8 }} />
            <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
              Settings
            </Text>
          </View>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

export default function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>(seedPlaylists);

  const addPlaylist = (payload: { name: string; description: string; url?: string; songs?: Song[] }) => {
    setPlaylists((current) => [
      {
        id: Date.now().toString(),
        name: payload.name,
        description: payload.description,
        url: payload.url,
        songs: payload.songs ?? [],
      },
      ...current,
    ]);
  };

  const addSong = (
    playlistId: string,
    payload: { title: string; artist: string; duration: string; audioUrl?: string }
  ) => {
    setPlaylists((current) =>
      current.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist;
        }

        const song: Song = {
          id: `${playlistId}-${Date.now()}`,
          title: payload.title,
          artist: payload.artist,
          duration: payload.duration,
          audioUrl: payload.audioUrl,
        };

        return {
          ...playlist,
          songs: [song, ...playlist.songs],
        };
      })
    );
  };

  const removeSong = (playlistId: string, songId: string) => {
    setPlaylists((current) =>
      current.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist;
        }

        return {
          ...playlist,
          songs: playlist.songs.filter((song) => song.id !== songId),
        };
      })
    );
  };

  const playlistMap = useMemo(
    () => new Map(playlists.map((playlist) => [playlist.id, playlist])),
    [playlists]
  );

  const MainStackNavigator = () => (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: '#0F172A',
              borderBottomColor: '#334155',
              borderBottomWidth: 1,
            }}
          />
        ),
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="Home"
        options={({ navigation, route }) => ({
          title: route.params?.playlistName ?? 'BANDTANGO',
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginRight: 8, padding: 4 }}
            >
              <Ionicons name="menu" size={22} color="#F8FAFC" />
            </Pressable>
          ),
        })}
      >
        {(props) => <HomeScreen {...props} playlists={playlists} />}
      </Stack.Screen>

      <Stack.Screen name="Playlists" options={{ title: 'Playlists' }}>
        {(props) => <PlaylistsScreen {...props} playlists={playlists} />}
      </Stack.Screen>

      <Stack.Screen
        name="DiscoveryLevel"
        component={DiscoveryLevelScreen}
        options={{ title: 'Discovery Level' }}
      />

      <Stack.Screen
        name="AudioAgent"
        component={AudioAgentScreen}
        options={{ title: 'Audio Agent' }}
      />

      <Stack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />

      <Stack.Screen
        name="HLSListening"
        component={HLSListeningScreen}
        options={{ title: 'Streaming' }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />

      <Stack.Screen
        name="GettingStarted"
        component={GettingStartedScreen}
        options={{ title: 'Getting Started', headerShown: false }}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Login', headerShown: false }}
      />

      <Stack.Screen name="AddPlaylist" options={{ title: 'New Playlist' }}>
        {(props) => (
          <AddPlaylistScreen {...props} onCreatePlaylist={addPlaylist} />
        )}
      </Stack.Screen>

      <Stack.Screen name="CreatePlaylist" options={{ title: 'New Playlist' }}>
        {(props) => (
          <CreatePlaylistScreen {...props} onCreatePlaylist={addPlaylist} />
        )}
      </Stack.Screen>

      <Stack.Screen name="PlaylistDetail" options={{ title: 'Playlist' }}>
        {(props) => (
          <PlaylistDetailScreen
            {...props}
            playlist={playlistMap.get(props.route.params.playlistId)}
            onAddSong={addSong}
            onRemoveSong={removeSong}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );

  return (
    <NowPlayingProvider>
      <View style={{ flex: 1, backgroundColor: '#0B1220' }}>
        <View style={{ flex: 1, backgroundColor: '#0B1220' }}>
          <NavigationContainer>
            <StatusBar style="light" />
            <Drawer.Navigator
              drawerContent={(props) => <AppDrawerContent {...props} />}
              screenOptions={{
                drawerStyle: { backgroundColor: '#0B1220', width: 280 },
                headerShown: false,
              }}
            >
              <Drawer.Screen component={MainStackNavigator} name="MainStack" />
            </Drawer.Navigator>
          </NavigationContainer>
          <NowPlayingMiniBar />
        </View>
      </View>
    </NowPlayingProvider>
  );
}
