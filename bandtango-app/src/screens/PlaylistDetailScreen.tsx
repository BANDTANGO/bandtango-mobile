import { RouteProp } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
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
import { Playlist, Song, MainStackParamList } from '../types';

const TRACKS_SEARCH_ENDPOINT = 'http://localhost:7070/api/tracks/search';
const PLAYLISTS_ENDPOINT = 'http://localhost:7070/api/music-playlists';

type SearchResult = {
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  /** Full raw object from the search API — preserved so nothing is lost on save. */
  raw: Record<string, unknown>;
};

type PlaylistDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'PlaylistDetail'>;
  playlist?: Playlist;
  isNew?: boolean; // true = not yet on server → POST; false/undefined = server record → PUT
  onAddSong: (
    playlistId: string,
    payload: { title: string; artist: string; duration: string; audioUrl?: string; meta?: Record<string, unknown> }
  ) => void;
  onRemoveSong: (playlistId: string, songId: string) => void;
  onPlaylistSaved?: (saved: Playlist) => void;
  onDeletePlaylist?: (playlistId: string) => void;
};

/** HTML5 drag-and-drop track list — works on web. */
/** Single draggable track row — attaches HTML5 drag events directly to the DOM node. */
function TrackRow({
  item,
  idx,
  overIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: {
  item: Song;
  idx: number;
  overIndex: number | null;
  onDragStart: (idx: number) => void;
  onDragOver: (e: Event, idx: number) => void;
  onDrop: (e: Event, idx: number) => void;
  onDragEnd: () => void;
  onRemove: (id: string) => void;
}) {
  const rowRef = useRef<View>(null);

  useEffect(() => {
    const node = (rowRef.current as any)?._nativeTag
      ? undefined
      : (rowRef.current as unknown as HTMLElement | null);
    if (!node) return;
    node.draggable = true;
    const ds = () => onDragStart(idx);
    const dov = (e: Event) => onDragOver(e, idx);
    const dp = (e: Event) => onDrop(e, idx);
    const de = () => onDragEnd();
    node.addEventListener('dragstart', ds);
    node.addEventListener('dragover', dov);
    node.addEventListener('drop', dp);
    node.addEventListener('dragend', de);
    return () => {
      node.removeEventListener('dragstart', ds);
      node.removeEventListener('dragover', dov);
      node.removeEventListener('drop', dp);
      node.removeEventListener('dragend', de);
    };
  }, [idx, onDragStart, onDragOver, onDrop, onDragEnd]);

  return (
    <View
      ref={rowRef}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 12, borderWidth: 1,
        borderColor: overIndex === idx ? '#3B82F6' : '#334155',
        backgroundColor: overIndex === idx ? '#1E3A5F' : '#1E293B',
        padding: 12, marginBottom: 10,
        cursor: 'grab',
      } as any}
    >
      <View style={{ paddingRight: 10, paddingVertical: 4 }}>
        <Ionicons name="reorder-three-outline" size={20} color="#475569" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#F8FAFC', marginBottom: 3 }}>{item.title}</Text>
        <Text style={{ fontSize: 13, color: '#94A3B8' }}>{item.artist} • {item.duration}</Text>
        {!!item.audioUrl && (
          <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }} numberOfLines={1}>{item.audioUrl}</Text>
        )}
      </View>
      <Pressable
        onPress={() => onRemove(item.id)}
        style={{ borderRadius: 8, borderWidth: 1, borderColor: '#F87171', paddingHorizontal: 10, paddingVertical: 6 }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#F87171' }}>Remove</Text>
      </Pressable>
    </View>
  );
}

