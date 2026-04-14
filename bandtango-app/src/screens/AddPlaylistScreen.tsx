import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types';

type AddPlaylistScreenProps = NativeStackScreenProps<MainStackParamList, 'AddPlaylist'> & {
  onCreatePlaylist: (payload: { name: string; description: string; url?: string }) => void;
};

const GENRE_TAGS = ['Rock', 'Hip-Hop', 'Jazz', 'Electronic', 'R&B', 'Pop', 'Country', 'Classical', 'Indie', 'Metal'];
const MOOD_TAGS  = ['Chill', 'Hype', 'Focus', 'Workout', 'Sad', 'Happy', 'Late Night', 'Morning'];

export function AddPlaylistScreen({ navigation, onCreatePlaylist }: AddPlaylistScreenProps) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl]                 = useState('');
  const [selectedGenres, setGenres]   = useState<string[]>([]);
  const [selectedMoods, setMoods]     = useState<string[]>([]);
  const [isPublic, setIsPublic]       = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [urlFocused, setUrlFocused]   = useState(false);
  const [error, setError]             = useState('');

  const toggleTag = (list: string[], setList: (v: string[]) => void, tag: string) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Playlist name is required.');
      return;
    }
    onCreatePlaylist({ name: name.trim(), description: description.trim() || 'No description yet', url: url.trim() || undefined });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 18, 32, 0.72)' }} />
      </ImageBackground>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Name */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Playlist Name</Text>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t); if (error) setError(''); }}
          placeholder="e.g. Late Night Set"
          placeholderTextColor="#64748B"
          selectionColor="#F8FAFC"
          cursorColor="#F8FAFC"
          underlineColorAndroid="transparent"
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          style={{
            borderWidth: 1,
            borderColor: nameFocused ? '#F8FAFC' : '#334155',
            borderRadius: 10,
            backgroundColor: '#1E293B',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#F8FAFC',
            fontSize: 15,
            marginBottom: 4,
            outline: 'none',
          } as any}
        />
        {!!error && <Text style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>{error}</Text>}

        {/* Description */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Mood, venue, or rehearsal notes"
          placeholderTextColor="#64748B"
          multiline
          textAlignVertical="top"
          selectionColor="#F8FAFC"
          cursorColor="#F8FAFC"
          underlineColorAndroid="transparent"
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          style={{
            borderWidth: 1,
            borderColor: descFocused ? '#F8FAFC' : '#334155',
            borderRadius: 10,
            backgroundColor: '#1E293B',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#F8FAFC',
            fontSize: 15,
            minHeight: 80,
            marginBottom: 4,
            outline: 'none',
          } as any}
        />

        {/* URL */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 }}>Playlist URL <Text style={{ color: '#475569', fontWeight: '400' }}>(optional)</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: urlFocused ? '#F8FAFC' : '#334155', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          <Ionicons name="link-outline" size={15} color="#64748B" />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            keyboardType="url"
            selectionColor="#F8FAFC"
            cursorColor="#F8FAFC"
            underlineColorAndroid="transparent"
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setUrlFocused(false)}
            style={{ flex: 1, color: '#F8FAFC', fontSize: 14, outline: 'none' } as any}
          />
          {!!url && (
            <Pressable onPress={() => setUrl('')}>
              <Ionicons name="close-circle" size={15} color="#64748B" />
            </Pressable>
          )}
        </View>

        {/* Genre tags */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Genre</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GENRE_TAGS.map((tag) => {
            const on = selectedGenres.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(selectedGenres, setGenres, tag)}
                style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: on ? '#00CAF5' : '#334155' }}
              >
                {on && (
                  <LinearGradient
                    colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
                    start={{ x: 1.0, y: 0.2 }}
                    end={{ x: 0.5, y: 1.25 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                )}
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: on ? 'transparent' : '#0F172A' }}>
                  <Text style={{ color: on ? '#00CAF5' : '#F8FAFC', fontSize: 13, fontWeight: on ? '600' : '400' }}>{tag}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Mood tags */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Mood</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MOOD_TAGS.map((tag) => {
            const on = selectedMoods.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(selectedMoods, setMoods, tag)}
                style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: on ? '#00CAF5' : '#334155' }}
              >
                {on && (
                  <LinearGradient
                    colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
                    start={{ x: 1.0, y: 0.2 }}
                    end={{ x: 0.5, y: 1.25 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                )}
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: on ? 'transparent' : '#0F172A' }}>
                  <Text style={{ color: on ? '#00CAF5' : '#F8FAFC', fontSize: 13, fontWeight: on ? '600' : '400' }}>{tag}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Visibility toggle */}
        <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8 }}>Visibility</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['Private', 'Public'] as const).map((opt) => {
            const on = (opt === 'Public') === isPublic;
            return (
              <Pressable
                key={opt}
                onPress={() => setIsPublic(opt === 'Public')}
                style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: on ? '#00CAF5' : '#334155', flex: 1 }}
              >
                {on && (
                  <LinearGradient
                    colors={['#6a78a0', '#455380', 'rgba(25,29,62,0.12)', '#455380', '#6a78a0']}
                    start={{ x: 1.0, y: 0.2 }}
                    end={{ x: 0.5, y: 1.25 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: on ? 'transparent' : '#0F172A' }}>
                  <Ionicons name={opt === 'Public' ? 'globe-outline' : 'lock-closed-outline'} size={15} color={on ? '#00CAF5' : '#94A3B8'} />
                  <Text style={{ color: on ? '#00CAF5' : '#94A3B8', fontSize: 14, fontWeight: on ? '600' : '400' }}>{opt}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Submit */}
        <Pressable
          onPress={submit}
          style={{ marginTop: 28, borderRadius: 10, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={['#1d4ed8', '#2563eb', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Create Playlist</Text>
          </LinearGradient>
        </Pressable>

      </ScrollView>
    </View>
  );
}
