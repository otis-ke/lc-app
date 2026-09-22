import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BlogStackParamList } from '../../navigation/types';
import { fetchBlogPosts } from '../../lib/content';
import type { BlogPost } from '../../types';
import { colors, fonts, radii, spacing, shadow } from '../../theme/theme';
import { PROGRAM_PHOTOS, LOGO_TRANSPARENT } from '../../data/localImages';
import { BlogMedia } from '../../components/BlogMedia';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKED_KEY = 'lc-blog-liked-posts';

type Nav = NativeStackNavigationProp<BlogStackParamList>;

// Discover-style relative time ("Just now", "5m ago", "2d ago"...) — mirrors
// the getRelativeTime() helper in the site's blog.js.
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

// ~200 words/min, same as the site's getReadingTime().
function getReadingTime(content: string[]): number {
  const words = content.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function BlogListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchBlogPosts();
      setPosts(data);
      setLoading(false);
    })();
    AsyncStorage.getItem(LIKED_KEY)
      .then((raw) => setLikedIds(raw ? JSON.parse(raw) : []))
      .catch(() => {});
  }, []);

  const toggleLike = async (postId: string) => {
    const isLiked = likedIds.includes(postId);
    const next = isLiked ? likedIds.filter((id) => id !== postId) : [...likedIds, postId];
    setLikedIds(next);
    try {
      await AsyncStorage.setItem(LIKED_KEY, JSON.stringify(next));
    } catch {
      // best-effort local persistence only
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.content.join(' ').toLowerCase().includes(q));
  }, [posts, query]);

  // Hero stats mirror the site's updateHeroStats(): computed from every
  // loaded post (not the filtered/search set) — total story count, summed
  // reading minutes across all posts, and the most recent post's relative time.
  const heroStats = useMemo(() => {
    if (posts.length === 0) return { count: 0, totalMin: 0, updated: '–' };
    const totalMin = posts.reduce((sum, p) => sum + getReadingTime(p.content), 0);
    return { count: posts.length, totalMin, updated: getRelativeTime(posts[0].published_on) };
  }, [posts]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.eyebrow}>L&amp;C MODELING BLOG</Text>
        <Text style={styles.heroTitle}>
          Stories, tips <Text style={{ fontFamily: fonts.body }}>&</Text> trends from the runway
        </Text>
        <Text style={styles.heroSub}>
          Discover the latest trends in modeling, tips from industry experts, and real stories from our students.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{loading ? '–' : heroStats.count}</Text>
            <Text style={styles.statLabel}>Stories</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{loading ? '–' : heroStats.totalMin}</Text>
            <Text style={styles.statLabel}>Min of reading</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{loading ? '–' : heroStats.updated}</Text>
            <Text style={styles.statLabel}>Last updated</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.85)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stories…"
            placeholderTextColor="rgba(255,255,255,0.65)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
      </LinearGradient>

      {query.trim() ? (
        <Text style={styles.searchNote}>
          {filtered.length === 0
            ? `No stories match "${query.trim()}"`
            : `${filtered.length} ${filtered.length === 1 ? 'story matches' : 'stories match'} "${query.trim()}"`}
        </Text>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: 90 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="albums-outline" size={30} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {query ? `No stories match "${query}"` : 'No stories published yet — check back soon.'}
            </Text>
          </View>
        ) : (
          filtered.map((post, idx) => {
            const readMin = getReadingTime(post.content);
            const relTime = getRelativeTime(post.published_on);
            const isLiked = likedIds.includes(post.id);
            return (
              <Pressable
                key={post.id}
                style={styles.card}
                onPress={() => navigation.navigate('BlogDetail', { postId: post.id })}
              >
                {/* 16:9 frame, matching .post-media in blog.css exactly —
                    same fixed aspect ratio the website uses for every card. */}
                <BlogMedia
                  source={post.header_image ? { uri: post.header_image } : PROGRAM_PHOTOS[idx % PROGRAM_PHOTOS.length]}
                  style={styles.cardImg}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <View style={styles.cardMetaRow}>
                    <Image source={LOGO_TRANSPARENT} style={styles.sourceAvatar} />
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      L&amp;C Modeling
                    </Text>
                    <View style={styles.dot} />
                    <Text style={styles.cardMeta}>{relTime}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.cardMeta}>{readMin} min read</Text>
                  </View>
                  {post.content[0] ? (
                    <Text style={styles.cardPreview} numberOfLines={2}>
                      {post.content[0]}
                    </Text>
                  ) : null}
                  <View style={styles.cardActionsRow}>
                    <Pressable
                      hitSlop={8}
                      style={styles.cardActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLike(post.id);
                      }}
                    >
                      <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={17}
                        color={isLiked ? colors.primary : colors.textMuted}
                      />
                      <Text style={[styles.cardActionText, isLiked && { color: colors.primary }]}>Like</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={8}
                      style={styles.cardActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('BlogDetail', { postId: post.id });
                      }}
                    >
                      <Ionicons name="expand-outline" size={17} color={colors.textMuted} />
                      <Text style={styles.cardActionText}>Read</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={8}
                      style={styles.cardActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        Share.share({ message: `${post.title}\n\n${post.content[0] ?? ''}` }).catch(() => {});
                      }}
                    >
                      <Ionicons name="share-social-outline" size={17} color={colors.textMuted} />
                      <Text style={styles.cardActionText}>Share</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 26,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.2, marginBottom: 8 },
  // Same size/weight/line-height as the Models and Connect hero
  // headlines — one consistent "hero headline" style across every tab.
  heroTitle: { fontFamily: fonts.heading, fontSize: 30, color: '#fff', lineHeight: 36, marginBottom: 10 },
  heroSub: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20, marginBottom: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.lg,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  statTile: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 18, color: '#fff' },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  searchNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: { padding: spacing.lg, gap: 14 },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  // Full-width 16:9 frame — the exact aspect-ratio blog.css uses for
  // .post-media on every screen size (16/9 on phones, widened slightly for
  // desktop breakpoints which don't apply here).
  cardImg: { width: '100%', aspectRatio: 16 / 9 },
  cardBody: { padding: spacing.md, gap: 6 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, lineHeight: 23 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, flexShrink: 1 },
  sourceAvatar: { width: 22, height: 22, borderRadius: 11 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
  cardPreview: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, lineHeight: 19, marginTop: 2 },
  cardActionsRow: { flexDirection: 'row', gap: 22, marginTop: 8 },
  cardActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardActionText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted },
});
