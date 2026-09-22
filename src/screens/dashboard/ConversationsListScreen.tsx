import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { fetchConversations } from '../../lib/messages';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Conversation } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function ConversationsListScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchConversations(session.uid);
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Messages</Text>
      {conversations.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubbles-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No conversations yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {conversations.map((c) => {
            const otherUid = c.participants.find((p) => p !== session?.uid) ?? c.participants[0];
            const otherName = c.participant_names[otherUid] ?? 'Unknown';
            return (
              <Pressable
                key={c.id}
                style={styles.card}
                onPress={() => navigation.navigate('Chat', { otherUid, otherName })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{otherName[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{otherName}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>{c.last_message ?? 'Start the conversation'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 17, color: '#fff' },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  lastMessage: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
