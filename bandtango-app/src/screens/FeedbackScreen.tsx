import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Feedback'>;

const CATEGORIES = ['General Feedback', 'Discovery', 'Agent'] as const;
type Category = (typeof CATEGORIES)[number];

// ── Survey data ───────────────────────────────────────────────────────────────

const Q1_OPTIONS = [
  'Every Day',
  'Every Week',
  'Few times a month',
  'Few times a year',
  'Never',
] as const;

const Q2_OPTIONS = [
  'More accurate recommendations',
  'More Variety',
  'More Familiar Favorites',
  'More control over the mix',
] as const;

const Q3_OPTIONS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often'] as const;

const Q4_OPTIONS = [
  'Very Open',
  'Moderately Open',
  'Slightly Open',
  'Not open at all',
] as const;

const Q5_OPTIONS = ['Only popular songs', 'A few albums', 'Full Discography'] as const;

const Q6_OPTIONS = [
  'I choose every song',
  'I pick a playlist and let it run',
  'I let autoplay / recommendations decide',
] as const;

const Q7_OPTIONS = [
  'Working out',
  'Driving',
  'Studying',
  'Party / Social Settings',
  'Feeling Bored with current music',
  'Looking for new artists',
] as const;

const Q8_OPTIONS = ['Yes', 'No', 'Unsure'] as const;

// ── Agent survey data ─────────────────────────────────────────────────────────

const AQ2_OPTIONS = [
  'Very Helpful',
  'Somewhat Helpful',
  'Neutral',
  'Not Very Helpful',
  'Not Helpful At All',
] as const;

const AQ3_OPTIONS = ['Every song', 'Every few songs', 'Only when asked', 'Other'] as const;

const AQ4_OPTIONS = [
  'Every few songs',
  'Occasionally',
  'Rarely',
  'Only when requested',
] as const;

const AQ5_OPTIONS = [
  'Better recommendation accuracy',
  'Better understanding of mood',
  'Better voice interaction',
  'Not personal enough',
] as const;

const AQ6_OPTIONS = [
  'Interrupting with unnecessary comments',
  'Repeating similar recommendations',
  'Misunderstanding requests',
  'Taking too long to adjust',
] as const;

const AQ7_OPTIONS = ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'] as const;

const AQ8_OPTIONS = [
  'Why this song was selected',
  'Artist or song information',
  'Suggestion for what is coming next',
  'Other',
] as const;

const AQ9_OPTIONS = [
  'Songs skipped',
  'Songs replayed',
  'Favorite Artists',
  'Location of Listening',
  'Time of Listening',
] as const;

const AQ10_OPTIONS = [
  'Faster learning from skips',
  'More accurate song recommendations',
  'Better voice interaction',
  'Smarter introduction of new music',
] as const;

type SingleAnswer<T extends readonly string[]> = T[number] | null;
type MultiAnswer<T extends readonly string[]> = Set<T[number]>;

// ── Sub-components ────────────────────────────────────────────────────────────

