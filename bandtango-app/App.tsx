import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { useMemo, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import './global.css';
import { NowPlayingMiniBar } from './src/components/NowPlayingMiniBar';
import { seedPlaylists } from './src/data/seed';
import { AddPlaylistScreen } from './src/screens/AddPlaylistScreen';
import { CreatePlaylistScreen } from './src/screens/CreatePlaylistScreen';
import { AudioAgentScreen } from './src/screens/AudioAgentScreen';
import { DiscoveryLevelScreen } from './src/screens/DiscoveryLevelScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { GettingStartedScreen } from './src/screens/GettingStartedScreen';
import { AboutYouScreen }              from './src/screens/AboutYouScreen';
import { AudioAgentPersonalityScreen } from './src/screens/AudioAgentPersonalityScreen';
import { CreateAccountScreen }         from './src/screens/CreateAccountScreen';
import AuthCallbackScreen              from './src/screens/AuthCallbackScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlaylistsScreen } from './src/screens/PlaylistsScreen';
import { PlaylistDetailScreen } from './src/screens/PlaylistDetailScreen';
import { HLSListeningScreen } from './src/screens/HLSListeningScreen';
import { FeedbackScreen } from './src/screens/FeedbackScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NowPlayingProvider } from './src/state/NowPlayingContext';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { AuthStackParamList, MainStackParamList, Playlist, RootStackParamList, Song } from './src/types';

const Stack       = createNativeStackNavigator<RootStackParamList>();
const AuthStack   = createNativeStackNavigator<AuthStackParamList>();
const Drawer      = createDrawerNavigator<{
  MainStack: NavigatorScreenParams<MainStackParamList>;
}>(); 

function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();
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
            navigation.navigate('MainStack', { screen: 'Feedback' });
            navigation.closeDrawer();
          }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <Ionicons color="#F8FAFC" name="chatbubble-outline" size={18} />
            <View style={{ width: 8 }} />
            <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}>
              Feedback
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

        <Pressable
          style={{
            marginBottom: 10,
            borderColor: '#4B1D1D',
            borderRadius: 12,
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
          onPress={() => { navigation.closeDrawer(); signOut(); }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <Ionicons color="#F87171" name="log-out-outline" size={18} />
            <View style={{ width: 8 }} />
            <Text style={{ color: '#F87171', fontSize: 15, fontWeight: '600' }}>
              Sign Out
            </Text>
            {user?.name ? (
              <Text style={{ color: '#64748B', fontSize: 12, marginLeft: 8 }} numberOfLines={1}>
                ({user.name})
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

function ProtectedApp() {
  const [playlists, setPlaylists] = useState<Playlist[]>(seedPlaylists);
  const [apiPlaylists, setApiPlaylists] = useState<Playlist[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    fetch('http://localhost:7070/api/music-playlists', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json() as unknown;
        const items: Array<Record<string, unknown>> = Array.isArray(data)
          ? data as Array<Record<string, unknown>>
          : ((data as Record<string, unknown>).data ?? (data as Record<string, unknown>).results ?? []) as Array<Record<string, unknown>>;
        setApiPlaylists(
          items.map((p, i) => {
            // Server may return tracks as `tracks` or `songs` — normalise to Song[].
            const rawTracks = Array.isArray(p.tracks) ? p.tracks
              : Array.isArray(p.songs) ? p.songs
              : [];
            const songs: Song[] = (rawTracks as Array<Record<string, unknown>>).map((t, ti) => ({
              id:       String(t.id       ?? `${i}-track-${ti}`),
              title:    String(t.title    ?? t.name   ?? 'Unknown'),
              artist:   String(t.artist   ?? t.band   ?? ''),
              duration: String(t.duration ?? t.length ?? '--:--'),
              audioUrl: t.audioUrl ? String(t.audioUrl) : t.url ? String(t.url) : undefined,
              meta:     t,
            }));
            return {
              id:          String(p.id ?? `api-${i}`),
              name:        String(p.name ?? p.title ?? 'Untitled'),
              description: [p.genre, p.mood].filter(Boolean).join(' · ') || String(p.description ?? ''),
              url:         p.url ? String(p.url) : undefined,
              songs,
            };
          })
        );
      })
      .catch((e: unknown) => setApiError(e instanceof Error ? e.message : 'Failed to load playlists'))
      .finally(() => setApiLoading(false));
  }, []);

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
    payload: { title: string; artist: string; duration: string; audioUrl?: string; meta?: Record<string, unknown> }
  ) => {
    const song: Song = {
      // Spread all original API fields first so nothing is lost, then
      // overlay the normalised fields so they always win.
      ...(payload.meta ?? {}),
      id:       `${playlistId}-${Date.now()}`,
      title:    payload.title,
      artist:   payload.artist,
      duration: payload.duration,
      audioUrl: payload.audioUrl,
      meta:     payload.meta,
    };
    const updater = (current: Playlist[]) =>
      current.map((p) =>
        p.id !== playlistId ? p : { ...p, songs: [song, ...p.songs] }
      );
    setPlaylists(updater);
    setApiPlaylists(updater);
  };

  const removeSong = (playlistId: string, songId: string) => {
    const updater = (current: Playlist[]) =>
      current.map((p) =>
        p.id !== playlistId ? p : { ...p, songs: p.songs.filter((s) => s.id !== songId) }
      );
    setPlaylists(updater);
    setApiPlaylists(updater);
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((current) => current.filter((p) => p.id !== playlistId));
    setApiPlaylists((current) => current.filter((p) => p.id !== playlistId));
  };

  const playlistMap = useMemo(
    () => new Map([...playlists, ...apiPlaylists].map((p) => [p.id, p])),
    [playlists, apiPlaylists]
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
        {(props) => <HomeScreen {...props} playlists={[...playlists, ...apiPlaylists]} apiPlaylistIds={new Set(apiPlaylists.map((p) => p.id))} />}
      </Stack.Screen>

      <Stack.Screen name="Playlists" options={{ title: 'Playlists' }}>
        {(props) => (
          <PlaylistsScreen
            {...props}
            playlists={playlists}
            apiPlaylists={apiPlaylists}
            apiLoading={apiLoading}
            apiError={apiError}
          />
        )}
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
        name="Feedback"
        component={FeedbackScreen}
        options={{ title: 'Feedback' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />

      {/* GettingStarted is accessible from within the protected app (e.g. onboarding replay) */}
      <Stack.Screen
        name="GettingStarted"
        component={GettingStartedScreen}
        options={{ title: 'Getting Started', headerShown: false }}
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
            isNew={!apiPlaylists.some((p) => p.id === props.route.params.playlistId)}
            onAddSong={addSong}
            onRemoveSong={removeSong}
            onDeletePlaylist={(id) => {
              deletePlaylist(id);
              props.navigation.goBack();
            }}
            onPlaylistSaved={(saved) => {
              setApiPlaylists((current) => {
                // Server may echo back as `tracks` or `songs` — prefer `tracks`, fall back to `songs`,
                // and if neither is a non-empty array keep the locally-held songs.
                const existing = current.find((p) => p.id === saved.id);
                const serverTracks = (saved as unknown as Record<string, unknown>).tracks;
                const songs =
                  (Array.isArray(serverTracks) && serverTracks.length > 0 ? serverTracks as typeof saved.songs : null) ??
                  (Array.isArray(saved.songs) && saved.songs.length > 0 ? saved.songs : null) ??
                  existing?.songs ?? [];
                const normalized: Playlist = { ...saved, songs };
                const exists = !!existing;
                return exists
                  ? current.map((p) => (p.id === normalized.id ? normalized : p))
                  : [normalized, ...current];
              });
              // Also sync into local playlists if it was a local-only entry.
              setPlaylists((current) => {
                const existing = current.find((p) => p.id === saved.id);
                if (!existing) return current;
                const serverTracks = (saved as unknown as Record<string, unknown>).tracks;
                const songs =
                  (Array.isArray(serverTracks) && serverTracks.length > 0 ? serverTracks as typeof saved.songs : null) ??
                  (Array.isArray(saved.songs) && saved.songs.length > 0 ? saved.songs : null) ??
                  existing.songs;
                return current.map((p) => p.id === saved.id ? { ...saved, songs } : p);
              });
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <Drawer.Navigator
        drawerContent={(props) => <AppDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: { backgroundColor: '#0B1220', width: 280 },
          headerShown: false,
        }}
      >
        <Drawer.Screen component={MainStackNavigator} name="MainStack" />
      </Drawer.Navigator>
      <NowPlayingMiniBar />
    </View>
  );
}

// ── Public navigator (no auth required) ─────────────────────────────────────
function PublicNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="GettingStarted" component={GettingStartedScreen} />
      <AuthStack.Screen name="Login"          component={LoginScreen} />
      <AuthStack.Screen name="AboutYou"              component={AboutYouScreen} />
      <AuthStack.Screen name="AudioAgentPersonality" component={AudioAgentPersonalityScreen} />
      <AuthStack.Screen name="CreateAccount"         component={CreateAccountScreen} />
    </AuthStack.Navigator>
  );
}

// ── Root switcher — renders public or protected tree based on auth state ─────
function AppContent() {
  const { user, loading, authError, clearAuthError } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // OAuth callback exchange failed — show support screen.
  if (authError) return <AuthCallbackScreen onBack={clearAuthError} />;

  // Unauthenticated — show only the public routes
  if (!user) return <PublicNavigator />;

  // Authenticated — show the full protected app
  return <ProtectedApp />;
}

// ── App entry point — providers only, no navigation logic ────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NowPlayingProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppContent />
          </NavigationContainer>
        </NowPlayingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}