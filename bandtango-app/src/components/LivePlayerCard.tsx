import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { useNowPlaying } from '../state/NowPlayingContext';

// ── Metadata helpers ────────────────────────────────────────────────────────

interface TrackMeta {
  artist: string;
  title: string;
  /** Full ordered track list parsed from a comment-block (e.g. # Track N: …). */
  tracks?: Array<{ artist: string; title: string }>;
  /** Sum of all #EXTINF durations in seconds — used for positional track lookup. */
  totalDurationSec?: number;
}

/** SomaFM channel IDs baked in so the card can self-identify and poll their API. */
const SOMA_META_IDS: Record<string, string> = {
  'https://ice1.somafm.com/groovesalad-128-aac': 'groovesalad',
  'https://ice1.somafm.com/spacestation-128-aac': 'spacestation',
  'https://ice1.somafm.com/secretagent-128-aac': 'secretagent',
};

async function fetchSomaFmMeta(channelId: string): Promise<TrackMeta | null> {
  try {
    const res = await fetch(`https://api.somafm.com/songs/${channelId}.json`);
    if (!res.ok) return null;
    const data = await res.json() as { songs?: { artist?: string; title?: string }[] };
    const song = data?.songs?.[0];
    if (!song) return null;
    return { artist: song.artist ?? 'Unknown Artist', title: song.title ?? 'Live Stream' };
  } catch {
    return null;
  }
}

