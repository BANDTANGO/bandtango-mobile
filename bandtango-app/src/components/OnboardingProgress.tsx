import { View } from 'react-native';

interface Props {
  step: number;  // 1-based current step
  total: number; // total steps
}

export function OnboardingProgress({ step, total }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: i < step ? '#00CAF5' : '#1E293B',
          }}
        />
      ))}
    </View>
  );
}
