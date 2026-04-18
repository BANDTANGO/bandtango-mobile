import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { useNowPlaying } from '../state/NowPlayingContext';
import { wireAudioElement, resumeCtx } from '../utils/audioAnalyser';

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
  // Use an AbortController so we never hang on a live endpoint that keeps the
  // connection open indefinitely. 8 s is generous for a local server.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  // Parse the M3U8 playlist
  try {
    const res = await fetch(playlistUrl, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) { clearTimeout(timeout); return null; }

    // Read the body in chunks and stop as soon as we have a complete M3U8 header
    // (ends with a segment URI). This avoids waiting for EOF on live streams.
    let text = '';
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (value) text += decoder.decode(value, { stream: !done });
          // Stop once we've seen at least one EXTINF + a URI line after it, or EXT-X-ENDLIST
          if (done || text.includes('#EXT-X-ENDLIST') ||
              /^#EXTINF.+\r?\n.+/m.test(text)) {
            reader.cancel().catch(() => {});
            break;
          }
        }
      } catch { /* reader aborted */ }
    } else {
      text = await res.text();
    }
    clearTimeout(timeout);

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
  } catch { clearTimeout(timeout); /* ignore */ }

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
  /** When true, immediately call play() even if the audio element is already
   * loaded (e.g. paused from a previous session). Useful when navigation
   * should auto-start the stream without a manual button tap. */
  autoplay?: boolean;
  /** When provided, activates the skip-forward button and calls this on press. */
  onNext?: () => void;
}

