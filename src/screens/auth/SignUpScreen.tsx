import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextField, RadioGroup } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { openPrivacyPolicy } from '../../lib/legal';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import type { ProfileStackParamList } from '../../navigation/types';
import type { AccountType } from '../../types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

// Labels shown to the user; mapped to the stored AccountType (or null for
// "just browsing", which keeps today's behavior — no dashboard, just leads/forms).
const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType | null }[] = [
  { label: 'Just Browsing', value: null },
  { label: 'Model', value: 'model' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Brand / Client', value: 'brand' },
];

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountTypeLabel, setAccountTypeLabel] = useState(ACCOUNT_TYPE_OPTIONS[0].label);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in every field.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const accountType = ACCOUNT_TYPE_OPTIONS.find((o) => o.label === accountTypeLabel)?.value ?? null;
    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim(), accountType);
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <Screen>
        <Card style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-open-outline" size={28} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Account created!</Text>
          <Text style={styles.successText}>
            Check your email to confirm your account, then sign in to continue.
          </Text>
          <Button label="Go to Sign In" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md }} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Join L&C Modeling Academy to track applications and bookings.</Text>

      <Card>
        <TextField
          label="Full Name"
          placeholder="Jane Doe"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          textContentType="name"
        />
        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <RadioGroup
          label="I am a..."
          value={accountTypeLabel}
          options={ACCOUNT_TYPE_OPTIONS.map((o) => o.label)}
          onChange={setAccountTypeLabel}
        />
        <TextField
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
        />
        <TextField
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
        />
        <Pressable style={styles.eyeToggle} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textMuted} />
          <Text style={styles.eyeToggleText}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
        </Pressable>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.dangerDark} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button label="Sign Up" onPress={handleSignUp} loading={loading} style={{ marginTop: spacing.sm }} />

        <Text style={styles.legalText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.legalLink} onPress={openPrivacyPolicy}>
            Privacy Policy
          </Text>
          .
        </Text>
      </Card>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: 6 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  eyeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  eyeToggleText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fbeaea',
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.sm,
  },
  errorText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.dangerDark, lineHeight: 18 },
  legalText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  legalLink: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  footerLink: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  successCard: { alignItems: 'center', paddingVertical: spacing.xl },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f6ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: { ...typography.dialogTitle, marginBottom: 8 },
  successText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.md },
});
