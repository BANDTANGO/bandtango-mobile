import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlayerTrack, useNowPlaying } from '../state/NowPlayingContext';

type MusicPlayerControlsProps = {
  sessionId: string;
  tracks?: PlayerTrack[];
  initialTrackIndex?: number;
  title?: string;
  artist?: string;
  progressPercent?: number;
  isPlaying?: boolean;
};

export function MusicPlayerControls({
  sessionId,
  tracks,
  initialTrackIndex = 0,
  title = 'Current Track',
  artist = 'BandTango Session',
  progressPercent = 72,
  isPlaying = true,
}: MusicPlayerControlsProps) {
  const {
    state,
    currentTrack: nowPlayingTrack,
    setSession,
    togglePlay,
    nextTrack,
    previousTrack,
    seekToRatio,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    toggleQueue,
  } = useNowPlaying();

  const safeTracks = tracks && tracks.length > 0 ? tracks : [{ title, artist, duration: '3:56' }];
  const safeInitialIndex = Math.max(0, Math.min(initialTrackIndex, safeTracks.length - 1));

  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (state.sessionId) {
      return;
    }

    setSession({
      sessionId,
      tracks: safeTracks,
      initialTrackIndex: safeInitialIndex,
      initialProgressPercent: progressPercent,
      autoplay: isPlaying,
    });
  }, [isPlaying, progressPercent, safeInitialIndex, safeTracks, sessionId, setSession, state.sessionId]);

  const isActiveSession = state.sessionId === sessionId;

  const displayedTrack =
    isActiveSession && nowPlayingTrack
      ? nowPlayingTrack
      : safeTracks[safeInitialIndex] ?? safeTracks[0];

  const parseDurationMs = (raw?: string) => {
    if (!raw) {
      return 236000;
    }

    const [min, sec] = raw.split(':').map((value) => Number.parseInt(value, 10));
    if (!Number.isFinite(min) || !Number.isFinite(sec)) {
      return 236000;
    }

    return (min * 60 + sec) * 1000;
  };

  const inactiveDurationMs = parseDurationMs(displayedTrack.duration);

  const activeDurationMs = isActiveSession
    ? state.durationMs || 236000
    : inactiveDurationMs;
  const activePositionMs = isActiveSession
    ? state.positionMs
    : Math.round((Math.max(0, Math.min(progressPercent, 100)) / 100) * inactiveDurationMs);

  const progressRatio = activeDurationMs > 0 ? activePositionMs / activeDurationMs : 0;
  const clampedRatio = Math.max(0, Math.min(progressRatio, 1));
  const clampedProgress = Math.round(clampedRatio * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activateSession = (autoplay = false) => {
    if (isActiveSession) {
      return false;
    }

    setSession({
      sessionId,
      tracks: safeTracks,
      initialTrackIndex: safeInitialIndex,
      initialProgressPercent: progressPercent,
      autoplay,
    });
    return true;
  };

  const seekFromPress = (locationX: number) => {
    activateSession();
    if (barWidth <= 0) {
      return;
    }

    const ratio = Math.max(0, Math.min(locationX / barWidth, 1));
    seekToRatio(ratio);
  };

  const knobX = barWidth > 0 ? Math.max(0, Math.min(clampedRatio * barWidth - 14, barWidth - 28)) : 0;

  return (
    <View className="mt-4 rounded-2xl border border-[#334155] bg-[#111827] p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-semibold text-[#F8FAFC]" numberOfLines={1}>
            {displayedTrack.title}
          </Text>
          <Text className="mt-0.5 text-xs text-[#94A3B8]" numberOfLines={1}>
            {displayedTrack.artist}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Pressable
            className="mr-2 h-8 w-8 items-center justify-center rounded-full border border-[#334155]"
            onPress={() => {
              const activated = activateSession();
              if (activated) {
                return;
              }
              toggleQueue();
            }}
          >
            <MaterialIcons
              name="queue-music"
              size={16}
              color={state.queueEnabled ? '#00CAF5' : '#94A3B8'}
            />
          </Pressable>
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-full border border-[#334155]"
            onPress={() => {
              const activated = activateSession();
              if (activated) {
                return;
              }
              toggleFavorite();
            }}
          >
            <Ionicons
              name={state.favoriteEnabled ? 'heart' : 'heart-outline'}
              size={15}
              color={state.favoriteEnabled ? '#00CAF5' : '#94A3B8'}
            />
          </Pressable>
        </View>
      </View>

      <Pressable
        className="mb-1.5 h-[7px] w-full rounded-full bg-[#334155]"
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        onPress={(event) => seekFromPress(event.nativeEvent.locationX)}
      >
        <View
          className="h-[7px] rounded-full bg-[#00CAF5]"
          style={{ width: `${clampedProgress}%` }}
        />
        <View
          className="absolute -top-[10px] h-7 w-7 rounded-full border-2 border-[#00CAF5] bg-[#0F172A]"
          style={{ left: knobX }}
        />
      </Pressable>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[11px] text-[#94A3B8]">
          {formatTime(Math.floor(activePositionMs / 1000))}
        </Text>
        <Text className="text-[11px] text-[#94A3B8]">
          {formatTime(Math.floor(activeDurationMs / 1000))}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full border border-[#334155]"
          onPress={() => {
            const activated = activateSession();
            if (activated) {
              return;
            }
            toggleShuffle();
          }}
        >
          <MaterialCommunityIcons
            name="shuffle-variant"
            size={18}
            color={state.shuffleEnabled ? '#00CAF5' : '#94A3B8'}
          />
        </Pressable>

        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border border-[#334155]"
          onPress={() => {
            const activated = activateSession();
            if (activated) {
              return;
            }
            previousTrack();
          }}
        >
          <Ionicons name="play-skip-back" size={18} color="#F8FAFC" />
        </Pressable>

        <Pressable
          className="h-14 w-14 items-center justify-center rounded-full bg-[#00CAF5]"
          onPress={() => {
            const activated = activateSession(true);
            if (activated) {
              return;
            }
            togglePlay();
          }}
        >
          <Ionicons
            name={state.playing && isActiveSession ? 'pause' : 'play'}
            size={26}
            color="#0F172A"
          />
        </Pressable>

        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border border-[#334155]"
          onPress={() => {
            const activated = activateSession();
            if (activated) {
              return;
            }
            nextTrack();
          }}
        >
          <Ionicons name="play-skip-forward" size={18} color="#F8FAFC" />
        </Pressable>

        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full border border-[#334155]"
          onPress={() => {
            const activated = activateSession();
            if (activated) {
              return;
            }
            toggleRepeat();
          }}
        >
          <MaterialCommunityIcons
            name="repeat"
            size={18}
            color={state.repeatEnabled ? '#00CAF5' : '#94A3B8'}
          />
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center justify-center gap-1.5">
        <View className="h-1.5 w-1.5 rounded-full bg-[#00CAF5]" />
        <View className="h-1.5 w-1.5 rounded-full bg-[#00CAF5]/70" />
        <View className="h-1.5 w-1.5 rounded-full bg-[#00CAF5]/50" />
      </View>
    </View>
  );
}