export function LivePlayerCard({ url, label, initialTitle, initialArtist, autoplay, onNext }: LivePlayerCardProps) {
  const {
    setHlsStream, registerHlsToggle, hlsAudioRef, activeHlsUrl, setActiveHlsUrl,
    activeHlsTitle, activeHlsArtist,
    setActiveHlsMeta, activeHlsPlaying, setActiveHlsPlaying,
    activeHlsElapsedSec, setActiveHlsElapsedSec,
    activeHlsDurationSec, setActiveHlsDurationSec,
    activeHlsFavorite, toggleActiveHlsFavorite,
    activeHlsRepeat,   toggleActiveHlsRepeat,
    activeHlsShuffle,  toggleActiveHlsShuffle,
    activeHlsQueue,    toggleActiveHlsQueue,
  } = useNowPlaying();

  // Lazy-init from the persisted element so we don't briefly show "paused"
  // on re-mount and trigger the play/pause sync effect to stop audio.
  const [playing, setPlaying] = useState(() => {
    const a = hlsAudioRef.current;
    return !!a && !a.paused && !a.ended;
  });
  const [error,        setError]        = useState<string | null>(null);
  const [trackMeta,    setTrackMeta]    = useState<TrackMeta | null>(null);
  const [trackMetaUrl, setTrackMetaUrl] = useState<string>('');
  const [barWidth,     setBarWidth]     = useState(0);

  const audioRef    = hlsAudioRef;
  const metaTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  // retryRef: monotonic generation counter — incremented on url change so stale
  // retry timeouts from a previous url never fire against the new audio element.
  const retryRef    = useRef(0);
  const retryTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount  = useRef(0);
  // Ref that always holds the latest activeHlsUrl without being a dep of the
  // audio lifecycle effect — lets us gate context writes without re-running audio setup.
  const activeHlsUrlRef = useRef(activeHlsUrl);
  useEffect(() => { activeHlsUrlRef.current = activeHlsUrl; }, [activeHlsUrl]);

  // autoplay in a ref so the audio lifecycle effect doesn't re-run (and tear
  // down a working stream) just because the prop flipped from false→true.
  const autoplayRef = useRef(autoplay);
  useEffect(() => { autoplayRef.current = autoplay; }, [autoplay]);

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
      resumeCtx();
    } else {
      a.pause();
      setPlaying(false);
      setActiveHlsPlaying(false);
    }
  };

  // ── Audio lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!url) return;

    const existing = audioRef.current;
    // Check whether the persisted element already has this URL loaded.
    // The browser resolves relative URLs to absolute, so compare both directions.
    // Guard existing.src !== '' to avoid false-positive when a pre-warmed element
    // has no src yet (empty-string passes all endsWith checks).
    const isSameUrl = existing && !existing.error && existing.src !== '' &&
      (existing.src === url || existing.src.endsWith(url) || url.endsWith(existing.src));

    if (isSameUrl && existing) {
      // ── Adopt the live element — re-attach listeners only ──
      // DO NOT call setActiveHlsUrl here. Context already holds the correct URL
      // (set by whoever initiated this stream: handleStart or HomeScreen's listen
      // effect). A background card (e.g. HomeScreen behind HLSListeningScreen)
      // runs this branch when its url prop still points to the old playlist; calling
      // setActiveHlsUrl from here would overwrite the active preset URL in context.
      setError(null);
      setActiveHlsElapsedSec(Math.floor(existing.currentTime));
      const d = existing.duration;
      if (d && isFinite(d)) setActiveHlsDurationSec(Math.floor(d));

      // Immediately sync playing state from the element — handles the case where
      // play() was called (e.g. from PlaylistsScreen's gesture handler) before
      // our event listeners were attached, so the 'play' event was already fired.
      const alreadyPlaying = !existing.paused;
      setPlaying(alreadyPlaying);
      setActiveHlsPlaying(alreadyPlaying);

      // If autoplay is requested and the element is currently paused, kick it off.
      if (autoplayRef.current && existing.paused) {
        existing.play()
          .then(() => { setPlaying(true); setActiveHlsPlaying(true); })
          .catch(() => { setPlaying(false); setActiveHlsPlaying(false); });
      }

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
    // This card is creating the audio element for this URL, so it IS the active
    // stream — register the URL in context so the MiniBar becomes visible.
    setActiveHlsUrl(url);
    if (existing) {
      existing.pause();
      existing.src = '';
    }
    audioRef.current = null;

    setError(null);
    setTrackMeta(null);
    setTrackMetaUrl('');
    setActiveHlsElapsedSec(0);
    setActiveHlsDurationSec(0);
    // Only pre-fill MiniBar title/artist when this card IS the active stream.
    if (url === activeHlsUrlRef.current) {
      setActiveHlsMeta(initialTitle ?? 'Live Stream', initialArtist ?? '');
    }

    const audio = new (globalThis as unknown as { Audio: typeof Audio }).Audio();
    audio.crossOrigin = 'anonymous'; // required for Web Audio API access
    audio.preload = 'auto';
    audio.src = url;
    wireAudioElement(audio); // connect to shared AudioContext/AnalyserNode

    const onError = () => { setError('Could not load stream. Check the URL and try again.'); setPlaying(false); setActiveHlsPlaying(false); };
    const onEnded = () => { setPlaying(false); setActiveHlsPlaying(false); };
    const onPlay  = () => { setPlaying(true);  setActiveHlsPlaying(true);  setError(null); };
    const onPause = () => { setPlaying(false); setActiveHlsPlaying(false); };
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play',  onPlay);
    audio.addEventListener('pause', onPause);
    audioRef.current = audio;

    // Attempt play() with automatic retry so a stream that isn't fully ready
    // yet (common right after a server-side playlist is initialised) recovers
    // without the user having to navigate away and back.
    const generation = ++retryRef.current;
    retryCount.current = 0;
    const MAX_RETRIES = 5;
    const RETRY_DELAYS = [1000, 2000, 3000, 4000, 5000];

    const attemptPlay = () => {
      if (generation !== retryRef.current) return; // url changed, abort
      const a = audioRef.current;
      if (!a) return;
      // Clear any previous error as soon as a (re)try begins.
      setError(null);
      a.play()
        .then(() => { setPlaying(true); setActiveHlsPlaying(true); })
        .catch(() => {
          setPlaying(false);
          setActiveHlsPlaying(false);
          if (generation !== retryRef.current) return;
          if (retryCount.current < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount.current] ?? 5000;
            retryCount.current += 1;
            retryTimer.current = setTimeout(attemptPlay, delay);
          }
        });
    };
    attemptPlay();

    return () => {
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play',  onPlay);
      audio.removeEventListener('pause', onPause);
      // Invalidate any pending retry for this url.
      ++retryRef.current;
      if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
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
      // Only write shared context state when this card is the active stream.
      if (url !== activeHlsUrl) return;
      const a = audioRef.current;
      if (!a) return;
      const elapsed = Math.floor(a.currentTime);
      setActiveHlsElapsedSec(elapsed);
      const d = a.duration;
      if (d && isFinite(d)) {
        const dur = Math.floor(d);
        setActiveHlsDurationSec(dur);
        // HLS streams don't reliably fire the 'ended' event. Detect completion
        // by checking elapsed >= duration while the element is no longer playing.
        if (elapsed >= dur && (a.paused || a.ended)) {
          setPlaying(false);
          setActiveHlsPlaying(false);
        }
      }
    }, 1000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [url, activeHlsUrl, audioRef]);

  // ── Metadata polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (metaTimer.current) { clearInterval(metaTimer.current); metaTimer.current = null; }
    if (!url) return;
    const poll = () => fetchMeta(url).then((m) => {
      if (m) {
        setTrackMeta(m);
        setTrackMetaUrl(url);
        // Only push to context if this card is still the active stream.
        if (!m.tracks?.length && url === activeHlsUrl) {
          setActiveHlsMeta(m.title, m.artist);
        }
      }
    });
    poll();
    const interval = /\.m3u8/i.test(url) ? 8_000 : 20_000;
    metaTimer.current = setInterval(poll, interval);
    return () => { if (metaTimer.current) clearInterval(metaTimer.current); };
  }, [url, activeHlsUrl]);

  // ── Position-based track selection ───────────────────────────────────────
  // When the playlist carries a comment-block track list with a known total
  // duration, derive the currently-playing title/artist from elapsed time so
  // the MiniBar updates as each song changes without any extra network calls.
  // Guard: only write context metadata when this card IS the active stream —
  // a background-mounted card (e.g. HomeScreen behind HLSListeningScreen)
  // would otherwise overwrite the new stream's metadata every elapsed tick.
  useEffect(() => {
    if (url !== activeHlsUrl) return;
    const tracks = trackMetaUrl === url ? trackMeta?.tracks : undefined;
    const total  = trackMeta?.totalDurationSec;
    if (!tracks?.length || !total || total === 0) return;
    const idx     = Math.min(Math.floor((activeHlsElapsedSec / total) * tracks.length), tracks.length - 1);
    const current = tracks[idx];
    setActiveHlsMeta(current.title, current.artist);
  }, [activeHlsElapsedSec, trackMeta, trackMetaUrl, url, activeHlsUrl, setActiveHlsMeta]);

  // ── MiniBar toggle registration ──────────────────────────────────────────────
  // Register a toggle that directly controls the persisted audio element so
  // the MiniBar works even while this card is unmounted (navigated away).
  // Do NOT clear on unmount — the audio element survives navigation and the
  // MiniBar must keep working. The toggle is only cleared when the stream stops
  // (setActiveHlsUrl('') in context, which calls setHlsStreamCallback(null)).
  useEffect(() => {
    registerHlsToggle(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) { audio.play().catch(() => undefined); }
      else { audio.pause(); }
      // play/pause event listeners (re-attached on mount) will call setPlaying.
    });
  }, [registerHlsToggle, audioRef]);

  // ── MiniBar context sync ─────────────────────────────────────────────────
  // Only SET hlsStream — never call setHlsStream(null) from here. Clearing is
  // handled by setActiveHlsUrl('') in context (when stream is explicitly stopped).
  useEffect(() => {
    if (!url) return;
    setHlsStream({ elapsedSec: activeHlsElapsedSec });
  }, [url, activeHlsElapsedSec, setHlsStream]);

  // ── Seek ─────────────────────────────────────────────────────────────────
  const seekFromPress = (locationX: number) => {
    if (!audioRef.current || barWidth === 0 || activeHlsDurationSec === 0) return;
    const ratio = Math.max(0, Math.min(locationX / barWidth, 1));
    audioRef.current.currentTime = ratio * activeHlsDurationSec;
    setActiveHlsElapsedSec(Math.floor(ratio * activeHlsDurationSec));
  };

  if (!url) return null;

  // When the playlist carries a multi-track list, derive the currently-playing
  // track by position so the card title/artist updates as each song changes —
  // identical logic to the setActiveHlsMeta effect above.
  const currentTrackEntry = (() => {
    const tracks = trackMetaUrl === url ? trackMeta?.tracks : undefined;
    const total  = trackMeta?.totalDurationSec;
    if (!tracks?.length || !total || total === 0) return null;
    const idx = Math.min(Math.floor((activeHlsElapsedSec / total) * tracks.length), tracks.length - 1);
    return tracks[idx];
  })();

  // When this card is the active stream, fall back to the context title/artist
  // (set by a previously-mounted LivePlayerCard that already fetched metadata)
  // so re-mounting after navigation doesn't flash 'Live Stream' until re-fetch.
  const isActive = url === activeHlsUrl;
  const displayTitle  = currentTrackEntry?.title  ?? trackMeta?.title  ?? (isActive ? activeHlsTitle  : undefined) ?? initialTitle  ?? 'Live Stream';
  const displayArtist = currentTrackEntry?.artist ?? trackMeta?.artist ?? (isActive ? activeHlsArtist : undefined) ?? initialArtist ?? '';

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
            {formatMmSs(activeHlsElapsedSec)}
          </Text>
          <Text style={{ color: '#334155', fontSize: 9, letterSpacing: 0.5, marginTop: 2 }}>ELAPSED</Text>
        </View>
      </View>

      {/* Progress bar */}
      {activeHlsDurationSec > 0 ? (
        <View style={{ marginBottom: 14 }}>
          <Pressable
            style={{ height: 7, borderRadius: 4, backgroundColor: '#1E293B', marginBottom: 6 }}
            onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
            onPress={(e) => seekFromPress(e.nativeEvent.locationX)}
          >
            <View style={{
              height: 7, borderRadius: 4, backgroundColor: '#00CAF5',
              width: `${Math.round(Math.min(activeHlsElapsedSec / activeHlsDurationSec, 1) * 100)}%`,
            }} />
            <View style={{
              position: 'absolute', top: -10, width: 28, height: 28,
              borderRadius: 14, borderWidth: 2, borderColor: '#00CAF5',
              backgroundColor: '#0F172A',
              left: barWidth > 0 ? Math.round(Math.min(activeHlsElapsedSec / activeHlsDurationSec, 1) * barWidth) - 14 : 0,
            }} />
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{formatMmSs(activeHlsElapsedSec)}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{formatMmSs(activeHlsDurationSec)}</Text>
          </View>
        </View>
      ) : (
        <View style={{ marginBottom: 14 }}>
          <View style={{ height: 7, borderRadius: 4, backgroundColor: '#1E293B' }}>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(0,202,245,0.25)', width: '100%' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{formatMmSs(activeHlsElapsedSec)}</Text>
            <Text style={{ color: '#475569', fontSize: 11 }}>{'∞'}</Text>
          </View>
        </View>
      )}

      {/* Transport controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Pressable
          onPress={() => toggleActiveHlsShuffle()}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="shuffle-variant" size={20} color={activeHlsShuffle ? '#00CAF5' : '#94A3B8'} />
        </Pressable>

        <Pressable
          onPress={() => { if (audioRef.current) { audioRef.current.currentTime = 0; setActiveHlsElapsedSec(0); } }}
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
          <Ionicons name={(isActive ? activeHlsPlaying : playing) ? 'pause' : 'play'} size={30} color="#0F172A" />
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!onNext}
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', opacity: onNext ? 1 : 0.4 }}
        >
          <Ionicons name="play-skip-forward" size={20} color="#F8FAFC" />
        </Pressable>

        <Pressable
          onPress={() => toggleActiveHlsRepeat()}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="repeat" size={20} color={activeHlsRepeat ? '#00CAF5' : '#94A3B8'} />
        </Pressable>
      </View>

      {/* Secondary controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Pressable
          onPress={() => toggleActiveHlsQueue()}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="queue-music" size={18} color={activeHlsQueue ? '#00CAF5' : '#94A3B8'} />
        </Pressable>
        <Pressable
          onPress={() => toggleActiveHlsFavorite()}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={activeHlsFavorite ? 'heart' : 'heart-outline'} size={18} color={activeHlsFavorite ? '#00CAF5' : '#94A3B8'} />
        </Pressable>
      </View>
    </View>
  );
}
