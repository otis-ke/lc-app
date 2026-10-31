import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from '../../navigation/types';
import { BlogMedia } from '../../components/BlogMedia';
import { fetchInstructors, countInstructors } from '../../lib/content';
import { fetchApprovedInstructorProfiles } from '../../lib/instructors';
import { fetchModelDirectory } from '../../lib/models';
import { distanceKm, formatDistance } from '../../lib/geo';
import { describeLocationDenial, getLocationIfAlreadyGranted, requestLocationFromGesture } from '../../lib/location';
import { useAuth } from '../../contexts/AuthContext';
import type { AppInstructorProfile, AppModelProfile, Instructor } from '../../types';
import { colors, fonts, radii, spacing, shadow, typography } from '../../theme/theme';
import { Button } from '../../components/Button';
import { CONNECT_GALLERY_PHOTOS, CONNECT_HERO_PHOTOS, fallbackInstructorPhoto } from '../../data/localImages';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Same 8 disciplines as the site's Training Categories grid / form <select>s.
const CATEGORIES: { icon: IoniconName; label: string }[] = [
  { icon: 'walk-outline', label: 'Catwalk Training' },
  { icon: 'body-outline', label: 'Runway Coaching' },
  { icon: 'trophy-outline', label: 'Pageantry Training' },
  { icon: 'camera-outline', label: 'Posing Classes' },
  { icon: 'sparkles-outline', label: 'Grooming & Etiquette' },
  { icon: 'happy-outline', label: 'Confidence Building' },
  { icon: 'people-outline', label: 'Kids Modeling' },
  { icon: 'briefcase-outline', label: 'Portfolio & Personal Branding' },
];

const STEPS = [
  { num: '1', title: 'Browse instructors', desc: 'Explore verified coaches by specialization and location.' },
  { num: '2', title: 'Book a session', desc: 'Send a booking request — train online or in person.' },
  { num: '3', title: 'Grow your career', desc: 'Attend training and build your modeling portfolio.' },
];

function openWhatsApp(text: string) {
  Linking.openURL(`https://wa.me/254702066492?text=${encodeURIComponent(text)}`).catch(() => {});
}

