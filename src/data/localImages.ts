// Real photography pulled straight from the L&C Modeling Academy website
// (bundled on-device — see assets/images/) so every hero/card/gallery in the
// app always shows a real photo, never a broken link or a grey box, even
// before any live Firestore content loads. Live content (blog/models/
// instructors) still fetches from Firestore and prefers its own
// `header_image` when present — these are the fallback/decorative layer.

export const MODEL_PHOTOS = [
  require('../../assets/images/models/model1.jpg'),
  require('../../assets/images/models/model2.jpg'),
  require('../../assets/images/models/model3.jpg'),
  require('../../assets/images/models/model4.jpg'),
  require('../../assets/images/models/model5.jpg'),
  require('../../assets/images/models/model7.jpg'),
  require('../../assets/images/models/model8.jpg'),
  require('../../assets/images/models/model9.jpg'),
  require('../../assets/images/models/model10.jpg'),
  require('../../assets/images/models/model11.jpg'),
  require('../../assets/images/models/model12.jpg'),
  require('../../assets/images/models/model13.jpg'),
];

export const CONNECT_HERO_PHOTOS = [
  require('../../assets/images/connect/headerconnect1.jpg'),
  require('../../assets/images/connect/headerconnect2.jpg'),
  require('../../assets/images/connect/headerconnect3.jpg'),
  require('../../assets/images/connect/headerconnect4.jpg'),
  require('../../assets/images/connect/headerconnect5.jpg'),
];

export const CONNECT_GALLERY_PHOTOS = [
  require('../../assets/images/connect/connect1.jpg'),
  require('../../assets/images/connect/connect2.jpg'),
  require('../../assets/images/connect/connect3.jpg'),
  require('../../assets/images/connect/connect4.jpg'),
  require('../../assets/images/connect/connect5.jpg'),
  require('../../assets/images/connect/connect6.jpg'),
  require('../../assets/images/connect/connect7.jpg'),
  require('../../assets/images/connect/connect8.jpg'),
  require('../../assets/images/connect/connect9.jpg'),
  require('../../assets/images/connect/connect10.jpg'),
];

export const PROGRAM_PHOTOS = [
  require('../../assets/images/programs/pp1.jpg'),
  require('../../assets/images/programs/pp2.jpg'),
  require('../../assets/images/programs/pp3.jpg'),
  require('../../assets/images/programs/pp4.jpg'),
  require('../../assets/images/programs/pp5.jpg'),
  require('../../assets/images/programs/pp6.jpg'),
  require('../../assets/images/programs/pp7.jpg'),
  require('../../assets/images/programs/pp8.jpg'),
];

export const DIVERSITY_PHOTOS = [
  require('../../assets/images/diversity/d4.jpg'),
  require('../../assets/images/diversity/d5.jpg'),
  require('../../assets/images/diversity/d9.jpg'),
  require('../../assets/images/diversity/d10.jpg'),
  require('../../assets/images/diversity/d16.jpg'),
  require('../../assets/images/diversity/d17.jpg'),
  require('../../assets/images/diversity/d18.jpg'),
  require('../../assets/images/diversity/d19.jpg'),
];

export const HOME_HERO_PHOTO = require('../../assets/images/misc/modelsh.jpg');
// Real portrait photography (not the promo/logo graphics also present in
// misc/) — much better suited to the About Us section's photo treatment.
export const ABOUT_PHOTO_1 = require('../../assets/images/models/model4.jpg');
export const ABOUT_PHOTO_2 = require('../../assets/images/models/model9.jpg');
export const PARTNER_PHOTO = require('../../assets/images/misc/partner2.jpeg');
export const COLLAB_PHOTO = require('../../assets/images/misc/collab11.jpeg');
export const LOGO = require('../../assets/images/misc/logo.png');
export const LOGO_TRANSPARENT = require('../../assets/images/misc/l_-removebg-preview.png');

// Deterministic-but-varied fallback picker (same id always yields the same
// photo, so a card doesn't "flicker" to a different photo on re-render).
function pickByHash<T>(list: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

export function fallbackModelPhoto(seed: string) {
  return pickByHash(MODEL_PHOTOS, seed);
}

export function fallbackInstructorPhoto(seed: string) {
  return pickByHash(CONNECT_GALLERY_PHOTOS, seed);
}
