import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from '../../navigation/types';
import { fetchInstructor } from '../../lib/content';
import type { Instructor } from '../../types';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import { Button } from '../../components/Button';
import { fallbackInstructorPhoto } from '../../data/localImages';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;

function openWhatsApp(text: string) {
  Linking.openURL(`https://wa.me/254702066492?text=${encodeURIComponent(text)}`).catch(() => {});
}

export default function InstructorDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<ConnectStackParamList, 'InstructorDetail'>>();
  const { instructorId } = route.params;

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchInstructor(instructorId);
        if (active) setInstructor(data);
      } catch {
        if (active) setInstructor(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [instructorId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!instructor) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
        <Text style={styles.emptyText}>Instructor not found.</Text>
      </View>
    );
  }

  // Gallery never looks empty: fall back to a few deterministic photos from
  // the site's real gallery set, keyed off the instructor id so the same
  // instructor always sees the same fallback photos.
  const galleryPhotos =
    instructor.content_images.length > 0
      ? instructor.content_images
      : [
          fallbackInstructorPhoto(instructor.id),
          fallbackInstructorPhoto(`${instructor.id}-2`),
          fallbackInstructorPhoto(`${instructor.id}-3`),
        ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      <Image
        source={instructor.header_image ? { uri: instructor.header_image } : fallbackInstructorPhoto(instructor.id)}
        style={styles.hero}
        cachePolicy="memory-disk"
        transition={200}
      />

      <View style={styles.body}>
        <Text style={styles.name}>{instructor.name}</Text>

        <View style={styles.metaRow}>
          {instructor.location ? (
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={13} color={colors.primary} />
              <Text style={styles.metaChipText}>{instructor.location}</Text>
            </View>
          ) : null}
          {instructor.specialization ? (
            <View style={styles.metaChip}>
              <Ionicons name="ribbon-outline" size={13} color={colors.primary} />
              <Text style={styles.metaChipText}>{instructor.specialization}</Text>
            </View>
          ) : null}
          {instructor.experience_years != null ? (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.metaChipText}>{instructor.experience_years} yrs experience</Text>
            </View>
          ) : null}
        </View>

        {instructor.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.paragraph}>{instructor.description}</Text>
          </View>
        ) : null}

        {instructor.fee_notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Fees</Text>
            <Text style={styles.paragraph}>{instructor.fee_notes}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Gallery</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {galleryPhotos.map((img, i) => (
              <Image
                key={typeof img === 'string' ? `${img}-${i}` : `local-${i}`}
                source={typeof img === 'string' ? { uri: img } : img}
                style={styles.galleryImg}
                cachePolicy="memory-disk"
                transition={200}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.actions}>
          <Button
            label="Book This Instructor"
            variant="primary"
            onPress={() => navigation.navigate('BookTraining', { instructorName: instructor.name })}
          />
          <Button
            label="Message on WhatsApp"
            variant="outline"
            onPress={() =>
              openWhatsApp(`Hi, I'd like to book training with ${instructor.name} on L&C Models Connect.`)
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.bg, padding: spacing.lg },
  hero: { width: '100%', height: 300, backgroundColor: colors.surfaceAlt },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg },
  name: { ...typography.pageTitle, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  metaChipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  section: { marginTop: spacing.md },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  paragraph: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 23 },
  galleryImg: { width: 130, height: 130, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  actions: { gap: 12, marginTop: spacing.xl },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
