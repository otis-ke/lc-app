import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { fetchBlogPosts, fetchDiversityPhotos, fetchHomeHeroImage, fetchModels } from '../../lib/content';
import { ABOUT_PHOTO_1, ABOUT_PHOTO_2, DIVERSITY_PHOTOS, HOME_HERO_PHOTO } from '../../data/localImages';
import type { ImageSourcePropType } from 'react-native';
import type { BlogPost, ModelProfile } from '../../types';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const PROGRAM_PREVIEWS: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Runway', icon: 'walk-outline' },
  { label: 'Pageantry', icon: 'trophy-outline' },
  { label: 'Commercial', icon: 'camera-outline' },
  { label: 'Etiquette', icon: 'sparkles-outline' },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  // Cross-tab deep links (Home -> Models/Blog tabs) aren't representable in
  // HomeStackParamList, so we bypass the typed overload here rather than
  // fight `as never` through react-navigation's overload resolution.
  const crossNavigate = navigation.navigate as unknown as (name: string, params?: object) => void;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [models, setModels] = useState<ModelProfile[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  // Hero + diversity photos come from the website's own admin-managed
  // Firestore collections (main_header_banner / diversity_and_inclusivity)
  // — the bundled local photos are only a last-resort fallback if those
  // collections are empty, never the primary source.
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [diversityPhotos, setDiversityPhotos] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBlogPosts();
        setPosts(data.slice(0, 5));
      } catch {
        // network failure — empty state below covers it
      } finally {
        setPostsLoading(false);
      }
    })();
    (async () => {
      try {
        const data = await fetchModels();
        setModels(data.slice(0, 4));
      } catch {
        // network failure — empty state below covers it
      } finally {
        setModelsLoading(false);
      }
    })();
    fetchHomeHeroImage().then(setHeroImage).catch(() => {});
    fetchDiversityPhotos().then(setDiversityPhotos).catch(() => {});
  }, []);

  const aboutPhotoMain: ImageSourcePropType = models[0]?.header_image
    ? { uri: models[0].header_image }
    : ABOUT_PHOTO_1;
  const aboutPhotoSecondary: ImageSourcePropType = models[1]?.header_image
    ? { uri: models[1].header_image }
    : ABOUT_PHOTO_2;

  return (
    <Screen dark scroll padded={false}>
      {/* Photographic hero with dark scrim so the wordmark/CTAs stay legible */}
      <ImageBackground
        source={heroImage ? { uri: heroImage } : HOME_HERO_PHOTO}
        style={styles.hero}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(11,11,12,0.55)', '#0b0b0c']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <Text style={styles.wordmark}>
            L<Text style={{ fontFamily: fonts.body }}>&</Text>C
          </Text>
          <Text style={styles.wordmarkSub}>MODELING ACADEMY</Text>
          <Text style={styles.tagline}>Best Modeling School in Kenya</Text>
          <Text style={styles.heroBlurb}>
            Runway, pageantry & portfolio training led by industry experts — nurturing confidence
            and skill for every aspiring model.
          </Text>
          <View style={styles.heroActions}>
            <View style={{ flex: 1 }}>
              <Button
                label="Get Scouted"
                variant="gold"
                onPress={() => crossNavigate('ModelsTab', { screen: 'GetScouted' })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Enroll Now" variant="primary" onPress={() => navigation.navigate('Enroll')} />
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Light content sheet, overlapping the hero for a native layered feel */}
      <View style={styles.sheet}>
        <SectionTitle title="About Us" />
        <View style={styles.aboutRow}>
          <View style={styles.aboutPhotos}>
            <Image source={aboutPhotoMain} style={styles.aboutPhotoMain} cachePolicy="memory-disk" transition={200} />
            <Image
              source={aboutPhotoSecondary}
              style={styles.aboutPhotoSecondary}
              cachePolicy="memory-disk"
              transition={200}
            />
          </View>
          <View style={styles.aboutTextWrap}>
            <Text style={styles.paragraph}>
              L&C Modeling School is a modeling training and development academy founded in 2022 by
              Linkosiclothing. L&C is the most affordable, rewarding, and best modeling school
              located in Nairobi, Kenya. We empower and train both genders from the age of 8 years
              onwards.
            </Text>
            <Text style={[styles.paragraph, { marginTop: spacing.sm }]}>
              Are you an aspiring model looking for an affordable, best-in-class modeling school in
              Nairobi? Register today and become your dream — we advocate for equality, diversity,
              and togetherness, with no restrictions on body type.
            </Text>
          </View>
        </View>

        <SectionTitle
          title={
            <>
              Diversity <Text style={{ fontFamily: fonts.body }}>&</Text> Inclusivity
            </>
          }
          subtitle="A glimpse of the many faces, cultures, and stories that make our community."
          style={{ marginTop: spacing.xl }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(diversityPhotos.length > 0 ? diversityPhotos.map((uri) => ({ uri })) : DIVERSITY_PHOTOS).map(
            (photo, idx) => (
              <Image key={idx} source={photo} style={styles.diversityPhoto} cachePolicy="memory-disk" transition={200} />
            )
          )}
        </ScrollView>

        <SectionTitle title="Our Programs" style={{ marginTop: spacing.xl }} />
        <View style={styles.programGrid}>
          {PROGRAM_PREVIEWS.map((p) => (
            <Pressable key={p.label} style={styles.programCard} onPress={() => navigation.navigate('Programs')}>
              <View style={styles.programIconWrap}>
                <Ionicons name={p.icon} size={22} color={colors.secondary} />
              </View>
              <Text style={styles.programLabel}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle
          title="Featured Stories"
          subtitle="Top stories, fashion trends, and model previews."
          style={{ marginTop: spacing.xl }}
        />
        {postsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
        ) : posts.length === 0 ? null : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollRow}>
            {posts.map((post) => (
              <Pressable
                key={post.id}
                style={styles.storyCard}
                onPress={() => crossNavigate('BlogTab', { screen: 'BlogDetail', params: { postId: post.id } })}
              >
                {post.header_image ? (
                  <Image
                    source={{ uri: post.header_image }}
                    style={styles.storyImage}
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.storyImage, styles.imagePlaceholder]}>
                    <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                  </View>
                )}
                <Text style={styles.storyTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.storyRead}>Read →</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <SectionTitle
          title="Book One of Our Models"
          subtitle="Available professional models for bookings and hire."
          style={{ marginTop: spacing.xl }}
        />
        {modelsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
        ) : models.length === 0 ? null : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollRow}>
            {models.map((m) => (
              <Pressable
                key={m.id}
                style={styles.modelCard}
                onPress={() => crossNavigate('ModelsTab', { screen: 'ModelDetail', params: { modelId: m.id } })}
              >
                {m.header_image ? (
                  <Image
                    source={{ uri: m.header_image }}
                    style={styles.modelImage}
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.modelImage, styles.imagePlaceholder]}>
                    <Ionicons name="person-outline" size={26} color={colors.textMuted} />
                  </View>
                )}
                <Text style={styles.modelName} numberOfLines={1}>
                  {m.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View style={{ marginTop: spacing.md }}>
          <Button
            label="View All Models"
            variant="outline"
            onPress={() => crossNavigate('ModelsTab', { screen: 'ModelsHub' })}
          />
        </View>

        <Card style={{ marginTop: spacing.xl }}>
          <Text style={styles.ctaTitle}>Let's Talk</Text>
          <Text style={styles.mutedText}>
            Questions about a program, or interested in collaborating with L&C? We'd love to hear
            from you.
          </Text>
          <View style={[styles.heroActions, { marginTop: spacing.md }]}>
            <View style={{ flex: 1 }}>
              <Button label="Contact Us" variant="primary" onPress={() => navigation.navigate('Contact')} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Partner With Us" variant="outline" onPress={() => navigation.navigate('Partner')} />
            </View>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerWordmark}>
            L<Text style={{ fontFamily: fonts.body }}>&</Text>C MODELING
          </Text>
          <Text style={styles.footerCredit}>L&C Modeling school is regulated by Linkosiclothing</Text>
          <View style={styles.socialRow}>
            <SocialIcon icon="logo-whatsapp" onPress={() => Linking.openURL('https://wa.me/254702066492')} />
            <SocialIcon icon="call-outline" onPress={() => Linking.openURL('tel:+254702066492')} />
            <SocialIcon icon="mail-outline" onPress={() => Linking.openURL('mailto:Linkosiclothing@gmail.com')} />
            <SocialIcon
              icon="logo-instagram"
              onPress={() => Linking.openURL('https://www.instagram.com/lc_modeling_school')}
            />
            <SocialIcon
              icon="logo-facebook"
              onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=100088956974742')}
            />
          </View>
          <Text style={styles.footerRights}>© L&C Modeling. All rights reserved.</Text>
        </View>
      </View>
    </Screen>
  );
}

function SocialIcon({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={styles.socialIcon} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.textOnDark} />
    </Pressable>
  );
}

const CARD_W = 220;

const styles = StyleSheet.create({
  hero: {
    width: '100%',
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  wordmark: { fontFamily: fonts.wordmark, fontSize: 56, color: colors.textOnDark, letterSpacing: 1 },
  wordmarkSub: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.gold, letterSpacing: 3, marginTop: 2 },
  tagline: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textOnDark,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  heroBlurb: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  heroActions: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.lg },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  paragraph: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text, lineHeight: 22 },
  mutedText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  aboutRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  aboutPhotos: { width: 110, marginRight: spacing.sm },
  aboutPhotoMain: {
    width: 110,
    height: 130,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    ...shadow.card,
  },
  aboutPhotoSecondary: {
    width: 78,
    height: 96,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    position: 'absolute',
    right: -8,
    bottom: -20,
    borderWidth: 3,
    borderColor: colors.bg,
    ...shadow.card,
  },
  aboutTextWrap: { flex: 1, paddingTop: 4 },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  diversityPhoto: {
    width: 100,
    height: 100,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
  },
  programGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  programCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  programIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  programLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  hScrollRow: { gap: spacing.md, paddingRight: spacing.lg, paddingVertical: spacing.xs },
  storyCard: { width: CARD_W },
  storyImage: { width: CARD_W, height: 130, borderRadius: radii.lg, backgroundColor: colors.surfaceAlt },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  storyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginTop: spacing.sm },
  storyRead: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary, marginTop: 4 },
  modelCard: { width: 140 },
  modelImage: { width: 140, height: 170, borderRadius: radii.lg, backgroundColor: colors.surfaceAlt },
  modelName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginTop: spacing.sm },
  ctaTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.text, marginBottom: 6 },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerWordmark: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  footerCredit: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  socialRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  socialIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRights: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted, marginTop: spacing.md },
});
