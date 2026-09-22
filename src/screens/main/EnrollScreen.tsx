import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { SectionTitle } from '../../components/Card';
import { TextField, SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { submitEnrollment } from '../../lib/submissions';
import { COUNTRIES } from '../../data/countries';
import { spacing } from '../../theme/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type EnrollRoute = RouteProp<HomeStackParamList, 'Enroll'>;

// Matches the <select id="course"> options in programs.html / register.html,
// plus "Home Coaching" which homecoaching.html routes into the same form.
const COURSE_OPTIONS = [
  '6-Week Professional Modeling Program',
  'L&C Models Workshop Program',
  'Pageantry Program',
  'Runway Modeling',
  'Commercial Modeling',
  'Etiquette Classes',
  'Home Coaching',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

interface FormState {
  fullName: string;
  email: string;
  telephone: string;
  nationality: string;
  county: string;
  age: string;
  gender: string;
  idNumber: string;
  course: string;
  startDate: string;
}

function initialState(course?: string): FormState {
  return {
    fullName: '',
    email: '',
    telephone: '',
    nationality: '',
    county: '',
    age: '',
    gender: '',
    idNumber: '',
    course: course ?? '',
    startDate: '',
  };
}

export default function EnrollScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<EnrollRoute>();
  const [form, setForm] = useState<FormState>(() => initialState(route.params?.course));
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
    if (!form.age.trim()) next.age = 'Age is required';
    else if (Number.isNaN(Number(form.age))) next.age = 'Age must be a number';
    if (!form.gender) next.gender = 'Select a gender';
    if (!form.idNumber.trim()) next.idNumber = 'ID/Passport number is required';
    if (!form.course) next.course = 'Select a course';
    if (!form.startDate.trim()) next.startDate = 'Start date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitEnrollment({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        nationality: form.nationality,
        county: form.county.trim(),
        age: Number(form.age),
        gender: form.gender,
        id_number: form.idNumber.trim(),
        course: form.course,
        start_date: form.startDate.trim(),
      });
      setForm(initialState());
      Alert.alert('Application received', "Thanks for applying — we'll be in touch soon.", [
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
      <SectionTitle title="Enroll Now" subtitle="Please provide these details to apply for a program." />

      <TextField
        label="Full Name"
        required
        error={errors.fullName}
        value={form.fullName}
        onChangeText={(v) => set('fullName', v)}
        placeholder="Jane Wanjiru"
      />
      <TextField
        label="Email Address"
        required
        error={errors.email}
        value={form.email}
        onChangeText={(v) => set('email', v)}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Telephone No"
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
        label="County/Province of Residence"
        required
        error={errors.county}
        value={form.county}
        onChangeText={(v) => set('county', v)}
        placeholder="Nairobi"
      />
      <TextField
        label="Age"
        required
        error={errors.age}
        value={form.age}
        onChangeText={(v) => set('age', v)}
        placeholder="18"
        keyboardType="number-pad"
      />
      <SelectField
        label="Gender"
        required
        error={errors.gender}
        value={form.gender}
        options={GENDER_OPTIONS}
        placeholder="Select gender"
        onChange={(v) => set('gender', v)}
      />
      <TextField
        label="ID/Passport Number"
        required
        error={errors.idNumber}
        value={form.idNumber}
        onChangeText={(v) => set('idNumber', v)}
        placeholder="12345678"
      />
      <SelectField
        label="Course Application"
        required
        error={errors.course}
        value={form.course}
        options={COURSE_OPTIONS}
        placeholder="Select a program"
        onChange={(v) => set('course', v)}
      />
      <TextField
        label="Starting Date"
        required
        error={errors.startDate}
        value={form.startDate}
        onChangeText={(v) => set('startDate', v)}
        placeholder="YYYY-MM-DD"
      />

      <Button
        label="Submit Application"
        variant="gold"
        loading={submitting}
        onPress={handleSubmit}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}
