import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextAreaField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCasting, applyToCasting } from '../../lib/castings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Casting } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;
type Rt = RouteProp<DashboardStackParamList, 'CastingDetail'>;

export default function CastingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { castingId } = route.params;
  const { session, profile } = useAuth();

  const [casting, setCasting] = useState<Casting | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetchCasting(castingId);
      setCasting(data);
      setLoading(false);
    })();
  }, [castingId]);

  async function handleApply() {
    if (!session || !casting) return;
    setSubmitting(true);
    try {
      await applyToCasting({
        casting,
        model_uid: session.uid,
        model_name: profile?.full_name ?? profile?.email ?? 'Model',
        message: message.trim(),
      });
      setModalOpen(false);
      setApplied(true);
      Alert.alert('Applied!', 'Your application has been sent.');
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!casting) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.textMuted} />
        <Text style={styles.emptyText}>Casting not found.</Text>
      </View>
    );
  }

  const isPoster = session?.uid === casting.posted_by_uid;
  const isModel = profile?.account_type === 'model';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.categoryPill}>
        <Text style={styles.categoryPillText}>{casting.category}</Text>
      </View>
      <Text style={styles.title}>{casting.title}</Text>
      <Text style={styles.poster}>Posted by {casting.posted_by_name}</Text>

      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={14} color={colors.primary} />
        <Text style={styles.metaText}>{casting.location}</Text>
      </View>
      {casting.date ? (
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={styles.metaText}>{casting.date}</Text>
        </View>
      ) : null}
      {casting.compensation ? (
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={14} color={colors.primary} />
          <Text style={styles.metaText}>{casting.compensation}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Description</Text>
      <Text style={styles.description}>{casting.description}</Text>

      {isPoster ? (
        <Button
          label="View Applicants"
          onPress={() => navigation.navigate('CastingApplicants', { castingId: casting.id, castingTitle: casting.title })}
          style={{ marginTop: spacing.xl }}
        />
      ) : isModel ? (
        <Button
          label={applied ? 'Applied ✓' : 'Apply Now'}
          disabled={applied}
          onPress={() => setModalOpen(true)}
          style={{ marginTop: spacing.xl }}
        />
      ) : !session ? (
        <Button
          label="Sign In to Apply"
          onPress={() =>
            navigation.getParent()?.dispatch(
              CommonActions.navigate({ name: 'ProfileTab', params: { screen: 'Login' } })
            )
          }
          style={{ marginTop: spacing.xl }}
        />
      ) : null}

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.sheetTitle}>Apply to "{casting.title}"</Text>
              <TextAreaField
                label="Message"
                value={message}
                onChangeText={setMessage}
                placeholder="Introduce yourself and why you're a fit"
              />
              <Button label="Submit Application" onPress={handleApply} loading={submitting} />
              <Button label="Cancel" variant="ghost" onPress={() => setModalOpen(false)} style={{ marginTop: spacing.sm }} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.bg },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
  },
  categoryPillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary },
  title: { ...typography.pageTitle },
  poster: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.text },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, marginTop: spacing.md, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  description: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 23 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg },
  sheetTitle: { ...typography.dialogTitle, marginBottom: spacing.md },
});
