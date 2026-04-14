import { Platform } from 'react-native';
import { createPlayer, PlayerInstance } from '../utils/audioPlayer';
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
  /** Stable title/artist — only updates when metadata genuinely changes, not every ticker tick. */
  activeHlsTitle: string;
  activeHlsArtist: string;
  setActiveHlsMeta: (title: string, artist: string) => void;
  /** Stable playing flag — written by LivePlayerCard DOM event listeners, read by MiniBar. */
  activeHlsPlaying: boolean;
  setActiveHlsPlaying: (playing: boolean) => void;
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
  const [activeHlsTitle,  setActiveHlsTitleState]  = useState('');
  const [activeHlsArtist, setActiveHlsArtistState] = useState('');
  const [activeHlsPlaying, setActiveHlsPlayingState] = useState(false);
  const setActiveHlsPlaying = useCallback((playing: boolean) => {
    setActiveHlsPlayingState(playing);
  }, []);
  const setActiveHlsMeta = useCallback((title: string, artist: string) => {
    setActiveHlsTitleState(title);
    setActiveHlsArtistState(artist);
  }, []);
  const setActiveHlsUrl = useCallback((url: string) => {
    setActiveHlsUrlState(url);
    // When explicitly cleared, also tear down the persisted audio element and hide MiniBar.
    if (!url) {
      const a = hlsAudioRef.current;
      if (a) { a.pause(); a.src = ''; }
      hlsAudioRef.current = null;
      setHlsStream(null);
      setActiveHlsTitleState('');
      setActiveHlsArtistState('');
      setActiveHlsPlayingState(false);
    }
  }, []);  // setState setters are stable — no deps needed
  // Persisted audio element — lives for the lifetime of the provider, not the card.
  const hlsAudioRef = useRef<HTMLAudioElement | null>(null);
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
  }, []);

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
      activeHlsTitle,
      activeHlsArtist,
      setActiveHlsMeta,
      activeHlsPlaying,
      setActiveHlsPlaying,
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
     activeHlsTitle, activeHlsArtist, setActiveHlsMeta, activeHlsPlaying, setActiveHlsPlaying, position,
     setIsVisible, setSession, seekToRatio, state, stepTrack,
     toggleFavorite, togglePlay, toggleQueue, toggleRepeat, toggleShuffle,
     setHlsStreamCallback, registerHlsToggle, toggleHlsPlay]
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
