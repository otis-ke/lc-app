import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextField, TextAreaField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyBrandProfile, saveMyBrandProfile } from '../../lib/brands';
import { pickImage, uploadImage } from '../../lib/uploadImage';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';

export default function BrandProfileScreen() {
  const { session, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState(profile?.full_name ?? '');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const p = await fetchMyBrandProfile(session.uid);
        if (p) {
          setIsNew(false);
          setCompanyName(p.company_name);
          setContactName(p.contact_name ?? '');
          setIndustry(p.industry ?? '');
          setLocation(p.location ?? '');
          setDescription(p.description ?? '');
          setLogoUrl(p.logo_url);
        }
      } catch {
        // fall through to the empty "new profile" form
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  async function handlePickLogo() {
    const asset = await pickImage();
    if (!asset || !session) return;
    setUploading(true);
    try {
      const url = await uploadImage(asset.uri, `brands/${session.uid}`);
      setLogoUrl(url);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!session) return;
    if (!companyName.trim()) {
      Alert.alert('Company name is required');
      return;
    }
    setSaving(true);
    try {
      await saveMyBrandProfile(
        session.uid,
        {
          company_name: companyName.trim(),
          contact_name: contactName.trim() || null,
          industry: industry.trim() || null,
          location: location.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl,
        },
        isNew
      );
      setIsNew(false);
      Alert.alert('Saved', 'Your brand profile has been updated.');
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Company Profile</Text>

      <Pressable style={styles.logoWrap} onPress={handlePickLogo} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="cover" />
        ) : (
          <Ionicons name="business-outline" size={28} color={colors.primary} />
        )}
      </Pressable>
      <Text style={styles.logoHint}>Tap to {logoUrl ? 'change' : 'add'} your logo</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <TextField label="Company Name" required value={companyName} onChangeText={setCompanyName} />
        <TextField label="Contact Name" value={contactName} onChangeText={setContactName} />
        <TextField label="Industry" value={industry} onChangeText={setIndustry} placeholder="e.g. Fashion, Advertising" />
        <TextField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Nairobi" />
        <TextAreaField label="About" value={description} onChangeText={setDescription} placeholder="Tell models about your brand" />
        <Button label="Save Profile" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: spacing.md },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  logoHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
});
