import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { BlogMedia } from '../../components/BlogMedia';
import { RatingStars } from '../../components/RatingStars';
import { fetchInstructorSelfProfile } from '../../lib/instructors';
import { fetchReviewsForTarget } from '../../lib/reviews';
import { fallbackInstructorPhoto } from '../../data/localImages';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { AppInstructorProfile, Review } from '../../types';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;
type Rt = RouteProp<ConnectStackParamList, 'InstructorProfileDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InstructorProfileDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { uid } = route.params;

  const [instructor, setInstructor] = useState<AppInstructorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [profileData, reviewsData] = await Promise.all([
          fetchInstructorSelfProfile(uid),
          fetchReviewsForTarget(uid, 'instructor'),
        ]);
        setInstructor(profileData);
        setReviews(reviewsData);
      } catch {
        setInstructor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

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

  const photos = instructor.photos.length > 0 ? instructor.photos : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      <View style={styles.carouselWrap}>
        {photos ? (
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
              {photos.map((img, idx) => (
                <BlogMedia key={`${img}-${idx}`} source={{ uri: img }} style={styles.hero} />
              ))}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.dotsRow}>
                {photos.map((_, idx) => (
                  <View key={idx} style={[styles.dot, idx === activeSlide && styles.dotActive]} />
                ))}
              </View>
            )}
          </>
        ) : (
          <Image source={fallbackInstructorPhoto(instructor.id)} style={styles.hero} cachePolicy="memory-disk" transition={200} />
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{instructor.full_name}</Text>
          {instructor.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.secondary} /> : null}
        </View>

        {instructor.rating_count > 0 ? (
          <RatingStars rating={instructor.rating_avg} showValue count={instructor.rating_count} />
        ) : null}

        <View style={styles.metaRow}>
          {instructor.location ? (
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={13} color={colors.primary} />
              <Text style={styles.metaChipText}>{instructor.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Ionicons name="videocam-outline" size={13} color={colors.primary} />
            <Text style={styles.metaChipText}>
              {instructor.mode === 'both' ? 'Online / In Person' : instructor.mode === 'online' ? 'Online' : 'In Person'}
            </Text>
          </View>
          {instructor.experience_years != null ? (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.metaChipText}>{instructor.experience_years} yrs experience</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.price}>KSh {instructor.price_per_session.toLocaleString()} / session</Text>

        {instructor.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.paragraph}>{instructor.bio}</Text>
          </View>
        ) : null}

        {instructor.specialties.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Specialties</Text>
            <View style={styles.chipRow}>
              {instructor.specialties.map((s) => (
                <View key={s} style={styles.specChip}>
                  <Text style={styles.specChipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {reviews.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Reviews</Text>
            <View style={{ gap: 10 }}>
              {reviews.slice(0, 5).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{r.author_name}</Text>
                    <RatingStars rating={r.rating} size={13} />
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Book a Slot"
            variant="primary"
            onPress={() => navigation.navigate('SelectSlot', { instructorUid: instructor.id, instructorName: instructor.full_name })}
          />
          <Button
            label="Message"
            variant="outline"
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({
                  name: 'DashboardTab',
                  params: { screen: 'Chat', params: { otherUid: instructor.id, otherName: instructor.full_name } },
                })
              )
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
  carouselWrap: { width: '100%' },
  hero: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.05, backgroundColor: colors.surfaceAlt },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  body: { padding: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  name: { ...typography.pageTitle },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm, marginBottom: 6 },
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
  price: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.primary, marginTop: spacing.xs },
  section: { marginTop: spacing.md },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  paragraph: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 23 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specChip: { backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12 },
  specChipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  reviewComment: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  actions: { gap: 12, marginTop: spacing.xl },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
