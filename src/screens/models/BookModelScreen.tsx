import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextField, TextAreaField, SelectField, CheckboxGroup } from '../../components/FormFields';
import { colors, fonts, gradients, radii, spacing } from '../../theme/theme';
import { COUNTRIES } from '../../data/countries';
import { submitModelBooking } from '../../lib/submissions';

const EVENT_TYPES: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Fashion Shows', icon: 'walk-outline' },
  { label: 'Photoshoots', icon: 'camera-outline' },
  { label: 'Commercials', icon: 'videocam-outline' },
  { label: 'Special Events', icon: 'sparkles-outline' },
];

const CATEGORIES = ['Runway', 'Commercial', 'Fashion', 'Beauty', 'Fitness', 'Plus Size', 'Kids', 'Mature', 'Pageantry', 'Brand Influencer'];

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'ribbon-outline', title: 'Experienced Models', body: 'Our models are trained and experienced, ready to deliver outstanding performances.' },
  { icon: 'people-outline', title: 'Diverse Talent Pool', body: 'We offer a wide range of models to suit any project requirement.' },
  { icon: 'shield-checkmark-outline', title: 'Professional Service', body: 'From booking to execution, we ensure a seamless, professional experience.' },
];

export default function BookModelScreen() {
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [nationality, setNationality] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Required';
    if (!email.trim()) errs.email = 'Required';
    if (!telephone.trim()) errs.telephone = 'Required';
    if (!nationality) errs.nationality = 'Required';
    if (!projectDetails.trim()) errs.projectDetails = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitModelBooking({
        full_name: fullName.trim(),
        email: email.trim(),
        telephone: telephone.trim(),
        nationality,
        project_details: projectDetails.trim(),
        model_category_needed: categories,
      });
      Alert.alert('Request Sent', "Thanks — our booking team will reach out shortly to confirm details.");
      setFullName('');
      setEmail('');
      setTelephone('');
      setNationality('');
      setProjectDetails('');
      setCategories([]);
      setErrors({});
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll padded={false} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={gradients.gold as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
      >
        <Text style={styles.eyebrow}>L&C MODELS MANAGEMENT</Text>
        <Text style={styles.heroTitle}>Book Our Models</Text>
        <Text style={styles.heroSub}>
          Discover top-tier modeling talent for fashion shows, photoshoots, commercials and special events.
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.chipRow}>
          {EVENT_TYPES.map((e) => (
            <View key={e.label} style={styles.chip}>
              <Ionicons name={e.icon} size={14} color={colors.goldDark} />
              <Text style={styles.chipText}>{e.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.featureRow}>
          {FEATURES.map((f) => (
            <Card key={f.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={colors.goldLight} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureBody}>{f.body}</Text>
            </Card>
          ))}
        </View>

        <SectionTitle title="How to Book" subtitle="Tell us about your project and who you need" style={{ marginTop: spacing.xl }} />

        <Card style={styles.formCard}>
          <TextField label="Full Name" required value={fullName} onChangeText={setFullName} error={errors.fullName} placeholder="Jane Doe" />
          <TextField label="Email" required value={email} onChangeText={setEmail} error={errors.email} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <TextField label="Telephone" required value={telephone} onChangeText={setTelephone} error={errors.telephone} placeholder="+254 7xx xxx xxx" keyboardType="phone-pad" />
          <SelectField label="Your Country" required value={nationality} onChange={setNationality} options={COUNTRIES} placeholder="Select your country" error={errors.nationality} />
          <TextAreaField
            label="Project Details"
            required
            value={projectDetails}
            onChangeText={setProjectDetails}
            error={errors.projectDetails}
            placeholder="Tell us about the shoot, event or campaign you're booking for."
          />
          <CheckboxGroup label="Model Category Needed (select all that apply)" values={categories} options={CATEGORIES} onChange={setCategories} />

          <Button label="Book a Model" variant="gold" loading={submitting} onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
        </Card>

        <Text style={styles.contactNote}>For any inquiries or special requests, reach our booking team directly:</Text>
        <View style={styles.contactRow}>
          <Button
            label="Call Us"
            variant="outline"
            fullWidth={false}
            style={styles.contactBtn}
            onPress={() => Linking.openURL('tel:+254702066492')}
          />
          <Button
            label="WhatsApp"
            variant="ghost"
            fullWidth={false}
            style={styles.contactBtn}
            onPress={() => Linking.openURL('https://wa.me/254702066492')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: 'rgba(20,17,10,0.7)', marginBottom: 8 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, marginBottom: 8 },
  heroSub: { fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(20,17,10,0.75)', lineHeight: 20, maxWidth: 320 },
  body: { padding: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  featureRow: { gap: spacing.sm },
  featureCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  featureIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: 2 },
  featureBody: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, lineHeight: 18, flex: 1 },
  formCard: { gap: 0 },
  contactNote: { fontFamily: fonts.body, fontSize: 13, fontStyle: 'italic', color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },
  contactRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, justifyContent: 'center' },
  contactBtn: { flex: 1 },
});