async function fetchHlsMeta(playlistUrl: string): Promise<TrackMeta | null> {
  // Parse the M3U8 playlist
  try {
    const res = await fetch(playlistUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    const text  = await res.text();
    const lines = text.split('\n').map((l) => l.trim());

    // ── Comment-block track list: # Track N: Artist - Title [Album] ──────
    // This is a custom server format where each track is listed in a comment
    // header block. We also sum #EXTINF durations to compute relative positions.
    const commentTracks: Array<{ artist: string; title: string }> = [];
    for (const line of lines) {
      const m = line.match(/^#\s+Track\s+\d+:\s*(.+)$/);
      if (!m) continue;
      const raw     = m[1].trim().replace(/\s*\[[^\]]+\]\s*$/, '').trim(); // strip [Album]
      const dash    = raw.indexOf(' - ');
      commentTracks.push({
        artist: dash !== -1 ? raw.slice(0, dash).trim() : '',
        title:  dash !== -1 ? raw.slice(dash + 3).trim() : raw,
      });
    }
    if (commentTracks.length > 0) {
      let totalDurationSec = 0;
      for (const line of lines) {
        const m = line.match(/^#EXTINF:([\d.]+)/);
        if (m) totalDurationSec += parseFloat(m[1]);
      }
      return {
        artist: commentTracks[0].artist,
        title:  commentTracks[0].title,
        tracks: commentTracks,
        totalDurationSec: Math.round(totalDurationSec),
      };
    }

    // Comment-style ID3 block: # TITLE: ... / # ARTIST: ...
    let commentTitle  = '';
    let commentArtist = '';
    for (const line of lines) {
      const tm = line.match(/^#\s+TITLE:\s*(.+)$/i);
      if (tm) commentTitle = tm[1].trim();
      const am = line.match(/^#\s+ARTIST:\s*(.+)$/i);
      if (am) commentArtist = am[1].trim();
    }
    if (commentTitle || commentArtist) {
      return { artist: commentArtist, title: commentTitle || 'Live Stream' };
    }

    // #EXT-X-TITLE / #STREAMTITLE
    for (const line of lines) {
      const m = line.match(/^#EXT-X-TITLE:(.+)$/i) ?? line.match(/^#STREAMTITLE:(.+)$/i);
      if (m) {
        const raw = m[1].trim();
        const di  = raw.indexOf(' - ');
        return di !== -1
          ? { artist: raw.slice(0, di).trim(), title: raw.slice(di + 3).trim() }
          : { artist: '', title: raw };
      }
    }

    // Last #EXTINF title
    let lastExtinf: string | null = null;
    for (const line of lines) {
      const m = line.match(/^#EXTINF:[^,]*,(.+)$/);
      if (m) lastExtinf = m[1].trim();
    }
    if (lastExtinf && lastExtinf !== '-1' && lastExtinf !== '') {
      const di = lastExtinf.indexOf(' - ');
      return di !== -1
        ? { artist: lastExtinf.slice(0, di).trim(), title: lastExtinf.slice(di + 3).trim() }
        : { artist: '', title: lastExtinf };
    }
  } catch { /* ignore */ }

  return null;
}

async function fetchMeta(url: string): Promise<TrackMeta | null> {
  const somaId = SOMA_META_IDS[url];
  if (somaId) return fetchSomaFmMeta(somaId);
  if (/\.m3u8/i.test(url)) return fetchHlsMeta(url);
  return null;
}

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Component ───────────────────────────────────────────────────────────────

export interface LivePlayerCardProps {
  /** HLS / audio stream URL. Card renders nothing when empty. */
  url: string;
  /** Short label shown in the header row (station name, playlist name, etc.) */
  label?: string;
  /** Pre-known title shown before metadata is fetched */
  initialTitle?: string;
  /** Pre-known artist shown before metadata is fetched */
  initialArtist?: string;
}

export function LivePlayerCard({ url, label, initialTitle, initialArtist }: LivePlayerCardProps) {
  const { setHlsStream, registerHlsToggle, hlsAudioRef, activeHlsUrl, setActiveHlsUrl, setActiveHlsMeta, setActiveHlsPlaying } = useNowPlaying();

  // Lazy-init from the persisted element so we don't briefly show "paused"
  // on re-mount and trigger the play/pause sync effect to stop audio.
  const [playing, setPlaying] = useState(() => {
    const a = hlsAudioRef.current;
    return !!a && !a.paused && !a.ended;
  });
  const [error,      setError]      = useState<string | null>(null);
  const [trackMeta,  setTrackMeta]  = useState<TrackMeta | null>(null);
  const [trackMetaUrl, setTrackMetaUrl] = useState<string>('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationSec,setDurationSec]= useState(0);
  const [barWidth,   setBarWidth]   = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRepeat,   setIsRepeat]   = useState(false);
  const [isShuffle,  setIsShuffle]  = useState(false);
  const [isQueue,    setIsQueue]    = useState(false);

  const audioRef    = hlsAudioRef;
  const metaTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Directly control audio and state together ───────────────────────
  // Do NOT use a separate "sync" effect that watches `playing` — that creates
  // a feedback loop: effect calls play() → onPlay fires → setPlaying → effect
  // re-fires, causing rapid flicker. Instead, the button handler is the sole
  // place that both changes state AND drives the audio element atomically.
  const handlePlayPause = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => { setPlaying(false); setActiveHlsPlaying(false); });
      setPlaying(true);
      setActiveHlsPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
      setActiveHlsPlaying(false);
    }
  };

  // ── Audio lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!url) return;
    // Mark this URL as the active stream so the MiniBar becomes visible.
    setActiveHlsUrl(url);

    const existing = audioRef.current;
    // Check whether the persisted element already has this URL loaded.
    // The browser resolves relative URLs to absolute, so compare both directions.
    const isSameUrl = existing && !existing.error &&
      (existing.src === url || existing.src.endsWith(url) || url.endsWith(existing.src));

    if (isSameUrl && existing) {
      // ── Adopt the live element — re-attach listeners only ──
      // Do NOT call setPlaying here — lazy init already captured the correct
      // state on mount, and the onPlay/onPause listeners will handle future changes.
      setError(null);
      setElapsedSec(Math.floor(existing.currentTime));
      const d = existing.duration;
      if (d && isFinite(d)) setDurationSec(Math.floor(d));

      const onError = () => { setError('Could not load stream. Check the URL and try again.'); setPlaying(false); setActiveHlsPlaying(false); };
      const onEnded = () => { setPlaying(false); setActiveHlsPlaying(false); };
      const onPlay  = () => { setPlaying(true);  setActiveHlsPlaying(true); };
      const onPause = () => { setPlaying(false); setActiveHlsPlaying(false); };
      existing.addEventListener('error', onError);
      existing.addEventListener('ended', onEnded);
      existing.addEventListener('play',  onPlay);
      existing.addEventListener('pause', onPause);
      return () => {
        existing.removeEventListener('error', onError);
        existing.removeEventListener('ended', onEnded);
        existing.removeEventListener('play',  onPlay);
        existing.removeEventListener('pause', onPause);
        // Do NOT pause — audio lives in context across navigation.
      };
    }

    // ── Different URL — tear down old element, create new ─────────────────
    // (setActiveHlsUrl(url) already called above — covers this branch too)
    if (existing) {
      existing.pause();
      existing.src = '';
    }
    audioRef.current = null;

    setError(null);
    setTrackMeta(null);
    setTrackMetaUrl('');
    setElapsedSec(0);
    setDurationSec(0);
    // Immediately show the playlist/track name in the MiniBar while real metadata loads.
    setActiveHlsMeta(initialTitle ?? 'Live Stream', initialArtist ?? '');

    const audio = new (globalThis as unknown as { Audio: typeof Audio }).Audio(url);
    audio.preload = 'auto';

    const onError = () => { setError('Could not load stream. Check the URL and try again.'); setPlaying(false); setActiveHlsPlaying(false); };
    const onEnded = () => { setPlaying(false); setActiveHlsPlaying(false); };
    const onPlay  = () => { setPlaying(true);  setActiveHlsPlaying(true); };
    const onPause = () => { setPlaying(false); setActiveHlsPlaying(false); };
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play',  onPlay);
    audio.addEventListener('pause', onPause);
    audioRef.current = audio;

    audio.play().then(() => { setPlaying(true); setActiveHlsPlaying(true); }).catch(() => { setPlaying(false); setActiveHlsPlaying(false); });

    return () => {
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play',  onPlay);
      audio.removeEventListener('pause', onPause);
      // Do NOT pause or clear — the element lives in context across navigation.
    };
  }, [url, audioRef, setActiveHlsUrl]);

  // ── Play / pause sync ────────────────────────────────────────────────────
  // INTENTIONALLY REMOVED — see handlePlayPause above. A reactive sync effect
  // caused UI flicker by calling play()/pause() which fired onPlay/onPause events
  // that in turn triggered setPlaying → re-triggering the effect in a loop.

  // ── Ticker ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
    if (!url) return;
    tickerRef.current = setInterval(() => {
      const a = audioRef.current;
      if (!a) return;
      setElapsedSec(Math.floor(a.currentTime));
      const d = a.duration;
      if (d && isFinite(d)) setDurationSec(Math.floor(d));
    }, 1000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [url, audioRef]);

  // ── Metadata polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (metaTimer.current) { clearInterval(metaTimer.current); metaTimer.current = null; }
    if (!url) return;
    const poll = () => fetchMeta(url).then((m) => {
      if (m) {
        setTrackMeta(m);
        setTrackMetaUrl(url);
        // For multi-track VOD playlists the position-based effect below updates
        // the MiniBar on each second tick — don't overwrite with the first track.
        if (!m.tracks?.length) {
          setActiveHlsMeta(m.title, m.artist);
        }
      }
    });
    poll();
    const interval = /\.m3u8/i.test(url) ? 8_000 : 20_000;
    metaTimer.current = setInterval(poll, interval);
    return () => { if (metaTimer.current) clearInterval(metaTimer.current); };
  }, [url]);

  // ── Position-based track selection ───────────────────────────────────────
  // When the playlist carries a comment-block track list with a known total
  // duration, derive the currently-playing title/artist from elapsed time so
  // the MiniBar updates as each song changes without any extra network calls.
  useEffect(() => {
    const tracks = trackMetaUrl === url ? trackMeta?.tracks : undefined;
    const total  = trackMeta?.totalDurationSec;
    if (!tracks?.length || !total || total === 0) return;
    const idx     = Math.min(Math.floor((elapsedSec / total) * tracks.length), tracks.length - 1);
    const current = tracks[idx];
    setActiveHlsMeta(current.title, current.artist);
  }, [elapsedSec, trackMeta, trackMetaUrl, url, setActiveHlsMeta]);

  // ── MiniBar toggle registration ──────────────────────────────────────────────
  // Register a toggle that directly controls the persisted audio element so
  // the MiniBar works even while this card is unmounted (navigated away).
  useEffect(() => {
    registerHlsToggle(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) { audio.play().catch(() => undefined); }
      else { audio.pause(); }
      // play/pause event listeners (re-attached on mount) will call setPlaying.
    });
    return () => registerHlsToggle(null);
  }, [registerHlsToggle, audioRef]);

  // ── MiniBar context sync ─────────────────────────────────────────────────
  // Only SET hlsStream — never call setHlsStream(null) from here. Clearing is
  // handled by setActiveHlsUrl('') in context (when stream is explicitly stopped).
  // title/artist/playing are now in separate stable context fields; hlsStream
  // only carries elapsedSec (the MiniBar has its own ticker reading hlsAudioRef).
  useEffect(() => {
    if (!url) return;
    setHlsStream({ elapsedSec });
  }, [url, elapsedSec, setHlsStream]);

  // On unmount (navigation away), keep hlsStream visible in the MiniBar.
  // Only clear it when the URL actually goes empty (handled by the effect above).
  useEffect(() => {
    return () => { registerHlsToggle(null); };
  }, [registerHlsToggle]);

  // ── Seek ─────────────────────────────────────────────────────────────────
  const seekFromPress = (locationX: number) => {
    if (!audioRef.current || barWidth === 0 || durationSec === 0) return;
    const ratio = Math.max(0, Math.min(locationX / barWidth, 1));
    audioRef.current.currentTime = ratio * durationSec;
    setElapsedSec(Math.floor(ratio * durationSec));
  };

  if (!url) return null;

  // When the playlist carries a multi-track list, derive the currently-playing
  // track by position so the card title/artist updates as each song changes —
  // identical logic to the setActiveHlsMeta effect above.
  const currentTrackEntry = (() => {
    const tracks = trackMetaUrl === url ? trackMeta?.tracks : undefined;
    const total  = trackMeta?.totalDurationSec;
    if (!tracks?.length || !total || total === 0) return null;
    const idx = Math.min(Math.floor((elapsedSec / total) * tracks.length), tracks.length - 1);
    return tracks[idx];
  })();

  const displayTitle  = currentTrackEntry?.title  ?? trackMeta?.title  ?? initialTitle  ?? 'Live Stream';
  const displayArtist = currentTrackEntry?.artist ?? trackMeta?.artist ?? initialArtist ?? '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{
      backgroundColor: 'rgba(17, 24, 39, 0.55)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(51, 65, 85, 0.6)',
      padding: 16,
    }}>
      {/* Header: LIVE dot + label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 }} />
        <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginRight: 8 }}>LIVE</Text>
        {label ? (
          <Text style={{ color: '#94A3B8', fontSize: 12, flex: 1 }} numberOfLines={1}>{label}</Text>
        ) : null}
      </View>

      {/* Error */}
      {error ? (
        <View style={{
          backgroundColor: 'rgba(153,27,27,0.15)', borderRadius: 10, borderWidth: 1,
          borderColor: '#7f1d1d', padding: 10, marginBottom: 12,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <Ionicons name="alert-circle-outline" size={16} color="#FCA5A5" />
          <Text style={{ color: '#FCA5A5', fontSize: 12, flex: 1 }}>{error}</Text>
        </View>
      ) : null}

      {/* Title + Artist with elapsed time */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
            {displayTitle}
          </Text>
          {displayArtist ? (
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }} numberOfLines={1}>
              {displayArtist}
            </Text>
          ) : null}
        </View>
        <View style={{ width: 1, height: 36, backgroundColor: '#1E293B' }} />
        <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 48 }}>
          <Text style={{ color: '#00CAF5', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {formatMmSs(elapsedSec)}
          </Text>
          <Text style={{ color: '#334155', fontSize: 9, letterSpacing: 0.5, marginTop: 2 }}>ELAPSED</Text>
        </View>
      </View>

      {/* Progress bar */}
      {durationSec > 0 ? (
        <View style={{ marginBottom: 14 }}>
          <Pressable
            style={{ height: 7, borderRadius: 4, backgroundColor: '#1E293B', marginBottom: 6 }}
            onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
            onPress={(e) => seekFromPress(e.nativeEvent.locationX)}
          >
            <View style={{
              height: 7, borderRadius: 4, backgroundColor: '#00CAF5',
              width: `${Math.round(Math.min(elapsedSec / durationSec, 1) * 100)}%`,
            }} />
            <View style={{
              position: 'absolute', top: -10, width: 28, height: 28,
              borderRadius: 14, borderWidth: 2, borderColor: '#00CAF5',
              backgroundColor: '#0F172A',
              left: barWidth > 0 ? Math.round(Math.min(elapsedSec / durationSec, 1) * barWidth) - 14 : 0,
            }} />
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{formatMmSs(elapsedSec)}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{formatMmSs(durationSec)}</Text>
          </View>
        </View>
      ) : (
        <View style={{ marginBottom: 14 }}>
          <View style={{ height: 7, borderRadius: 4, backgroundColor: '#1E293B' }}>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(0,202,245,0.25)', width: '100%' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{formatMmSs(elapsedSec)}</Text>
            <Text style={{ color: '#475569', fontSize: 11 }}>{'∞'}</Text>
          </View>
        </View>
      )}

      {/* Transport controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Pressable
          onPress={() => setIsShuffle((p) => !p)}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="shuffle-variant" size={20} color={isShuffle ? '#00CAF5' : '#94A3B8'} />
        </Pressable>

        <Pressable
          onPress={() => { if (audioRef.current) { audioRef.current.currentTime = 0; setElapsedSec(0); } }}
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="play-skip-back" size={20} color="#F8FAFC" />
        </Pressable>

        <Pressable
          onPress={handlePlayPause}
          style={({ pressed }) => ({
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: pressed ? '#0099c4' : '#00CAF5',
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={30} color="#0F172A" />
        </Pressable>

        <Pressable
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}
        >
          <Ionicons name="play-skip-forward" size={20} color="#F8FAFC" />
        </Pressable>

        <Pressable
          onPress={() => setIsRepeat((p) => !p)}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="repeat" size={20} color={isRepeat ? '#00CAF5' : '#94A3B8'} />
        </Pressable>
      </View>

      {/* Secondary controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Pressable
          onPress={() => setIsQueue((p) => !p)}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="queue-music" size={18} color={isQueue ? '#00CAF5' : '#94A3B8'} />
        </Pressable>
        <Pressable
          onPress={() => setIsFavorite((p) => !p)}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#00CAF5' : '#94A3B8'} />
        </Pressable>
      </View>
    </View>
  );
}
