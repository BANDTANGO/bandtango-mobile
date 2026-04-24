/**
 * AuthCallbackScreen
 *
 * Pure error UI — rendered by AppContent when the /auth/callback exchange fails.
 * URL parsing and the backend POST are handled inside AuthProvider bootstrap.
 */

import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  /** Called when the user taps "Back to Sign In" — clears the authError flag. */
  onBack: () => void;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AuthCallbackScreen({ onBack }: Props) {

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.centred}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.heading}>We couldn't sign you in</Text>
        <Text style={styles.body}>
          Your session couldn't be verified. Our support team has been
          notified and will reach out to you shortly.
        </Text>
        <Text style={styles.subBody}>
          If this problem persists, please contact us at{' '}
          <Text style={styles.link}>support@bandtangocc.com</Text>
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 18, 32, 0.72)',
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconText: {
    color: '#EF4444',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
  },
  heading: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  subBody: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 40,
  },
  link: {
    color: '#00CAF5',
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backBtnText: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
});
