import React, { useEffect, useState } from 'react';
import { Image, LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { HeadingText } from '../../components/HeadingText';
import { Button } from '../../components/Button';
import { fetchEnrollHeroImage } from '../../lib/content';
import { PROGRAM_PHOTOS } from '../../data/localImages';
import { colors, fonts, radii, spacing } from '../../theme/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProgramSection {
  heading?: string;
  paragraph?: string;
  items?: string[];
}

interface Program {
  id: string;
  title: string;
  summary: string;
  courseValue: string;
  sections: ProgramSection[];
}

// Copy, pricing and schedule text lifted verbatim from programs.html
// (#programs section) — do not paraphrase, this is what's quoted to parents.
const PROGRAMS: Program[] = [
  {
    id: 'six-week',
    title: '6-Week Professional Modeling Program',
    courseValue: '6-Week Professional Modeling Program',
    summary:
      'Designed for aspiring models who want to gain confidence, industry knowledge, and practical skills — a complete, hands-on introduction to the modeling world.',
    sections: [
      {
        heading: 'Why Join Us?',
        items: [
          'Hands-on training in runway techniques, posing, and personal branding',
          'Learn about modeling contracts, safety, and professionalism',
          'Build a complete modeling portfolio and receive expert feedback',
          'Gain confidence and on-camera comfort',
          'Receive a branded L&C T-shirt and professional Handbook',
          'Become part of a growing modeling community and network',
        ],
      },
      {
        heading: 'Training Fees',
        items: [
          'Standard Package: Ksh 27,000 (includes registration, T-shirt, and Handbook)',
          'Referral/Friends Package: Ksh 24,500 each',
          'Family Package: Ksh 23,500 each',
          'Trial Package: 3 weeks for Ksh 15,000 (handbook sold separately)',
          'Flexible Payment Plan: Start with Ksh 13,500, balance within 3 weeks',
        ],
      },
      {
        heading: 'Training Schedule',
        items: ['Monday – Thursday: General Students', 'Saturday & Sunday: Special sessions for school-going kids'],
      },
    ],
  },
  {
    id: 'workshop',
    title: 'L&C Models Workshop Program',
    courseValue: 'L&C Models Workshop Program',
    summary:
      'Ideal for anyone seeking to sharpen their modeling skills, prepare for photoshoots, or boost confidence before entering the professional scene.',
    sections: [
      {
        heading: "What You'll Learn",
        items: [
          'Posing for headshots, fashion, and commercial work',
          'Facial expression control and movement choreography',
          'Wardrobe, styling, and grooming basics',
          'Runway techniques: stance, rhythm, and turns',
          'Portfolio development and comp card presentation',
          'Audition and casting preparation (including self-tapes)',
        ],
      },
      {
        heading: 'Schedule',
        items: ['Every Saturday — 10:00 AM to 1:00 PM', 'Location: L&C Modeling Studio'],
      },
      {
        heading: 'Fees',
        items: [
          'Slot Price: Ksh 2,000 per session',
          'Payments via M-Pesa or Bank Transfer',
          'Includes workshop materials, refreshments, and critique sessions',
        ],
      },
    ],
  },
  {
    id: 'pageantry',
    title: 'Pageantry Program',
    courseValue: 'Pageantry Program',
    summary:
      'Shapes, grooms, and prepares girls and women into confident models and beauty queens — building leadership, confidence, and social impact through elegant presentation.',
    sections: [
      {
        heading: 'Highlights',
        items: [
          'Art of Communication: Interview skills, speech enhancement, mic use',
          'Ramp Walk: Posture, stage presence, and elegance',
          'Fitness & Diet: Nutrition and exercise routines',
          'Camera Technique: On-camera confidence and photoshoot prep',
          'Makeup & Grooming: Practical sessions for assignments',
          'Table Etiquette and Social Graces: Dining, manners, and presence',
          'Power Dressing: Styling tips for different body types',
          'Q&A Preparation: Handling pageant questions confidently',
        ],
      },
      {
        heading: 'Special Focus',
        paragraph:
          'The Miss L&C Competition offers a real pageantry experience for children and young women aged 12 and above — promoting confidence, public speaking, and positive self-image.',
      },
    ],
  },
  {
    id: 'runway',
    title: 'Runway Modeling',
    courseValue: 'Runway Modeling',
    summary:
      'Helps students perfect their walk, posture, and stage presence while maintaining confidence and expression — where models learn to shine in fashion shows and castings.',
    sections: [
      {
        items: [
          'Walking confidently on the runway',
          'Perfecting your posture and stage confidence',
          'Creating strong portfolio poses',
          'Facial expression and control',
          'Building confidence for castings and fashion events',
        ],
      },
    ],
  },
  {
    id: 'commercial',
    title: 'Commercial Modeling',
    courseValue: 'Commercial Modeling',
    summary:
      'Welcomes all ages, sizes, and looks — representing real people in advertisements, campaigns, and media. Prepares students to work confidently in commercial and product modeling.',
    sections: [
      {
        items: [
          'Building your professional portfolio',
          'Creating your social media presence',
          'Fitness and diet fundamentals',
          'Camera-facing techniques and expressions',
        ],
      },
    ],
  },
  {
    id: 'etiquette',
    title: 'Etiquette Classes',
    courseValue: 'Etiquette Classes',
    summary:
      "Etiquette is more than rules — it's the art of confidence and grace. Equips students with essential life and social skills to thrive in professional and personal environments.",
    sections: [
      {
        items: [
          'Dining etiquette and table manners',
          'Image consultancy, style, and beauty',
          'Elegant social skills and graceful movement',
          'Confidence-building and effective communication',
          'Conversation etiquette and eye contact mastery',
          'Social media, email, and phone manners',
          'Handling bad manners gracefully',
        ],
      },
    ],
  },
];

