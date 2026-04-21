import { useMemo, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LivePlayerCard } from '../components/LivePlayerCard';
import { PRESET_STREAMS } from '../data/streamPresets';
import { Playlist, MainStackParamList } from '../types';
import { useNowPlaying } from '../state/NowPlayingContext';
import { getAnalyserData } from '../utils/audioAnalyser';

const LISTEN_BASE = 'http://localhost:7070';

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
  const rafRef    = useRef<number | null>(null);
  // Smoothed values — exponential moving average per bar
  const smoothed  = useRef(new Float32Array(BAR_HEIGHTS.length).fill(0.10));
  const zeroFrames = useRef(0);
  const usingRealData = useRef(false);

  useEffect(() => {
    pulsesRef.current.forEach((p) => p.stop());
    pulsesRef.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    smoothed.current.fill(0.25);
    zeroFrames.current = 0;
    usingRealData.current = false;

    if (playing === false) {
      // Smoothly settle all bars to their minimum height
      Animated.parallel(
        anims.map((anim) =>
          Animated.timing(anim, { toValue: 1, duration: 5, useNativeDriver: false })
        )
      ).start();
      return;
    }

    // Log-spaced bin centers across the musically active range (mirrored).
    // At fftSize=2048, sampleRate=44100: 1 bin ≈ 21.5 Hz.
    //   bin 4  ≈   86 Hz (sub-bass)
    //   bin 9  ≈  193 Hz (bass)
    //   bin 20 ≈  430 Hz (low-mid)
    //   bin 40 ≈  860 Hz (mid)
    //   bin 62 ≈ 1333 Hz (upper-mid — more musical energy than 2.5 kHz)
    const BAR_BIN_CENTERS = [4,  9, 15, 20,  25, 20, 15,  9, 4];
    // Tighter spread for higher bars = better isolation and less dilution.
    const BAR_BIN_SPREADS = [3,  3,  3,  4,   5,  4,  3,  3, 3];
    // High-freq bins still carry less energy — boost them proportionally.
    const BAR_GAIN        = [1.0, 1.2, 1.6, 2.2, 3.0, 2.2, 1.6, 1.2, 1.0];
    // Fast attack so beats feel snappy; slow decay so bars glide back down.
    const ALPHA_ATTACK = 0.55;
    const ALPHA_DECAY  = 0.45;
    // Square-root scaling: expands mid-level signals without saturating peaks.
    const GAMMA = 0.50;
    // Minimum bar height — low enough that quiet gaps are clearly visible.
    const BAR_FLOOR = 0.05;

    const startSimulated = () => {
      if (pulsesRef.current.length) return; // already running
      // Stagger start phases so bars don't all move in lockstep
      const phases = [0, 0.22, 0.44, 0.66, 0.88, 0.66, 0.44, 0.22, 0];
      pulsesRef.current = anims.map((anim, i) => {
        const duration = 600 + i * 60;
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: BAR_FLOOR, duration, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 1,         duration, useNativeDriver: false }),
          ])
        );
        // Start each bar offset into its cycle so they're naturally staggered
        anim.setValue(phases[i]);
        return pulse;
      });
      pulsesRef.current.forEach((p) => p.start());
    };

    // Start simulated immediately — guarantees animation on all platforms
    // (iOS Safari cannot tap into HLS streams via Web Audio at all).
    // If real frequency data flows in, tick() will stop simulated and take over.
    startSimulated();

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const result = getAnalyserData();

      // No analyser connected yet — simulated is already running, nothing to do
      if (!result) return;

      const { data, binCount } = result;
      const allZero = data.every((v) => v === 0);

      if (allZero) {
        zeroFrames.current += 1;
        // After ~0.5 s of confirmed zeros, stop checking — we're on a platform
        // where the analyser can't read this stream (iOS HLS, CORS block, etc.).
        // Simulated is already running so just cancel the RAF to save CPU.
        if (zeroFrames.current > 30) {
          if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        }
        return;
      }

      // Real data is flowing — stop simulated and drive bars from frequency data
      if (pulsesRef.current.length) {
        pulsesRef.current.forEach((p) => p.stop());
        pulsesRef.current = [];
      }
      zeroFrames.current = 0;
      usingRealData.current = true;

      anims.forEach((anim, i) => {
        // Average bins within this bar's spread for its frequency band
        const center = BAR_BIN_CENTERS[i];
        const spread = BAR_BIN_SPREADS[i];
        let sum = 0, count = 0;
        for (let b = center - spread; b <= center + spread; b++) {
          if (b >= 0 && b < binCount) { sum += data[b]; count++; }
        }
        // Apply per-bar gain before normalising so high-freq bars reach full height
        const raw    = count > 0 ? Math.min(1, (sum / count / 255) * BAR_GAIN[i]) : 0;
        // Gamma expand: stretches quiet signals across more of the bar height
        const curved = Math.pow(raw, GAMMA);
        const target = Math.max(BAR_FLOOR, curved);
        const prev   = smoothed.current[i];
        // Exponential moving average: different coefficients for rising vs falling
        const alpha  = target > prev ? ALPHA_ATTACK : ALPHA_DECAY;
        const next   = prev + (target - prev) * alpha;
        smoothed.current[i] = next;
        anim.setValue(next);
      });
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      pulsesRef.current.forEach((p) => p.stop());
      pulsesRef.current = [];
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
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
              height: anim.interpolate({ inputRange: [0.05, 1], outputRange: [BAR_HEIGHTS[i] * 0.05, BAR_HEIGHTS[i]] }),
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
  apiPlaylistIds?: Set<string>;
};

