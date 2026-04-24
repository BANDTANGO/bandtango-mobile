import { useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageBackground, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { OnboardingProgress } from '../components/OnboardingProgress';

type Props = NativeStackScreenProps<AuthStackParamList, 'AudioAgentPersonality'>;

// ── Data ─────────────────────────────────────────────────────────────────────

const MOODS = ['Smooth', 'Thoughtful', 'Energetic', 'Chill'] as const;

const ENERGIES = [
  'Laid-back cruising',
  'Windows down, volume up',
  'Late night long haul',
  'Weekend driving',
] as const;

type Mood   = (typeof MOODS)[number];
type Energy = (typeof ENERGIES)[number];

// ── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: selected ? '#00CAF5' : '#334155',
        backgroundColor: selected ? 'rgba(0, 202, 245, 0.15)' : '#0B1220',
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: selected ? '#00CAF5' : '#E2E8F0' }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Discovery Slider ─────────────────────────────────────────────────────────

const TRACK_H  = 6;
const THUMB_SZ = 26;

function DiscoverySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackWidth = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        if (!trackWidth.current) return;
        onChange(Math.round(Math.min(100, Math.max(0, (e.nativeEvent.locationX / trackWidth.current) * 100))));
      },
      onPanResponderMove: (e) => {
        if (!trackWidth.current) return;
        onChange(Math.round(Math.min(100, Math.max(0, (e.nativeEvent.locationX / trackWidth.current) * 100))));
      },
    }),
  ).current;

  return (
    <View style={{ paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: '#94A3B8', fontSize: 12 }}>Familiar favourites</Text>
        <Text style={{ color: '#94A3B8', fontSize: 12 }}>Pure discovery</Text>
      </View>

      {/* Drag area */}
      <View
        {...pan.panHandlers}
        onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
        style={{ height: THUMB_SZ + 16, justifyContent: 'center' }}
      >
        {/* Track background */}
        <View
          style={{
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            backgroundColor: '#1E293B',
          }}
        >
          {/* Fill */}
          <View
            style={{
              width: `${value}%`,
              height: TRACK_H,
              borderRadius: TRACK_H / 2,
              backgroundColor: '#00CAF5',
            }}
          />
          {/* Thumb */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: `${value}%` as any,
              top: TRACK_H / 2 - THUMB_SZ / 2,
              width: THUMB_SZ,
              height: THUMB_SZ,
              borderRadius: THUMB_SZ / 2,
              backgroundColor: '#00CAF5',
              borderWidth: 3,
              borderColor: '#0B1220',
              shadowColor: '#00CAF5',
              shadowOpacity: 0.5,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
              transform: [{ translateX: -THUMB_SZ / 2 }],
            }}
          />
        </View>
      </View>

      <Text style={{ textAlign: 'center', marginTop: 8, color: '#00CAF5', fontSize: 13, fontWeight: '700' }}>
        {value}% Discovery
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function AudioAgentPersonalityScreen({ navigation }: Props) {
  const [mood,      setMood]      = useState<Mood | null>(null);
  const [energy,    setEnergy]    = useState<Energy | null>(null);
  const [discovery, setDiscovery] = useState(20);

  const canProceed = mood !== null && energy !== null;

  return (
    <View className="flex-1">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress step={3} total={3} />

        {/* Header */}
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
          Your Audio Agent's Personality
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 28 }}>
          Set the tone for how your agent curates music for you.
        </Text>

        {/* ── Q1: Default mood ─────────────────────────────────────────── */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
            Select your default mood
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {MOODS.map((m) => (
              <Pill key={m} label={m} selected={mood === m} onPress={() => setMood(m)} />
            ))}
          </View>
        </View>

        {/* ── Q2: Energy ───────────────────────────────────────────────── */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
            What kind of energy would you like your Agent to deliver?
          </Text>
          <View style={{ gap: 10 }}>
            {ENERGIES.map((e) => {
              const selected = energy === e;
              return (
                <Pressable
                  key={e}
                  onPress={() => setEnergy(e)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? '#00CAF5' : '#334155',
                    backgroundColor: selected ? 'rgba(0, 202, 245, 0.12)' : '#111827',
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selected ? '#00CAF5' : '#475569',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {selected && (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#00CAF5' }} />
                    )}
                  </View>
                  <Text style={{ color: selected ? '#F8FAFC' : '#CBD5E1', fontSize: 15, fontWeight: '500' }}>
                    {e}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Discovery slider ─────────────────────────────────────────── */}
        <View
          style={{
            marginBottom: 36,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#334155',
            backgroundColor: '#111827',
            paddingHorizontal: 16,
            paddingVertical: 20,
          }}
        >
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
            Discovery level
          </Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
            How much new music should your agent introduce?
          </Text>
          <DiscoverySlider value={discovery} onChange={setDiscovery} />
        </View>

        {/* Bottom nav row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              flex: 1,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#334155',
              backgroundColor: '#0B1220',
              paddingVertical: 15,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '600' }}>Prev</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('CreateAccount')}
            disabled={!canProceed}
            style={{
              flex: 2,
              borderRadius: 12,
              backgroundColor: canProceed ? '#00CAF5' : '#1E293B',
              paddingVertical: 15,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: canProceed ? '#0B1220' : '#475569', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
