import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { OnboardingProgress } from '../components/OnboardingProgress';

type Props = NativeStackScreenProps<AuthStackParamList, 'AboutYou'>;

// ── Data ─────────────────────────────────────────────────────────────────────

const LISTEN_OPTIONS = [
  { id: 'radio',    label: 'Radio AM / FM',          icon: 'radio-outline' },
  { id: 'stream',   label: 'Spotify / Apple Music',  icon: 'musical-notes-outline' },
  { id: 'youtube',  label: 'Youtube / Podcasts',     icon: 'play-circle-outline' },
  { id: 'live',     label: 'Live Events / Concerts', icon: 'people-outline' },
  { id: 'vinyl',    label: 'Vinyl / CDs',            icon: 'disc-outline' },
] as const;

const DISCOVER_OPTIONS = [
  'Friends',
  'Algorithm',
  'Radio DJ',
  'Social Media',
  'Live Shows',
  'Blogs',
] as const;

type ListenId   = (typeof LISTEN_OPTIONS)[number]['id'];
type DiscoverId = (typeof DISCOVER_OPTIONS)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function AboutYouScreen({ navigation }: Props) {
  const [listenSel,   setListenSel]   = useState<Set<ListenId>>(new Set());
  const [discoverSel, setDiscoverSel] = useState<Set<DiscoverId>>(new Set());

  const toggleListen = (id: ListenId) =>
    setListenSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleDiscover = (val: DiscoverId) =>
    setDiscoverSel((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });

  const handleNext = () => {
    // TODO: persist selections (user profile API call)
    navigation.navigate('AudioAgentPersonality');
  };

  const canProceed = listenSel.size > 0 && discoverSel.size > 0;

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
        <OnboardingProgress step={2} total={3} />

        {/* Header */}
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
          About You
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 28 }}>
          Help us personalise your Bandtango experience.
        </Text>

        {/* ── Q1: How do you listen? ───────────────────────────────────── */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
            How do you listen to music?
          </Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 14 }}>
            Check all that apply
          </Text>

          {LISTEN_OPTIONS.map(({ id, label, icon }) => {
            const selected = listenSel.has(id);
            return (
              <Pressable
                key={id}
                onPress={() => toggleListen(id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  marginBottom: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected ? '#00CAF5' : '#334155',
                  backgroundColor: selected ? 'rgba(0, 202, 245, 0.12)' : '#111827',
                }}
              >
                {/* Checkbox */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    borderWidth: 2,
                    borderColor: selected ? '#00CAF5' : '#475569',
                    backgroundColor: selected ? '#00CAF5' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {selected && <Ionicons name="checkmark" size={13} color="#0B1220" />}
                </View>

                <Ionicons
                  name={icon as never}
                  size={18}
                  color={selected ? '#00CAF5' : '#94A3B8'}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    color: selected ? '#F8FAFC' : '#CBD5E1',
                    fontSize: 15,
                    fontWeight: '500',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Q2: How do you find new music? ──────────────────────────── */}
        <View style={{ marginBottom: 36 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
            How do you find new music?
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {DISCOVER_OPTIONS.map((val) => {
              const selected = discoverSel.has(val);
              return (
                <Pressable
                  key={val}
                  onPress={() => toggleDiscover(val)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: selected ? '#00CAF5' : '#334155',
                    backgroundColor: selected ? 'rgba(0, 202, 245, 0.15)' : '#0B1220',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: selected ? '#00CAF5' : '#E2E8F0',
                    }}
                  >
                    {val}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '600' }}>Prev</Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            disabled={!canProceed}
            style={{
              flex: 2,
              borderRadius: 12,
              backgroundColor: canProceed ? '#00CAF5' : '#1E293B',
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: canProceed ? '#0B1220' : '#475569', fontSize: 16, fontWeight: '700' }}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
