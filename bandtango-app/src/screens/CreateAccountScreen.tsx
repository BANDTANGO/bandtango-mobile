import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { useAuth, OAuthProvider } from '../state/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const { signIn, signInAsGuest } = useAuth();

  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const handleCreate = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Your passwords don\'t match.');
      return;
    }
    // TODO: POST to /api/auth/register then navigate into onboarding
    Alert.alert('Coming Soon', 'Account creation is not yet connected.');
  };

  const handleSocial = (provider: OAuthProvider) => signIn(provider);

  return (
    <View className="flex-1">
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-[#F8FAFC] mb-1">Create Account</Text>
          <Text className="text-[#94A3B8] text-sm">Join Bandtango and start discovering music.</Text>
        </View>

        {/* Form */}
        <View className="mb-6">
          {/* Email */}
          <View className="mb-4">
            <Text className="text-[#F8FAFC] mb-2 font-medium">Email</Text>
            <TextInput
              className="bg-[#1E293B] text-[#F8FAFC] px-4 py-3 rounded-lg"
              placeholder="Enter your email"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-[#F8FAFC] mb-2 font-medium">Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                className="bg-[#1E293B] text-[#F8FAFC] px-4 py-3 rounded-lg"
                style={{ paddingRight: 48 }}
                placeholder="Create a password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
              </Pressable>
            </View>
          </View>

          {/* Confirm password */}
          <View className="mb-6">
            <Text className="text-[#F8FAFC] mb-2 font-medium">Confirm Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                className="bg-[#1E293B] text-[#F8FAFC] px-4 py-3 rounded-lg"
                style={{ paddingRight: 48 }}
                placeholder="Repeat your password"
                placeholderTextColor="#64748B"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowConfirm((v) => !v)}
                style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
              >
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
              </Pressable>
            </View>
          </View>

          <Pressable
            className="w-full bg-[#3B82F6] py-2 rounded-lg items-center mb-4"
            onPress={handleCreate}
          >
            <Text className="text-[#F8FAFC] font-semibold text-lg">Create Account</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-[#334155]" />
          <Text className="mx-4 text-[#64748B] text-sm">or connect with</Text>
          <View className="flex-1 h-px bg-[#334155]" />
        </View>

        {/* Social buttons */}
        <View className="mb-8">
          <View className="flex-row justify-between">
            <Pressable
              className="flex-1 flex-row items-center justify-center bg-[#DC2626] py-3 rounded-lg mr-2"
              onPress={() => handleSocial('google')}
            >
              <Ionicons name="logo-google" size={20} color="#F8FAFC" />
              <Text className="ml-2 text-[#F8FAFC] font-medium text-sm">Google</Text>
            </Pressable>

            <Pressable
              className="flex-1 flex-row items-center justify-center bg-[#1877F2] py-3 rounded-lg mx-1"
              onPress={() => handleSocial('facebook')}
            >
              <Ionicons name="logo-facebook" size={20} color="#F8FAFC" />
              <Text className="ml-2 text-[#F8FAFC] font-medium text-sm">Facebook</Text>
            </Pressable>

            <Pressable
              className="flex-1 flex-row items-center justify-center bg-[#E4405F] py-3 rounded-lg ml-2"
              onPress={() => handleSocial('instagram')}
            >
              <Ionicons name="logo-instagram" size={20} color="#F8FAFC" />
              <Text className="ml-2 text-[#F8FAFC] font-medium text-sm">Instagram</Text>
            </Pressable>
          </View>
        </View>

        {/* Sign in link */}
        <View className="items-center">
          <Text className="text-[#64748B] text-sm">
            Already have an account?{' '}
            <Text className="text-[#3B82F6]" onPress={() => navigation.navigate('Login')}>
              Sign In
            </Text>
          </Text>
        </View>

        {/* Start Listening */}
        <Pressable
          className="w-full items-center rounded-xl mt-6 py-4"
          style={{ backgroundColor: '#00CAF5' }}
          onPress={() => { signInAsGuest(); }}
        >
          <Text style={{ color: '#0B1220', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>Start Listening</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
