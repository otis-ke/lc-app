import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { subscribeToMessages } from '../../lib/messages';
import { colors, fonts, radii, spacing } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Message } from '../../types';

type Rt = RouteProp<DashboardStackParamList, 'AdminChatView'>;

// Media bubbles are still decrypted/displayed for admin oversight (per the
// brief: encrypted at rest, but readable by the app's own admin view) — see
// crypto.ts. Its own component so useVideoPlayer can run unconditionally.
function AdminBubble({ item }: { item: Message }) {
  const player = useVideoPlayer(item.media_type === 'video' ? item.media_url : null);
  return (
    <View style={styles.bubbleRow}>
      <View style={styles.bubble}>
        {item.media_url && item.media_type === 'image' ? (
          <Image source={{ uri: item.media_url }} style={styles.mediaImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
        ) : item.media_url && item.media_type === 'video' ? (
          <VideoView style={styles.mediaImage} player={player} nativeControls contentFit="cover" />
        ) : null}
        {item.text ? <Text style={[styles.bubbleText, item.media_url && { marginTop: 8 }]}>{item.text}</Text> : null}
        <Text style={styles.bubbleTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
    </View>
  );
}

// Read-only mirror of ChatScreen — no input row, since admin is observing,
// not participating.
export default function AdminChatViewScreen() {
  const route = useRoute<Rt>();
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList<Message>>(null);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, setMessages);
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  return (
    <View style={styles.root}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Admin view — read only</Text>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + spacing.md }]}
        ListEmptyComponent={<Text style={styles.emptyText}>No messages in this thread yet.</Text>}
        renderItem={({ item }) => <AdminBubble item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  banner: { backgroundColor: colors.surfaceAlt, paddingVertical: 8, alignItems: 'center' },
  bannerText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { padding: spacing.md, gap: 8 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '85%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text, lineHeight: 20 },
  bubbleTime: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, marginTop: 4 },
  mediaImage: { width: 220, height: 220, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
});
