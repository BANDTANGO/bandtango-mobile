import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types';

const CARD_GRADIENT: [string, string, string, string, string] = ['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0'];
const CARD_BORDER = 'rgba(106, 120, 160, 0.85)';
const SELECTED_BORDER = '#00CAF5';
const HOVER_BG = 'rgba(0, 202, 245, 0.08)';
const SELECTED_BG = 'rgba(0, 202, 245, 0.13)';

const ARTISTS = [
  { name: 'Los Vientos', genre: 'Indie Rock' },
  { name: 'Alma Vega', genre: 'Dream Pop' },
  { name: 'DJ Marina', genre: 'Electronic' },
] as const;

const SONGS = [
  { title: 'Sunset Boulevard', artist: 'The Comet Trails' },
  { title: 'Radio Heart', artist: 'Los Vientos' },
] as const;

const EVENTS = [
  { label: 'BANDTANGO Live', sub: 'House of Rock' },
  { label: 'CC Music Fest', sub: 'Cole Park' },
  { label: 'Open Mic Night', sub: 'Brewster Street' },
] as const;

type ExploreScreenProps = NativeStackScreenProps<MainStackParamList, 'Explore'>;

export function ExploreScreen({}: ExploreScreenProps) {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  return (
    <View className="flex-1 px-5 pt-4">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <Text className="text-sm font-semibold text-[#94A3B8] mb-2">Local Artists</Text>

      {/* Artist cards */}
      <View className="mb-6">
        <View className="flex-row justify-between">
          {ARTISTS.map(({ name, genre }, i) => {
            const isSelected = selectedArtist === name;
            const mx = i === 0 ? 'mr-2' : i === 1 ? 'mx-2' : 'ml-2';
            return (
              <Pressable
                key={name}
                onPress={() => setSelectedArtist(isSelected ? null : name)}
                style={({ hovered, pressed }: any) => ({
                  flex: 1,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? SELECTED_BORDER : CARD_BORDER,
                  ...(i === 0 ? { marginRight: 8 } : i === 1 ? { marginHorizontal: 8 } : { marginLeft: 8 }),
                })}
                className={mx}
              >
                {({ hovered, pressed }: any) => (
                  <>
                    <LinearGradient
                      colors={CARD_GRADIENT}
                      start={{ x: 1.0, y: 0.2 }}
                      end={{ x: 0.5, y: 1.25 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    {(hovered || isSelected) && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isSelected ? SELECTED_BG : HOVER_BG }} />
                    )}
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Ionicons name="person-circle-outline" size={48} color={isSelected ? '#00CAF5' : '#F8FAFC'} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: isSelected ? '#00CAF5' : '#F8FAFC', marginTop: 8, textAlign: 'center' }}>{name}</Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>{genre}</Text>
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Featured Songs */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="musical-notes-outline" size={12} color="#94A3B8" />
          <Text className="text-sm font-semibold text-[#94A3B8] ml-2">Featured Songs</Text>
        </View>
        <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: CARD_BORDER }}>
          <LinearGradient
            colors={CARD_GRADIENT}
            start={{ x: 1.0, y: 0.2 }}
            end={{ x: 0.5, y: 1.25 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {SONGS.map(({ title, artist }, i) => {
            const isSelected = selectedSong === title;
            const isLast = i === SONGS.length - 1;
            return (
              <Pressable
                key={title}
                onPress={() => setSelectedSong(isSelected ? null : title)}
                style={({ hovered, pressed }: any) => ({
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: 'rgba(106,120,160,0.4)',
                  borderRadius: isLast ? 0 : undefined,
                  backgroundColor: isSelected ? SELECTED_BG : hovered ? HOVER_BG : 'transparent',
                  borderLeftWidth: isSelected ? 2 : 0,
                  borderLeftColor: SELECTED_BORDER,
                })}
              >
                {({ hovered }: any) => (
                  <>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isSelected ? 'rgba(0,202,245,0.2)' : '#334155', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="musical-note" size={16} color={isSelected ? '#00CAF5' : '#F8FAFC'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: isSelected ? '#00CAF5' : '#F8FAFC' }}>{title}</Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{artist}</Text>
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Community Events */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
          <Text className="text-sm font-semibold text-[#94A3B8] ml-2">Community Events</Text>
        </View>
        <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: CARD_BORDER }}>
          <LinearGradient
            colors={CARD_GRADIENT}
            start={{ x: 1.0, y: 0.2 }}
            end={{ x: 0.5, y: 1.25 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {EVENTS.map(({ label, sub }, i) => {
            const isSelected = selectedEvent === label;
            const isLast = i === EVENTS.length - 1;
            return (
              <Pressable
                key={label}
                onPress={() => setSelectedEvent(isSelected ? null : label)}
                style={({ hovered, pressed }: any) => ({
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: 'rgba(106,120,160,0.4)',
                  backgroundColor: isSelected ? SELECTED_BG : hovered ? HOVER_BG : 'transparent',
                  borderLeftWidth: isSelected ? 2 : 0,
                  borderLeftColor: SELECTED_BORDER,
                })}
              >
                {({ hovered }: any) => (
                  <>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isSelected ? 'rgba(0,202,245,0.2)' : '#334155', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="location" size={16} color={isSelected ? '#00CAF5' : '#F8FAFC'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: isSelected ? '#00CAF5' : '#F8FAFC' }}>{label}</Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{sub}</Text>
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

