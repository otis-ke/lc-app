import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { BlogMedia } from '../../components/BlogMedia';
import { TextField, TextAreaField, RadioGroup } from '../../components/FormFields';
import { fetchModel } from '../../lib/content';
import { submitModelEnquiry } from '../../lib/submissions';
import { MODEL_PHOTOS } from '../../data/localImages';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { ModelsStackParamList } from '../../navigation/types';
import type { ModelProfile } from '../../types';

type Nav = NativeStackNavigationProp<ModelsStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ENQUIRE_TYPES = ['Enquire about model', 'Book model'] as const;

export default function ModelDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<ModelsStackParamList, 'ModelDetail'>>();
  const { modelId } = route.params;

  const [model, setModel] = useState<ModelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [enquireType, setEnquireType] = useState<(typeof ENQUIRE_TYPES)[number]>('Enquire about model');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTelephone, setUserTelephone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchModel(modelId);
        if (active) setModel(data);
      } catch (e: any) {
        if (active) setErrorMsg(e?.message ?? 'Could not load this model.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [modelId]);

  const remoteImages = model
    ? ([model.header_image, ...(model.images ?? [])].filter(Boolean) as string[])
    : [];
  // Never show an empty carousel — fall back to a few real site photos,
  // picked deterministically from the model id so it doesn't flicker.
  const images: (string | number)[] =
    remoteImages.length > 0
      ? remoteImages
      : (() => {
          let hash = 0;
          const seed = modelId ?? 'model';
          for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
          const start = hash % MODEL_PHOTOS.length;
          return [0, 1, 2].map((offset) => MODEL_PHOTOS[(start + offset) % MODEL_PHOTOS.length]);
        })();

  function openModal(type: (typeof ENQUIRE_TYPES)[number]) {
    setEnquireType(type);
    setFormErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!userName.trim()) errs.userName = 'Required';
    if (!userEmail.trim()) errs.userEmail = 'Required';
    if (!userTelephone.trim()) errs.userTelephone = 'Required';
    if (!message.trim()) errs.message = 'Required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!model) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitModelEnquiry({
        model_id: model.id,
        model_name: model.name,
        user_name: userName.trim(),
        user_email: userEmail.trim(),
        user_telephone: userTelephone.trim(),
        enquire_type: enquireType,
        message: message.trim(),
      });
      setModalOpen(false);
      setUserName('');
      setUserEmail('');
      setUserTelephone('');
      setMessage('');
      Alert.alert('Sent!', "Thanks — we've received your message and will be in touch soon.");
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    if (!model) return;
    try {
      await Share.share({
        message: `Check out ${model.name} from L&C Modeling Academy! ${model.text_description ?? ''}`.trim(),
      });
    } catch {
      // user cancelled or share failed silently
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (errorMsg || !model) {
    return (
      <Screen>
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
          <Text style={styles.emptyText}>{errorMsg ?? 'Model not found.'}</Text>
          <Button label="Go Back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false} edges={['left', 'right', 'bottom']}>
      <View style={styles.headerBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.carouselWrap}>
        {images.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveSlide(idx);
              }}
            >
              {images.map((img, idx) => (
                <BlogMedia
                  key={typeof img === 'string' ? `${img}-${idx}` : `local-${idx}`}
                  source={typeof img === 'string' ? { uri: img } : img}
                  style={styles.slide}
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((_, idx) => (
                  <View key={idx} style={[styles.dot, idx === activeSlide && styles.dotActive]} />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.slide, styles.slidePlaceholder]}>
            <Ionicons name="person-outline" size={48} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{model.name}</Text>
        {model.text_description ? <Text style={styles.blurb}>{model.text_description}</Text> : null}

        <View style={styles.actionsRow}>
          <Button label="Enquire" variant="outline" fullWidth={false} style={styles.actionBtn} onPress={() => openModal('Enquire about model')} />
          <Button label="Book This Model" variant="gold" fullWidth={false} style={styles.actionBtn} onPress={() => openModal('Book model')} />
        </View>

        {model.full_description ? <Text style={styles.fullDescription}>{model.full_description}</Text> : null}
      </View>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>{model.name}</Text>
                <Text style={styles.sheetSubtitle}>Send an enquiry and our team will get back to you.</Text>

                <TextField label="Your Name" required value={userName} onChangeText={setUserName} placeholder="Enter your name" error={formErrors.userName} />
                <TextField label="Your Email" required value={userEmail} onChangeText={setUserEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={formErrors.userEmail} />
                <TextField label="Your Telephone" required value={userTelephone} onChangeText={setUserTelephone} placeholder="+254 7xx xxx xxx" keyboardType="phone-pad" error={formErrors.userTelephone} />
                <RadioGroup label="Enquiry Type" value={enquireType} options={[...ENQUIRE_TYPES]} onChange={(v) => setEnquireType(v as (typeof ENQUIRE_TYPES)[number])} />
                <TextAreaField label="Message" required value={message} onChangeText={setMessage} placeholder="Write your message..." error={formErrors.message} />

                <Button label="Submit" variant="gold" loading={submitting} onPress={handleSubmit} />
                <Button label="Cancel" variant="ghost" onPress={() => setModalOpen(false)} style={{ marginTop: spacing.sm }} />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  headerBar: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselWrap: { width: '100%' },
  slide: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1, backgroundColor: colors.surfaceAlt },
  slidePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  body: { padding: spacing.lg },
  name: { ...typography.pageTitle, marginBottom: 6 },
  blurb: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 21 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { flex: 1 },
  fullDescription: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 23 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { ...typography.dialogTitle },
  sheetSubtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, marginBottom: spacing.md, marginTop: 2 },
});
