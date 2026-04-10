import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types';

type ExploreScreenProps = NativeStackScreenProps<MainStackParamList, 'Explore'>;

export function ExploreScreen({}: ExploreScreenProps) {
  return (
    <View className="flex-1 bg-[#0B1220] px-5 pt-4">
      <Text className="text-sm font-semibold text-[#94A3B8] mb-2">
        Local Artists
      </Text>

      <View className="mb-6">
        <View className="flex-row justify-between">
          <View className="flex-1 rounded-2xl border border-[#334155] bg-[#1E293B] p-4 mr-2 items-center">
            <Ionicons name="disc-outline" size={32} color="#F8FAFC" />
            <Text className="text-sm font-semibold text-[#F8FAFC] mt-2 text-center">
              Los Vientos
            </Text>
            <Text className="text-xs text-[#94A3B8] text-center">
              Indie Rock
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-[#334155] bg-[#1E293B] p-4 mx-2 items-center">
            <Ionicons name="disc-outline" size={32} color="#F8FAFC" />
            <Text className="text-sm font-semibold text-[#F8FAFC] mt-2 text-center">
              Alma Vega
            </Text>
            <Text className="text-xs text-[#94A3B8] text-center">
              Dream Pop
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-[#334155] bg-[#1E293B] p-4 ml-2 items-center">
            <Ionicons name="disc-outline" size={32} color="#F8FAFC" />
            <Text className="text-sm font-semibold text-[#F8FAFC] mt-2 text-center">
              DJ Marina
            </Text>
            <Text className="text-xs text-[#94A3B8] text-center">
              Electronic
            </Text>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="musical-notes-outline" size={12} color="#94A3B8" />
          <Text className="text-sm font-semibold text-[#94A3B8] ml-2">
            Featured Songs
          </Text>
        </View>

        <View className="rounded-2xl border border-[#334155] bg-[#1E293B] overflow-hidden">
          <View className="p-4 border-b border-[#334155] flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#334155] items-center justify-center mr-3">
              <Ionicons name="musical-note" size={16} color="#F8FAFC" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-[#F8FAFC]">
                Sunset Boulevard
              </Text>
              <Text className="text-xs text-[#94A3B8] mt-1">
                The Comet Trails
              </Text>
            </View>
          </View>

          <View className="p-4 flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#334155] items-center justify-center mr-3">
              <Ionicons name="musical-note" size={16} color="#F8FAFC" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-[#F8FAFC]">
                Radio Heart
              </Text>
              <Text className="text-xs text-[#94A3B8] mt-1">
                Los Vientos
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
          <Text className="text-sm font-semibold text-[#94A3B8] ml-2">
            Community Events
          </Text>
        </View>

        <View className="rounded-2xl border border-[#334155] bg-[#1E293B] overflow-hidden">
          <View className="p-4 border-b border-[#334155] flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#334155] items-center justify-center mr-3">
              <Ionicons name="location" size={16} color="#F8FAFC" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-[#F8FAFC]">
                BANDTANGO Live
              </Text>
              <Text className="text-xs text-[#94A3B8] mt-1">
                House of Rock
              </Text>
            </View>
          </View>

          <View className="p-4 border-b border-[#334155] flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#334155] items-center justify-center mr-3">
              <Ionicons name="location" size={16} color="#F8FAFC" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-[#F8FAFC]">
                CC Music Fest
              </Text>
              <Text className="text-xs text-[#94A3B8] mt-1">
                Cole Park
              </Text>
            </View>
          </View>

          <View className="p-4 flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#334155] items-center justify-center mr-3">
              <Ionicons name="location" size={16} color="#F8FAFC" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-[#F8FAFC]">
                Open Mic Night
              </Text>
              <Text className="text-xs text-[#94A3B8] mt-1">
                Brewster Street
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}