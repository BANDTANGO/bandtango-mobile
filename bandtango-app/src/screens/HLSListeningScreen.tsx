import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LivePlayerCard } from '../components/LivePlayerCard';
import { MainStackParamList } from '../types';
import { useNowPlaying } from '../state/NowPlayingContext';

const PRESET_STREAMS = [
  { label: 'SomaFM Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-aac' },
  { label: 'SomaFM Space Station', url: 'https://ice1.somafm.com/spacestation-128-aac' },
  { label: 'SomaFM Secret Agent', url: 'https://ice1.somafm.com/secretagent-128-aac' },
];

type Props = NativeStackScreenProps<MainStackParamList, 'HLSListening'>;

export function HLSListeningScreen(_props: Props) {
  const { setActiveHlsUrl, activeHlsUrl } = useNowPlaying();
  const [urlInput, setUrlInput] = useState('');
  const [focused, setFocused] = useState(false);

  // Use context's activeHlsUrl as the source of truth for what's streaming.
  const activeUrl = activeHlsUrl;

  const handleStart = (url?: string) => {
    const target = (url ?? urlInput).trim();
    if (!target) return;
    setActiveHlsUrl(target);
  };

  const handleStop = () => {
    setActiveHlsUrl('');
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
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '700' }}>
            HLS Live Listening
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
            Paste any HLS or audio stream URL and hit play.
          </Text>
        </View>

        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 }}>
          STREAM URL
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

        {/* Start / Stop button */}
        <Pressable
          onPress={() => (activeUrl ? handleStop() : handleStart())}
          style={({ pressed }) => ({
            borderRadius: 12,
            backgroundColor: activeUrl
              ? (pressed ? '#7f1d1d' : '#991b1b')
              : (pressed ? '#0099c4' : '#00CAF5'),
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 24,
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

        {/* Live player card */}
        {activeUrl ? (
          <View style={{ marginBottom: 24 }}>
            <LivePlayerCard
              url={activeUrl}
              label={PRESET_STREAMS.find((s) => s.url === activeUrl)?.label ?? 'Custom Stream'}
            />
          </View>
        ) : null}

        {/* Preset stations */}
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 }}>
          PRESET STATIONS
        </Text>
        {PRESET_STREAMS.map((stream, index) => {
          const isActive = activeUrl === stream.url;
          const isLast = index === PRESET_STREAMS.length - 1;
          return (
            <Pressable
              key={stream.url}
              onPress={() => {
                setUrlInput(stream.url);
                handleStart(stream.url);
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
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 1 }} numberOfLines={1}>{stream.url}</Text>
                  </View>
                </View>
                {isActive ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                    <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
                  </View>
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
