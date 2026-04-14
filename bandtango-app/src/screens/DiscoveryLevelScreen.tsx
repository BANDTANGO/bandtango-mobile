import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';

const moods = ['Smooth', 'Thoughtful', 'Energetic', 'Chill'] as const;

export function DiscoveryLevelScreen() {
  const [discoveryPercent, setDiscoveryPercent] = useState(60);
  const [selectedMood, setSelectedMood] = useState<(typeof moods)[number]>('Smooth');

  return (
    <View className="flex-1 px-5 pt-6">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <Text className="text-sm text-[#94A3B8]">
        How adventurous should your music discovery be?
      </Text>

      <View className="mt-2 items-center rounded-2xl border border-[#334155] bg-[#111827] px-4 py-6">
        <Text className="text-6xl font-bold text-[#00CAF5]">{discoveryPercent}%</Text>
        <Text className="mt-2 text-xs tracking-[2px] text-[#94A3B8]">DISCOVERY</Text>

        <View className="mt-7 w-full">
          <Slider
            value={discoveryPercent}
            minimumValue={0}
            maximumValue={100}
            step={1}
            minimumTrackTintColor="#00CAF5"
            maximumTrackTintColor="#334155"
            thumbTintColor="#00CAF5"
            onValueChange={setDiscoveryPercent}
          />

          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-[#E2E8F0]">{discoveryPercent}%</Text>
            <Text className="text-sm font-semibold text-[#E2E8F0]">Discovery</Text>
          </View>

          <View className="mt-6 border-t border-[#334155]" />

          <Text className="mt-5 mb-3 text-sm font-semibold text-[#E2E8F0]">Select Mood</Text>

          <View className="flex-row flex-wrap gap-2">
            {moods.map((mood) => {
              const isSelected = mood === selectedMood;

              return (
                <Pressable
                  key={mood}
                  className={`rounded-full border px-4 py-2 ${
                    isSelected
                      ? 'border-[#00CAF5] bg-[#00CAF5]/20'
                      : 'border-[#334155] bg-[#0B1220]'
                  }`}
                  onPress={() => setSelectedMood(mood)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? 'text-[#00CAF5]' : 'text-[#E2E8F0]'
                    }`}
                  >
                    {mood}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable className="mt-5 items-center rounded-xl bg-[#00CAF5] py-3">
            <Text className="text-sm font-bold text-[#0B1220]">Set Discovery</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
