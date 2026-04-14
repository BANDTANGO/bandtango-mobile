import { useMemo, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, Image, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LivePlayerCard } from '../components/LivePlayerCard';
import { Playlist, MainStackParamList } from '../types';
import { useNowPlaying } from '../state/NowPlayingContext';

const BAR_COUNT = 9;
const BAR_HEIGHTS = [240, 200, 155, 105, 60, 105, 155, 200, 240];

/** Fetch album art URL from iTunes Search API. Returns null when nothing found. */
async function fetchAlbumArt(artist: string, title: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${artist} ${title}`.trim());
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=musicTrack&limit=3`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { results?: { artworkUrl100?: string }[] };
    const art = data.results?.[0]?.artworkUrl100;
    if (!art) return null;
    // Replace the 100×100 thumbnail with a 600×600 image
    return art.replace('100x100bb', '600x600bb');
  } catch {
    return null;
  }
}

function EqualizerGraphic({ albumArtUrl, playing }: { albumArtUrl?: string | null; playing?: boolean }) {
  const anims = useRef(BAR_HEIGHTS.map(() => new Animated.Value(1))).current;
  const pulsesRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    pulsesRef.current.forEach((p) => p.stop());
    pulsesRef.current = [];

    if (playing === false) {
      // Smoothly settle all bars to their minimum height
      Animated.parallel(
        anims.map((anim) =>
          Animated.timing(anim, { toValue: 0.25, duration: 300, useNativeDriver: false })
        )
      ).start();
    } else {
      // Each bar loops independently with a different speed — no delays, all start immediately
      pulsesRef.current = anims.map((anim, i) => {
        const duration = 400 + i * 80;
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.25, duration, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 1,    duration, useNativeDriver: false }),
          ])
        );
      });
      pulsesRef.current.forEach((p) => p.start());
    }

    return () => { pulsesRef.current.forEach((p) => p.stop()); };
  }, [playing, anims]);

  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {/* Album art backdrop — sits behind everything */}
      {albumArtUrl ? (
        <Image
          source={{ uri: albumArtUrl }}
          resizeMode="contain"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {/* Dark gradient overlay so bars stay legible against art */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: albumArtUrl ? 'rgba(11, 18, 32, 0.55)' : 'transparent',
      }} />
      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: '100%', height: 256, paddingHorizontal: 8, gap: 4 }}>
        {anims.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              flex: 1,
              borderRadius: 4,
              height: anim.interpolate({ inputRange: [0.25, 1], outputRange: [BAR_HEIGHTS[i] * 0.25, BAR_HEIGHTS[i]] }),
              backgroundColor: `rgba(0, 202, 245, ${(0.4 + Math.abs(i - Math.floor(BAR_COUNT / 2)) * 0.08) * 0.35})`,
            }}
          />
        ))}
      </View>
      {/* Musical note — only show when there's no album art */}
      {!albumArtUrl ? (
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="musical-note" size={48} color="rgba(0,202,245,0.85)" />
        </View>
      ) : null}
    </View>
  );
}

type HomeScreenProps = NativeStackScreenProps<MainStackParamList, 'Home'> & {
  playlists: Playlist[];
};

export function HomeScreen({ navigation, playlists, route }: HomeScreenProps) {
  const { activeHlsTitle, activeHlsArtist, activeHlsPlaying } = useNowPlaying();
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  navigation.setOptions({
    headerRight: () => (
      <View className="flex-row gap-3 mr-4">
        <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155]">
          <Ionicons name="search" size={16} color="#F8FAFC" />
        </Pressable>
        <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155]">
          <Ionicons name="pencil" size={16} color="#F8FAFC" />
        </Pressable>
      </View>
    ),
  });

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === route.params?.playlistId),
    [playlists, route.params?.playlistId]
  );

  const tracks = useMemo(() => {
    const sourcePlaylists = selectedPlaylist ? [selectedPlaylist] : playlists;

    // If the selected playlist has a URL, inject it as the lead track so the player streams it
    const injected = selectedPlaylist?.url
      ? [{
          title: selectedPlaylist.name,
          artist: 'BandTango Stream',
          duration: '--:--',
          audioUrl: selectedPlaylist.url,
          albumArtUrl: undefined,
        }]
      : [];

    const songTracks = sourcePlaylists.flatMap((playlist) =>
      playlist.songs.map((song) => ({
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        audioUrl: song.audioUrl,
        albumArtUrl: song.albumArtUrl,
      }))
    );

    return [...injected, ...songTracks];
  }, [playlists, selectedPlaylist]);

  const featuredTrack = tracks[0];

  // ── Album art lookup ────────────────────────────────────────────────────
  // Prefer live stream metadata (title/artist from the HLS stream parser) over
  // static track data, so the art updates as the stream progresses.
  useEffect(() => {
    // activeHlsTitle/activeHlsArtist come from context and only update when metadata
    // genuinely changes (not every ticker tick), so album art fetches are stable.
    const artist = activeHlsArtist || featuredTrack?.artist || '';
    const title  = activeHlsTitle  || featuredTrack?.title  || '';
    if (!artist && !title) { setAlbumArtUrl(null); return; }
    let cancelled = false;
    fetchAlbumArt(artist, title).then((art) => {
      if (!cancelled) setAlbumArtUrl(art);
    });
    return () => { cancelled = true; };
  }, [activeHlsArtist, activeHlsTitle, featuredTrack?.artist, featuredTrack?.title]);

  return (
    <View className="flex-1">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <ScrollView contentContainerClassName="px-5 pb-9">
        <View className="mb-4 mt-4">
          <Text className="mb-2 text-sm font-semibold text-[#E2E8F0]">Album</Text>
          <View className="h-64 overflow-hidden rounded-2xl border border-[#334155] bg-[#111827]">
            {featuredTrack?.albumArtUrl ? (
              <Image
                source={{ uri: featuredTrack.albumArtUrl }}
                resizeMode="cover"
                style={{ height: '100%', width: '100%' }}
              />
            ) : (
              <EqualizerGraphic albumArtUrl={albumArtUrl} playing={activeHlsPlaying} />
            )}
          </View>
        </View>

        <LivePlayerCard
          url={featuredTrack?.audioUrl ?? ''}
          label={featuredTrack?.title}
          initialTitle={featuredTrack?.title}
          initialArtist={featuredTrack?.artist}
        />
      </ScrollView>
    </View>
  );
}
