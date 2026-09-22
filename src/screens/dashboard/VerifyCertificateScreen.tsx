import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { verifyCertificate } from '../../lib/certificates';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import type { Certificate } from '../../types';

export default function VerifyCertificateScreen() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Certificate | null | 'not_checked'>('not_checked');
  const [checking, setChecking] = useState(false);

  async function handleVerify() {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const cert = await verifyCertificate(code.trim());
      setResult(cert);
    } finally {
      setChecking(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Verify a Certificate</Text>
      <Text style={styles.subtitle}>Enter the certificate number to confirm it was issued by L&amp;C Modeling Academy.</Text>

      <TextField
        label="Certificate Number"
        value={code}
        onChangeText={(v) => {
          setCode(v);
          setResult('not_checked');
        }}
        placeholder="e.g. LC-2026-483920"
        autoCapitalize="characters"
      />
      <Button label="Verify" onPress={handleVerify} loading={checking} />

      {result === null ? (
        <Card style={[styles.resultCard, styles.resultInvalid]}>
          <Ionicons name="close-circle" size={24} color={colors.danger} />
          <Text style={styles.resultTitle}>Not Found</Text>
          <Text style={styles.resultText}>No certificate matches this number.</Text>
        </Card>
      ) : result && result !== 'not_checked' ? (
        <Card style={[styles.resultCard, styles.resultValid]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.resultTitle}>Valid Certificate</Text>
          <View style={{ marginTop: spacing.sm, width: '100%' }}>
            <Row label="Name" value={result.model_name} />
            <Row label="Course" value={result.course} />
            <Row label="Instructor" value={result.instructor_name} />
            <Row label="Completed" value={result.completion_date} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: 6 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  resultCard: { alignItems: 'center', marginTop: spacing.lg, paddingVertical: spacing.lg },
  resultValid: { borderColor: colors.success },
  resultInvalid: { borderColor: colors.danger },
  resultTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.text, marginTop: 6 },
  resultText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  rowValue: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
});
