import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View, Pressable, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { OnboardingProgress } from '../components/OnboardingProgress';

type GettingStartedScreenProps = NativeStackScreenProps<RootStackParamList, 'GettingStarted'>;

export function GettingStartedScreen({ navigation }: GettingStartedScreenProps) {
  return (
    <View className="flex-1 pt-1">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <OnboardingProgress step={1} total={3} />
      <View className="flex-1 items-center justify-center">
        <View className="justify-start items-center pt-4">
            <View style={{ width: '100%', height: 256, alignItems: 'center' }}>
            <Image source={require('../../assets/bandtango-play-icon.png')} style={{ width: 125, height: 150 }} />
            </View>
        </View>
        <View className="mb-6">
          <Text className="mt-2 text-3xl font-bold text-[#F8FAFC]">BANDTANGO</Text>
        </View>

        <View className="w-full max-w-sm">

          <Pressable
            className="mb-4 w-full flex-row items-center justify-center rounded-lg border border-[#334155] bg-[#0F172A] p-2"
            onPress={() => navigation.navigate('AboutYou')}
          >
            <Ionicons name="person-add-outline" size={20} color="#F8FAFC" />
            <Text className="ml-2 text-lg font-semibold text-[#F8FAFC]">Get Started</Text>
          </Pressable>

          <Pressable
            className="w-full flex-row items-center justify-center rounded-lg bg-[#3B82F6] p-2"
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in-outline" size={20} color="#F8FAFC" />
            <Text className="ml-2 text-lg font-semibold text-[#F8FAFC]">Sign In</Text>
          </Pressable>

        </View>

        <View className="mt-8">
          <Text className="text-center text-sm text-[#64748B]">
            Continue as guest to explore BANDTANGO
          </Text>
          <Pressable
            className="mt-2"
            onPress={() => navigation.getParent()?.navigate('MainStack')}
          >
            <Text className="text-center text-[#3B82F6] underline">Browse as Guest</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}