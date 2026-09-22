import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { SectionTitle } from '../../components/Card';
import { BlogMedia } from '../../components/BlogMedia';
import { fetchModels, fetchModelsHeroImage } from '../../lib/content';
import { fallbackModelPhoto, MODEL_PHOTOS } from '../../data/localImages';
import { colors, fonts, gradients, radii, shadow, spacing } from '../../theme/theme';
import type { ModelsStackParamList } from '../../navigation/types';
import type { ModelProfile } from '../../types';

type Nav = NativeStackNavigationProp<ModelsStackParamList>;

export default function ModelsHubScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [models, setModels] = useState<ModelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Hero photo comes from the website's models_header collection — local
  // photo is only a fallback if that collection is empty.
  const [heroImage, setHeroImage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErrorMsg(null);
      const data = await fetchModels();
      setModels(data);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Could not load models right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchModelsHeroImage().then(setHeroImage).catch(() => {});
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  return (
    <Screen
      scroll
      padded={false}
      edges={['left', 'right', 'bottom']}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <ImageBackground
        source={heroImage ? { uri: heroImage } : MODEL_PHOTOS[0]}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={gradients.brand as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.72 }]}
        />
        <Text style={styles.eyebrow}>NAIROBI, KENYA</Text>
        <Text style={styles.heroTitle}>Our Models</Text>
        <Text style={styles.heroSubtitle}>
          Discover L&C's roster, get scouted, or book standout talent for your next shoot.
        </Text>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.ctaRow}>
          <Pressable
            style={[styles.ctaCard, styles.ctaCardDark]}
            onPress={() => navigation.navigate('GetScouted')}
          >
            <View style={styles.ctaIconWrapGold}>
              <Ionicons name="camera" size={20} color={colors.ink} />
            </View>
            <Text style={styles.ctaTitleLight}>Get Scouted</Text>
            <Text style={styles.ctaSubLight}>Start your modeling journey</Text>
          </Pressable>

          <Pressable
            style={[styles.ctaCard, styles.ctaCardLight]}
            onPress={() => navigation.navigate('BookModel')}
          >
            <View style={styles.ctaIconWrap}>
              <Ionicons name="briefcase" size={20} color={colors.primary} />
            </View>
            <Text style={styles.ctaTitle}>Book a Model</Text>
            <Text style={styles.ctaSub}>For shoots &amp; campaigns</Text>
          </Pressable>

          <Pressable
            style={[styles.ctaCard, styles.ctaCardLight]}
            onPress={() => navigation.navigate('OnlineClassSignup')}
          >
            <View style={styles.ctaIconWrap}>
              <Ionicons name="school" size={20} color={colors.primary} />
            </View>
            <Text style={styles.ctaTitle}>Online Classes</Text>
            <Text style={styles.ctaSub}>Learn from anywhere</Text>
          </Pressable>
        </View>

        <SectionTitle title="The Roster" subtitle="Faces we've scouted, trained and placed" />

        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {!loading && errorMsg && (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
            <Text style={styles.emptyText}>{errorMsg}</Text>
          </View>
        )}

        {!loading && !errorMsg && models.length === 0 && (
          <View style={styles.centerBox}>
            <Ionicons name="sparkles-outline" size={26} color={colors.textMuted} />
            <Text style={styles.emptyText}>No models published yet — check back soon!</Text>
          </View>
        )}

        {!loading && !errorMsg && models.length > 0 && (
          <View style={styles.list}>
            {models.map((model) => (
              <Pressable
                key={model.id}
                style={styles.modelCard}
                onPress={() => navigation.navigate('ModelDetail', { modelId: model.id })}
              >
                {/* Same fixed 16:9 frame the blog feed uses — a blurred,
                    oversized copy fills the frame behind a full "contain"
                    copy, so the whole photo is always visible, whatever its
                    original aspect ratio, instead of a hard crop. */}
                <BlogMedia
                  source={model.header_image ? { uri: model.header_image } : fallbackModelPhoto(model.id)}
                  style={styles.modelImage}
                />
                <View style={styles.modelCardBody}>
                  <Text style={styles.modelName} numberOfLines={1}>
                    {model.name}
                  </Text>
                  {model.text_description ? (
                    <Text style={styles.modelBlurb} numberOfLines={2}>
                      {model.text_description}
                    </Text>
                  ) : null}
                  <View style={styles.modelCardFooter}>
                    <Text style={styles.viewProfile}>View Profile</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
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
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  // Same size/weight/line-height as the Connect and Blog hero headlines —
  // one consistent "hero headline" style across every tab's landing page.
  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: 36,
    color: '#fff',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.9)',
    maxWidth: 320,
  },
  body: { padding: spacing.lg },
  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  ctaCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 118,
    justifyContent: 'flex-end',
  },
  ctaCardDark: { backgroundColor: colors.ink, ...shadow.card },
  ctaCardLight: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  ctaIconWrapGold: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ctaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ctaTitleLight: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.goldLight },
  ctaSubLight: { fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(245,243,238,0.7)', marginTop: 2 },
  ctaTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  ctaSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  centerBox: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  list: { gap: 14 },
  modelCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  // Full-width 16:9 frame, matching BlogListScreen's .post-media treatment.
  modelImage: { width: '100%', aspectRatio: 16 / 9 },
  modelCardBody: { padding: spacing.md, gap: 4 },
  modelName: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  modelBlurb: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, lineHeight: 19, marginTop: 2 },
  modelCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  viewProfile: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.primary },
});