export function HomeScreen({ navigation, playlists, apiPlaylistIds, route }: HomeScreenProps) {
  const { activeHlsTitle, activeHlsArtist, activeHlsPlaying, activeHlsUrl, activeHlsElapsedSec, setActiveHlsUrl } = useNowPlaying();
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  const [listenHlsUrl, setListenHlsUrl] = useState<string | null>(null);
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

  // When the selected playlist is a server playlist, call the listen endpoint
  // to obtain the HLS stream URL. Reset when the playlist changes.
  const isServerPlaylist = !!(selectedPlaylist && apiPlaylistIds?.has(selectedPlaylist.id));
  useEffect(() => {
    if (!isServerPlaylist || !selectedPlaylist) {
      setListenHlsUrl(null);
      return;
    }
    let cancelled = false;
    fetch(`${LISTEN_BASE}/api/music-playlists/listen/${selectedPlaylist.id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json() as { hls_url?: string };
        console.log('Listen endpoint response:', data);
        if (cancelled || !data.hls_url) return;
        // hls_url may be relative (e.g. /hls/…/playlist.m3u8) — prepend origin.
        const full = data.hls_url.startsWith('http')
          ? data.hls_url
          : `${LISTEN_BASE}${data.hls_url}`;

        console.log('Resolved HLS URL:', full);
        setListenHlsUrl(full);
        setActiveHlsUrl(full);
      })
      .catch((e: unknown) => {
        console.error('[HomeScreen] Failed to fetch listen URL:', e);
      });
    return () => { cancelled = true; };
  }, [isServerPlaylist, selectedPlaylist?.id]);

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

  // ── Resolve which URL the LivePlayerCard should use ──────────────────────────
  // For server playlists: use the resolved listen URL, or fall back to whatever
  // activeHlsUrl context already holds (set early by PlaylistsScreen's tap handler).
  // For local playlists / no selection: use the local track audioUrl or active preset.
  const localUrl = featuredTrack?.audioUrl ?? '';
  // Three distinct cases:
  // 1. Server playlist: activeHlsUrl is ground truth (updated by listen fetch).
  //    Fall back to listenHlsUrl while the context hasn't been updated yet.
  // 2. Local playlist: prefer the static track audioUrl; fall back to activeHlsUrl.
  // 3. No playlist selected (preset): use activeHlsUrl.
  const cardUrl = isServerPlaylist
    ? (activeHlsUrl || listenHlsUrl || '')
    : (localUrl || activeHlsUrl || '');
  const isLoadingStream = isServerPlaylist && !cardUrl;
  const activePreset = PRESET_STREAMS.find((s) => s.url === cardUrl);
  const cardLabel         = activePreset?.label ?? selectedPlaylist?.name ?? featuredTrack?.title;
  const cardInitialTitle  = activePreset?.label ?? featuredTrack?.title;
  const cardInitialArtist = activePreset ? '' : featuredTrack?.artist;

  // ── Skip-forward handler ────────────────────────────────────────────────
  // Only available for server playlists with more than one song.
  const serverSongCount = isServerPlaylist ? (selectedPlaylist?.songs?.length ?? 0) : 0;
  const handleNext = serverSongCount > 1 && selectedPlaylist ? async () => {
    try {
      const from = activeHlsElapsedSec;
      const res = await fetch(
        `${LISTEN_BASE}/api/music-playlists/listen/${selectedPlaylist.id}?from=${from}&next`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json() as { hls_url?: string };
      if (!data.hls_url) return;
      const full = data.hls_url.startsWith('http')
        ? data.hls_url
        : `${LISTEN_BASE}${data.hls_url}`;
      setListenHlsUrl(full);
      setActiveHlsUrl(full);
    } catch { /* silently ignore */ }
  } : undefined;

  // Update the nav header title when a preset is active.
  useEffect(() => {
    const title = activePreset?.label ?? selectedPlaylist?.name ?? 'BANDTANGO';
    navigation.setOptions({ title });
  }, [activePreset?.label, selectedPlaylist?.name, navigation]);

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
          url={cardUrl}
          label={cardLabel}
          initialTitle={cardInitialTitle}
          initialArtist={cardInitialArtist}
          autoplay={isServerPlaylist}
          onNext={handleNext}
        />
        {isLoadingStream && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 }}>
            <ActivityIndicator size="small" color="#00CAF5" />
            <Text style={{ color: '#64748B', fontSize: 14 }}>Connecting to stream…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
