import { Audio, AVPlaybackStatus } from 'expo-av';
import {
  createContext,
  ReactNode,
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
  positionMs: number;
  durationMs: number;
  isVisible: boolean;
};

type NowPlayingContextValue = {
  state: NowPlayingState;
  currentTrack?: PlayerTrack;
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
    positionMs: 0,
    durationMs: 0,
    isVisible: true,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
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
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    }).catch(() => undefined);
  }, []);

  const currentTrack = state.tracks[state.currentIndex];
  const durationFallbackMs = parseDurationToSec(currentTrack?.duration) * 1000;

  const stepTrack = (direction: 1 | -1) => {
    setState((current) => {
      if (current.tracks.length <= 1) {
        return {
          ...current,
          positionMs: 0,
        };
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
        positionMs: 0,
      };
    });
  };

  useEffect(() => {
    let disposed = false;

    const loadSound = async () => {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (!currentTrack?.audioUrl) {
        setState((current) => ({
          ...current,
          durationMs: durationFallbackMs,
        }));
        return;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: currentTrack.audioUrl },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 500,
        },
        (event: AVPlaybackStatus) => {
          if (!event.isLoaded) {
            return;
          }

          setState((current) => ({
            ...current,
            positionMs: event.positionMillis ?? 0,
            durationMs: event.durationMillis ?? durationFallbackMs,
          }));

          if (event.didJustFinish) {
            if (repeatRef.current) {
              soundRef.current?.setPositionAsync(0).then(() => {
                if (playingRef.current) {
                  soundRef.current?.playAsync();
                }
              });
              return;
            }

            setState((current) => {
              if (current.tracks.length <= 1) {
                return { ...current, positionMs: 0, playing: false };
              }

              let nextIndex = current.currentIndex;
              if (shuffleRef.current) {
                while (nextIndex === current.currentIndex) {
                  nextIndex = Math.floor(Math.random() * current.tracks.length);
                }
              } else {
                nextIndex = (current.currentIndex + 1) % current.tracks.length;
              }

              return {
                ...current,
                currentIndex: nextIndex,
                positionMs: 0,
              };
            });
          }
        }
      );

      if (disposed) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      if (status.isLoaded) {
        setState((current) => ({
          ...current,
          positionMs: status.positionMillis ?? 0,
          durationMs: status.durationMillis ?? durationFallbackMs,
        }));
      }
    };

    if (!currentTrack) {
      return;
    }

    loadSound().catch(() => undefined);

    return () => {
      disposed = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
    };
  }, [currentTrack?.audioUrl, state.currentIndex, durationFallbackMs]);

  useEffect(() => {
    if (!currentTrack || !currentTrack.audioUrl || !soundRef.current) {
      return;
    }

    if (state.playing) {
      soundRef.current.playAsync().catch(() => undefined);
      return;
    }

    soundRef.current.pauseAsync().catch(() => undefined);
  }, [currentTrack, state.playing]);

  useEffect(() => {
    if (!currentTrack || currentTrack.audioUrl || !state.playing) {
      return;
    }

    const interval = setInterval(() => {
      setState((current) => {
        const activeDuration = current.durationMs || durationFallbackMs;
        const nextPosition = current.positionMs + 1000;

        if (nextPosition < activeDuration) {
          return { ...current, positionMs: nextPosition };
        }

        if (current.repeatEnabled) {
          return { ...current, positionMs: 0 };
        }

        if (current.tracks.length <= 1) {
          return { ...current, positionMs: activeDuration, playing: false };
        }

        let nextIndex = current.currentIndex;
        if (current.shuffleEnabled) {
          while (nextIndex === current.currentIndex) {
            nextIndex = Math.floor(Math.random() * current.tracks.length);
          }
        } else {
          nextIndex = (current.currentIndex + 1) % current.tracks.length;
        }

        return {
          ...current,
          currentIndex: nextIndex,
          positionMs: 0,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTrack, durationFallbackMs, state.playing]);

  const value = useMemo<NowPlayingContextValue>(
    () => ({
      state,
      currentTrack,
      setSession: ({
        sessionId,
        tracks,
        initialTrackIndex = 0,
        initialProgressPercent = 0,
        autoplay = false,
      }) => {
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

        setState((current) => ({
          ...current,
          sessionId,
          tracks,
          currentIndex: boundedIndex,
          durationMs,
          positionMs,
          playing: autoplay ? true : current.playing && current.sessionId === sessionId,
        }));
      },
      togglePlay: () => {
        setState((current) => ({ ...current, playing: !current.playing }));
      },
      nextTrack: () => stepTrack(1),
      previousTrack: () => stepTrack(-1),
      seekToRatio: (ratio: number) => {
        const clampedRatio = Math.max(0, Math.min(ratio, 1));

        setState((current) => {
          const activeDuration =
            current.durationMs ||
            parseDurationToSec(current.tracks[current.currentIndex]?.duration) * 1000;
          const targetMs = Math.round(activeDuration * clampedRatio);

          if (soundRef.current && current.tracks[current.currentIndex]?.audioUrl) {
            soundRef.current.setPositionAsync(targetMs).catch(() => undefined);
          }

          return {
            ...current,
            positionMs: targetMs,
          };
        });
      },
      toggleShuffle: () => {
        setState((current) => ({
          ...current,
          shuffleEnabled: !current.shuffleEnabled,
        }));
      },
      toggleRepeat: () => {
        setState((current) => ({
          ...current,
          repeatEnabled: !current.repeatEnabled,
        }));
      },
      toggleFavorite: () => {
        setState((current) => ({
          ...current,
          favoriteEnabled: !current.favoriteEnabled,
        }));
      },
      toggleQueue: () => {
        setState((current) => ({
          ...current,
          queueEnabled: !current.queueEnabled,
        }));
      },
      setIsVisible: (visible: boolean) => {
        setState((current) => ({
          ...current,
          isVisible: visible,
        }));
      },
    }),
    [currentTrack, state]
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
