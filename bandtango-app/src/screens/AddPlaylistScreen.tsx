import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList, Song } from '../types';

type AddPlaylistScreenProps = NativeStackScreenProps<MainStackParamList, 'AddPlaylist'> & {
  onCreatePlaylist: (payload: { name: string; description: string; url?: string; songs?: Song[] }) => void;
};

// ── URL probe ─────────────────────────────────────────────────────────────────

type ProbeResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; label: string; songs: Song[] };

/** Parse an M3U8 body into individual track entries (empty array for live/master). */
function parseM3u8Tracks(text: string): Song[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Master playlist — multiple bitrate renditions, not individual songs.
  if (lines.some((l) => l.startsWith('#EXT-X-STREAM-INF'))) return [];

  // ── Strategy 1: comment-block track list ──────────────────────────────────
  // Servers may emit a header like:
  //   # Track 1: Dave Matthews Band - Where Are You Going [Busted Stuff]
  //   # Track 2: The Lumineers - Life in the City [III]
  // Extract these when #EXTINF entries carry no inline labels.
  const commentTracks: Array<{ artist: string; title: string }> = [];
  let totalExtinfSec = 0;
  for (const line of lines) {
    const cm = line.match(/^#\s+Track\s+\d+:\s*(.+)$/);
    if (cm) {
      const raw     = cm[1].trim().replace(/\s*\[[^\]]+\]\s*$/, '').trim(); // strip [Album]
      const dash    = raw.indexOf(' - ');
      commentTracks.push({
        artist: dash !== -1 ? raw.slice(0, dash).trim() : '',
        title:  dash !== -1 ? raw.slice(dash + 3).trim() : raw,
      });
    }
    const em = line.match(/^#EXTINF:([\d.]+)/);
    if (em) totalExtinfSec += parseFloat(em[1]);
  }

  // ── Strategy 2: inline #EXTINF labels ────────────────────────────────────
  const songs: Song[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF:')) continue;

    const raw = line.slice('#EXTINF:'.length);
    const commaIdx = raw.indexOf(',');
    const durationSec = commaIdx !== -1 ? parseFloat(raw.slice(0, commaIdx)) : NaN;
    const label = commaIdx !== -1 ? raw.slice(commaIdx + 1).trim() : '';

    // Skip if no meaningful label — comment-block strategy will handle it
    if (!label) continue;

    const durationStr =
      !isNaN(durationSec) && durationSec > 0
        ? `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}`
        : '--:--';

    let title = label;
    let artist = '';
    const dash = label.indexOf(' - ');
    if (dash !== -1) {
      artist = label.slice(0, dash).trim();
      title  = label.slice(dash + 3).trim();
    }

    let audioUrl: string | undefined;
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].startsWith('#')) { audioUrl = lines[j]; break; }
    }

    songs.push({
      id: `imported-${Date.now()}-${songs.length}`,
      title,
      artist,
      duration: durationStr,
      audioUrl,
    });
  }

  // Prefer inline-label songs; fall back to comment-block tracks
  if (songs.length > 0) return songs;

  if (commentTracks.length > 0) {
    const perTrackSec = totalExtinfSec > 0 ? totalExtinfSec / commentTracks.length : 0;
    const durationStr = perTrackSec > 0
      ? `${Math.floor(perTrackSec / 60)}:${String(Math.floor(perTrackSec % 60)).padStart(2, '0')}`
      : '--:--';
    return commentTracks.map((t, i) => ({
      id: `imported-${Date.now()}-${i}`,
      title: t.title,
      artist: t.artist,
      duration: durationStr,
      audioUrl: undefined,
    }));
  }

  return [];
}

