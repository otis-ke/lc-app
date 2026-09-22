import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { ensureConversation, sendMessage, subscribeToMessages } from '../../lib/messages';
import { pickImage, uploadImage } from '../../lib/uploadImage';
import { colors, fonts, radii, spacing } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Message } from '../../types';

type Rt = RouteProp<DashboardStackParamList, 'Chat'>;

// A message's own component (not an inline renderItem) so expo-video's
// useVideoPlayer hook — which must run unconditionally — only ever mounts
// once per video bubble instead of once per FlatList render pass.
function ChatBubble({ item, mine }: { item: Message; mine: boolean }) {
  const player = useVideoPlayer(item.media_type === 'video' ? item.media_url : null);

  async function handleShare() {
    if (!item.media_url) return;
    try {
      // RN's built-in Share sheet (no extra native module/rebuild needed) —
      // opens the OS share sheet so the photo/video can be forwarded or
      // saved to the phone from there.
      await Share.share(Platform.OS === 'ios' ? { url: item.media_url } : { message: item.media_url });
    } catch {
      // user cancelled — nothing to do
    }
  }

  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, item.media_url && styles.bubbleMedia]}>
        {item.media_url && item.media_type === 'image' ? (
          <Pressable onLongPress={handleShare}>
            <Image source={{ uri: item.media_url }} style={styles.mediaImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          </Pressable>
        ) : item.media_url && item.media_type === 'video' ? (
          <VideoView style={styles.mediaImage} player={player} nativeControls contentFit="cover" />
        ) : null}
        {item.text ? <Text style={[styles.bubbleText, mine && styles.bubbleTextMine, item.media_url && { marginTop: 8 }]}>{item.text}</Text> : null}
        {item.media_url ? (
          <Pressable style={styles.shareChip} onPress={handleShare} hitSlop={6}>
            <Ionicons name="share-outline" size={12} color={mine ? '#fff' : colors.textMuted} />
            <Text style={[styles.shareChipText, mine && { color: '#fff' }]}>Share / Save</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const route = useRoute<Rt>();
  const { otherUid, otherName } = route.params;
  const { session, profile } = useAuth();
  // The floating tab bar renders above every screen (it's never hidden per
  // route), so without this the send button sits underneath it.
  const tabBarHeight = useBottomTabBarHeight();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (!session) return;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const id = await ensureConversation(
        session.uid,
        profile?.full_name ?? profile?.email ?? 'Me',
        otherUid,
        otherName
      );
      setConversationId(id);
      unsubscribe = subscribeToMessages(id, setMessages);
    })();
    return () => unsubscribe?.();
  }, [session, otherUid, otherName]);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function handleSend() {
    if (!conversationId || !session || !text.trim()) return;
    const value = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(conversationId, session.uid, value);
    } finally {
      setSending(false);
    }
  }

  async function handleAttach() {
    if (!conversationId || !session) return;
    const asset = await pickImage({ videos: true });
    if (!asset) return;
    setUploadingMedia(true);
    try {
      const url = await uploadImage(asset.uri, `chat/${conversationId}`);
      const isVideo = /\.(mp4|mov|m4v)$/i.test(asset.uri) || asset.type === 'video';
      await sendMessage(conversationId, session.uid, '', { url, type: isVideo ? 'video' : 'image' });
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ChatBubble item={item} mine={item.sender_uid === session?.uid} />}
        />
        <View style={[styles.inputRow, { paddingBottom: Math.max(spacing.sm, tabBarHeight - 4) }]}>
          <Pressable style={styles.attachBtn} onPress={handleAttach} disabled={uploadingMedia}>
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="attach" size={20} color={colors.primary} />
            )}
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={handleSend} disabled={sending || !text.trim()}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: radii.lg, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleMedia: { padding: 6 },
  mediaImage: { width: 220, height: 220, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  shareChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-start' },
  shareChipText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
