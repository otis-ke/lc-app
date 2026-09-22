import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextField, TextAreaField, SelectField, RadioGroup, CheckboxGroup } from '../../components/FormFields';
import { colors, fonts, radii, spacing } from '../../theme/theme';
import { COUNTRIES } from '../../data/countries';
import { pickImage, uploadImage } from '../../lib/uploadImage';
import { submitScoutingApplication } from '../../lib/submissions';
import { fetchModelsHeroImage } from '../../lib/content';
import { MODEL_PHOTOS } from '../../data/localImages';

const GENDERS = ['Male', 'Female', 'Other'];
const EXPERIENCE_LEVELS = ['None', 'Beginner', 'Intermediate', 'Professional'];
const INTEREST_AREAS = ['Runway', 'Commercial', 'Fashion', 'Beauty', 'Fitness', 'Kids', 'Pageantry', 'Brand Influencer'];
const DIVERSITY = ['African', 'Asian', 'Caucasian', 'Mixed Heritage', 'Middle Eastern', 'Any Ethnicity'];
const CATEGORIES = ['Plus Size', 'Commercial', 'Runway', 'Fitness', 'Kids', 'Mature', 'Pageantry', 'Brand Influencer'];
const CHECKLIST = ['One clear headshot', 'One full-body photo', 'Natural lighting', 'Minimal makeup', 'Plain clothing', 'No heavy filters'];
const STEPS = [
  'Submit your application.',
  'Our scouting team reviews your profile.',
  'Shortlisted applicants are contacted for an interview or assessment.',
  'Successful candidates receive an invitation to join L&C Modeling School or our management program.',
];

type UploadKey = 'headshot' | 'full_body_front' | 'full_body_side' | 'walking_video';
interface UploadState {
  localUri: string | null;
  url: string | null;
  uploading: boolean;
}
const EMPTY_UPLOAD: UploadState = { localUri: null, url: null, uploading: false };

const UPLOAD_META: Record<UploadKey, { title: string; icon: keyof typeof Ionicons.glyphMap; required: boolean }> = {
  headshot: { title: 'Headshot', icon: 'person-circle-outline', required: true },
  full_body_front: { title: 'Full Body Front', icon: 'body-outline', required: true },
  full_body_side: { title: 'Full Body Side', icon: 'walk-outline', required: true },
  walking_video: { title: 'Walking Video', icon: 'videocam-outline', required: false },
};