function SurveyQuestion({ number, question, hint }: { number: number; question: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
        QUESTION {number}
      </Text>
      <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: hint ? 4 : 0 }}>
        {question}
      </Text>
      {hint ? (
        <Text style={{ color: '#64748B', fontSize: 13 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

function RadioRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? '#00CAF5' : '#334155',
        backgroundColor: selected ? 'rgba(0, 202, 245, 0.12)' : '#111827',
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? '#00CAF5' : '#475569',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {selected && (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#00CAF5' }} />
        )}
      </View>
      <Text style={{ color: selected ? '#F8FAFC' : '#CBD5E1', fontSize: 15, fontWeight: '500', flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function CheckRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? '#00CAF5' : '#334155',
        backgroundColor: selected ? 'rgba(0, 202, 245, 0.12)' : '#111827',
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: selected ? '#00CAF5' : '#475569',
          backgroundColor: selected ? '#00CAF5' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {selected && <Ionicons name="checkmark" size={13} color="#0B1220" />}
      </View>
      <Text style={{ color: selected ? '#F8FAFC' : '#CBD5E1', fontSize: 15, fontWeight: '500', flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FeedbackScreen({ navigation }: Props) {
  const [category, setCategory] = useState<Category>('General Feedback');
  const [message, setMessage]   = useState('');
  const [focused,  setFocused]  = useState(false);
  const [agentMessage, setAgentMessage] = useState('');
  const [agentFocused, setAgentFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Agent survey state
  const [aq1, setAq1] = useState('');
  const [aq1Focused, setAq1Focused] = useState(false);
  const [aq2, setAq2] = useState<SingleAnswer<typeof AQ2_OPTIONS>>(null);
  const [aq3, setAq3] = useState<SingleAnswer<typeof AQ3_OPTIONS>>(null);
  const [aq3Other, setAq3Other] = useState('');
  const [aq3OtherFocused, setAq3OtherFocused] = useState(false);
  const [aq4, setAq4] = useState<SingleAnswer<typeof AQ4_OPTIONS>>(null);
  const [aq5, setAq5] = useState<SingleAnswer<typeof AQ5_OPTIONS>>(null);
  const [aq6, setAq6] = useState<SingleAnswer<typeof AQ6_OPTIONS>>(null);
  const [aq7, setAq7] = useState<SingleAnswer<typeof AQ7_OPTIONS>>(null);
  const [aq8, setAq8] = useState<SingleAnswer<typeof AQ8_OPTIONS>>(null);
  const [aq8Other, setAq8Other] = useState('');
  const [aq8OtherFocused, setAq8OtherFocused] = useState(false);
  const [aq9, setAq9] = useState<MultiAnswer<typeof AQ9_OPTIONS>>(new Set());
  const [aq10, setAq10] = useState<SingleAnswer<typeof AQ10_OPTIONS>>(null);

  const toggleAq9 = (val: (typeof AQ9_OPTIONS)[number]) =>
    setAq9((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });

  const agentSurveyComplete =
    aq1.trim() &&
    aq2 && aq3 &&
    (aq3 !== 'Other' || aq3Other.trim()) &&
    aq4 && aq5 && aq6 && aq7 && aq8 &&
    (aq8 !== 'Other' || aq8Other.trim()) &&
    aq9.size > 0 && aq10;

  // Survey state
  const [q1, setQ1] = useState<SingleAnswer<typeof Q1_OPTIONS>>(null);
  const [q2, setQ2] = useState<SingleAnswer<typeof Q2_OPTIONS>>(null);
  const [q3, setQ3] = useState<SingleAnswer<typeof Q3_OPTIONS>>(null);
  const [q4, setQ4] = useState<SingleAnswer<typeof Q4_OPTIONS>>(null);
  const [q5, setQ5] = useState<SingleAnswer<typeof Q5_OPTIONS>>(null);
  const [q6, setQ6] = useState<SingleAnswer<typeof Q6_OPTIONS>>(null);
  const [q7, setQ7] = useState<MultiAnswer<typeof Q7_OPTIONS>>(new Set());
  const [q8, setQ8] = useState<SingleAnswer<typeof Q8_OPTIONS>>(null);

  const toggleQ7 = (val: (typeof Q7_OPTIONS)[number]) =>
    setQ7((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });

  const surveyComplete = q1 && q2 && q3 && q4 && q5 && q6 && q7.size > 0 && q8;

  const handleSubmit = () => {
    if (category === 'General Feedback' && !message.trim()) return;
    if (category === 'Discovery' && !surveyComplete) return;
    if (category === 'Agent' && !agentSurveyComplete) return;
    // TODO: wire to a real feedback endpoint
    setSubmitted(true);
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {submitted ? (
          <View style={{ alignItems: 'center', marginTop: 60, gap: 16 }}>
            <Ionicons name="checkmark-circle" size={56} color="#00CAF5" />
            <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '700' }}>Thanks for your feedback!</Text>
            <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center' }}>
              We read every submission and use it to improve BandTango.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginTop: 16, backgroundColor: '#00CAF5', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 }}
            >
              <Text style={{ color: '#0B1220', fontWeight: '700', fontSize: 15 }}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Category selector */}
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 14 }}>
              CATEGORY
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={{
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: category === c ? '#00CAF5' : '#334155',
                    backgroundColor: category === c ? 'rgba(0,202,245,0.12)' : '#111827',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                  }}
                >
                  <Text style={{ color: category === c ? '#00CAF5' : '#94A3B8', fontSize: 13, fontWeight: '600' }}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── General Feedback ─────────────────────────────────────── */}
            {category === 'General Feedback' && (
              <>
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 }}>
                  MESSAGE
                </Text>
                <View
                  style={{
                    backgroundColor: '#111827',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: focused ? '#00CAF5' : '#334155',
                    padding: 12,
                    marginBottom: 24,
                  }}
                >
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Tell us what's on your mind…"
                    placeholderTextColor="#475569"
                    multiline
                    numberOfLines={6}
                    autoCapitalize="sentences"
                    selectionColor="#00CAF5"
                    cursorColor="#00CAF5"
                    style={{
                      color: '#F8FAFC',
                      fontSize: 14,
                      minHeight: 120,
                      textAlignVertical: 'top',
                      ...({ outline: 'none' } as object),
                    }}
                  />
                </View>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!message.trim()}
                  style={{
                    backgroundColor: message.trim() ? '#00CAF5' : '#1E293B',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: message.trim() ? '#0B1220' : '#475569', fontWeight: '700', fontSize: 15 }}>
                    Submit Feedback
                  </Text>
                </Pressable>
              </>
            )}

            {/* ── Discovery ───────────────────────────────────────────── */}
            {category === 'Discovery' && (
              <>
                <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                  Discovery
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 28 }}>
                  Help us understand how you discover music.
                </Text>

                {/* Q1 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion
                    number={1}
                    question="How often would you say that you utilize the personalized discovery playlists generated by your preferred streaming platform?"
                  />
                  {Q1_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={q1 === opt} onPress={() => setQ1(opt)} />
                  ))}
                </View>

                {/* Q2 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion
                    number={2}
                    question="What is more important to you when discovering new music?"
                  />
                  {Q2_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={q2 === opt} onPress={() => setQ2(opt)} />
                  ))}
                </View>

                {/* Q3 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion
                    number={3}
                    question="How often do you skip recommended songs because they don't match your taste?"
                  />
                  {Q3_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={q3 === opt} onPress={() => setQ3(opt)} />
                  ))}
                </View>

                {/* Q4 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion
                    number={4}
                    question="How open are you to discovering genres of music outside of your preferences/tastes?"
                  />
                  {Q4_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={q4 === opt} onPress={() => setQ4(opt)} />
                  ))}
                </View>

                {/* Q5 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion
                    number={5}
                    question="How deep do you go into a new (never previously listened to) artist's discography?"
                  />
                  {Q5_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={q5 === opt} onPress={() => setQ5(opt)} />
                  ))}
                </View>

                {/* Q6 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion
                    number={6}
                    question="How do you usually pick what to play next?"
                  />
                  {Q6_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={q6 === opt} onPress={() => setQ6(opt)} />
                  ))}
                </View>

                {/* Q7 — multi-select */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion
                    number={7}
                    question="In what situations would you increase your discovery level?"
                    hint="Select all that apply"
                  />
                  {Q7_OPTIONS.map((opt) => (
                    <CheckRow key={opt} label={opt} selected={q7.has(opt)} onPress={() => toggleQ7(opt)} />
                  ))}
                </View>

                {/* Q8 */}
                <View style={{ marginBottom: 36 }}>
                  <SurveyQuestion
                    number={8}
                    question="Does controlling discovery level manually feel better than relying only on automatic recommendations?"
                  />
                  {Q8_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={q8 === opt} onPress={() => setQ8(opt)} />
                  ))}
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={!surveyComplete}
                  style={{
                    backgroundColor: surveyComplete ? '#00CAF5' : '#1E293B',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: surveyComplete ? '#0B1220' : '#475569', fontWeight: '700', fontSize: 15 }}>
                    Submit Survey
                  </Text>
                </Pressable>
              </>
            )}

            {/* ── Agent ───────────────────────────────────────────────── */}
            {category === 'Agent' && (
              <>
                <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Agent Survey</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 28 }}>Help us improve the Audio Agent experience.</Text>

                {/* AQ1 — free form */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={1} question="What is one thing this AI could do better that would improve your experience?" />
                  <TextInput
                    style={{
                      backgroundColor: '#111827',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: aq1Focused ? '#00CAF5' : '#334155',
                      color: '#F8FAFC',
                      padding: 12,
                      fontSize: 14,
                      minHeight: 90,
                      textAlignVertical: 'top',
                      ...({ outline: 'none' } as object),
                    }}
                    multiline
                    numberOfLines={4}
                    placeholder="Your answer…"
                    placeholderTextColor="#475569"
                    selectionColor="#00CAF5"
                    cursorColor="#00CAF5"
                    underlineColorAndroid="transparent"
                    value={aq1}
                    onChangeText={setAq1}
                    onFocus={() => setAq1Focused(true)}
                    onBlur={() => setAq1Focused(false)}
                  />
                </View>

                {/* AQ2 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={2} question="How helpful is the AI agent when helping you find music?" />
                  {AQ2_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq2 === opt} onPress={() => setAq2(opt)} />
                  ))}
                </View>

                {/* AQ3 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={3} question="How often should the DJ speak between songs?" />
                  {AQ3_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq3 === opt} onPress={() => setAq3(opt)} />
                  ))}
                  {aq3 === 'Other' && (
                    <TextInput
                      style={{
                        backgroundColor: '#111827',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: aq3OtherFocused ? '#00CAF5' : '#334155',
                        color: '#F8FAFC',
                        padding: 10,
                        fontSize: 14,
                        marginTop: 4,
                        ...({ outline: 'none' } as object),
                      }}
                      placeholder="Please specify…"
                      placeholderTextColor="#475569"
                      selectionColor="#00CAF5"
                      cursorColor="#00CAF5"
                      underlineColorAndroid="transparent"
                      value={aq3Other}
                      onChangeText={setAq3Other}
                      onFocus={() => setAq3OtherFocused(true)}
                      onBlur={() => setAq3OtherFocused(false)}
                    />
                  )}
                </View>

                {/* AQ4 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={4} question="How often should the AI introduce songs you have never heard before?" />
                  {AQ4_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq4 === opt} onPress={() => setAq4(opt)} />
                  ))}
                </View>

                {/* AQ5 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={5} question="What should the AI improve first to make you use it more often?" />
                  {AQ5_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq5 === opt} onPress={() => setAq5(opt)} />
                  ))}
                </View>

                {/* AQ6 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={6} question="Which AI behavior feels most annoying during listening?" />
                  {AQ6_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq6 === opt} onPress={() => setAq6(opt)} />
                  ))}
                </View>

                {/* AQ7 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={7} question="When the AI recommends music, how often does it match what you want to hear at that moment?" />
                  {AQ7_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq7 === opt} onPress={() => setAq7(opt)} />
                  ))}
                </View>

                {/* AQ8 */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={8} question="What type of AI comment would be most useful between songs?" />
                  {AQ8_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq8 === opt} onPress={() => setAq8(opt)} />
                  ))}
                  {aq8 === 'Other' && (
                    <TextInput
                      style={{
                        backgroundColor: '#111827',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: aq8OtherFocused ? '#00CAF5' : '#334155',
                        color: '#F8FAFC',
                        padding: 10,
                        fontSize: 14,
                        marginTop: 4,
                        ...({ outline: 'none' } as object),
                      }}
                      placeholder="Please specify…"
                      placeholderTextColor="#475569"
                      selectionColor="#00CAF5"
                      cursorColor="#00CAF5"
                      underlineColorAndroid="transparent"
                      value={aq8Other}
                      onChangeText={setAq8Other}
                      onFocus={() => setAq8OtherFocused(true)}
                      onBlur={() => setAq8OtherFocused(false)}
                    />
                  )}
                </View>

                {/* AQ9 — multi-select */}
                <View style={{ marginBottom: 28 }}>
                  <SurveyQuestion number={9} question="What should the AI learn from most when improving recommendations?" hint="Select all that apply" />
                  {AQ9_OPTIONS.map((opt) => (
                    <CheckRow key={opt} label={opt} selected={aq9.has(opt)} onPress={() => toggleAq9(opt)} />
                  ))}
                </View>

                {/* AQ10 */}
                <View style={{ marginBottom: 36 }}>
                  <SurveyQuestion number={10} question="Which AI feature would make you most likely to keep using this app over other music apps?" />
                  {AQ10_OPTIONS.map((opt) => (
                    <RadioRow key={opt} label={opt} selected={aq10 === opt} onPress={() => setAq10(opt)} />
                  ))}
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={!agentSurveyComplete}
                  style={{
                    backgroundColor: agentSurveyComplete ? '#00CAF5' : '#1E293B',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: agentSurveyComplete ? '#0B1220' : '#475569', fontWeight: '700', fontSize: 15 }}>
                    Submit Survey
                  </Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