async function probeUrl(rawUrl: string): Promise<ProbeResult> {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { status: 'idle' };

  try {
    const res = await fetch(trimmed, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { status: 'error', message: `Server returned ${res.status}` };

    const contentType = res.headers.get('content-type') ?? '';
    const isM3u8 =
      /\.m3u8/i.test(trimmed) ||
      contentType.includes('mpegurl') ||
      contentType.includes('x-scpls') ||
      contentType.includes('audio/x-mpegurl');

    if (isM3u8) {
      const text = await res.text();
      const songs = parseM3u8Tracks(text);

      // Detect live vs VOD
      const isLive =
        text.includes('#EXT-X-STREAM-INF') ||
        !text.includes('#EXT-X-ENDLIST');

      if (songs.length > 0) {
        return {
          status: 'ok',
          label: `HLS Playlist · ${songs.length} track${songs.length !== 1 ? 's' : ''} detected`,
          songs,
        };
      }
      return {
        status: 'ok',
        label: isLive ? 'HLS Live Stream' : 'HLS On-Demand Stream',
        songs: [],
      };
    }

    // Plain audio stream / unknown
    return { status: 'ok', label: 'Stream URL · no tracks detected', songs: [] };
  } catch (e) {
    return { status: 'error', message: 'Could not reach URL — check the address and try again.' };
  }
}

const GENRE_TAGS = ['Rock', 'Hip-Hop', 'Jazz', 'Electronic', 'R&B', 'Pop', 'Country', 'Classical', 'Indie', 'Metal'];
const MOOD_TAGS  = ['Chill', 'Hype', 'Focus', 'Workout', 'Sad', 'Happy', 'Late Night', 'Morning'];

const MUSIC_PLAYLIST_ENDPOINT = 'http://localhost:7070/api/music-playlists';

export function AddPlaylistScreen({ navigation, onCreatePlaylist }: AddPlaylistScreenProps) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl]                 = useState('');
  const [selectedGenres, setGenres]   = useState<string[]>([]);
  const [selectedMoods, setMoods]     = useState<string[]>([]);
  const [isPublic, setIsPublic]       = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [urlFocused, setUrlFocused]   = useState(false);
  const [error, setError]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [probe, setProbe]             = useState<ProbeResult>({ status: 'idle' });

  const handleUrlBlur = async () => {
    setUrlFocused(false);
    const trimmed = url.trim();
    if (!trimmed) { setProbe({ status: 'idle' }); return; }
    setProbe({ status: 'loading' });
    setProbe(await probeUrl(trimmed));
  };

  const toggleTag = (list: string[], setList: (v: string[]) => void, tag: string) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const submit = async () => {
    if (!name.trim()) {
      setError('Playlist name is required.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const body = {
      name: name.trim(),
      description: description.trim() || 'No description yet',
      genre: selectedGenres.join(', '),
      mood: selectedMoods.join(', '),
      visibility: isPublic ? 'public' : 'private',
      url: url.trim() || '',
      songs: {},
    };

    try {
      const res = await fetch(MUSIC_PLAYLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setSubmitError(`Server error ${res.status}${text ? `: ${text}` : ''}`);
        setSubmitting(false);
        return;
      }
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
      setSubmitting(false);
      return;
    }

    // Mirror the new playlist locally so the UI reflects it immediately.
    onCreatePlaylist({
      name: body.name,
      description: body.description,
      url: url.trim() || undefined,
      songs: probe.status === 'ok' ? probe.songs : [],
    });

    setSubmitting(false);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Name */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Playlist Name</Text>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t); if (error) setError(''); }}
          placeholder="e.g. Late Night Set"
          placeholderTextColor="#64748B"
          selectionColor="#F8FAFC"
          cursorColor="#F8FAFC"
          underlineColorAndroid="transparent"
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          style={{
            borderWidth: 1,
            borderColor: nameFocused ? '#F8FAFC' : '#334155',
            borderRadius: 10,
            backgroundColor: '#1E293B',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#F8FAFC',
            fontSize: 15,
            marginBottom: 4,
            outline: 'none',
          } as any}
        />
        {!!error && <Text style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>{error}</Text>}

        {/* Description */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Mood, venue, or rehearsal notes"
          placeholderTextColor="#64748B"
          multiline
          textAlignVertical="top"
          selectionColor="#F8FAFC"
          cursorColor="#F8FAFC"
          underlineColorAndroid="transparent"
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          style={{
            borderWidth: 1,
            borderColor: descFocused ? '#F8FAFC' : '#334155',
            borderRadius: 10,
            backgroundColor: '#1E293B',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#F8FAFC',
            fontSize: 15,
            minHeight: 80,
            marginBottom: 4,
            outline: 'none',
          } as any}
        />

        {/* URL */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 }}>Playlist URL <Text style={{ color: '#475569', fontWeight: '400' }}>(optional)</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: urlFocused ? '#F8FAFC' : '#334155', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          <Ionicons name="link-outline" size={15} color="#64748B" />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            keyboardType="url"
            selectionColor="#F8FAFC"
            cursorColor="#F8FAFC"
            underlineColorAndroid="transparent"
            onFocus={() => setUrlFocused(true)}
            onBlur={handleUrlBlur}
            style={{ flex: 1, color: '#F8FAFC', fontSize: 14, outline: 'none' } as any}
          />
          {!!url && (
            <Pressable onPress={() => { setUrl(''); setProbe({ status: 'idle' }); }}>
              <Ionicons name="close-circle" size={15} color="#64748B" />
            </Pressable>
          )}
        </View>

        {/* URL probe result */}
        {probe.status === 'loading' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <ActivityIndicator size="small" color="#00CAF5" />
            <Text style={{ color: '#64748B', fontSize: 13 }}>Checking URL…</Text>
          </View>
        )}
        {probe.status === 'error' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Ionicons name="alert-circle-outline" size={15} color="#F87171" />
            <Text style={{ color: '#F87171', fontSize: 13, flex: 1 }}>{probe.message}</Text>
          </View>
        )}
        {probe.status === 'ok' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Ionicons name="checkmark-circle-outline" size={15} color="#34D399" />
            <Text style={{ color: '#34D399', fontSize: 13 }}>{probe.label}</Text>
          </View>
        )}

        {/* Genre tags */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Genre</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GENRE_TAGS.map((tag) => {
            const on = selectedGenres.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(selectedGenres, setGenres, tag)}
                style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: on ? '#00CAF5' : '#334155' }}
              >
                {on && (
                  <LinearGradient
                    colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
                    start={{ x: 1.0, y: 0.2 }}
                    end={{ x: 0.5, y: 1.25 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                )}
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: on ? 'transparent' : '#0F172A' }}>
                  <Text style={{ color: on ? '#00CAF5' : '#F8FAFC', fontSize: 13, fontWeight: on ? '600' : '400' }}>{tag}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Mood tags */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Mood</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MOOD_TAGS.map((tag) => {
            const on = selectedMoods.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(selectedMoods, setMoods, tag)}
                style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: on ? '#00CAF5' : '#334155' }}
              >
                {on && (
                  <LinearGradient
                    colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
                    start={{ x: 1.0, y: 0.2 }}
                    end={{ x: 0.5, y: 1.25 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                )}
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: on ? 'transparent' : '#0F172A' }}>
                  <Text style={{ color: on ? '#00CAF5' : '#F8FAFC', fontSize: 13, fontWeight: on ? '600' : '400' }}>{tag}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Visibility toggle */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8 }}>Visibility</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['Private', 'Public'] as const).map((opt) => {
            const on = (opt === 'Public') === isPublic;
            return (
              <Pressable
                key={opt}
                onPress={() => setIsPublic(opt === 'Public')}
                style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: on ? '#00CAF5' : '#334155', flex: 1 }}
              >
                {on && (
                  <LinearGradient
                    colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
                    start={{ x: 1.0, y: 0.2 }}
                    end={{ x: 0.5, y: 1.25 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: on ? 'transparent' : '#0F172A' }}>
                  <Ionicons name={opt === 'Public' ? 'globe-outline' : 'lock-closed-outline'} size={15} color={on ? '#00CAF5' : '#94A3B8'} />
                  <Text style={{ color: on ? '#00CAF5' : '#94A3B8', fontSize: 14, fontWeight: on ? '600' : '400' }}>{opt}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Submit error */}
        {!!submitError && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: 'rgba(153,27,27,0.15)', borderRadius: 10, borderWidth: 1, borderColor: '#7f1d1d', padding: 12 }}>
            <Ionicons name="alert-circle-outline" size={16} color="#FCA5A5" />
            <Text style={{ color: '#FCA5A5', fontSize: 13, flex: 1 }}>{submitError}</Text>
          </View>
        )}

        {/* Submit */}
        <Pressable
          onPress={submitting ? undefined : submit}
          style={{ marginTop: 28, borderRadius: 10, overflow: 'hidden', opacity: submitting ? 0.6 : 1 }}
        >
          <LinearGradient
            colors={['#1d4ed8', '#2563eb', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            {submitting && <ActivityIndicator size="small" color="#F8FAFC" />}
            <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
              {submitting ? 'Creating…' : 'Create Playlist'}
            </Text>
          </LinearGradient>
        </Pressable>

      </ScrollView>
    </View>
  );
}