export default function ProgramsScreen() {
  const navigation = useNavigation<Nav>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Hero comes from the website's enroll_header collection (shared with the
  // Enroll screen) — local photo is only a fallback until it loads / if empty.
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollHeroImage().then(setHeroImage).catch(() => {});
  }, []);

  function toggle(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <Screen scroll padded={false}>
      <Image
        source={heroImage ? { uri: heroImage } : PROGRAM_PHOTOS[0]}
        style={styles.hero}
        resizeMode="cover"
      />
      <View style={styles.body}>
      <SectionTitle title="Our Programs" subtitle="Six ways to start your modeling journey with L&C." />
      {PROGRAMS.map((program) => {
        const open = expandedId === program.id;
        return (
          <Card key={program.id} style={styles.card}>
            <Pressable style={styles.header} onPress={() => toggle(program.id)}>
              <View style={{ flex: 1 }}>
                <HeadingText style={styles.title}>{program.title}</HeadingText>
                <Text style={styles.summary} numberOfLines={open ? undefined : 2}>
                  {program.summary}
                </Text>
              </View>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
                style={{ marginLeft: spacing.sm }}
              />
            </Pressable>

            {open ? (
              <View style={styles.details}>
                {program.sections.map((section, i) => (
                  <View key={i} style={styles.section}>
                    {section.heading ? <Text style={styles.sectionHeading}>{section.heading}</Text> : null}
                    {section.paragraph ? <Text style={styles.paragraph}>{section.paragraph}</Text> : null}
                    {section.items?.map((item, j) => (
                      <View key={j} style={styles.bulletRow}>
                        <Ionicons name="checkmark-circle" size={15} color={colors.success} style={{ marginTop: 2 }} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                <Button
                  label="Enroll in this program"
                  variant="gold"
                  onPress={() => navigation.navigate('Enroll', { course: program.courseValue })}
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            ) : null}
          </Card>
        );
      })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surfaceAlt,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  body: { padding: spacing.lg },
  card: { marginBottom: spacing.md, padding: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  summary: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  details: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  section: { marginTop: spacing.sm },
  sectionHeading: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: 6 },
  paragraph: { fontFamily: fonts.body, fontSize: 13.5, color: colors.text, lineHeight: 20 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingRight: spacing.xs },
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.text, lineHeight: 19 },
});
