import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
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
    positionMs: ctxPositionMs,
    durationMs: ctxDurationMs,
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

  // Keep a ref to setSession so we can call the latest version without it
  // being a useEffect dependency (avoids re-running on every positionMs update)
  const setSessionRef = useRef(setSession);
  setSessionRef.current = setSession;

  // Stable refs for the values we need inside the effect
  const safeTracksRef = useRef(safeTracks);
  safeTracksRef.current = safeTracks;
  const safeInitialIndexRef = useRef(safeInitialIndex);
  safeInitialIndexRef.current = safeInitialIndex;
  const progressPercentRef = useRef(progressPercent);
  progressPercentRef.current = progressPercent;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    // Only fire when the sessionId itself changes — not on every positionMs update
    if (state.sessionId === sessionId) {
      return;
    }

    setSessionRef.current({
      sessionId,
      tracks: safeTracksRef.current,
      initialTrackIndex: safeInitialIndexRef.current,
      initialProgressPercent: progressPercentRef.current,
      autoplay: isPlayingRef.current,
    });
  }, [sessionId, state.sessionId]);

  const isActiveSession = state.sessionId === sessionId;

  const displayedTrack =
    isActiveSession && nowPlayingTrack
      ? nowPlayingTrack
      : safeTracks[safeInitialIndex] ?? safeTracks[0];

  // A live/HLS stream reports durationMs = 0 (unknown duration)
  const isLive = isActiveSession && ctxDurationMs === 0 && !!displayedTrack.audioUrl;

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
    ? (ctxDurationMs > 0 ? ctxDurationMs : (isLive ? 0 : 236000))
    : inactiveDurationMs;
  const activePositionMs = isActiveSession
    ? ctxPositionMs
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

      {isLive ? (
        <View className="mb-1.5 flex-row items-center justify-center h-[7px]">
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 }} />
          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>LIVE</Text>
        </View>
      ) : (
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
      )}

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[11px] text-[#94A3B8]">
          {isLive ? formatTime(Math.floor(activePositionMs / 1000)) : formatTime(Math.floor(activePositionMs / 1000))}
        </Text>
        <Text className="text-[11px] text-[#94A3B8]">
          {isLive ? '∞' : formatTime(Math.floor(activeDurationMs / 1000))}
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
