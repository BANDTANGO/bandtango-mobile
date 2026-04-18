import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useNowPlaying } from '../state/NowPlayingContext';

export function NowPlayingMiniBar() {
  const {
    currentTrack,
    state,
    activeHlsUrl,
    activeHlsTitle,
    activeHlsArtist,
    activeHlsPlaying,
    activeHlsElapsedSec,
    toggleHlsPlay,
    positionMs: ctxPositionMs,
    durationMs: ctxDurationMs,
    nextTrack,
    previousTrack,
    togglePlay,
    seekToRatio,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    toggleQueue,
  } = useNowPlaying();
  const [expanded, setExpanded] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  // ── HLS live stream mini bar ───────────────────────────────────────────────
  if (activeHlsUrl) {
    return (
      <View className="border-t border-[#334155] bg-[#0B1220] px-4 py-3">
        <View className="flex-row items-center justify-between">
          {/* LIVE badge + metadata */}
          <View className="mr-3 flex-1 flex-row items-center gap-2">
            <View style={{ width: 1, height: 28, backgroundColor: '#1E293B' }} />
            <View style={{ flex: 1 }}>
              <Text className="text-sm font-semibold text-[#F8FAFC]" numberOfLines={1}>
                {activeHlsTitle || 'Live Stream'}
              </Text>
              {activeHlsArtist ? (
                <Text className="mt-0.5 text-xs text-[#94A3B8]" numberOfLines={1}>
                  {activeHlsArtist}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Elapsed + play/pause */}
          <View className="flex-row items-center gap-2">
            <Text style={{ color: '#00CAF5', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {String(Math.floor(activeHlsElapsedSec / 60)).padStart(2, '0')}:{String(activeHlsElapsedSec % 60).padStart(2, '0')}
            </Text>
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-[#00CAF5]"
              onPress={toggleHlsPlay}
            >
              <Ionicons name={activeHlsPlaying ? 'pause' : 'play'} size={18} color="#0F172A" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Regular track mini bar ─────────────────────────────────────────────────
  if (!currentTrack || !state.isVisible) {
    return null;
  }

  const isLive = ctxDurationMs === 0 && !!currentTrack.audioUrl;
  const durationMs = isLive ? 0 : (ctxDurationMs || 236000);
  const positionMs = Math.max(0, Math.min(ctxPositionMs, durationMs || ctxPositionMs));
  const progressRatio = durationMs > 0 ? positionMs / durationMs : 0;
  const clampedRatio = Math.max(0, Math.min(progressRatio, 1));
  const progressPercent = Math.round(clampedRatio * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekFromPress = (locationX: number) => {
    if (barWidth <= 0) {
      return;
    }

    const ratio = Math.max(0, Math.min(locationX / barWidth, 1));
    seekToRatio(ratio);
  };

  const knobX =
    barWidth > 0
      ? Math.max(0, Math.min(clampedRatio * barWidth - 14, barWidth - 28))
      : 0;

  return (
    <>
      <View className="border-t border-[#334155] bg-[#0B1220] px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Pressable className="mr-3 flex-1" onPress={() => setExpanded(true)}>
            <Text className="text-sm font-semibold text-[#F8FAFC]" numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text className="mt-0.5 text-xs text-[#94A3B8]" numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </Pressable>

          <View className="flex-row items-center">
            <Pressable
              className="mr-2 h-9 w-9 items-center justify-center rounded-full border border-[#334155]"
              onPress={nextTrack}
            >
              <Ionicons name="play-skip-forward" size={18} color="#F8FAFC" />
            </Pressable>
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-[#00CAF5]"
              onPress={togglePlay}
            >
              <Ionicons
                name={state.playing ? 'pause' : 'play'}
                size={18}
                color="#0F172A"
              />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={expanded} transparent animationType="slide" onRequestClose={() => setExpanded(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setExpanded(false)}>
          <Pressable className="mt-auto rounded-t-3xl border-t border-[#334155] bg-[#0B1220] px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-[#E2E8F0]">Now Playing</Text>
              <Pressable onPress={() => setExpanded(false)}>
                <Ionicons name="chevron-down" size={22} color="#94A3B8" />
              </Pressable>
            </View>

            <View className="mb-4 rounded-2xl border border-[#334155] bg-[#111827] p-4">
              <Text className="text-base font-semibold text-[#F8FAFC]" numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text className="mt-1 text-sm text-[#94A3B8]" numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>

            <Pressable
              className="mb-1.5 h-[7px] w-full rounded-full bg-[#334155]"
              onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
              onPress={(event) => seekFromPress(event.nativeEvent.locationX)}
            >
              <View
                className="h-[7px] rounded-full bg-[#00CAF5]"
                style={{ width: `${progressPercent}%` }}
              />
              <View
                className="absolute -top-[10px] h-7 w-7 rounded-full border-2 border-[#00CAF5] bg-[#0F172A]"
                style={{ left: knobX }}
              />
            </Pressable>

            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[11px] text-[#94A3B8]">
                {formatTime(Math.floor(positionMs / 1000))}
              </Text>
              <Text className="text-[11px] text-[#94A3B8]">
                {formatTime(Math.floor(durationMs / 1000))}
              </Text>
            </View>

            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full border border-[#334155]"
                onPress={toggleShuffle}
              >
                <MaterialCommunityIcons
                  name="shuffle-variant"
                  size={20}
                  color={state.shuffleEnabled ? '#00CAF5' : '#94A3B8'}
                />
              </Pressable>

              <Pressable
                className="h-11 w-11 items-center justify-center rounded-full border border-[#334155]"
                onPress={previousTrack}
              >
                <Ionicons name="play-skip-back" size={20} color="#F8FAFC" />
              </Pressable>

              <Pressable
                className="h-16 w-16 items-center justify-center rounded-full bg-[#00CAF5]"
                onPress={togglePlay}
              >
                <Ionicons
                  name={state.playing ? 'pause' : 'play'}
                  size={30}
                  color="#0F172A"
                />
              </Pressable>

              <Pressable
                className="h-11 w-11 items-center justify-center rounded-full border border-[#334155]"
                onPress={nextTrack}
              >
                <Ionicons name="play-skip-forward" size={20} color="#F8FAFC" />
              </Pressable>

              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full border border-[#334155]"
                onPress={toggleRepeat}
              >
                <MaterialCommunityIcons
                  name="repeat"
                  size={20}
                  color={state.repeatEnabled ? '#00CAF5' : '#94A3B8'}
                />
              </Pressable>
            </View>

            <View className="flex-row items-center justify-center gap-3">
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full border border-[#334155]"
                onPress={toggleQueue}
              >
                <MaterialIcons
                  name="queue-music"
                  size={18}
                  color={state.queueEnabled ? '#00CAF5' : '#94A3B8'}
                />
              </Pressable>

              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full border border-[#334155]"
                onPress={toggleFavorite}
              >
                <Ionicons
                  name={state.favoriteEnabled ? 'heart' : 'heart-outline'}
                  size={18}
                  color={state.favoriteEnabled ? '#00CAF5' : '#94A3B8'}
                />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
