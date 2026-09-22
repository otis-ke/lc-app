import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchAllConversations } from '../../lib/messages';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Conversation } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function AdminChatsScreen() {
  const navigation = useNavigation<Nav>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllConversations();
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
      <Text style={styles.title}>All Conversations</Text>
      <Text style={styles.subtitle}>Read-only oversight of every student ↔ instructor thread.</Text>

      {conversations.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubbles-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No conversations yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {conversations.map((c) => {
            const [uidA, uidB] = c.participants;
            const nameA = c.participant_names[uidA] ?? 'Unknown';
            const nameB = c.participant_names[uidB] ?? 'Unknown';
            return (
              <Pressable
                key={c.id}
                style={styles.card}
                onPress={() => navigation.navigate('AdminChatView', { conversationId: c.id, title: `${nameA} & ${nameB}` })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{nameA} ↔ {nameB}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>{c.last_message ?? 'No messages yet'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
  title: { ...typography.pageTitle, marginBottom: 4 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text },
  lastMessage: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
