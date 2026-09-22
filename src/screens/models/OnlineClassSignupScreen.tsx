import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ModelsStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { TextField, SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { submitClassSignup } from '../../lib/submissions';
import { COUNTRIES } from '../../data/countries';
import { spacing } from '../../theme/theme';

type Nav = NativeStackNavigationProp<ModelsStackParamList>;

// Course options from onlineclasses.html's #online-classes-form select.
const COURSE_OPTIONS = [
  'Introduction to Modeling',
  'Advanced Runway Techniques',
  'Commercial Modeling',
  'Portfolio Development',
];

interface FormState {
  fullName: string;
  email: string;
  telephone: string;
  nationality: string;
  county: string;
  preferredCourse: string;
  startDate: string;
}

const initialState: FormState = {
  fullName: '',
  email: '',
  telephone: '',
  nationality: '',
  county: '',
  preferredCourse: '',
  startDate: '',
};

export default function OnlineClassSignupScreen() {
  const navigation = useNavigation<Nav>();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.telephone.trim()) next.telephone = 'Telephone is required';
    if (!form.nationality) next.nationality = 'Select your nationality';
    if (!form.county.trim()) next.county = 'County is required';
    if (!form.preferredCourse) next.preferredCourse = 'Select a course';
    if (!form.startDate.trim()) next.startDate = 'Start date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitClassSignup({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        nationality: form.nationality,
        county: form.county.trim(),
        preferred_course: form.preferredCourse,
        start_date: form.startDate.trim(),
      });
      setForm(initialState);
      Alert.alert('Signed up!', "Thanks for joining our online classes — we'll email you the details.", [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll padded>
      <SectionTitle
        title="Join Our Online Classes"
        subtitle="Can't make it to campus? Sign up and learn from wherever you are."
      />

      <Card>
        <TextField
          label="Full Name"
          required
          error={errors.fullName}
          value={form.fullName}
          onChangeText={(v) => set('fullName', v)}
          placeholder="Jane Wanjiru"
        />
        <TextField
          label="Email"
          required
          error={errors.email}
          value={form.email}
          onChangeText={(v) => set('email', v)}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Telephone"
          required
          error={errors.telephone}
          value={form.telephone}
          onChangeText={(v) => set('telephone', v)}
          placeholder="+254 700 000 000"
          keyboardType="phone-pad"
        />
        <SelectField
          label="Nationality"
          required
          error={errors.nationality}
          value={form.nationality}
          options={COUNTRIES}
          placeholder="Select your country"
          onChange={(v) => set('nationality', v)}
        />
        <TextField
          label="County"
          required
          error={errors.county}
          value={form.county}
          onChangeText={(v) => set('county', v)}
          placeholder="Nairobi"
        />
        <SelectField
          label="Preferred Course"
          required
          error={errors.preferredCourse}
          value={form.preferredCourse}
          options={COURSE_OPTIONS}
          placeholder="Select a course"
          onChange={(v) => set('preferredCourse', v)}
        />
        <TextField
          label="Preferred Start Date"
          required
          error={errors.startDate}
          value={form.startDate}
          onChangeText={(v) => set('startDate', v)}
          placeholder="YYYY-MM-DD"
        />
        <Button
          label="Sign Up"
          variant="primary"
          loading={submitting}
          onPress={handleSubmit}
          style={{ marginTop: spacing.xs }}
        />
      </Card>
    </Screen>
  );
}
