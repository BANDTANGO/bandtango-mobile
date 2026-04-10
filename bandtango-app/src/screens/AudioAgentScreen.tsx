import { useState } from 'react';
import { Text, View, Image, TextInput, Pressable } from 'react-native';

const vibes = ['More Chill', 'More Energy', 'Go Deeper', 'Local Picks', 'Surprise Me'] as const;

export function AudioAgentScreen() {
  const [selectedVibe, setSelectedVibe] = useState<(typeof vibes)[number]>('More Chill');
  return (
    <View className="flex-1 bg-[#0B1220] px-5 pt-4">
      <View className="justify-start items-center pt-4">
        <View style={{ width: '100%', height: 256, borderWidth: 1, borderColor: '#334155', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
          <Image source={require('../../assets/bandtango-play-icon.png')} style={{ width: 125, height: 150 }} />
        </View>
      </View>
      <TextInput
        className="mt-2 mb-2 rounded-[10px] border border-[#334155] bg-[#1E293B] px-3 py-2.5 text-[#F8FAFC]"
        multiline
        numberOfLines={4}
        placeholder="Ask the agent..."
        placeholderTextColor="#64748B"
      />
      <View className="mt-2 rounded-2xl border border-[#334155] bg-[#111827] p-2">
        <Text className="mb-2 text-lg font-semibold text-[#F8FAFC]">Current Session</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-[#94A3B8]">Mood</Text>
            <Text className="text-sm text-[#F8FAFC]">Energetic</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-[#94A3B8]">Discovery</Text>
            <Text className="text-sm text-[#F8FAFC]">High</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-[#94A3B8]">Tracks Played</Text>
            <Text className="text-sm text-[#F8FAFC]">12</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-[#94A3B8]">Session Time</Text>
            <Text className="text-sm text-[#F8FAFC]">2h 34m</Text>
          </View>
        </View>
      </View>
      <View className="mt-2 rounded-xl border border-[#334155] bg-[#1E293B] p-2">
        <Text className="mb-2 text-base font-semibold text-[#F8FAFC]">Set the vibe</Text>
        <View className="flex-row flex-wrap gap-2">
          {vibes.map((vibe) => {
            const isSelected = vibe === selectedVibe;

            return (
              <Pressable
                key={vibe}
                className={`rounded-lg border px-3 py-2 ${
                  isSelected
                    ? 'border-[#00CAF5] bg-[#00CAF5]/20'
                    : 'border-[#334155] bg-[#0F172A]'
                }`}
                onPress={() => setSelectedVibe(vibe)}
              >
                <Text
                  className={`text-sm ${
                    isSelected ? 'text-[#00CAF5] font-semibold' : 'text-[#F8FAFC]'
                  }`}
                >
                  {vibe}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
