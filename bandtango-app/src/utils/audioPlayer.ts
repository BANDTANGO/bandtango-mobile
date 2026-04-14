import { Platform } from 'react-native';

export interface PlayerStatus {
  positionMs: number;
  /** null = unknown (live stream) */
  durationMs: number | null;
  didJustFinish: boolean;
}

export interface PlayerInstance {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  destroy: () => void;
}

/**
 * Creates a platform-appropriate audio player.
 * - Web: native HTMLAudioElement (supports HLS on Safari; works on Chrome too for most streams)
 * - Native: expo-audio (AVFoundation / ExoPlayer, full HLS support)
 */
export function createPlayer(
  url: string,
  onStatus: (status: PlayerStatus) => void
): PlayerInstance {
  if (Platform.OS === 'web') {
    // Use the browser's built-in Audio API
    const audio = new (globalThis as unknown as { Audio: typeof Audio }).Audio(url);
    audio.preload = 'auto';

    const onTimeUpdate = () => {
      onStatus({
        positionMs: Math.round(audio.currentTime * 1000),
        durationMs:
          Number.isFinite(audio.duration) && audio.duration > 0
            ? Math.round(audio.duration * 1000)
            : null,
        didJustFinish: false,
      });
    };

    const onEnded = () => {
      onStatus({ positionMs: 0, durationMs: null, didJustFinish: true });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return {
      play: () => { audio.play().catch(() => undefined); },
      pause: () => { audio.pause(); },
      seekTo: (seconds) => { audio.currentTime = seconds; },
      destroy: () => {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.pause();
        audio.src = '';
      },
    };
  }

  // Native: expo-audio
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createAudioPlayer } = require('expo-audio');
  const player = createAudioPlayer({ uri: url }, 500);

  player.addListener('playbackStatusUpdate', (event: {
    isLoaded: boolean;
    currentTime: number;
    duration: number;
    didJustFinish?: boolean;
  }) => {
    if (!event.isLoaded) {
      return;
    }

    onStatus({
      positionMs: Math.round(event.currentTime * 1000),
      durationMs: event.duration > 0 ? Math.round(event.duration * 1000) : null,
      didJustFinish: event.didJustFinish ?? false,
    });
  });

  return {
    play: () => { player.play(); },
    pause: () => { player.pause(); },
    seekTo: (seconds) => { player.seekTo(seconds); },
    destroy: () => { player.remove(); },
  };
}
