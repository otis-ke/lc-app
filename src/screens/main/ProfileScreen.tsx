import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { openPrivacyPolicy } from '../../lib/legal';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() ?? '?';
  return '?';
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { session, profile, isAdmin, signOut, deleteAccount } = useAuth();
  // Only mode/toggleMode are used here — every color on this screen stays
  // pinned to the frozen dark default (see Screen.tsx/Card.tsx) since this
  // whole screen sits on those two, which don't move on toggle. The Switch
  // itself still genuinely flips the app's stored preference.
  const { mode, toggleMode } = useTheme();
  const [deleting, setDeleting] = useState(false);

  function handleDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your profile, photos, and account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await deleteAccount();
            setDeleting(false);
            if (error) Alert.alert('Could not delete account', error);
          },
        },
      ]
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Text style={styles.headerTitle}>Account</Text>

      {!session ? (
        <>
          <Card style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.introTitle}>Create your account</Text>
            <Text style={styles.introText}>
              Sign in to track your applications and bookings, revisit your submissions, and get
              the fastest path to a reply from our team.
            </Text>
            <Button label="Sign In" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md }} />
            <Button
              label="Create Account"
              variant="outline"
              onPress={() => navigation.navigate('SignUp')}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </>
      ) : (
        <>
          <Card style={styles.profileCard}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getInitials(profile?.full_name, profile?.email)}</Text>
            </LinearGradient>
            <Text style={styles.name}>{profile?.full_name || 'Member'}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            {isAdmin ? (
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark-outline" size={13} color={colors.goldDark} />
                <Text style={styles.roleBadgeText}>Administrator</Text>
              </View>
            ) : null}
          </Card>

          {isAdmin ? (
            <View style={styles.section}>
              <SectionTitle title="Admin" subtitle="Opens the website's admin panel" />
              <Button
                label="Admin Panel"
                variant="gold"
                onPress={() => navigation.navigate('AdminHome')}
              />
            </View>
          ) : null}
        </>
      )}

      <View style={styles.section}>
        <SectionTitle title="Appearance" subtitle="Dark is the default look — switch anytime" />
        <Card style={styles.themeRow}>
          <View style={styles.themeRowLeft}>
            <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.primary} />
            <View>
              <Text style={styles.themeLabel}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={styles.themeHint}>
                {mode === 'dark' ? 'Easy on the eyes, matches the brand' : 'Bright, high-contrast look'}
              </Text>
            </View>
          </View>
          <Switch
            value={mode === 'light'}
            onValueChange={toggleMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Legal" subtitle="How we handle your information" />
        <Card>
          <Pressable style={styles.legalRow} onPress={openPrivacyPolicy}>
            <View style={styles.themeRowLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.themeLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </Card>
      </View>

      {session ? (
        <View style={styles.section}>
          <Button label="Sign Out" variant="outline" onPress={() => signOut()} />
          <Pressable style={styles.deleteRow} onPress={handleDeleteAccount} disabled={deleting} hitSlop={8}>
            {deleting ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={styles.deleteText}>Delete Account</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>L&C Modeling Academy · v1.0.0</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTitle: { ...typography.pageTitle, marginBottom: spacing.lg },
  introCard: { alignItems: 'center', paddingVertical: spacing.lg },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  introTitle: { ...typography.dialogTitle, marginBottom: 6 },
  introText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  profileCard: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 24, color: '#fff' },
  name: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  email: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.goldLight,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  roleBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.goldDark },
  section: { marginTop: spacing.lg },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  themeLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  themeHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deleteRow: { alignItems: 'center', marginTop: spacing.md, paddingVertical: 4 },
  deleteText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.danger },
  footer: { alignItems: 'center', marginTop: spacing.xl },
  footerText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
});
