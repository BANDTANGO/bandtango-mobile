import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, Text, View, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  return (
    <ScrollView className="flex-1 bg-[#0B1220]">
      <View className="px-5 pt-4 pb-8">
        {/* Listening Modes Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Listening Modes</Text>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#1E293B] p-4">
            <View className="flex-row items-center">
              <Ionicons name="headset-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">High Quality</Text>
                <Text className="text-xs text-[#94A3B8]">Best audio experience</Text>
              </View>
            </View>
            <Ionicons name="checkmark" size={20} color="#3B82F6" />
          </Pressable>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="cellular-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Data Saver</Text>
                <Text className="text-xs text-[#94A3B8]">Lower quality, less data</Text>
              </View>
            </View>
          </Pressable>

          <Pressable className="flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="wifi" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Wi-Fi Only</Text>
                <Text className="text-xs text-[#94A3B8]">Stream only on Wi-Fi</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Discovery Defaults Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Discovery Defaults</Text>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="shuffle" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Shuffle Mode</Text>
                <Text className="text-xs text-[#94A3B8]">Play songs randomly</Text>
              </View>
            </View>
            <Switch value={true} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </Pressable>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="repeat" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Auto-Repeat</Text>
                <Text className="text-xs text-[#94A3B8]">Repeat playlist when finished</Text>
              </View>
            </View>
            <Switch value={false} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </Pressable>

          <Pressable className="flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Auto-Like</Text>
                <Text className="text-xs text-[#94A3B8]">Like songs you play often</Text>
              </View>
            </View>
            <Switch value={true} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </Pressable>
        </View>

        {/* Ad Preferences Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Ad Preferences</Text>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="notifications-off-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Personalized Ads</Text>
                <Text className="text-xs text-[#94A3B8]">Allow ads based on your interests</Text>
              </View>
            </View>
            <Switch value={false} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </Pressable>

          <Pressable className="flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Ad Frequency</Text>
                <Text className="text-xs text-[#94A3B8]">Limit ads per hour</Text>
              </View>
            </View>
            <Text className="text-[#F8FAFC] text-sm">3/hour</Text>
          </Pressable>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Account</Text>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Profile</Text>
                <Text className="text-xs text-[#94A3B8]">Update your profile information</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="key-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Password</Text>
                <Text className="text-xs text-[#94A3B8]">Change your password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">Subscription</Text>
                <Text className="text-xs text-[#94A3B8]">Manage your subscription</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4"
            onPress={() => navigation.navigate('GettingStarted')}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <View className="ml-3">
                <Text className="text-[#EF4444] font-medium">Sign Out</Text>
                <Text className="text-xs text-[#94A3B8]">Sign out of your account</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Import Playlists Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-[#F8FAFC]">Import Playlists</Text>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="cloud-upload-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From Spotify</Text>
                <Text className="text-xs text-[#94A3B8]">Import playlists from Spotify</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="musical-notes-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From Apple Music</Text>
                <Text className="text-xs text-[#94A3B8]">Import playlists from Apple Music</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          <Pressable className="mb-2 flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="logo-youtube" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From YouTube Music</Text>
                <Text className="text-xs text-[#94A3B8]">Import playlists from YouTube Music</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-4">
            <View className="flex-row items-center">
              <Ionicons name="folder-open-outline" size={20} color="#F8FAFC" />
              <View className="ml-3">
                <Text className="text-[#F8FAFC] font-medium">From File</Text>
                <Text className="text-xs text-[#94A3B8]">Import from local files</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}