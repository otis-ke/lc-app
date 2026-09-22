import * as ImagePicker from 'expo-image-picker';

// Same Cloudinary account the website's admin editors and scouting-form
// uploads already use (see admindash/*.html / models.html's
// uploadImageToCloud) — reusing it means uploads from this app show up
// exactly like uploads from the website, no new service to configure.
const CLOUDINARY_CLOUD_NAME = 'dwlasndqv';
const CLOUDINARY_UPLOAD_PRESET = 'quranpilot';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

export async function pickImage(options?: { videos?: boolean }) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: options?.videos ? ['images', 'videos'] : ['images'],
    allowsEditing: !options?.videos,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}

export async function uploadImage(uri: string, folder: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = ext === 'png' ? 'image/png' : ext === 'mp4' || ext === 'mov' ? 'video/mp4' : 'image/jpeg';

  const formData = new FormData();
  // React Native's fetch/FormData accepts this {uri,name,type} shape directly
  // for file uploads — no manual base64/blob conversion needed.
  formData.append('file', { uri, name: `${folder}-${Date.now()}.${ext}`, type } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `lc-app/${folder}`);

  const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
  const json = await response.json();
  if (!response.ok || !json.secure_url) {
    throw new Error(json?.error?.message ?? 'Image upload failed');
  }
  return json.secure_url as string;
}
