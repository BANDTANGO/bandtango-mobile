import { Platform } from 'react-native';
import { createPlayer, PlayerInstance } from '../utils/audioPlayer';
import { PRESET_STREAMS } from '../data/streamPresets';
import { fetchIcyMeta } from '../utils/icyMetadata';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type PlayerTrack = {
  title: string;
  artist: string;
  duration?: string;
  audioUrl?: string;
};

export type HlsStreamInfo = {
  elapsedSec: number;
};

// ── Context-level stream metadata fetcher ───────────────────────────────────────────
// Runs independently of any mounted LivePlayerCard so the MiniBar stays fresh
// even when navigating between screens.
const SOMA_IDS: Record<string, string> = Object.fromEntries(
  PRESET_STREAMS
    .filter((s) => s.url.includes('somafm.com'))
    .map((s) => [s.url, s.url.match(/\/([a-zA-Z]+)-\d/)?.[1] ?? ''])
);

async function fetchContextMeta(url: string): Promise<{ title: string; artist: string } | null> {
  // ── SomaFM JSON API ──────────────────────────────────────────────────
  const somaId = SOMA_IDS[url];
  if (somaId) {
    try {
      const res = await fetch(`https://api.somafm.com/songs/${somaId}.json`);
      if (res.ok) {
        const data = await res.json() as { songs?: { artist?: string; title?: string }[] };
        const song = data?.songs?.[0];
        if (song) return { artist: song.artist ?? 'Unknown Artist', title: song.title ?? '' };
      }
    } catch { /* network unavailable */ }
    return null;
  }

  // ── HLS M3U8 ────────────────────────────────────────────────────────────
  // LivePlayerCard owns all HLS metadata parsing and positional track updates.
  // The context poll must NOT attempt to read the M3U8 here, because it would
  // always extract Track 1 from the comment-block and overwrite whatever track
  // the position-based effect in LivePlayerCard has correctly resolved — causing
  // the artist/title to flicker back to Track 1 every 20 s.
  if (/\.m3u8/i.test(url)) return null;

  // ── Skip static audio files — they are not ICY streams ─────────────────
  // fetchIcyMeta sends non-simple headers (Icy-MetaData) that trigger a CORS
  // preflight. Static MP3/AAC/OGG servers never include that header anyway.
  if (/\.(mp3|aac|ogg|flac|wav|opus|m4a)(\?.*)?$/i.test(url)) return null;

  // ── Icecast / ShoutCast: ICY byte-offset metadata ─────────────────────
  // Only attempt the streaming fetch for origins that are verified to send
  // CORS headers — avoids a wasted 12 s timeout on CORS-blocked servers.
  // The ICY fetch is now proxied through the backend — no CORS restrictions.
  const icy = await fetchIcyMeta(url);
  if (icy) return { title: icy.title, artist: icy.artist };
  return null;
}

type SetSessionPayload = {
  sessionId: string;
  tracks: PlayerTrack[];
  initialTrackIndex?: number;
  initialProgressPercent?: number;
  autoplay?: boolean;
};

type NowPlayingState = {
  sessionId: string | null;
  tracks: PlayerTrack[];
  currentIndex: number;
  playing: boolean;
  shuffleEnabled: boolean;
  repeatEnabled: boolean;
  favoriteEnabled: boolean;
  queueEnabled: boolean;
  isVisible: boolean;
};

// Separate type for frequently-changing playback position so it doesn't
// invalidate the main context value on every audio tick.
type PlaybackPosition = {
  positionMs: number;
  durationMs: number;
};

