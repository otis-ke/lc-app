import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextAreaField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { RatingStars } from '../../components/RatingStars';
import { useAuth } from '../../contexts/AuthContext';
import { submitReview } from '../../lib/reviews';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;
type Rt = RouteProp<DashboardStackParamList, 'LeaveReview'>;

export default function LeaveReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { bookingId, targetType, targetUid, targetName } = route.params;
  const { session, profile } = useAuth();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!session) return;
    setSubmitting(true);
    try {
      await submitReview({
        booking_id: bookingId,
        target_type: targetType,
        target_uid: targetUid,
        target_name: targetName,
        author_uid: session.uid,
        author_name: profile?.full_name ?? profile?.email ?? 'Someone',
        rating,
        comment: comment.trim(),
      });
      Alert.alert('Thank you!', 'Your review has been posted.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Rate {targetName}</Text>
      <Card>
        <View style={styles.starsWrap}>
          <RatingStars rating={rating} onChange={setRating} size={32} />
        </View>
        <TextAreaField
          label="Comment"
          value={comment}
          onChangeText={setComment}
          placeholder={`How was your experience with ${targetName}?`}
        />
        <Button label="Submit Review" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.sm }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: spacing.md },
  starsWrap: { alignItems: 'center', marginBottom: spacing.md },
});