export default function GetScoutedScreen() {
  const insets = useSafeAreaInsets();
  // Hero comes from the website's models_header collection (the same one
  // the Models hub uses) — local photo is only a fallback until it loads.
  const [heroImage, setHeroImage] = useState<string | null>(null);
  useEffect(() => {
    fetchModelsHeroImage().then(setHeroImage).catch(() => {});
  }, []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [age, setAge] = useState('');
  const [nationality, setNationality] = useState('');
  const [county, setCounty] = useState('');
  const [gender, setGender] = useState('');

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');

  const [socialHandle, setSocialHandle] = useState('');
  const [modelingExperience, setModelingExperience] = useState('');
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [about, setAbout] = useState('');

  const [uploads, setUploads] = useState<Record<UploadKey, UploadState>>({
    headshot: EMPTY_UPLOAD,
    full_body_front: EMPTY_UPLOAD,
    full_body_side: EMPTY_UPLOAD,
    walking_video: EMPTY_UPLOAD,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function patchUpload(key: UploadKey, patch: Partial<UploadState>) {
    setUploads((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handlePick(key: UploadKey) {
    // NOTE: a real "record video" flow would call pickImage({ videos: true })
    // and let the picker offer video capture — already supported by the
    // helper's options param. For MVP we just let users pick any media type
    // from their library for the walking_video slot.
    const asset = await pickImage(key === 'walking_video' ? { videos: true } : undefined);
    if (!asset) return;
    patchUpload(key, { localUri: asset.uri, uploading: true, url: null });
    try {
      const url = await uploadImage(asset.uri, 'scouting');
      patchUpload(key, { url, uploading: false });
    } catch (e: any) {
      patchUpload(key, { uploading: false, localUri: null });
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Required';
    if (!email.trim()) errs.email = 'Required';
    if (!telephone.trim()) errs.telephone = 'Required';
    if (!age.trim()) errs.age = 'Required';
    if (!nationality) errs.nationality = 'Required';
    if (!county.trim()) errs.county = 'Required';
    if (!gender) errs.gender = 'Required';
    if (!modelingExperience) errs.modelingExperience = 'Required';
    if (!about.trim()) errs.about = 'Required';
    if (!uploads.headshot.url) errs.headshot = 'Required';
    if (!uploads.full_body_front.url) errs.full_body_front = 'Required';
    if (!uploads.full_body_side.url) errs.full_body_side = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    const anyUploading = Object.values(uploads).some((u) => u.uploading);
    if (anyUploading) {
      Alert.alert('Please wait', 'Your photos are still uploading.');
      return;
    }
    if (!validate()) {
      Alert.alert('Missing info', 'Please fill in all required fields and upload the required photos.');
      return;
    }
    setSubmitting(true);
    try {
      await submitScoutingApplication({
        full_name: fullName.trim(),
        email: email.trim(),
        telephone: telephone.trim(),
        age: parseInt(age, 10),
        nationality,
        county: county.trim(),
        gender,
        height: height.trim() || null,
        weight: weight.trim() || null,
        bust: gender === 'Female' ? bust.trim() || null : null,
        waist: waist.trim() || null,
        hips: hips.trim() || null,
        shoe_size: shoeSize.trim() || null,
        hair_color: hairColor.trim() || null,
        eye_color: eyeColor.trim() || null,
        social_handle: socialHandle.trim() || null,
        modeling_experience: modelingExperience,
        areas_of_interest: areasOfInterest,
        headshot_url: uploads.headshot.url,
        full_body_front_url: uploads.full_body_front.url,
        full_body_side_url: uploads.full_body_side.url,
        walking_video_url: uploads.walking_video.url,
        about: about.trim(),
      });
      Alert.alert('Application Submitted', "Thank you! Our scouting team will review your profile and be in touch.");
      setFullName('');
      setEmail('');
      setTelephone('');
      setAge('');
      setNationality('');
      setCounty('');
      setGender('');
      setHeight('');
      setWeight('');
      setBust('');
      setWaist('');
      setHips('');
      setShoeSize('');
      setHairColor('');
      setEyeColor('');
      setSocialHandle('');
      setModelingExperience('');
      setAreasOfInterest([]);
      setAbout('');
      setUploads({ headshot: EMPTY_UPLOAD, full_body_front: EMPTY_UPLOAD, full_body_side: EMPTY_UPLOAD, walking_video: EMPTY_UPLOAD });
      setErrors({});
    } catch (e: any) {
      Alert.alert('Submission Failed', e?.message ?? 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll padded={false} edges={['left', 'right', 'bottom']}>
      <ImageBackground
        source={heroImage ? { uri: heroImage } : MODEL_PHOTOS[3]}
        style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(11,11,12,0.55)', 'rgba(11,11,12,0.75)', colors.ink]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.eyebrow}>L&C MODELS MANAGEMENT</Text>
        <Text style={styles.heroTitle}>Get Scouted</Text>
        <Text style={styles.heroTagline}>Your Modeling Journey Starts Here</Text>
        <Text style={styles.heroSub}>No experience required — every age, size and background welcome.</Text>
      </ImageBackground>

      <View style={styles.body}>
        <Text style={styles.heading}>Do You Have What It Takes?</Text>
        <Text style={styles.paragraph}>
          At L&C Modeling School, we're always looking for fresh faces from every background. Whether you're
          interested in runway, commercial, fitness, pageantry or brand influencing — if you have the passion and
          the potential, we want to hear from you.
        </Text>

        <Text style={styles.subheading}>We proudly welcome applicants of all:</Text>
        <View style={styles.chipRow}>
          {DIVERSITY.map((d) => (
            <View key={d} style={styles.chip}>
              <Text style={styles.chipText}>{d}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.subheading}>...and every category of model:</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <View key={c} style={styles.chipGold}>
              <Text style={styles.chipGoldText}>{c}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Before You Apply</Text>
        <Text style={styles.paragraph}>Please prepare:</Text>
        <View style={styles.checklist}>
          {CHECKLIST.map((item) => (
            <View key={item} style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={17} color={colors.goldDark} />
              <Text style={styles.checklistText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Application Form</Text>
        <Text style={styles.paragraph}>
          Fields marked <Text style={{ color: colors.goldDark, fontFamily: fonts.bodySemiBold }}>*</Text> are
          required — everything else is optional, so don't let it hold you back from applying.
        </Text>

        <Fieldset icon="person-outline" title="Your Info">
          <TextField label="Full Name" required value={fullName} onChangeText={setFullName} error={errors.fullName} placeholder="Jane Doe" />
          <TextField label="Email" required value={email} onChangeText={setEmail} error={errors.email} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <TextField label="Telephone" required value={telephone} onChangeText={setTelephone} error={errors.telephone} placeholder="+254 7xx xxx xxx" keyboardType="phone-pad" />
          <TextField label="Age" required value={age} onChangeText={setAge} error={errors.age} placeholder="e.g. 21" keyboardType="number-pad" />
          <SelectField label="Nationality" required value={nationality} onChange={setNationality} options={COUNTRIES} placeholder="Select your country" error={errors.nationality} />
          <TextField label="County / Province" required value={county} onChangeText={setCounty} error={errors.county} placeholder="e.g. Nairobi" />
          <RadioGroup label="Gender" required value={gender} options={GENDERS} onChange={setGender} error={errors.gender} />
        </Fieldset>

        <Fieldset icon="resize-outline" title="Measurements" optional="(all optional)">
          <TextField label="Height" value={height} onChangeText={setHeight} placeholder="cm or ft/in" />
          <TextField label="Weight" value={weight} onChangeText={setWeight} placeholder="kg or lbs" />
          {gender === 'Female' && (
            <TextField label="Bust" value={bust} onChangeText={setBust} placeholder="in or cm" />
          )}
          <TextField label="Waist" value={waist} onChangeText={setWaist} placeholder="in or cm" />
          <TextField label="Hips" value={hips} onChangeText={setHips} placeholder="in or cm" />
          <TextField label="Shoe Size" value={shoeSize} onChangeText={setShoeSize} placeholder="EU / UK / US" />
          <TextField label="Hair Color" value={hairColor} onChangeText={setHairColor} />
          <TextField label="Eye Color" value={eyeColor} onChangeText={setEyeColor} />
        </Fieldset>

        <Fieldset icon="logo-instagram" title="Online Presence" optional="(optional)">
          <TextField label="Instagram / TikTok" value={socialHandle} onChangeText={setSocialHandle} placeholder="@yourhandle" autoCapitalize="none" />
        </Fieldset>

        <Fieldset icon="star-outline" title="Modeling Experience" required>
          <RadioGroup label="" value={modelingExperience} options={EXPERIENCE_LEVELS} onChange={setModelingExperience} error={errors.modelingExperience} />
        </Fieldset>

        <Fieldset icon="heart-outline" title="Areas of Interest" optional="(select all that apply)">
          <CheckboxGroup label="" values={areasOfInterest} options={INTEREST_AREAS} onChange={setAreasOfInterest} />
        </Fieldset>

        <Fieldset icon="camera-outline" title="Upload Photos">
          <Text style={styles.uploadHint}>A clear headshot, natural lighting, minimal makeup, plain clothing, no heavy filters.</Text>
          <View style={styles.uploadGrid}>
            {(Object.keys(UPLOAD_META) as UploadKey[]).map((key) => {
              const meta = UPLOAD_META[key];
              const state = uploads[key];
              return (
                <Pressable
                  key={key}
                  style={[styles.uploadTile, state.url && styles.uploadTileDone]}
                  onPress={() => handlePick(key)}
                >
                  {state.localUri ? (
                    <Image source={{ uri: state.localUri }} style={styles.uploadThumb} resizeMode="cover" />
                  ) : (
                    <Ionicons name={meta.icon} size={26} color={colors.goldDark} />
                  )}
                  <Text style={styles.uploadTitle} numberOfLines={1}>
                    {meta.title}
                    {meta.required ? <Text style={{ color: colors.goldDark }}> *</Text> : ''}
                  </Text>
                  <Text style={styles.uploadStatus}>
                    {state.uploading ? 'Uploading…' : state.url ? 'Uploaded' : 'Tap to upload'}
                  </Text>
                  {state.uploading && (
                    <View style={styles.uploadSpinner}>
                      <ActivityIndicator color={colors.gold} />
                    </View>
                  )}
                  {state.url && !state.uploading && (
                    <View style={styles.uploadBadge}>
                      <Ionicons name="checkmark" size={12} color={colors.ink} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Fieldset>

        <Fieldset icon="pencil-outline" title="Tell Us About Yourself" required>
          <TextAreaField
            label=""
            required
            value={about}
            onChangeText={setAbout}
            error={errors.about}
            placeholder="Share your interests, hobbies, goals, achievements, and why you want to become a model."
          />
        </Fieldset>

        <Button label="Submit My Application" variant="gold" loading={submitting} onPress={handleSubmit} />

        <Text style={[styles.heading, { marginTop: spacing.xxl }]}>What Happens Next?</Text>
        <View style={styles.steps}>
          {STEPS.map((step, idx) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.finalCta}>
        <Text style={styles.finalCtaEyebrow}>Your Future Starts Here</Text>
        <Text style={styles.finalCtaTagline}>Be Seen. Be Discovered. Be Confident.</Text>
      </View>
    </Screen>
  );
}

function Fieldset({
  icon,
  title,
  optional,
  required,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  optional?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.fieldset}>
      <View style={styles.legendRow}>
        <Ionicons name={icon} size={16} color={colors.goldDark} />
        <Text style={styles.legendText}>{title}</Text>
        {required ? <Text style={styles.legendRequired}> *</Text> : null}
        {optional ? <Text style={styles.legendOptional}> {optional}</Text> : null}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    overflow: 'hidden',
  },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.goldLight, marginBottom: 10 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 42, color: colors.goldLight, marginBottom: 8 },
  heroTagline: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: '#fff', marginBottom: 8 },
  heroSub: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20, maxWidth: 320 },
  body: { padding: spacing.lg },
  heading: { fontFamily: fonts.heading, fontSize: 22, color: colors.text, marginBottom: 10 },
  subheading: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginTop: 14, marginBottom: 8 },
  paragraph: { fontFamily: fonts.body, fontSize: 14.5, color: colors.textMuted, lineHeight: 22, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipGold: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.ink },
  chipGoldText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.goldLight },
  checklist: { marginTop: 4, gap: 10 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checklistText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  fieldset: { marginTop: spacing.lg, marginBottom: 0 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  legendText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, marginLeft: 8 },
  legendRequired: { color: colors.goldDark, fontFamily: fonts.bodyBold },
  legendOptional: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  uploadHint: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 18 },
  uploadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  uploadTile: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  uploadTileDone: { borderStyle: 'solid', borderColor: colors.gold, backgroundColor: colors.surface },
  uploadThumb: { ...StyleSheet.absoluteFill, opacity: 0.35 },
  uploadTitle: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text, marginTop: 6, textAlign: 'center' },
  uploadStatus: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  uploadSpinner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)' },
  uploadBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { gap: 14, marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.goldLight },
  stepText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
  finalCta: { backgroundColor: colors.ink, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, alignItems: 'center' },
  finalCtaEyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.goldLight, marginBottom: 8 },
  finalCtaTagline: { fontFamily: fonts.heading, fontSize: 22, color: '#fff', textAlign: 'center' },
});
