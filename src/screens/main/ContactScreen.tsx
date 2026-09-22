import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { TextField, TextAreaField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { submitContactMessage } from '../../lib/submissions';
import { colors, fonts, radii, spacing } from '../../theme/theme';

interface FormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  message: string;
}

const initialState: FormState = { fullName: '', email: '', phoneNumber: '', message: '' };

export default function ContactScreen() {
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
    if (!form.phoneNumber.trim()) next.phoneNumber = 'Phone number is required';
    if (!form.message.trim()) next.message = 'Message is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitContactMessage({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone_number: form.phoneNumber.trim(),
        message: form.message.trim(),
      });
      setForm(initialState);
      Alert.alert('Message sent', "Thanks for reaching out — we'll reply as soon as we can.");
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll padded>
      <SectionTitle title="Get in Touch" subtitle="We'd love to hear from you. Please fill out the form below for any inquiries." />

      <View style={styles.quickRow}>
        <QuickContact
          icon="call-outline"
          label="Call"
          onPress={() => Linking.openURL('tel:+254702066492')}
        />
        <QuickContact
          icon="logo-whatsapp"
          label="WhatsApp"
          onPress={() => Linking.openURL('https://wa.me/254702066492')}
        />
        <QuickContact
          icon="mail-outline"
          label="Email"
          onPress={() => Linking.openURL('mailto:Linkosiclothing@gmail.com')}
        />
      </View>

      <Card style={{ marginTop: spacing.lg }}>
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
          label="Phone Number"
          required
          error={errors.phoneNumber}
          value={form.phoneNumber}
          onChangeText={(v) => set('phoneNumber', v)}
          placeholder="+254 700 000 000"
          keyboardType="phone-pad"
        />
        <TextAreaField
          label="Message"
          required
          error={errors.message}
          value={form.message}
          onChangeText={(v) => set('message', v)}
          placeholder="How can we help?"
        />
        <Button label="Send Message" variant="primary" loading={submitting} onPress={handleSubmit} />
      </Card>
    </Screen>
  );
}

function QuickContact({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickItem} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text, marginTop: 6 },
});