function TrackList({
  songs,
  onReorder,
  onRemove,
}: {
  songs: Song[];
  onReorder: (next: Song[]) => void;
  onRemove: (id: string) => void;
}) {
  const dragIndex = useRef<number | null>(null);
  const songsRef = useRef(songs);
  songsRef.current = songs;
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useRef((idx: number) => {
    dragIndex.current = idx;
  }).current;

  const handleDragOver = useRef((e: Event, idx: number) => {
    (e as DragEvent).preventDefault?.();
    setOverIndex(idx);
  }).current;

  const handleDrop = useRef((e: Event, idx: number) => {
    (e as DragEvent).preventDefault?.();
    const from = dragIndex.current;
    if (from === null || from === idx) { setOverIndex(null); return; }
    const next = [...songsRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    onReorder(next);
    dragIndex.current = null;
    setOverIndex(null);
  }).current;

  const handleDragEnd = useRef(() => {
    dragIndex.current = null;
    setOverIndex(null);
  }).current;

  if (songs.length === 0) {
    return <Text style={{ color: '#64748B' }}>No tracks yet.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      {songs.map((item, idx) => (
        <TrackRow
          key={item.id}
          item={item}
          idx={idx}
          overIndex={overIndex}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onRemove={onRemove}
        />
      ))}
    </ScrollView>
  );
}

export function PlaylistDetailScreen({
  route,
  playlist,
  isNew = false,
  onAddSong,
  onRemoveSong,
  onPlaylistSaved,
  onDeletePlaylist,
}: PlaylistDetailScreenProps) {
  const [query, setQuery] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Local ordered copy of songs — updated by drag-and-drop.
  const [orderedSongs, setOrderedSongs] = useState(playlist?.songs ?? []);

  // Keep orderedSongs in sync when the playlist prop changes (e.g. after a save or add).
  useEffect(() => {
    setOrderedSongs(playlist?.songs ?? []);
  }, [playlist?.songs]);

  // Debounced API search — fires 350 ms after the user stops typing.
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setSearchError(''); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError('');
      fetch(`${TRACKS_SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          const data = await res.json() as unknown;
          const items: Array<Record<string, unknown>> = Array.isArray(data)
            ? data as Array<Record<string, unknown>>
            : ((data as Record<string, unknown>).data ??
               (data as Record<string, unknown>).results ??
               (data as Record<string, unknown>).tracks ??
               []) as Array<Record<string, unknown>>;
          setResults(
            items.map((t) => ({
              title:    String(t.title    ?? t.name  ?? 'Unknown'),
              artist:   String(t.artist   ?? t.band  ?? ''),
              duration: String(t.duration ?? t.length ?? '--:--'),
              audioUrl: t.audioUrl ? String(t.audioUrl) : t.url ? String(t.url) : undefined,
              raw: t, // preserve every field the API returned
            }))
          );
        })
        .catch((e: unknown) => setSearchError(e instanceof Error ? e.message : 'Search failed'))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  if (!playlist) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 14 }}>
        <Text style={{ color: '#64748B' }}>Playlist not found.</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    if (!playlist || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (!isNew && playlist.id) {
        const res = await fetch(`${PLAYLISTS_ENDPOINT}/${playlist.id}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 404) throw new Error(`Server returned ${res.status}`);
      }
      onDeletePlaylist?.(playlist.id);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleAdd = (track: SearchResult) => {
    onAddSong(route.params.playlistId, {
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      audioUrl: audioUrl.trim() || track.audioUrl,
      meta: track.raw,
    });
    setQuery('');
    setAudioUrl('');
  };

  const handleSave = async () => {
    if (!playlist || saving) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    const usePost = isNew || !playlist.id;
    const url = usePost ? PLAYLISTS_ENDPOINT : `${PLAYLISTS_ENDPOINT}/${playlist.id}`;
    // Ensure tracks is always sent as an array, never undefined or {}.
    // Destructure out `songs` so it doesn't conflict with the `tracks` key the server expects.
    // Spread each song's `meta` (original API fields) first, then overlay the normalised fields.
    const { songs: _songs, ...playlistRest } = playlist;
    const body = {
      ...playlistRest,
      tracks: (Array.isArray(orderedSongs) ? orderedSongs : []).map((s) => ({
        ...(s.meta ?? {}),
        id:       s.id,
        title:    s.title,
        artist:   s.artist,
        duration: s.duration,
        ...(s.audioUrl ? { audioUrl: s.audioUrl } : {}),
      })),
    };
    try {
      const res = await fetch(url, {
        method: usePost ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const saved = await res.json() as Playlist;
      setSaveSuccess(true);
      onPlaylistSaved?.(saved);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 14 }}>
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: '#F8FAFC' }}>{playlist.name}</Text>
          <Text style={{ marginTop: 4, marginBottom: 2, color: '#94A3B8' }}>{playlist.description}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {/* Delete button */}
          {!isNew && (
            deleteConfirm ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, borderColor: '#F87171', backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 7 }}>
                <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>Delete?</Text>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  style={({ pressed }) => ({ opacity: pressed || deleting ? 0.7 : 1, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F87171', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 })}
                >
                  {deleting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Yes</Text>}
                </Pressable>
                <Pressable onPress={() => { setDeleteConfirm(false); setDeleteError(''); }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>No</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setDeleteConfirm(true)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#F87171', opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="trash-outline" size={15} color="#F87171" />
              </Pressable>
            )
          )}
          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => ([
              { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
                backgroundColor: saveSuccess ? '#16A34A' : '#3B82F6',
                opacity: pressed || saving ? 0.7 : 1 },
            ])}
          >
            {saving
              ? <ActivityIndicator size="small" color="#F8FAFC" />
              : <Ionicons name={saveSuccess ? 'checkmark' : 'cloud-upload-outline'} size={15} color="#F8FAFC" />}
            <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '600' }}>
              {saving ? 'Saving…' : saveSuccess ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </View>

      {!!deleteError && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, backgroundColor: '#1E293B', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#F87171' }}>
          <Ionicons name="alert-circle-outline" size={14} color="#F87171" />
          <Text style={{ color: '#F87171', fontSize: 13, flex: 1 }}>{deleteError}</Text>
          <Pressable onPress={() => setDeleteError('')}><Ionicons name="close" size={14} color="#F87171" /></Pressable>
        </View>
      )}

      {!!saveError && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, backgroundColor: '#1E293B', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#F87171' }}>
          <Ionicons name="alert-circle-outline" size={14} color="#F87171" />
          <Text style={{ color: '#F87171', fontSize: 13, flex: 1 }}>{saveError}</Text>
          <Pressable onPress={() => setSaveError('')}><Ionicons name="close" size={14} color="#F87171" /></Pressable>
        </View>
      )}

      {/* Search panel */}
      <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B', padding: 12, marginBottom: 16 }}>
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Add Track</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: searchFocused ? '#F8FAFC' : '#334155', backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 8, gap: 8 }}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tracks or artists…"
            placeholderTextColor="#64748B"
            selectionColor="#F8FAFC"
            cursorColor="#F8FAFC"
            underlineColorAndroid="transparent"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ flex: 1, color: '#F8FAFC', fontSize: 14, outline: 'none' } as any}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="#64748B" />
            </Pressable>
          )}
        </View>

          {searching && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <ActivityIndicator size="small" color="#00CAF5" />
              <Text style={{ color: '#64748B', fontSize: 13 }}>Searching…</Text>
            </View>
          )}

          {!!searchError && !searching && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Ionicons name="alert-circle-outline" size={14} color="#F87171" />
              <Text style={{ color: '#F87171', fontSize: 13, flex: 1 }}>{searchError}</Text>
            </View>
          )}

          {!searching && results.length > 0 && (
          <View style={{ marginTop: 8, gap: 6 }}>
            {results.map((track, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleAdd(track)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: '#334155' }}
              >
                <View>
                  <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: '600' }}>{track.title}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 1 }}>{track.artist} • {track.duration}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
              </Pressable>
            ))}
          </View>
        )}

        {!searching && !searchError && query.trim().length > 0 && results.length === 0 && (
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 8 }}>No matches found.</Text>
        )}

        {/* Audio URL */}
        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 6 }}>Audio URL <Text style={{ color: '#475569', fontWeight: '400' }}>(optional)</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: urlFocused ? '#F8FAFC' : '#334155', backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 8, gap: 8 }}>
          <Ionicons name="link-outline" size={15} color="#64748B" />
          <TextInput
            value={audioUrl}
            onChangeText={setAudioUrl}
            placeholder="https://…"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            keyboardType="url"
            selectionColor="#F8FAFC"
            cursorColor="#F8FAFC"
            underlineColorAndroid="transparent"
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setUrlFocused(false)}
            style={{ flex: 1, color: '#F8FAFC', fontSize: 13, outline: 'none' } as any}
          />
          {!!audioUrl && (
            <Pressable onPress={() => setAudioUrl('')}>
              <Ionicons name="close-circle" size={15} color="#64748B" />
            </Pressable>
          )}
        </View>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '600', color: '#E2E8F0', marginBottom: 8 }}>
        Tracks ({orderedSongs.length})
      </Text>

<TrackList
        songs={orderedSongs}
        onReorder={setOrderedSongs}
        onRemove={(id) => onRemoveSong(playlist.id, id)}
      />
    </View>
  );
}
