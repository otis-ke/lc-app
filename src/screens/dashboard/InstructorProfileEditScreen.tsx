import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { TextField, TextAreaField, RadioGroup, CheckboxGroup } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchInstructorSelfProfile, saveInstructorLocation, saveInstructorProfile } from '../../lib/instructors';
import { describeLocationDenial, requestLocationFromGesture } from '../../lib/location';
import { pickImage, uploadImage } from '../../lib/uploadImage';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { GeoPoint, InstructorMode } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

const SPECIALTIES = [
  'Catwalk Training',
  'Runway Coaching',
  'Pageantry Training',
  'Posing Classes',
  'Grooming & Etiquette',
  'Confidence Building',
  'Kids Modeling',
  'Portfolio & Personal Branding',
];

const MODE_OPTIONS: { label: string; value: InstructorMode }[] = [
  { label: 'Online', value: 'online' },
  { label: 'In Person', value: 'in_person' },
  { label: 'Both', value: 'both' },
];

export default function InstructorProfileEditScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [approved, setApproved] = useState(false);

  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [mode, setMode] = useState<InstructorMode>('both');
  const [price, setPrice] = useState('');
  const [experience, setExperience] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const p = await fetchInstructorSelfProfile(session.uid);
      if (p) {
        setApproved(true);
        setBio(p.bio);
        setSpecialties(p.specialties);
        setLocation(p.location ?? '');
        setMode(p.mode);
        setPrice(p.price_per_session ? String(p.price_per_session) : '');
        setExperience(p.experience_years != null ? String(p.experience_years) : '');
        setPhotos(p.photos);
        setGeo(p.geo);
      }
      setLoading(false);
    })();
  }, [session]);

  async function handleUseMyLocation() {
    if (!session) return;
    setLocating(true);
    const result = await requestLocationFromGesture();
    setLocating(false);
    if (result.status === 'denied') {
      Alert.alert('Location permission needed', describeLocationDenial(result.canAskAgain));
      return;
    }
    if (result.status === 'unavailable') {
      Alert.alert('Could not get location', result.message);
      return;
    }
    await saveInstructorLocation(session.uid, result.lat, result.lng);
    setGeo({ lat: result.lat, lng: result.lng, updated_at: new Date().toISOString() });
    Alert.alert('Location saved', 'Students will now see how far away you are.');
  }

  async function handleAddPhoto() {
    const asset = await pickImage();
    if (!asset || !session) return;
    setUploading(true);
    try {
      const url = await uploadImage(asset.uri, `instructors/${session.uid}`);
      setPhotos((prev) => [...prev, url]);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      await saveInstructorProfile(session.uid, {
        bio: bio.trim(),
        specialties,
        location: location.trim() || null,
        mode,
        price_per_session: price.trim() ? Number(price.trim()) : 0,
        experience_years: experience.trim() ? Number(experience.trim()) : null,
        photos,
      });
      Alert.alert('Saved', 'Your instructor profile has been updated.');
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

  if (!approved) {
    return (
      <Screen>
        <Card style={styles.gateCard}>
          <Ionicons name="hourglass-outline" size={28} color={colors.primary} />
          <Text style={styles.gateTitle}>Not approved yet</Text>
          <Text style={styles.gateText}>
            Apply to become an instructor first. Once L&amp;C approves your application, you'll be able to
            set your bio, pricing and availability here.
          </Text>
          <Button
            label="Apply as Instructor"
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({ name: 'ConnectTab', params: { screen: 'BecomeInstructor' } })
              )
            }
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>My Instructor Profile</Text>

      <View style={styles.photoGrid}>
        {photos.map((url) => (
          <Image key={url} source={{ uri: url }} style={styles.photo} contentFit="cover" />
        ))}
        <Pressable style={styles.addPhoto} onPress={handleAddPhoto} disabled={uploading}>
          {uploading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="add" size={26} color={colors.primary} />}
        </Pressable>
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <TextAreaField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell students about your background" />
        <CheckboxGroup label="Specialties" values={specialties} options={SPECIALTIES} onChange={setSpecialties} />
        <TextField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Nairobi" />
        <Pressable style={styles.locationBtn} onPress={handleUseMyLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="locate-outline" size={16} color={colors.primary} />
          )}
          <Text style={styles.locationBtnText}>
            {geo ? 'Update My Current Location' : 'Use My Current Location'}
          </Text>
        </Pressable>
        {geo ? (
          <Text style={styles.locationHint}>
            Location saved — students see how far away you are. Last updated{' '}
            {new Date(geo.updated_at).toLocaleDateString()}.
          </Text>
        ) : (
          <Text style={styles.locationHint}>
            Add your location so nearby students can find you, like a ride-hailing app.
          </Text>
        )}
        <RadioGroup
          label="Training Mode"
          value={MODE_OPTIONS.find((m) => m.value === mode)?.label ?? 'Both'}
          options={MODE_OPTIONS.map((m) => m.label)}
          onChange={(label) => setMode(MODE_OPTIONS.find((m) => m.label === label)?.value ?? 'both')}
        />
        <TextField
          label="Price per Session (KSh)"
          value={price}
          onChangeText={setPrice}
          keyboardType="number-pad"
          placeholder="e.g. 2000"
        />
        <TextField label="Years of Experience" value={experience} onChangeText={setExperience} keyboardType="number-pad" />
        <Button label="Save Profile" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      </Card>

      <Button
        label="Set Availability"
        variant="outline"
        onPress={() => navigation.navigate('InstructorAvailability')}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: spacing.md },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: 84, height: 84, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  addPhoto: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  gateCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  gateTitle: { ...typography.dialogTitle },
  gateText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: -6,
    marginBottom: 6,
  },
  locationBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  locationHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 17 },
});
