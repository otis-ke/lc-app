import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { BlogStackParamList } from '../../navigation/types';
import { fetchBlogPost } from '../../lib/content';
import type { BlogPost } from '../../types';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import { PROGRAM_PHOTOS, LOGO_TRANSPARENT } from '../../data/localImages';
import { BlogMedia } from '../../components/BlogMedia';

const LIKED_KEY = 'lc-blog-liked-posts';

function fallbackBlogPhoto(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PROGRAM_PHOTOS[hash % PROGRAM_PHOTOS.length];
}

// ~200 words/min, same as the site's getReadingTime().
function getReadingTime(content: string[]): number {
  const words = content.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Same relative-time format as the card list / the site's getRelativeTime()
// — the reader overlay on the website shows relative time too (taken
// straight from the card), not an absolute date.
function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const week = Math.round(day / 7);
  const month = Math.round(day / 30);
  const year = Math.round(day / 365);
  if (sec < 60) return 'Just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  if (week < 5) return `${week}w ago`;
  if (month < 12) return `${month}mo ago`;
  return `${year}y ago`;
}

export default function BlogDetailScreen() {
  const route = useRoute<RouteProp<BlogStackParamList, 'BlogDetail'>>();
  const { postId } = route.params;
  const { height: windowHeight } = useWindowDimensions();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  // Scroll-based reading progress bar, matching the site reader's
  // .reader-progress__bar (tracks how far through the article you are).
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    const pct = scrollable <= 0 ? 100 : (contentOffset.y / scrollable) * 100;
    setProgress(Math.min(100, Math.max(0, pct)));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchBlogPost(postId);
        if (active) setPost(data);
      } catch {
        if (active) setPost(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [postId]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LIKED_KEY);
        const likedIds: string[] = raw ? JSON.parse(raw) : [];
        setLiked(likedIds.includes(postId));
      } catch {
        // ignore — local like state is best-effort
      }
    })();
  }, [postId]);

  const toggleLike = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LIKED_KEY);
      const likedIds: string[] = raw ? JSON.parse(raw) : [];
      // Local-only MVP like counter, keyed by post id in AsyncStorage — mirrors
      // the site's localStorage-based like button. A real "likes" feature
      // would move this to a Firestore `blog_likes` collection keyed by
      // postId_userId so likes are shared/counted server-side instead of per-device.
      const next = liked ? likedIds.filter((id) => id !== postId) : [...likedIds, postId];
      await AsyncStorage.setItem(LIKED_KEY, JSON.stringify(next));
      setLiked(!liked);
    } catch {
      // ignore
    }
  }, [liked, postId]);

  const handleShare = useCallback(() => {
    if (!post) return;
    const excerpt = post.content[0] ?? '';
    Share.share({ message: `${post.title}\n\n${excerpt}` }).catch(() => {});
  }, [post]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!post) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
        <Text style={styles.emptyText}>Story not found.</Text>
      </View>
    );
  }

  const readMin = getReadingTime(post.content);
  const relTime = getRelativeTime(post.published_on);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      {/* height: 40% of viewport, matching .reader-media { height: 40vh } in
          blog.css exactly. */}
      <BlogMedia
        source={post.header_image ? { uri: post.header_image } : fallbackBlogPhoto(post.id)}
        style={[styles.hero, { height: windowHeight * 0.4 }]}
      />

      <View style={styles.body}>
        <Text style={styles.title}>{post.title}</Text>

        <View style={styles.sourceRow}>
          <Image source={LOGO_TRANSPARENT} style={styles.sourceAvatar} />
          <Text style={styles.sourceName}>L&amp;C Modeling</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{relTime}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{readMin} min read</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={toggleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.primary : colors.text} />
            <Text style={[styles.actionText, liked && { color: colors.primary }]}>{liked ? 'Liked' : 'Like'}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {post.content.map((para, i) => (
          <Text key={i} style={styles.paragraph}>
            {para}
          </Text>
        ))}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.bg, padding: spacing.lg },
  progressTrack: { height: 3, backgroundColor: colors.border, width: '100%' },
  progressBar: { height: 3, backgroundColor: colors.primary },
  hero: { width: '100%', backgroundColor: colors.surfaceAlt },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { ...typography.pageTitle, lineHeight: 32, marginBottom: 10 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sourceAvatar: { width: 18, height: 18, borderRadius: 9 },
  sourceName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  metaText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
  actionRow: { flexDirection: 'row', gap: 22, marginBottom: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginBottom: spacing.lg },
  paragraph: { fontFamily: fonts.body, fontSize: 16.5, color: colors.text, lineHeight: 28, marginBottom: 20 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
