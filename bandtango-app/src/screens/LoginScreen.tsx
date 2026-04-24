import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View, Pressable, TextInput, Alert, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { useAuth, OAuthProvider } from '../state/AuthContext';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    // TODO: POST credentials to /api/auth/login, receive session token,
    // then call signIn('google') or a dedicated credential signIn method.
    Alert.alert('Coming Soon', 'Email/password login is not yet connected.');
  };

  const handleSocialLogin = (provider: OAuthProvider) => {
    // Redirects browser to the backend OAuth entry point.
    // On return the AuthContext will pick up the ?session= token automatically.
    signIn(provider);
  };

  return (
    <View className="flex-1 pt-12">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>
      <View className="px-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-[#F8FAFC] mb-2">Sign In</Text>
        </View>

        {/* Login Form */}
        <View className="mb-6">
          <View className="mb-4">
            <Text className="text-[#F8FAFC] mb-2 font-medium">Email</Text>
            <TextInput
              className="bg-[#1E293B] text-[#F8FAFC] px-4 py-3 rounded-lg"
              placeholder="Enter your email"
              placeholderTextColor="#64748B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="mb-6">
            <Text className="text-[#F8FAFC] mb-2 font-medium">Password</Text>
            <TextInput
              className="bg-[#1E293B] text-[#F8FAFC] px-4 py-3 rounded-lg"
              placeholder="Enter your password"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable
            className="w-full bg-[#3B82F6] py-2 rounded-lg items-center mb-4"
            onPress={handleLogin}
          >
            <Text className="text-[#F8FAFC] font-semibold text-lg">Sign In</Text>
          </Pressable>

          <Pressable className="items-center">
            <Text className="text-[#3B82F6] text-sm">Forgot Password?</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-[#334155]" />
          <Text className="mx-4 text-[#64748B] text-sm">or continue with</Text>
          <View className="flex-1 h-px bg-[#334155]" />
        </View>

        {/* Social Login Buttons */}
        <View className="mb-8">
          <View className="flex-row justify-between">
            <Pressable
              className="flex-1 flex-row items-center justify-center bg-[#DC2626] py-3 rounded-lg mr-2"
              onPress={() => handleSocialLogin('google')}
            >
              <Ionicons name="logo-google" size={20} color="#F8FAFC" />
              <Text className="ml-2 text-[#F8FAFC] font-medium text-sm">Google</Text>
            </Pressable>

            <Pressable
              className="flex-1 flex-row items-center justify-center bg-[#1877F2] py-3 rounded-lg mx-1"
              onPress={() => handleSocialLogin('facebook')}
            >
              <Ionicons name="logo-facebook" size={20} color="#F8FAFC" />
              <Text className="ml-2 text-[#F8FAFC] font-medium text-sm">Facebook</Text>
            </Pressable>

            <Pressable
              className="flex-1 flex-row items-center justify-center bg-[#E4405F] py-3 rounded-lg ml-2"
              onPress={() => handleSocialLogin('instagram')}
            >
              <Ionicons name="logo-instagram" size={20} color="#F8FAFC" />
              <Text className="ml-2 text-[#F8FAFC] font-medium text-sm">Instagram</Text>
            </Pressable>
          </View>
        </View>

        {/* Get Started Link */}
        <View className="items-center">
          <Text className="text-[#64748B] text-sm">
            New here?{' '}
            <Text
              className="text-[#3B82F6]"
              onPress={() => navigation.navigate('GettingStarted')}
            >
              Get Started
            </Text>
          </Text>
        </View>
        <View className="items-center mt-3">
          <Text className="text-[#64748B] text-sm">
            Don't have an account?{' '}
            <Text
              className="text-[#3B82F6]"
              onPress={() => navigation.navigate('CreateAccount')}
            >
              Create Account
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}