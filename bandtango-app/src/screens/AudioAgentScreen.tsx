import { useState } from 'react';
import { Text, View, Image, ImageBackground, TextInput, Pressable, ScrollView } from 'react-native';

const vibes = ['More Chill', 'More Energy', 'Go Deeper', 'Local Picks', 'Surprise Me'] as const;

export function AudioAgentScreen() {
  const [selectedVibe, setSelectedVibe] = useState<(typeof vibes)[number]>('More Chill');
  const [agentFocused, setAgentFocused] = useState(false);
  return (
    <View className="flex-1 px-5 pt-4">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <View className="justify-start items-center pt-4">
        <View style={{ width: '100%', height: 256, borderWidth: 1, borderColor: '#334155', borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#0B1220' }}>
          {/* Ripple circles */}
          {[530, 468, 430, 380, 355, 295, 255, 220, 172, 130, 95, 62, 30].map((size, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 0.8,
                borderColor: `rgba(0, 202, 245, ${0.004 + i * 0.022})`,
                backgroundColor: `rgba(0, 202, 245, ${0.001 + i * 0.005})`,
                transform: [{ translateY: 8 }],
              }}
            />
          ))}
          <Image source={require('../../assets/bandtango-play-icon.png')} style={{ width: 125, height: 150, zIndex: 1 }} />
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <TextInput
        style={{ marginTop: 8, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: agentFocused ? '#00CAF5' : '#334155', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 10, color: '#F8FAFC', minHeight: 80, textAlignVertical: 'top', outline: 'none' } as any}
        multiline
        numberOfLines={4}
        placeholder="Ask the agent..."
        placeholderTextColor="#64748B"
        selectionColor="#00CAF5"
        cursorColor="#00CAF5"
        underlineColorAndroid="transparent"
        onFocus={() => setAgentFocused(true)}
        onBlur={() => setAgentFocused(false)}
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
      </ScrollView>
    </View>
  );
}
