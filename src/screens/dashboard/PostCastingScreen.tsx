import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { TextField, TextAreaField, SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { createCasting } from '../../lib/castings';
import { spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

const CATEGORIES = [
  'Fashion Show',
  'Photoshoot',
  'Commercial Campaign',
  'Product Modeling',
  'TV / Video Advert',
  'Pageant',
  'Brand Activation',
  'Influencer Campaign',
];

export default function PostCastingScreen() {
  const navigation = useNavigation<Nav>();
  const { session, profile, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [compensation, setCompensation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!location.trim()) e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!session) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createCasting({
        posted_by_uid: session.uid,
        posted_by_name: profile?.full_name ?? profile?.email ?? 'L&C',
        posted_by_type: isAdmin ? 'admin' : 'brand',
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        date: date.trim() || null,
        compensation: compensation.trim() || null,
      });
      Alert.alert('Posted!', 'Your casting is now live for models to apply to.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Post a Casting</Text>
      <Text style={styles.intro}>
        Advertise a modeling opportunity — models will see it on the Castings board and can apply directly.
      </Text>
      <TextField label="Title" required value={title} onChangeText={setTitle} error={errors.title} placeholder="e.g. Runway Models for Nairobi Fashion Week" />
      <SelectField label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
      <TextField label="Location" required value={location} onChangeText={setLocation} error={errors.location} placeholder="e.g. Nairobi" />
      <TextField label="Date" value={date} onChangeText={setDate} placeholder="e.g. 2026-10-12 (optional)" />
      <TextField label="Compensation" value={compensation} onChangeText={setCompensation} placeholder="e.g. KSh 15,000 + transport" />
      <TextAreaField label="Description" required value={description} onChangeText={setDescription} error={errors.description} placeholder="Describe the job, requirements, and what you're looking for" />
      <Button label="Post Casting" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: 6 },
  intro: { ...typography.intro, marginBottom: spacing.md },
});