export default function ConnectHomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [bookableInstructors, setBookableInstructors] = useState<AppInstructorProfile[]>([]);
  const [models, setModels] = useState<AppModelProfile[]>([]);
  const [instructorCount, setInstructorCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  useEffect(() => {
    // Silent check only — never auto-prompts. Browsers in particular treat
    // an unsolicited permission request (fired without a tap) as spam and
    // often auto-deny it, which then poisons the permission for every later
    // attempt too. Enabling location is always a deliberate tap below.
    getLocationIfAlreadyGranted().then((coords) => {
      if (coords) setMyCoords(coords);
    });
  }, []);

  async function handleEnableLocation() {
    setLocatingMe(true);
    setLocationMessage(null);
    const result = await requestLocationFromGesture();
    setLocatingMe(false);
    if (result.status === 'granted') {
      setMyCoords({ lat: result.lat, lng: result.lng });
    } else if (result.status === 'denied') {
      setLocationMessage(describeLocationDenial(result.canAskAgain));
    } else {
      setLocationMessage(result.message);
    }
  }

  const load = useCallback(async () => {
    try {
      const [list, count, bookable, modelList] = await Promise.all([
        fetchInstructors(),
        countInstructors(),
        fetchApprovedInstructorProfiles(),
        fetchModelDirectory().catch(() => []),
      ]);
      setInstructors(list);
      setInstructorCount(count);
      setBookableInstructors(bookable);
      setModels(modelList);
    } catch {
      // "Our Instructors"/"Book Instantly" below already show their own
      // empty states — a failed fetch here shouldn't hang the whole screen.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Hero + gallery photos are pulled from real instructor records rather
  // than the site's old static crossfade — the local CONNECT_HERO_PHOTOS /
  // CONNECT_GALLERY_PHOTOS are only used before the fetch resolves or if
  // no instructor has photos yet.
  const heroPhotoUri = instructors.find((i) => i.header_image)?.header_image ?? null;
  const galleryPhotos = instructors.flatMap((i) => i.content_images).filter(Boolean);

  // "Like Bolt": nearest bookable instructors first once we have the
  // student's position — instructors without a saved location sort last
  // rather than being hidden, so browsing never breaks.
  const bookableWithDistance = bookableInstructors.map((ins) => ({
    ins,
    distanceKm: myCoords && ins.geo ? distanceKm(myCoords.lat, myCoords.lng, ins.geo.lat, ins.geo.lng) : null,
  }));
  const sortedBookable = myCoords
    ? [...bookableWithDistance].sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      })
    : bookableWithDistance;

  // "Find a teacher or student nearby" — instructors and students who've
  // both shared their location, combined into one distance-sorted list.
  // Only appears once we have the viewer's own position; people without a
  // saved location just don't show up here (they're still visible in the
  // sections above/below).
  type NearbyPerson = {
    uid: string;
    name: string;
    kind: 'instructor' | 'student';
    photo: string | null;
    distanceKm: number;
  };
  const nearbyPeople: NearbyPerson[] = myCoords
    ? [
        ...bookableInstructors
          .filter((ins) => ins.geo)
          .map((ins) => ({
            uid: ins.id,
            name: ins.full_name,
            kind: 'instructor' as const,
            photo: ins.photos[0] ?? null,
            distanceKm: distanceKm(myCoords.lat, myCoords.lng, ins.geo!.lat, ins.geo!.lng),
          })),
        ...models
          .filter((m) => m.geo && m.id !== session?.uid)
          .map((m) => ({
            uid: m.id,
            name: m.full_name,
            kind: 'student' as const,
            photo: m.photos[0] ?? null,
            distanceKm: distanceKm(myCoords.lat, myCoords.lng, m.geo!.lat, m.geo!.lng),
          })),
      ].sort((a, b) => a.distanceKm - b.distanceKm)
    : [];

  function openChatWith(uid: string, name: string) {
    if (!session) {
      navigation.getParent()?.dispatch(CommonActions.navigate({ name: 'ProfileTab', params: { screen: 'Login' } }));
      return;
    }
    navigation.getParent()?.dispatch(
      CommonActions.navigate({ name: 'DashboardTab', params: { screen: 'Chat', params: { otherUid: uid, otherName: name } } })
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* HERO */}
      <ImageBackground
        source={heroPhotoUri ? { uri: heroPhotoUri } : CONNECT_HERO_PHOTOS[0]}
        style={[styles.hero, { paddingTop: insets.top + 18 }]}
        resizeMode="cover"
      >
        {/* Dark scrim (not a flat brand-color wash) so text stays legible
            over this particular photo's light background while still
            reading as a real photographic hero, matching the Home hero's
            editorial tone. */}
        <LinearGradient
          colors={['rgba(11,11,12,0.45)', 'rgba(24,10,28,0.72)', 'rgba(11,11,12,0.82)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>KENYA &amp; WORLDWIDE</Text>
        </View>
        <Text style={styles.heroTitle}>Find Your Modeling Instructor</Text>
        <Text style={styles.heroSub}>
          Connect with verified catwalk, pageantry, posing &amp; grooming coaches — online or in person,
          near you or anywhere in the world.
        </Text>
        <View style={styles.heroBtnRow}>
          <Pressable style={styles.heroBtnSolid} onPress={() => navigation.navigate('BookTraining')}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.heroBtnSolidText}>Book Training</Text>
          </Pressable>
          <Pressable style={styles.heroBtnGhost} onPress={() => navigation.navigate('BecomeInstructor')}>
            <Ionicons name="school-outline" size={16} color="#fff" />
            <Text style={styles.heroBtnGhostText}>Become an Instructor</Text>
          </Pressable>
        </View>
      </ImageBackground>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatTile value={loading ? '–' : `${instructorCount ?? 0}+`} label="Verified Instructors" />
        <StatTile value="57+" label="Countries Served" />
        <StatTile value="8" label="Training Categories" />
      </View>

      {/* NEARBY PEOPLE — like Bolt: instructors and students who've shared
          their location, closest first. This is the first thing a signed-in
          student or a stranger who just registered sees on the home tab. */}
      <View style={styles.section}>
        <View style={styles.nearbyHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Nearby People</Text>
            <Text style={styles.sectionSub}>Instructors and students near you, closest first.</Text>
          </View>
          <Pressable style={styles.mapBtn} onPress={() => navigation.navigate('NearbyMap')}>
            <Ionicons name="map-outline" size={15} color="#fff" />
            <Text style={styles.mapBtnText}>Map</Text>
          </Pressable>
        </View>
        {nearbyPeople.length === 0 ? (
          <>
            <Pressable
              style={styles.mapPromptCard}
              disabled={locatingMe}
              onPress={() => (myCoords ? navigation.navigate('NearbyMap') : handleEnableLocation())}
            >
              {locatingMe ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons name="navigate-circle-outline" size={22} color={colors.primary} />
              )}
              <Text style={styles.mapPromptText}>
                {locatingMe
                  ? 'Getting your location…'
                  : myCoords
                    ? 'No one nearby has shared their location yet — open the map to check the area.'
                    : 'Tap to turn on location and find instructors and students near you.'}
              </Text>
            </Pressable>
            {locationMessage ? <Text style={styles.locationErrorText}>{locationMessage}</Text> : null}
          </>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow} style={styles.cardRowScroll}>
            {nearbyPeople.map((p) => (
              <Pressable
                key={`${p.kind}-${p.uid}`}
                style={styles.nearbyCard}
                onPress={() =>
                  p.kind === 'instructor'
                    ? navigation.navigate('InstructorProfileDetail', { uid: p.uid })
                    : navigation.getParent()?.dispatch(
                        CommonActions.navigate({ name: 'ModelsTab', params: { screen: 'ModelDetail', params: { modelId: p.uid } } })
                      )
                }
              >
                <BlogMedia source={p.photo ? { uri: p.photo } : fallbackInstructorPhoto(p.uid)} style={styles.nearbyPhoto} />
                <View style={styles.nearbyBody}>
                  <View style={styles.nearbyKindPill}>
                    <Text style={styles.nearbyKindText}>{p.kind === 'instructor' ? 'Instructor' : 'Student'}</Text>
                  </View>
                  <Text style={styles.tileName} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.metaInline}>
                    <Ionicons name="navigate" size={11} color={colors.primary} />
                    <Text style={styles.tileMeta}>{formatDistance(p.distanceKm)}</Text>
                  </View>
                  <Pressable style={styles.nearbyMessageBtn} onPress={() => openChatWith(p.uid, p.name)}>
                    <Ionicons name="chatbubble-outline" size={13} color="#fff" />
                    <Text style={styles.nearbyMessageBtnText}>Message</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* STYLE SHOWCASE — real portfolio photos pulled from instructor records */}
      <View style={[styles.section, { marginTop: spacing.xl }]}>
        <Text style={styles.sectionTitle}>Style Showcase</Text>
        <Text style={styles.sectionSub}>A look at the training and portfolio work happening on L&amp;C Connect.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
        {(galleryPhotos.length > 0 ? galleryPhotos.map((uri) => ({ uri })) : CONNECT_GALLERY_PHOTOS).map(
          (photo, idx) => (
            <Image key={idx} source={photo} style={styles.galleryPhoto} cachePolicy="memory-disk" transition={200} />
          )
        )}
      </ScrollView>

      {/* HOW IT WORKS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionSub}>Three simple steps to start training with L&amp;C Models Connect.</Text>
        <View style={{ gap: 12 }}>
          {STEPS.map((s) => (
            <View key={s.num} style={styles.stepCard}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* TRAINING CATEGORIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Categories</Text>
        <Text style={styles.sectionSub}>Choose the discipline you'd like to master.</Text>
        <View style={styles.chipGrid}>
          {CATEGORIES.map((c) => (
            <View key={c.label} style={styles.categoryChip}>
              <Ionicons name={c.icon} size={20} color={colors.primary} />
              <Text style={styles.categoryChipText}>{c.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* GROUP TRAINING */}
      <LinearGradient colors={['#1c1420', '#2a1030']} style={styles.groupBand}>
        <View style={styles.groupEyebrow}>
          <Text style={styles.groupEyebrowText}>GROUP TRAINING</Text>
        </View>
        <Text style={styles.groupTitle}>Learn Together as a Group</Text>
        <Text style={styles.groupDesc}>
          Training with friends in your area? We'll bring aspiring models near you together, match your
          group with a suitable instructor, and coordinate everything on your behalf.
        </Text>
        <Pressable
          style={styles.groupBtn}
          onPress={() => openWhatsApp('Hi, I would like to enquire about group training')}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.groupBtnText}>Request Group Training</Text>
        </Pressable>
      </LinearGradient>

      {/* BOOK INSTANTLY — app's own self-serve, real-slot-booking instructors */}
      {bookableInstructors.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Instantly</Text>
          <Text style={styles.sectionSub}>Real availability &amp; pricing — pick a slot and book in the app.</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            style={styles.cardRowScroll}
          >
            {sortedBookable.map(({ ins, distanceKm: dist }) => (
              <Pressable
                key={ins.id}
                style={styles.instructorTile}
                onPress={() => navigation.navigate('InstructorProfileDetail', { uid: ins.id })}
              >
                <View>
                  <BlogMedia
                    source={ins.photos[0] ? { uri: ins.photos[0] } : fallbackInstructorPhoto(ins.id)}
                    style={styles.tilePhoto}
                  />
                  {ins.verified ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
                    </View>
                  ) : null}
                  {ins.rating_count > 0 ? (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color={colors.gold} />
                      <Text style={styles.ratingBadgeText}>{ins.rating_avg.toFixed(1)}</Text>
                    </View>
                  ) : null}
                  {dist != null ? (
                    <View style={styles.distanceBadge}>
                      <Ionicons name="navigate" size={10} color="#fff" />
                      <Text style={styles.distanceBadgeText}>{formatDistance(dist)}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.tileBody}>
                  <Text style={styles.tileName} numberOfLines={1}>
                    {ins.full_name}
                  </Text>
                  {ins.location ? (
                    <View style={styles.metaInline}>
                      <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.tileMeta} numberOfLines={1}>{ins.location}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.tilePrice}>KSh {ins.price_per_session.toLocaleString()} / session</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* INSTRUCTOR DIRECTORY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Instructors</Text>
        <Text style={styles.sectionSub}>Approved modeling instructors ready to train you.</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : instructors.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No instructors listed yet — check back soon.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            style={styles.cardRowScroll}
          >
            {instructors.map((ins) => (
              <Pressable
                key={ins.id}
                style={styles.instructorTile}
                onPress={() => navigation.navigate('InstructorDetail', { instructorId: ins.id })}
              >
                <BlogMedia
                  source={ins.header_image ? { uri: ins.header_image } : fallbackInstructorPhoto(ins.id)}
                  style={styles.tilePhoto}
                />
                <View style={styles.tileBody}>
                  <Text style={styles.tileName} numberOfLines={1}>
                    {ins.name}
                  </Text>
                  {ins.location ? (
                    <View style={styles.metaInline}>
                      <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.tileMeta} numberOfLines={1}>{ins.location}</Text>
                    </View>
                  ) : null}
                  {ins.specialization ? (
                    <Text style={styles.tileSpec} numberOfLines={1}>{ins.specialization}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* CTA BUTTONS */}
      <View style={[styles.section, { gap: 12 }]}>
        <Button label="Book Training" variant="primary" onPress={() => navigation.navigate('BookTraining')} />
        <Button label="Become an Instructor" variant="outline" onPress={() => navigation.navigate('BecomeInstructor')} />
      </View>
    </ScrollView>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 30,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: '#fff', letterSpacing: 0.6 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 30, color: '#fff', lineHeight: 36, marginBottom: 10 },
  heroSub: { fontFamily: fonts.body, fontSize: 14.5, color: 'rgba(255,255,255,0.92)', lineHeight: 21, marginBottom: 22 },
  heroBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  heroBtnSolidText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  heroBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  heroBtnGhostText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    marginTop: -22,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 18,
    ...shadow.card,
  },
  statTile: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.primary },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  galleryRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  galleryPhoto: { width: 130, height: 170, borderRadius: radii.lg, backgroundColor: colors.surfaceAlt },
  sectionTitle: { ...typography.sectionTitle, marginBottom: 4 },
  sectionSub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, marginBottom: spacing.md },
  stepCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: fonts.bodyBold, color: '#fff', fontSize: 14 },
  stepTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 2 },
  stepDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  categoryChipText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  groupBand: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  groupEyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  groupEyebrowText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: '#ff9fd6', letterSpacing: 0.8 },
  groupTitle: { fontFamily: fonts.heading, fontSize: 22, color: '#fff', marginBottom: 8 },
  groupDesc: { fontFamily: fonts.body, fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 18 },
  groupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: radii.pill,
    paddingVertical: 13,
  },
  groupBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: '#fff' },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 30 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
  cardRowScroll: { marginHorizontal: -spacing.lg },
  cardRow: { gap: 14, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  instructorTile: {
    width: 176,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  tilePhoto: { width: '100%', height: 200, backgroundColor: colors.surfaceAlt },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(11,11,12,0.72)',
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  ratingBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: '#fff' },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  distanceBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: '#fff' },
  nearbyHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  mapBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: '#fff' },
  mapPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  mapPromptText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  locationErrorText: { fontFamily: fonts.body, fontSize: 12, color: colors.danger, marginTop: 6, lineHeight: 16 },
  nearbyCard: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  nearbyPhoto: { width: '100%', height: 140 },
  nearbyBody: { padding: spacing.sm, gap: 4 },
  nearbyKindPill: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingVertical: 2, paddingHorizontal: 8 },
  nearbyKindText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  nearbyMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 7,
    marginTop: 4,
  },
  nearbyMessageBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: '#fff' },
  tileBody: { padding: spacing.sm, gap: 3 },
  tileName: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tileMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, flexShrink: 1 },
  tileSpec: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.primary, marginTop: 2 },
  tilePrice: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary, marginTop: 2 },
});
