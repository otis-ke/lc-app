import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { issueCertificate } from '../../lib/certificates';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;
type Rt = RouteProp<DashboardStackParamList, 'IssueCertificate'>;

export default function IssueCertificateScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { modelUid, modelName, course, instructorName } = route.params;

  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  async function handleIssue() {
    setSubmitting(true);
    try {
      const number = await issueCertificate({
        model_uid: modelUid,
        model_name: modelName,
        course,
        instructor_name: instructorName,
        completion_date: completionDate,
      });
      Alert.alert('Certificate Issued', `Certificate number: ${number}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Issue Certificate</Text>
      <Card>
        <Text style={styles.row}>Student: {modelName}</Text>
        <Text style={styles.row}>Course: {course}</Text>
        <Text style={styles.row}>Instructor: {instructorName}</Text>
        <View style={{ height: spacing.sm }} />
        <TextField label="Completion Date" value={completionDate} onChangeText={setCompletionDate} placeholder="YYYY-MM-DD" />
        <Button label="Issue Certificate" onPress={handleIssue} loading={submitting} style={{ marginTop: spacing.sm }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: spacing.md },
  row: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, marginBottom: 4 },
});
