import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LivePlayerCard } from '../components/LivePlayerCard';
import { PRESET_STREAMS, StreamType, addCorsSafeOrigin } from '../data/streamPresets';
import { MainStackParamList } from '../types';
import { useNowPlaying } from '../state/NowPlayingContext';
import { useAuth } from '../state/AuthContext';

const API_BASE = 'http://localhost:7070';

type UserPreset = { label: string; url: string; type: StreamType; corsOk: boolean };

function detectStreamType(url: string): StreamType {
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8') || lower.includes('.m3u') || lower.includes('/hls/')) return 'hls';
  return 'icecast';
}

type Props = NativeStackScreenProps<MainStackParamList, 'HLSListening'>;

export function HLSListeningScreen(_props: Props) {
  const { setActiveHlsUrl, activeHlsUrl, activeHlsLabel, setActiveHlsLabel } = useNowPlaying();
  const { user } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetLabel, setPresetLabel] = useState('');
  const [presetLabelFocused, setPresetLabelFocused] = useState(false);
  const [presetType, setPresetType] = useState<StreamType>('icecast');
  const [presetCorsOk, setPresetCorsOk] = useState(false);

  // ── Load user presets from API on mount ────────────────────────────────
  useEffect(() => {
    if (!user?.token) return;
    fetch(`${API_BASE}/api/station/preset?email=${encodeURIComponent(user.email ?? '')}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserPreset[] | null) => {
        if (Array.isArray(data)) {
          setUserPresets(data);
          data.forEach((p) => { if (p.corsOk) addCorsSafeOrigin(p.url); });
        }
      })
      .catch(() => { /* non-fatal — fall back to empty list */ });
  }, [user?.token]);

  // Use context's activeHlsUrl as the source of truth for what's streaming.
  const activeUrl = activeHlsUrl;

  const allPresets = [...PRESET_STREAMS, ...userPresets];
  const isAlreadyPreset = !!activeUrl && allPresets.some((p) => p.url === activeUrl);

  const handleStart = (url?: string, label?: string) => {
    const target = (url ?? urlInput).trim();
    if (!target) return;
    setActiveHlsUrl(target);
    // Use explicit label (from preset), otherwise derive a readable name from the URL.
    if (label) {
      setActiveHlsLabel(label);
    } else {
      try {
        const parsed = new URL(target);
        // e.g. "ice1.somafm.com / groovesalad-128-aac" → "groovesalad-128-aac @ ice1.somafm.com"
        const pathPart = parsed.pathname.split('/').filter(Boolean)[0];
        const derived = pathPart
          ? `${pathPart} @ ${parsed.hostname}`
          : parsed.hostname;
        setActiveHlsLabel(derived);
      } catch {
        setActiveHlsLabel(target);
      }
    }
  };

  const handleStop = () => {
    setActiveHlsUrl('');
    setActiveHlsLabel('');
    setSavingPreset(false);
  };

  const beginSavePreset = () => {
    const existing = allPresets.find((p) => p.url === activeUrl);
    setPresetLabel(existing?.label ?? activeUrl ?? '');
    setPresetType((existing as UserPreset | undefined)?.type ?? detectStreamType(activeUrl ?? ''));
    setPresetCorsOk((existing as UserPreset | undefined)?.corsOk ?? false);
    setSavingPreset(true);
  };

  const confirmSavePreset = () => {
    const label = presetLabel.trim();
    const url   = activeUrl;
    if (!label || !url) { setSavingPreset(false); return; }
    if (presetCorsOk) addCorsSafeOrigin(url);
    const newPreset: UserPreset = { label, url, type: presetType, corsOk: presetCorsOk };
    setUserPresets((prev) => [...prev.filter((p) => p.url !== url), newPreset]);
    // Persist to API keyed by user email.
    if (user?.token && user?.email) {
      fetch(`${API_BASE}/api/station/preset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ email: user.email, ...newPreset }),
      }).catch(() => { /* best-effort */ });
    }
    // Update the live label in context so the player header reflects the saved name.
    setActiveHlsLabel(label);
    setSavingPreset(false);
  };

  const removeUserPreset = (url: string) => {
    setUserPresets((prev) => prev.filter((p) => p.url !== url));
    if (user?.token) {
      fetch(`${API_BASE}/api/station/preset?url=${encodeURIComponent(url)}&email=${encodeURIComponent(user.email ?? '')}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      }).catch(() => { /* best-effort */ });
    }
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 }}>
            Paste any audio stream URL and hit play.
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#111827',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: focused ? '#00CAF5' : '#334155',
            paddingHorizontal: 12,
            paddingVertical: 2,
            marginBottom: 12,
          }}
        >
          <Ionicons name="radio-outline" size={18} color={focused ? '#00CAF5' : '#475569'} style={{ marginRight: 8 }} />
          <TextInput
            value={urlInput}
            onChangeText={setUrlInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="https://example.com/stream.m3u8"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={() => handleStart()}
            selectionColor="#00CAF5"
            cursorColor="#00CAF5"
            underlineColorAndroid="transparent"
            style={{
              flex: 1,
              color: '#F8FAFC',
              fontSize: 14,
              paddingVertical: 12,
              ...(({ outline: 'none' }) as object),
            }}
          />
          {urlInput.length > 0 && (
            <Pressable onPress={() => setUrlInput('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#475569" />
            </Pressable>
          )}
        </View>

        {/* Start / Stop + Save as Preset */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: savingPreset ? 12 : 24 }}>
          <Pressable
            onPress={() => (activeUrl ? handleStop() : handleStart())}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 12,
              backgroundColor: activeUrl
                ? (pressed ? '#7f1d1d' : '#991b1b')
                : (pressed ? '#0099c4' : '#00CAF5'),
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            })}
          >
            <Ionicons
              name={activeUrl ? 'stop-circle-outline' : 'play-circle-outline'}
              size={20}
              color={activeUrl ? '#FCA5A5' : '#0F172A'}
            />
            <Text style={{ color: activeUrl ? '#FCA5A5' : '#0F172A', fontSize: 15, fontWeight: '700' }}>
              {activeUrl ? 'Stop Stream' : 'Start Streaming'}
            </Text>
          </Pressable>

          {!!activeUrl && !isAlreadyPreset && (
            <Pressable
              onPress={beginSavePreset}
              style={({ pressed }) => ({
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#334155',
                backgroundColor: pressed ? '#1E293B' : '#111827',
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              })}
            >
              <Ionicons name="add-circle-outline" size={18} color="#00CAF5" />
              <Text style={{ color: '#00CAF5', fontSize: 13, fontWeight: '600' }}>Preset</Text>
            </Pressable>
          )}
        </View>

        {/* Inline preset-naming form */}
        {savingPreset && (
          <View style={{ marginBottom: 24, backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 12, gap: 10 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Station name</Text>
            <TextInput
              value={presetLabel}
              onChangeText={setPresetLabel}
              placeholder="e.g. My Jazz Station"
              placeholderTextColor="#475569"
              autoCapitalize="words"
              autoFocus
              selectionColor="#00CAF5"
              cursorColor="#00CAF5"
              underlineColorAndroid="transparent"
              onFocus={() => setPresetLabelFocused(true)}
              onBlur={() => setPresetLabelFocused(false)}
              style={{
                color: '#F8FAFC',
                fontSize: 14,
                backgroundColor: '#0F172A',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: presetLabelFocused ? '#00CAF5' : '#334155',
                paddingHorizontal: 12,
                paddingVertical: 9,
                ...(({ outline: 'none' }) as object),
              }}
            />
            {/* Stream type selector */}
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Stream type</Text>
            {/* CORS metadata polling toggle — only relevant for Icecast streams */}
            {presetType === 'icecast' && (
              <Pressable
                onPress={() => setPresetCorsOk((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 4, borderWidth: 1,
                  borderColor: presetCorsOk ? '#00CAF5' : '#334155',
                  backgroundColor: presetCorsOk ? 'rgba(0,202,245,0.15)' : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {presetCorsOk && <Ionicons name="checkmark" size={13} color="#00CAF5" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '600' }}>Allow metadata polling (CORS)</Text>
                  <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>
                    Enable only if this server sends CORS headers — lets us read artist/title from the stream.
                  </Text>
                </View>
              </Pressable>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['icecast', 'hls'] as StreamType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setPresetType(t)}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: presetType === t ? '#00CAF5' : '#334155',
                    backgroundColor: presetType === t ? 'rgba(0,202,245,0.12)' : '#0F172A',
                    paddingVertical: 9,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name={t === 'hls' ? 'layers-outline' : 'radio-outline'}
                    size={15}
                    color={presetType === t ? '#00CAF5' : '#64748B'}
                  />
                  <Text style={{ color: presetType === t ? '#00CAF5' : '#64748B', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
                    {t === 'hls' ? 'HLS' : 'Icecast'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={confirmSavePreset}
                style={{ flex: 1, borderRadius: 8, backgroundColor: '#00CAF5', paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 14 }}>Save Preset</Text>
              </Pressable>
              <Pressable
                onPress={() => setSavingPreset(false)}
                style={{ borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 14 }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Live player card */}
        {activeUrl ? (
          <View style={{ marginBottom: 24 }}>
            <LivePlayerCard
              url={activeUrl}
              label={
                activeHlsLabel ||
                PRESET_STREAMS.find((s) => s.url === activeUrl)?.label ||
                userPresets.find((p) => p.url === activeUrl)?.label ||
                'Custom Stream'
              }
            />
          </View>
        ) : null}

        {/* Preset stations */}
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 }}>
          PRESET STATIONS
        </Text>
        {allPresets.map((stream, index) => {
          const isActive = activeUrl === stream.url;
          const isLast = index === allPresets.length - 1;
          const isUserPreset = userPresets.some((p) => p.url === stream.url);
          return (
            <Pressable
              key={stream.url}
              onPress={() => {
                setUrlInput(stream.url);
                handleStart(stream.url, stream.label);
              }}
              style={{ borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: isActive ? 'rgba(0,202,245,0.85)' : 'rgba(106, 120, 160, 0.85)', marginBottom: isLast ? 0 : 8 }}
            >
              <LinearGradient
                colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
                start={{ x: 1.0, y: 0.2 }}
                end={{ x: 0.5, y: 1.25 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              {isActive && (
                <LinearGradient
                  colors={['rgba(0,202,245,0.18)', 'rgba(0,202,245,0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={isActive ? 'radio' : 'radio-outline'}
                    size={20}
                    color={isActive ? '#00CAF5' : '#F8FAFC'}
                  />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: '#F8FAFC', fontWeight: '500', fontSize: 14 }}>{stream.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <View style={{
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: 'type' in stream && stream.type === 'hls' ? 'rgba(139,92,246,0.5)' : 'rgba(0,202,245,0.35)',
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                    }}>
                      <Text style={{ color: 'type' in stream && stream.type === 'hls' ? '#A78BFA' : '#38BDF8', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                        {'type' in stream ? (stream.type === 'hls' ? 'HLS' : 'ICY') : 'ICY'}
                      </Text>
                    </View>
                    <Text style={{ color: '#94A3B8', fontSize: 11 }} numberOfLines={1}>{stream.url}</Text>
                  </View>
                  </View>
                </View>
                {isActive ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                    <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
                  </View>
                ) : isUserPreset ? (
                  <Pressable
                    onPress={(e) => { e.stopPropagation?.(); removeUserPreset(stream.url); }}
                    style={{ padding: 4 }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color="#475569" />
                  </Pressable>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