type NowPlayingContextValue = {
  state: NowPlayingState;
  positionMs: number;
  durationMs: number;
  currentTrack?: PlayerTrack;
  hlsStream: HlsStreamInfo | null;
  setHlsStream: (info: HlsStreamInfo | null) => void;
  registerHlsToggle: (fn: (() => void) | null) => void;
  toggleHlsPlay: () => void;
  /** Stable ref to the persisted HLS audio element — survives navigation. */
  hlsAudioRef: { current: HTMLAudioElement | null };
  /** Single source of truth for what HLS URL is currently active. */
  activeHlsUrl: string;
  setActiveHlsUrl: (url: string) => void;
  /** Human-readable name for the active stream (station/playlist name). */
  activeHlsLabel: string;
  setActiveHlsLabel: (label: string) => void;
  /** Stable title/artist — only updates when metadata genuinely changes, not every ticker tick. */
  activeHlsTitle: string;
  activeHlsArtist: string;
  setActiveHlsMeta: (title: string, artist: string) => void;
  /** Stable playing flag — written by LivePlayerCard DOM event listeners, read by MiniBar. */
  activeHlsPlaying: boolean;
  setActiveHlsPlaying: (playing: boolean) => void;
  /** Elapsed seconds — written by LivePlayerCard ticker, shared across all screens. */
  activeHlsElapsedSec: number;
  setActiveHlsElapsedSec: (sec: number) => void;
  /** Total duration in seconds (0 for live/unknown). */
  activeHlsDurationSec: number;
  setActiveHlsDurationSec: (sec: number) => void;
  /** Player toggle states — shared so they persist across navigation. */
  activeHlsFavorite: boolean;
  toggleActiveHlsFavorite: () => void;
  activeHlsRepeat: boolean;
  toggleActiveHlsRepeat: () => void;
  activeHlsShuffle: boolean;
  toggleActiveHlsShuffle: () => void;
  activeHlsQueue: boolean;
  toggleActiveHlsQueue: () => void;
  setSession: (payload: SetSessionPayload) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekToRatio: (ratio: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: () => void;
  toggleQueue: () => void;
  setIsVisible: (visible: boolean) => void;
};

const NowPlayingContext = createContext<NowPlayingContextValue | null>(null);

const parseDurationToSec = (raw?: string) => {
  if (!raw) {
    return 236;
  }

  // Live / unknown duration marker — return 0 so durationMs stays 0 (LIVE mode)
  if (raw === '--:--' || raw === 'LIVE' || raw === '∞') {
    return 0;
  }

  const [min, sec] = raw.split(':').map((value) => Number.parseInt(value, 10));
  if (!Number.isFinite(min) || !Number.isFinite(sec)) {
    return 236;
  }

  return min * 60 + sec;
};

export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NowPlayingState>({
    sessionId: null,
    tracks: [],
    currentIndex: 0,
    playing: false,
    shuffleEnabled: false,
    repeatEnabled: false,
    favoriteEnabled: true,
    queueEnabled: false,
    isVisible: true,
  });

  // Keep position in a separate state so audio ticks don't invalidate the
  // main context value (which would re-render all consumers every 250ms).
  const [position, setPosition] = useState<PlaybackPosition>({ positionMs: 0, durationMs: 0 });

  const soundRef = useRef<PlayerInstance | null>(null);
  // Keep a ref to position so callbacks (seekToRatio, fake tick) can read the
  // latest value without needing it as a useEffect dep.
  const positionRef = useRef<PlaybackPosition>({ positionMs: 0, durationMs: 0 });
  positionRef.current = position;

  // HLS stream display state (written by HLSListeningScreen, read by MiniBar)
  const [hlsStream, setHlsStream] = useState<HlsStreamInfo | null>(null);
  // Single source of truth for the active HLS URL — stable across re-renders.
  const [activeHlsUrl, setActiveHlsUrlState] = useState<string>('');
  // Stable title/artist: set by LivePlayerCard from metadata fetch, not updated every tick.
  const [activeHlsLabel,  setActiveHlsLabelState]  = useState('');
  const [activeHlsTitle,  setActiveHlsTitleState]  = useState('');
  const [activeHlsArtist, setActiveHlsArtistState] = useState('');
  const setActiveHlsLabel = useCallback((label: string) => setActiveHlsLabelState(label), []);
  const [activeHlsPlaying, setActiveHlsPlayingState] = useState(false);
  const setActiveHlsPlaying = useCallback((playing: boolean) => {
    setActiveHlsPlayingState(playing);
  }, []);

  // ── Shared HLS playback position + toggle states ─────────────────────────
  const [activeHlsElapsedSec,  setActiveHlsElapsedSecState]  = useState(0);
  const [activeHlsDurationSec, setActiveHlsDurationSecState] = useState(0);
  const [activeHlsFavorite,    setActiveHlsFavoriteState]    = useState(false);
  const [activeHlsRepeat,      setActiveHlsRepeatState]      = useState(false);
  const [activeHlsShuffle,     setActiveHlsShuffleState]     = useState(false);
  const [activeHlsQueue,       setActiveHlsQueueState]       = useState(false);

  const setActiveHlsElapsedSec  = useCallback((sec: number) => setActiveHlsElapsedSecState(sec), []);
  const setActiveHlsDurationSec = useCallback((sec: number) => setActiveHlsDurationSecState(sec), []);
  const toggleActiveHlsFavorite = useCallback(() => setActiveHlsFavoriteState((v) => !v), []);
  const toggleActiveHlsRepeat   = useCallback(() => setActiveHlsRepeatState((v) => !v), []);
  const toggleActiveHlsShuffle  = useCallback(() => setActiveHlsShuffleState((v) => !v), []);
  const toggleActiveHlsQueue    = useCallback(() => setActiveHlsQueueState((v) => !v), []);

  const setActiveHlsMeta = useCallback((title: string, artist: string) => {
    setActiveHlsTitleState(title);
    setActiveHlsArtistState(artist);
  }, []);
  // Track the previous URL synchronously so we can detect real changes without
  // adding activeHlsUrl as a dep of the callback itself.
  const activeHlsUrlRef = useRef('');
  const setActiveHlsUrl = useCallback((url: string) => {
    const prev = activeHlsUrlRef.current;
    activeHlsUrlRef.current = url;
    setActiveHlsUrlState(url);
    // Only clear stale metadata when the URL actually changes, not on redundant calls
    // (e.g. HLSListeningScreen card and handleStart both calling with the same URL).
    if (url !== prev) {
      setActiveHlsLabelState('');
      setActiveHlsTitleState('');
      setActiveHlsArtistState('');
    }
    // When explicitly cleared, also tear down the persisted audio element and hide MiniBar.
    if (!url) {
      const a = hlsAudioRef.current;
      if (a) { a.pause(); a.src = ''; }
      hlsAudioRef.current = null;
      setHlsStream(null);
      setActiveHlsPlayingState(false);
      setActiveHlsElapsedSecState(0);
      setActiveHlsDurationSecState(0);
    }
  }, []);  // setState setters are stable — no deps needed
  // Persisted audio element — lives for the lifetime of the provider, not the card.
  const hlsAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Background metadata polling ──────────────────────────────────────────────
  // Keeps title/artist fresh in context regardless of which LivePlayerCard (if
  // any) is currently mounted. LivePlayerCard's own polling takes precedence for
  // multi-track VOD playlists (positional switching) — this handles live presets
  // and any stream not covered by a mounted card.
  const ctxMetaPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (ctxMetaPollRef.current) { clearTimeout(ctxMetaPollRef.current); ctxMetaPollRef.current = null; }
    if (!activeHlsUrl) return;
    let cancelled = false;
    let burstCount = 0;
    const BURST_SIZE   = 3;
    const BURST_GAP_MS = 8_000;
    const COOLDOWN_MS  = 30_000;
    const schedule = (overrideDelay?: number) => {
      if (cancelled) return;
      let delay: number;
      if (overrideDelay !== undefined) {
        delay = overrideDelay;
      } else {
        burstCount += 1;
        delay = burstCount < BURST_SIZE ? BURST_GAP_MS : COOLDOWN_MS;
        if (burstCount >= BURST_SIZE) burstCount = 0;
      }
      ctxMetaPollRef.current = setTimeout(runPoll, delay);
    };
    const runPoll = () => {
      if (cancelled) return;
      fetchContextMeta(activeHlsUrl)
        .then((m) => {
          if (cancelled || !m) return;
          setActiveHlsTitleState(m.title);
          setActiveHlsArtistState(m.artist);
        })
        .catch(() => {})
        .finally(() => schedule());
    };
    // Delay the first context poll slightly so a freshly-mounted LivePlayerCard
    // (which has more detailed parsing) gets to run first.
    schedule(3_000);
    // Re-poll instantly when the browser tab becomes visible again; reset burst.
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (ctxMetaPollRef.current) { clearTimeout(ctxMetaPollRef.current); ctxMetaPollRef.current = null; }
        burstCount = 0;
        runPoll();
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      if (ctxMetaPollRef.current) { clearTimeout(ctxMetaPollRef.current); ctxMetaPollRef.current = null; }
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    };
  }, [activeHlsUrl]);
  // Ref to the play/pause toggle function registered by HLSListeningScreen
  const hlsToggleRef = useRef<(() => void) | null>(null);
  const setHlsStreamCallback = useCallback((info: HlsStreamInfo | null) => {
    setHlsStream(info);
    if (info === null) hlsToggleRef.current = null;
  }, []);
  const registerHlsToggle = useCallback((fn: (() => void) | null) => {
    hlsToggleRef.current = fn;
  }, []);
  const toggleHlsPlay = useCallback(() => {
    hlsToggleRef.current?.();
    // Sync activeHlsPlaying from the audio element after the toggle fires,
    // since play/pause event listeners may have been removed when the card
    // unmounted (navigated away). A rAF ensures the audio state has updated.
    requestAnimationFrame(() => {
      const audio = hlsAudioRef.current;
      if (audio) setActiveHlsPlayingState(!audio.paused);
    });
  }, [hlsAudioRef]);

  const repeatRef = useRef(state.repeatEnabled);
  const shuffleRef = useRef(state.shuffleEnabled);
  const playingRef = useRef(state.playing);
  const tracksRef = useRef(state.tracks);

  useEffect(() => {
    repeatRef.current = state.repeatEnabled;
    shuffleRef.current = state.shuffleEnabled;
    playingRef.current = state.playing;
    tracksRef.current = state.tracks;
  }, [state.repeatEnabled, state.shuffleEnabled, state.playing, state.tracks]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Keep audio playing while the screen is locked on native
      const { setAudioModeAsync } = require('expo-audio');
      setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true }).catch(() => undefined);
    }
  }, []);

  const currentTrack = state.tracks[state.currentIndex];
  const durationFallbackMs = parseDurationToSec(currentTrack?.duration) * 1000;

  const stepTrack = useCallback((direction: 1 | -1) => {
    setState((current) => {
      if (current.tracks.length <= 1) {
        return current;
      }

      let nextIndex = current.currentIndex;
      if (current.shuffleEnabled) {
        while (nextIndex === current.currentIndex) {
          nextIndex = Math.floor(Math.random() * current.tracks.length);
        }
      } else {
        nextIndex =
          (current.currentIndex + direction + current.tracks.length) %
          current.tracks.length;
      }

      return {
        ...current,
        currentIndex: nextIndex,
      };
    });
    // Reset position when the track changes
    setPosition((prev) => ({ ...prev, positionMs: 0 }));
  }, []);

  useEffect(() => {
    let disposed = false;

    const loadSound = async () => {
      if (soundRef.current) {
        soundRef.current.destroy();
        soundRef.current = null;
      }

      if (!currentTrack?.audioUrl) {
        setPosition((prev) => ({ ...prev, durationMs: durationFallbackMs }));
        return;
      }

      const player = createPlayer(currentTrack.audioUrl, (event) => {
        // Bail out if the displayed second hasn't changed and duration is same —
        // this skips the ~3 sub-second timeupdate events per second, preventing
        // the entire context from re-rendering every 250ms.
        setPosition((prev) => {
          const newPos = event.positionMs;
          const newDur = event.durationMs ?? prev.durationMs;
          if (
            Math.floor(newPos / 1000) === Math.floor(prev.positionMs / 1000) &&
            newDur === prev.durationMs
          ) {
            return prev; // same reference → React skips the re-render
          }
          return { positionMs: newPos, durationMs: newDur };
        });

        if (event.didJustFinish) {
          if (repeatRef.current) {
            soundRef.current?.seekTo(0);
            setPosition((prev) => ({ ...prev, positionMs: 0 }));
            if (playingRef.current) {
              soundRef.current?.play();
            }
            return;
          }

          setPosition((prev) => ({ ...prev, positionMs: 0 }));
          setState((current) => {
            if (current.tracks.length <= 1) {
              return { ...current, playing: false };
            }

            let nextIndex = current.currentIndex;
            if (shuffleRef.current) {
              while (nextIndex === current.currentIndex) {
                nextIndex = Math.floor(Math.random() * current.tracks.length);
              }
            } else {
              nextIndex = (current.currentIndex + 1) % current.tracks.length;
            }

            return { ...current, currentIndex: nextIndex };
          });
        }
      });

      if (disposed) {
        player.destroy();
        return;
      }

      soundRef.current = player;
    };

    if (!currentTrack) {
      return;
    }

    loadSound().catch(() => undefined);

    return () => {
      disposed = true;
      if (soundRef.current) {
        soundRef.current.destroy();
        soundRef.current = null;
      }
    };
  }, [currentTrack?.audioUrl, state.currentIndex, durationFallbackMs]);

  useEffect(() => {
    if (!currentTrack || !currentTrack.audioUrl || !soundRef.current) {
      return;
    }

    if (state.playing) {
      soundRef.current.play();
      return;
    }

    soundRef.current.pause();
  }, [currentTrack, state.playing]);

  // Fake tick for tracks that have no real audioUrl (preview / demo mode)
  const fakeTickEffect = useCallback(() => {
    if (!currentTrack || currentTrack.audioUrl || !state.playing) {
      return;
    }

    const interval = setInterval(() => {
      setPosition((prev) => {
        const activeDuration = prev.durationMs || durationFallbackMs;
        const nextPosition = prev.positionMs + 1000;

        if (nextPosition < activeDuration) {
          return { ...prev, positionMs: nextPosition };
        }

        // Track ended or loop
        setState((current) => {
          if (current.repeatEnabled) {
            return current;
          }

          if (current.tracks.length <= 1) {
            return { ...current, playing: false };
          }

          let nextIndex = current.currentIndex;
          if (current.shuffleEnabled) {
            while (nextIndex === current.currentIndex) {
              nextIndex = Math.floor(Math.random() * current.tracks.length);
            }
          } else {
            nextIndex = (current.currentIndex + 1) % current.tracks.length;
          }

          return { ...current, currentIndex: nextIndex };
        });

        return { ...prev, positionMs: 0 };
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, durationFallbackMs, state.playing]);

  useEffect(fakeTickEffect, [fakeTickEffect]);

  const setSession = useCallback((
    {
      sessionId,
      tracks,
      initialTrackIndex = 0,
      initialProgressPercent = 0,
      autoplay = false,
    }: SetSessionPayload
  ) => {
    if (tracks.length === 0) {
      return;
    }

    const boundedIndex = Math.max(
      0,
      Math.min(initialTrackIndex, tracks.length - 1)
    );
    const durationMs = parseDurationToSec(tracks[boundedIndex].duration) * 1000;
    const positionMs = Math.round(
      (Math.max(0, Math.min(initialProgressPercent, 100)) / 100) * durationMs
    );

    setPosition({ positionMs, durationMs });
    setState((current) => ({
      ...current,
      sessionId,
      tracks,
      currentIndex: boundedIndex,
      playing: autoplay ? true : current.playing && current.sessionId === sessionId,
    }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((current) => ({ ...current, playing: !current.playing }));
  }, []);

  const seekToRatio = useCallback((ratio: number) => {
    const clampedRatio = Math.max(0, Math.min(ratio, 1));
    const targetMs = Math.round(positionRef.current.durationMs * clampedRatio);
    setPosition((prev) => ({ ...prev, positionMs: targetMs }));
    // setState returning `current` = no state change; used only to safely
    // read current track and fire the imperative seekTo call.
    setState((current) => {
      if (soundRef.current && current.tracks[current.currentIndex]?.audioUrl) {
        soundRef.current.seekTo(targetMs / 1000);
      }
      return current;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((current) => ({ ...current, shuffleEnabled: !current.shuffleEnabled }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((current) => ({ ...current, repeatEnabled: !current.repeatEnabled }));
  }, []);

  const toggleFavorite = useCallback(() => {
    setState((current) => ({ ...current, favoriteEnabled: !current.favoriteEnabled }));
  }, []);

  const toggleQueue = useCallback(() => {
    setState((current) => ({ ...current, queueEnabled: !current.queueEnabled }));
  }, []);

  const setIsVisible = useCallback((visible: boolean) => {
    setState((current) => ({ ...current, isVisible: visible }));
  }, []);

  const value = useMemo<NowPlayingContextValue>(
    () => ({
      state,
      positionMs: position.positionMs,
      durationMs: position.durationMs,
      currentTrack,
      hlsStream,
      setHlsStream: setHlsStreamCallback,
      registerHlsToggle,
      toggleHlsPlay,
      hlsAudioRef,
      activeHlsUrl,
      setActiveHlsUrl,
      activeHlsLabel,
      setActiveHlsLabel,
      activeHlsTitle,
      activeHlsArtist,
      setActiveHlsMeta,
      activeHlsPlaying,
      setActiveHlsPlaying,
      activeHlsElapsedSec,
      setActiveHlsElapsedSec,
      activeHlsDurationSec,
      setActiveHlsDurationSec,
      activeHlsFavorite,
      toggleActiveHlsFavorite,
      activeHlsRepeat,
      toggleActiveHlsRepeat,
      activeHlsShuffle,
      toggleActiveHlsShuffle,
      activeHlsQueue,
      toggleActiveHlsQueue,
      setSession,
      togglePlay,
      nextTrack: () => stepTrack(1),
      previousTrack: () => stepTrack(-1),
      seekToRatio,
      toggleShuffle,
      toggleRepeat,
      toggleFavorite,
      toggleQueue,
      setIsVisible,
    }),
    [currentTrack, hlsStream, hlsAudioRef, activeHlsUrl, setActiveHlsUrl,
     activeHlsLabel, setActiveHlsLabel, activeHlsTitle, activeHlsArtist, setActiveHlsMeta, activeHlsPlaying, setActiveHlsPlaying, position,
     setIsVisible, setSession, seekToRatio, state, stepTrack,
     toggleFavorite, togglePlay, toggleQueue, toggleRepeat, toggleShuffle,
     setHlsStreamCallback, registerHlsToggle, toggleHlsPlay,
     activeHlsElapsedSec, setActiveHlsElapsedSec, activeHlsDurationSec, setActiveHlsDurationSec,
     activeHlsFavorite, toggleActiveHlsFavorite, activeHlsRepeat, toggleActiveHlsRepeat,
     activeHlsShuffle, toggleActiveHlsShuffle, activeHlsQueue, toggleActiveHlsQueue]
  );

  return (
    <NowPlayingContext.Provider value={value}>{children}</NowPlayingContext.Provider>
  );
}

export function useNowPlaying() {
  const context = useContext(NowPlayingContext);
  if (!context) {
    throw new Error('useNowPlaying must be used within NowPlayingProvider');
  }

  return context;
}
