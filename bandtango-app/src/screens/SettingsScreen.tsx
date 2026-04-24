import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const HOVER_BG = 'rgba(0, 202, 245, 0.08)';
const SELECTED_BG = 'rgba(0, 202, 245, 0.13)';
const SELECTED_BORDER = '#00CAF5';
const DEFAULT_BORDER = 'rgba(106, 120, 160, 0.85)';

function SettingRow({ onPress, last, selected, children }: { onPress?: () => void; last?: boolean; selected?: boolean; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: 8, overflow: 'hidden', borderWidth: selected ? 1.5 : 1, borderColor: selected ? SELECTED_BORDER : DEFAULT_BORDER, marginBottom: last ? 0 : 8 }}
    >
      {({ hovered }: any) => (
        <>
          <LinearGradient
            colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
            start={{ x: 1.0, y: 0.2 }}
            end={{ x: 0.5, y: 1.25 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {(hovered || selected) && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: selected ? SELECTED_BG : HOVER_BG }} pointerEvents="none" />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 }}>
            {children}
          </View>
        </>
      )}
    </Pressable>
  );
}

type ListeningMode = 'High Quality' | 'Data Saver' | 'Wi-Fi Only';

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [listeningMode, setListeningMode] = useState<ListeningMode>('High Quality');
  const [shuffleMode, setShuffleMode] = useState(true);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [autoLike, setAutoLike] = useState(true);
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <ScrollView className="flex-1">
      <View className="px-5 pt-4 pb-8">
        {/* Listening Modes Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Listening Modes</Text>

          {(
            [
              { key: 'High Quality', icon: 'headset-outline', desc: 'Best audio experience' },
              { key: 'Data Saver',   icon: 'cellular-outline', desc: 'Lower quality, less data' },
              { key: 'Wi-Fi Only',  icon: 'wifi',             desc: 'Stream only on Wi-Fi' },
            ] as { key: ListeningMode; icon: any; desc: string }[]
          ).map(({ key, icon, desc }, i, arr) => {
            const isSelected = listeningMode === key;
            return (
              <SettingRow
                key={key}
                last={i === arr.length - 1}
                selected={isSelected}
                onPress={() => setListeningMode(key)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={icon} size={20} color={isSelected ? '#00CAF5' : '#F8FAFC'} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: isSelected ? '#00CAF5' : '#F8FAFC', fontWeight: '500' }}>{key}</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{desc}</Text>
                  </View>
                </View>
                {isSelected && <Ionicons name="checkmark" size={20} color="#00CAF5" />}
              </SettingRow>
            );
          })}
        </View>

        {/* Discovery Defaults Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Discovery Defaults</Text>

          <SettingRow onPress={() => setShuffleMode(v => !v)}>
            <View className="flex-row items-center">
              <Ionicons name="shuffle" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Shuffle Mode</Text>
                <Text className="text-xs text-[#94A3B8]">Play songs randomly</Text>
              </View>
            </View>
            <Switch value={shuffleMode} onValueChange={setShuffleMode} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </SettingRow>

          <SettingRow onPress={() => setAutoRepeat(v => !v)}>
            <View className="flex-row items-center">
              <Ionicons name="repeat" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Auto-Repeat</Text>
                <Text className="text-xs text-[#94A3B8]">Repeat playlist when finished</Text>
              </View>
            </View>
            <Switch value={autoRepeat} onValueChange={setAutoRepeat} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </SettingRow>

          <SettingRow last onPress={() => setAutoLike(v => !v)}>
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Auto-Like</Text>
                <Text className="text-xs text-[#94A3B8]">Like songs you play often</Text>
              </View>
            </View>
            <Switch value={autoLike} onValueChange={setAutoLike} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </SettingRow>
        </View>

        {/* Ad Preferences Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Ad Preferences</Text>

          <SettingRow>
            <View className="flex-row items-center">
              <Ionicons name="notifications-off-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Personalized Ads</Text>
                <Text className="text-xs text-[#94A3B8]">Allow ads based on your interests</Text>
              </View>
            </View>
            <Switch value={false} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </SettingRow>

          <SettingRow last>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Ad Frequency</Text>
                <Text className="text-xs text-[#94A3B8]">Limit ads per hour</Text>
              </View>
            </View>
            <Text className="text-[#F8FAFC] text-sm">3/hour</Text>
          </SettingRow>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Account</Text>

          <SettingRow>
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Profile</Text>
                <Text className="text-xs text-[#94A3B8]">Update your profile information</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>

          <SettingRow>
            <View className="flex-row items-center">
              <Ionicons name="key-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Password</Text>
                <Text className="text-xs text-[#94A3B8]">Change your password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>

          <SettingRow>
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Subscription</Text>
                <Text className="text-xs text-[#94A3B8]">Manage your subscription</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>

          <SettingRow last onPress={() => navigation.navigate('GettingStarted')}>
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <View className="ml-3">
                <Text className="text-[#EF4444] font-medium">Sign Out</Text>
                <Text className="text-xs text-[#94A3B8]">Sign out of your account</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>
        </View>

        {/* Import Playlists Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Import Playlists</Text>

          <SettingRow>
            <View className="flex-row items-center">
              <Ionicons name="cloud-upload-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From Spotify</Text>
                <Text className="text-xs text-[#94A3B8]">Import playlists from Spotify</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>

          <SettingRow>
            <View className="flex-row items-center">
              <Ionicons name="musical-notes-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From Apple Music</Text>
                <Text className="text-xs text-[#94A3B8]">Import playlists from Apple Music</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>

          <SettingRow>
            <View className="flex-row items-center">
              <Ionicons name="logo-youtube" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From YouTube Music</Text>
                <Text className="text-xs text-[#94A3B8]">Import playlists from YouTube Music</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>

          <SettingRow last>
            <View className="flex-row items-center">
              <Ionicons name="folder-open-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From File</Text>
                <Text className="text-xs text-[#94A3B8]">Import from local files</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </SettingRow>
        </View>
      </View>
    </ScrollView>
    </View>
  );
}