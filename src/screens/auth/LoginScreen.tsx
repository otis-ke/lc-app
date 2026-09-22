import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('ProfileMain');
  }

  async function handleForgotPassword() {
    setError(null);
    setResetMessage(null);
    if (!email.trim()) {
      setError('Enter your email above first, then tap "Forgot password?".');
      return;
    }
    setResetLoading(true);
    const { error: resetError } = await resetPassword(email.trim());
    setResetLoading(false);
    setResetMessage(
      resetError ?? `Password reset email sent to ${email.trim()}. Check your inbox.`
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to manage your L&C Modeling Academy account.</Text>

      <Card style={styles.card}>
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
        <TextField
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />
        <View style={styles.utilityRow}>
          <Pressable style={styles.eyeToggle} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textMuted} />
            <Text style={styles.eyeToggleText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
          </Pressable>
          <Pressable onPress={handleForgotPassword} hitSlop={8} disabled={resetLoading}>
            <Text style={styles.forgotLink}>{resetLoading ? 'Sending...' : 'Forgot password?'}</Text>
          </Pressable>
        </View>

        {resetMessage ? <Text style={styles.resetMessage}>{resetMessage}</Text> : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.dangerDark} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button label="Sign In" onPress={handleSignIn} loading={loading} style={{ marginTop: spacing.sm }} />
      </Card>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: 6 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  card: { gap: 0 },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -8,
    marginBottom: spacing.sm,
  },
  eyeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyeToggleText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted },
  forgotLink: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.primary },
  resetMessage: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.sm },
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
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  footerLink: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
});
