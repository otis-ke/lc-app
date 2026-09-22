import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { TextField, TextAreaField, SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { submitPartnershipRequest } from '../../lib/submissions';
import { spacing } from '../../theme/theme';

const PARTNERSHIP_TYPES = ['Sponsorship', 'Collaboration', 'CSR', 'Other'];

interface FormState {
  orgName: string;
  email: string;
  telephone: string;
  partnershipType: string;
  message: string;
}

const initialState: FormState = { orgName: '', email: '', telephone: '', partnershipType: '', message: '' };

export default function PartnerScreen() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.orgName.trim()) next.orgName = 'Organization or full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.telephone.trim()) next.telephone = 'Telephone is required';
    if (!form.partnershipType) next.partnershipType = 'Select a partnership type';
    if (!form.message.trim()) next.message = 'Message is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitPartnershipRequest({
        org_name: form.orgName.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        partnership_type: form.partnershipType,
        message: form.message.trim(),
      });
      setForm(initialState);
      Alert.alert('Proposal received', "Thanks for reaching out — our team will review and be in touch.");
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll padded>
      <SectionTitle title="Partner With Us" subtitle="Collaborate with L&C Modeling Academy and grow together." />

      <Card>
        <TextField
          label="Organization / Individual Name"
          required
          error={errors.orgName}
          value={form.orgName}
          onChangeText={(v) => set('orgName', v)}
          placeholder="Your organization or full name"
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
          label="Type of Partnership"
          required
          error={errors.partnershipType}
          value={form.partnershipType}
          options={PARTNERSHIP_TYPES}
          placeholder="Select type"
          onChange={(v) => set('partnershipType', v)}
        />
        <TextAreaField
          label="Message / Proposal"
          required
          error={errors.message}
          value={form.message}
          onChangeText={(v) => set('message', v)}
          placeholder="Write your proposal here..."
        />
        <Button label="Submit" variant="primary" loading={submitting} onPress={handleSubmit} style={{ marginTop: spacing.xs }} />
      </Card>
    </Screen>
  );
}
