import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { TextField, TextAreaField, CheckboxGroup } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyModelProfile, saveModelLocation, saveMyModelProfile } from '../../lib/models';
import { pickImage, uploadImage } from '../../lib/uploadImage';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { AppModelProfile, GeoPoint } from '../../types';

const CATEGORIES = ['Runway', 'Commercial', 'High Fashion', 'Pageantry', 'Child Modeling', 'Fitness', 'Print/Editorial'];
const SKILLS = ['Catwalk', 'Posing', 'Public Speaking', 'Acting', 'Dancing', 'Photography-comfortable'];

export default function MyPortfolioScreen() {
  const { session, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const p = await fetchMyModelProfile(session.uid);
      if (p) {
        setIsNew(false);
        setFullName(p.full_name);
        setAge(p.age != null ? String(p.age) : '');
        setLocation(p.location ?? '');
        setHeightCm(p.height_cm != null ? String(p.height_cm) : '');
        setBust(p.bust ?? '');
        setWaist(p.waist ?? '');
        setHips(p.hips ?? '');
        setShoeSize(p.shoe_size ?? '');
        setCategories(p.categories);
        setSkills(p.skills);
        setBio(p.bio);
        setInstagram(p.social_instagram ?? '');
        setTiktok(p.social_tiktok ?? '');
        setAvailabilityNotes(p.availability_notes ?? '');
        setPhotos(p.photos);
        setGeo(p.geo);
      }
      setLoading(false);
    })();
  }, [session]);

  async function handleUseMyLocation() {
    if (!session) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Enable location access so nearby instructors and students can find you.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await saveModelLocation(session.uid, position.coords.latitude, position.coords.longitude);
      setGeo({ lat: position.coords.latitude, lng: position.coords.longitude, updated_at: new Date().toISOString() });
      Alert.alert('Location saved', 'Nearby instructors and students can now see how far away you are.');
    } catch (e: any) {
      Alert.alert('Could not get location', e?.message ?? 'Please try again.');
    } finally {
      setLocating(false);
    }
  }

  async function handleAddPhoto() {
    const asset = await pickImage();
    if (!asset || !session) return;
    setUploading(true);
    try {
      const url = await uploadImage(asset.uri, `models/${session.uid}`);
      setPhotos((prev) => [...prev, url]);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function handleSave() {
    if (!session) return;
    if (!fullName.trim()) {
      Alert.alert('Full name is required');
      return;
    }
    setSaving(true);
    try {
      const data: Partial<AppModelProfile> = {
        full_name: fullName.trim(),
        age: age.trim() ? Number(age.trim()) : null,
        location: location.trim() || null,
        height_cm: heightCm.trim() ? Number(heightCm.trim()) : null,
        bust: bust.trim() || null,
        waist: waist.trim() || null,
        hips: hips.trim() || null,
        shoe_size: shoeSize.trim() || null,
        categories,
        skills,
        bio: bio.trim(),
        social_instagram: instagram.trim() || null,
        social_tiktok: tiktok.trim() || null,
        social_other: null,
        availability_notes: availabilityNotes.trim() || null,
        photos,
      };
      await saveMyModelProfile(session.uid, data, isNew);
      setIsNew(false);
      Alert.alert('Saved', 'Your portfolio has been updated.');
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    await Share.share({
      message: `Check out my modeling portfolio on L&C Models Connect: ${fullName}${bio ? ` — ${bio}` : ''}`,
    }).catch(() => {});
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
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Portfolio</Text>
        <Pressable onPress={handleShare} hitSlop={8}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <SectionTitle title="Photos" subtitle="Add your best headshots and full-body shots" />
      <View style={styles.photoGrid}>
        {photos.map((url) => (
          <View key={url} style={styles.photoWrap}>
            <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
            <Pressable style={styles.photoRemove} onPress={() => removePhoto(url)}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addPhoto} onPress={handleAddPhoto} disabled={uploading}>
          {uploading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="add" size={26} color={colors.primary} />}
        </Pressable>
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <TextField label="Full Name" required value={fullName} onChangeText={setFullName} />
        <View style={styles.row2}>
          <TextField label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" style={{ flex: 1 }} />
          <TextField label="Location" value={location} onChangeText={setLocation} style={{ flex: 1 }} />
        </View>
        <Pressable style={styles.locationBtn} onPress={handleUseMyLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="locate-outline" size={16} color={colors.primary} />
          )}
          <Text style={styles.locationBtnText}>{geo ? 'Update My Current Location' : 'Use My Current Location'}</Text>
        </Pressable>
        <Text style={styles.locationHint}>
          {geo
            ? `Location saved — nearby instructors and students can find you. Last updated ${new Date(geo.updated_at).toLocaleDateString()}.`
            : 'Add your location so nearby instructors and students can find you, like a ride-hailing app.'}
        </Text>
        <TextField label="Height (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="number-pad" />
        <View style={styles.row3}>
          <TextField label="Bust" value={bust} onChangeText={setBust} style={{ flex: 1 }} />
          <TextField label="Waist" value={waist} onChangeText={setWaist} style={{ flex: 1 }} />
          <TextField label="Hips" value={hips} onChangeText={setHips} style={{ flex: 1 }} />
        </View>
        <TextField label="Shoe Size" value={shoeSize} onChangeText={setShoeSize} />
        <CheckboxGroup label="Modeling Categories" values={categories} options={CATEGORIES} onChange={setCategories} />
        <CheckboxGroup label="Skills" values={skills} options={SKILLS} onChange={setSkills} />
        <TextAreaField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell brands and instructors about yourself" />
        <TextField label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@yourhandle" />
        <TextField label="TikTok" value={tiktok} onChangeText={setTiktok} placeholder="@yourhandle" />
        <TextAreaField
          label="Availability"
          value={availabilityNotes}
          onChangeText={setAvailabilityNotes}
          placeholder="e.g. Weekends, or Mon-Fri evenings"
        />
        <Button label="Save Portfolio" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.pageTitle },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrap: { width: 84, height: 84, borderRadius: radii.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%', backgroundColor: colors.surfaceAlt },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  row2: { flexDirection: 'row', gap: spacing.sm },
  row3: { flexDirection: 'row', gap: spacing.sm },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 6,
  },
  locationBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  locationHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 17 },
});
