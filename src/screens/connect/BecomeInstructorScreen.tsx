import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextField, SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { COUNTRIES } from '../../data/countries';
import { submitInstructorApplication } from '../../lib/submissions';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, spacing, typography } from '../../theme/theme';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;

// Same 8 disciplines listed in modelconnect.html's #instructorForm specialization <select>.
const SPECIALIZATIONS = [
  'Catwalk Training',
  'Runway Coaching',
  'Pageantry Training',
  'Posing Classes',
  'Grooming & Etiquette',
  'Confidence Building',
  'Kids Modeling',
  'Portfolio & Personal Branding',
];

export default function BecomeInstructorScreen() {
  const navigation = useNavigation<Nav>();
  const { session, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [socials, setSocials] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email';
    if (!country) e.country = 'Select a country';
    if (!location.trim()) e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitInstructorApplication({
        uid: session!.uid,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        country,
        location: location.trim(),
        experience_years: experience.trim() ? Number(experience.trim()) : null,
        specialization,
        socials: socials.trim() || null,
      });
      Alert.alert('Application sent', "We'll review your profile and get in touch.", [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <Screen>
        <Card style={styles.gateCard}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
          <Text style={styles.gateTitle}>Sign in to apply</Text>
          <Text style={styles.gateText}>
            We link your instructor application to your account so that once approved, you get your own
            dashboard for bookings, pricing and availability — sign in or create an account first.
          </Text>
          <Button
            label="Sign In / Create Account"
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({ name: 'ProfileTab', params: { screen: 'Login' } })
              )
            }
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.intro}>
        Apply to join L&amp;C Model Connect. We'll review your application and get in touch.
      </Text>
      <TextField
        label="Full Name"
        required
        value={fullName}
        onChangeText={setFullName}
        error={errors.fullName}
        placeholder="Jane Doe"
      />
      <TextField
        label="Phone Number"
        required
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        placeholder="e.g. 0712 345 678"
        keyboardType="phone-pad"
      />
      <TextField
        label="Email Address"
        required
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <SelectField
        label="Country"
        required
        value={country}
        onChange={setCountry}
        options={COUNTRIES}
        placeholder="Select your country"
        error={errors.country}
      />
      <TextField
        label="Location / County / City"
        required
        value={location}
        onChangeText={setLocation}
        error={errors.location}
        placeholder="e.g. Nairobi"
      />
      <TextField
        label="Years of Experience"
        value={experience}
        onChangeText={setExperience}
        placeholder="Optional"
        keyboardType="number-pad"
      />
      <SelectField label="Specialization" value={specialization} onChange={setSpecialization} options={SPECIALIZATIONS} />
      <TextField
        label="Social Media Links"
        value={socials}
        onChangeText={setSocials}
        placeholder="Instagram, TikTok, etc. (optional)"
      />
      <View style={{ height: spacing.sm }} />
      <Button label="Submit Application" onPress={handleSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
  gateCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  gateTitle: { ...typography.dialogTitle },
  gateText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
