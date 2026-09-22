import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { TextField, SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { COUNTRIES } from '../../data/countries';
import { submitInstructorBooking } from '../../lib/submissions';
import { colors, fonts, spacing } from '../../theme/theme';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;

// Same 8 disciplines listed in modelconnect.html's #bookingForm training <select>.
const TRAINING_TYPES = [
  'Catwalk Training',
  'Runway Coaching',
  'Pageantry Training',
  'Posing Classes',
  'Grooming & Etiquette',
  'Confidence Building',
  'Kids Modeling',
  'Portfolio & Personal Branding',
];

const METHODS = ['Online', 'Home Coaching', 'Estate Coaching', 'Studio / Venue Coaching'];

export default function BookTrainingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<ConnectStackParamList, 'BookTraining'>>();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [training, setTraining] = useState(TRAINING_TYPES[0]);
  const [instructorName, setInstructorName] = useState(route.params?.instructorName ?? '');
  const [method, setMethod] = useState(METHODS[0]);
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
      await submitInstructorBooking({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        country,
        location: location.trim(),
        training,
        instructor_name: instructorName.trim() || null,
        method,
      });
      Alert.alert('Request sent', "We'll match you with an instructor and reach out shortly.", [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.intro}>Tell us what you'd like to learn and we'll match you with an instructor.</Text>
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
        label="Location"
        required
        value={location}
        onChangeText={setLocation}
        error={errors.location}
        placeholder="e.g. Nairobi"
      />
      <SelectField label="Type of Training Required" value={training} onChange={setTraining} options={TRAINING_TYPES} />
      <TextField
        label="Preferred Instructor"
        value={instructorName}
        onChangeText={setInstructorName}
        placeholder="Optional"
      />
      <SelectField label="Preferred Training Method" value={method} onChange={setMethod} options={METHODS} />
      <View style={{ height: spacing.sm }} />
      <Button label="Send Booking Request" onPress={handleSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
});
