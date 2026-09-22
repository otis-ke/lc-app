import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { fetchHomeCoachingHeroImage } from '../../lib/content';
import { COLLAB_PHOTO } from '../../data/localImages';
import { colors, fonts, radii, spacing } from '../../theme/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

// Copy from homecoaching.html's "Home Coaching for Modeling School" program card.
const HIGHLIGHTS = [
  'Runway walking techniques and posture',
  'Facial expressions and posing',
  'Personalized image consultancy',
  'Developing a signature style',
  'Building confidence and presence',
  'Understanding and navigating the modeling industry',
  'Professional portfolio development',
  'Nutrition and fitness for models',
  'Effective communication and networking skills',
];

export default function HomeCoachingScreen() {
  const navigation = useNavigation<Nav>();
  // Hero comes from the website's homecoaching_home collection — local
  // photo is only a fallback until it loads / if empty.
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    fetchHomeCoachingHeroImage().then(setHeroImage).catch(() => {});
  }, []);

  return (
    <Screen scroll padded>
      <ImageBackground
        source={heroImage ? { uri: heroImage } : COLLAB_PHOTO}
        style={styles.hero}
        imageStyle={{ borderRadius: radii.xl }}
      >
        <LinearGradient
          colors={['rgba(11,11,12,0.35)', 'rgba(11,11,12,0.75)']}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="home-outline" size={26} color={colors.gold} />
        <Text style={styles.heroTitle}>Home Coaching</Text>
        <Text style={styles.heroSubtitle}>
          Personalized, private modeling lessons delivered at your doorstep in Nairobi.
        </Text>
      </ImageBackground>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.paragraph}>
          Our home coaching program is tailored to help aspiring models develop their skills in
          the comfort of their own home. These one-on-one sessions cover all aspects of modeling,
          ensuring comprehensive development at a pace that suits you.
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.cardTitle}>What's Covered</Text>
        {HIGHLIGHTS.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginTop: 2 }} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </Card>

      <Button
        label="Register for Home Coaching"
        variant="gold"
        onPress={() => navigation.navigate('Enroll', { course: 'Home Coaching' })}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'flex-start',
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'flex-end',
  },
  heroTitle: { fontFamily: fonts.heading, fontSize: 26, color: colors.textOnDark, marginTop: spacing.sm },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: colors.textOnDarkMuted,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  paragraph: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text, lineHeight: 22 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 },
});
