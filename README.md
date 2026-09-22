# L&C Modeling Academy — Mobile App

A native iOS/Android rebuild of the L&C Modeling Academy website (Expo +
React Native + TypeScript). It runs on the **same live Firebase project the
website already uses** (`schoolcms-77713`) — real blog posts, real models,
real instructors, no setup step required to see live content. Image uploads
go through the site's existing Cloudinary account, same as the website's
admin editors.

## Stack

- **Expo SDK 57** (managed workflow), TypeScript
- **React Navigation** — bottom tabs (Home / Models / Connect / Blog /
  Profile) + a native stack per tab for drill-downs and forms
- **Firebase** — Firestore (content + form submissions) + Firebase Auth
  (email/password, with a `role` field for admin vs regular users)
- **Cloudinary** — image uploads (same account/preset the website's admin
  pages already use)

## Getting started

```
npm install
npx expo start
```

That's it for content — the app reads the website's real Firestore data out
of the box, no `.env` or backend project to create.

### Running on your phone (Expo Go)

1. Install **Expo Go** from the App Store / Play Store.
2. Run `npx expo start` and scan the QR code.
3. If the app gets stuck on a loading screen or the QR code never connects:
   your phone and computer need to be able to reach each other. In order of
   what to try:
   - Make sure the phone and computer are on the **same Wi-Fi network** (not
     a guest network, not mobile data).
   - **Windows Firewall** commonly blocks Metro's port from other devices on
     the network the first time you run it — when Windows shows a firewall
     prompt for Node.js, allow it on **Private networks**. If you don't see
     a prompt (or already dismissed it), open *Windows Defender Firewall →
     Allow an app through firewall* and make sure Node.js is checked for
     "Private".
   - Some routers isolate devices from each other ("AP/client isolation",
     common on public or office Wi-Fi) — a phone hotspot you also connect
     your laptop to is a reliable workaround.
   - **If none of that works, use tunnel mode** — it routes through the
     internet instead of your local network, so firewalls/router isolation
     don't matter:
     ```
     npm run start:tunnel
     ```
     (Slightly slower to load, but this is the most reliable fallback and
     works from anywhere.)

### How the admin panel works

The admin dashboard is **the website's own admin panel** (`admin.html` +
`admindash/*.html`), opened inside the app via a WebView — not a separate
native rebuild. This is deliberate: that panel already has full CRUD for
blog posts, models, instructors, and homepage banners, all wired to the same
live Firestore project this app reads from. Building a second admin
implementation would risk it drifting out of sync (different fields,
different bugs) from the one everyone already uses on desktop.

So there are two logins involved, back to back:

1. **App-level gate** — only someone with `role: "admin"` in this app's own
   `app_users` Firestore collection sees the "Admin Panel" button on the
   Profile tab at all (see setup steps below).
2. **The website's own login**, shown inside the WebView once you tap that
   button — the same email/password check `loginform.html` already uses.

To make your first app-level admin:

1. Sign up in the app (Profile tab → Create Account).
2. In the [Firebase console](https://console.firebase.google.com/) for
   project `schoolcms-77713`, go to **Authentication → Sign-in method** and
   make sure **Email/Password** is enabled (it may already be — the site
   itself doesn't use Firebase Auth today, so this could be the first time
   it's turned on for this project).
3. In **Firestore Database**, open the `app_users` collection, find the
   document with your email, and change its `role` field from `"user"` to
   `"admin"`.
4. Reopen the app (or sign out/in) — a gold "Admin Panel" button appears on
   the Profile tab. Tapping it opens `admin.html` in-app, where you sign in
   with the website's existing admin credentials.

## Building an installable APK

If Expo Go isn't cooperating (network issues, etc.), build a real
standalone APK instead — it installs and runs like any other Android app,
no dev server or Expo Go required. This uses **EAS Build**, Expo's cloud
build service, so it works without installing Android Studio/the Android
SDK locally.

1. **Create a free Expo account** at [expo.dev](https://expo.dev) if you
   don't have one (the free tier's build allowance is enough for this).
2. Log in from the terminal, in the `mobile-app` folder:
   ```
   npx eas login
   ```
3. Link this project to your account (one-time; creates/updates the
   `extra.eas.projectId` field in `app.json`):
   ```
   npx eas build:configure
   ```
   It'll ask which platforms — choose Android.
4. Start the build:
   ```
   npm run build:apk
   ```
   This uploads the project and builds on Expo's servers (typically
   5-15 minutes). `eas.json`'s `preview` profile is already set to produce a
   `.apk` (not the Play-Store-only `.aab`), so it's ready to sideload.
5. When it finishes, the terminal prints a download link (and it's also
   listed at [expo.dev](https://expo.dev) under your project's Builds tab).
   Open that link **on your phone** (or download the file and transfer it
   over), tap it, and allow "install from unknown sources" if Android asks —
   that installs the app directly, no Expo Go involved.

To rebuild after making changes, just run `npm run build:apk` again.

## Folder structure

```
App.tsx                      # font loading, providers, splash screen
src/
  theme/theme.ts             # brand colors, gradients, fonts, spacing
  lib/
    firebase.ts              # Firebase app/Firestore/Auth init (the site's real project)
    content.ts                # typed read access for blog/models/instructors (see below)
    submissions.ts            # typed "create" calls for every public form
    uploadImage.ts             # image picker + Cloudinary upload (public Get Scouted form)
  types/index.ts               # data model shared across the app
  data/
    countries.ts               # static nationality list (offline-safe)
    localImages.ts             # real photos bundled from the website, used as
                                # hero imagery and as fallbacks when a piece of
                                # live content doesn't have its own photo yet
  contexts/AuthContext.tsx     # session, profile, role, sign in/up/out (Firebase Auth)
  navigation/                  # param types + one stack per tab + tab bar
  components/                  # Button, form fields, Screen, Card, etc.
  screens/
    main/                      # Home, Programs, Enroll, Home Coaching,
                                # Contact, Partner, Profile
    models/                    # Talent roster, model detail, Get Scouted,
                                # Book a Model, Online Classes
    connect/                   # Instructor marketplace (L&C Model Connect)
    blog/                      # Stories list + reader
    auth/                      # Login, Sign Up
    admin/                     # AdminHomeScreen.tsx — WebView wrapper around
                                # the website's real admin.html (see below)
assets/images/                 # bundled real website photography (see localImages.ts)
```

## Data model

The app **reads** the same Firestore collections the website's admin editors
(`admindash/*.html`) already **write** — content edited on the website shows
up in the app automatically, no sync step:

| Collection | What it is | Edited via |
|---|---|---|
| `lcschoolblog` | Blog posts | `admindash/blogupdate.html` (in the admin panel) |
| `lc_models_management` | Talent roster | `admindash/modeldash.html` |
| `lc_model_connect_instructors` | Instructors | `admindash/lsstoriesupdate.html` |

Every public form (scouting applications, bookings, enrollments, contact,
partnership inquiries, etc.) used to only send a one-off EmailJS email on
the website — nothing was ever queryable afterwards. This app persists all
of them as new Firestore collections instead (`scouting_applications`,
`class_signups`, `model_bookings`, `enrollments`, `instructor_applications`,
`instructor_bookings`, `model_enquiries`, `contact_messages`,
`partnership_requests`). These aren't shown anywhere in the admin panel yet
since `admin.html` predates them — see "Next steps" below.

`app_users` is a new collection, used only for this app's own `role` gate in
front of the admin panel (the website never had real user accounts — only a
hardcoded admin password check in `loginform.html`).

## What's simplified for this MVP (and how to extend it)

- **Hero/banner images** for a few marketing sections (Diversity &
  Inclusivity, page headers) use real bundled photos from the website
  (`src/data/localImages.ts`) rather than the website's tiny single-image
  Firestore collections (`main_header_banner`, `models_header`, etc.) — those
  are admin-managed banners that may be empty or have broken URLs (the
  website's own `debug.html` audits this), so reusing real static photography
  is more reliable for an MVP. To make these editable from the app too, add
  fetchers for those collections in `src/lib/content.ts` following the same
  pattern as `fetchModels`/`fetchBlogPosts`.
- **Fallback photos**: any model/instructor/blog post that doesn't have its
  own photo yet shows a real photo from `localImages.ts` instead of a blank
  or broken image, picked deterministically from the item's id so it doesn't
  change on every render.
- **Country pickers** use a bundled static list (`src/data/countries.ts`)
  instead of a live API call, so forms work offline.
- **Blog "likes"** are stored locally on-device (AsyncStorage), mirroring the
  website's localStorage-based likes. To make likes shared/global, add a
  Firestore `blog_likes` collection keyed by `postId_userId` and switch the
  like screen to read/write there instead.
- **The admin panel doesn't show the new submission collections yet** —
  `admin.html`/`admindash/*.html` predate this app's `scouting_applications`,
  `contact_messages`, etc. Since those forms only ever emailed via EmailJS
  before, this is still a net improvement (the data now exists and is
  queryable), but there's no UI to browse it yet. Add an "Inbox" section to
  `admin.html` (or a new `admindash/inbox.html`) that lists these
  collections — see the field names in `src/lib/submissions.ts`.
- **App-level user management** (the `app_users` role gate) has no UI either
  — promoting the first admin is a one-time manual Firestore edit (see
  above). If you get more admins than is comfortable to manage by hand, add
  a small screen or script for it; deleting a Firebase Auth account itself
  requires the Admin SDK (server-side), which must never ship inside a
  mobile client.
- **Walking video uploads** (scouting application) reuse the same
  image-picker flow rather than a dedicated video-camera capture UI.
- **Firestore security rules**: this app assumes the project's existing
  rules are permissive enough for public reads of content collections and
  public writes to the new submission collections (the website's own admin
  pages already write to Firestore with no real auth check, so this is
  consistent with how the project is already configured — not a new
  exposure this app introduces). If you tighten the rules later, make sure
  submission collections stay writable by unauthenticated users (visitors
  shouldn't need an account to apply/book/enquire) and readable only by
  admins.

## Next steps toward production

1. Add an inbox view to `admin.html`/`admindash/*.html` for the new
   submission collections (see above) so admins can act on them without
   opening the Firebase console directly.
2. Add pagination to the blog list once content volume grows past a couple
   hundred docs.
3. Move Cloudinary's unsigned upload preset to a signed/server-mediated
   upload if you want tighter control over who can upload.
4. Add a Cloud Function to send a notification (email/Slack/etc.) when a
   new submission comes in.
5. Add proper native date pickers (`@react-native-community/datetimepicker`)
   in place of the plain text "YYYY-MM-DD" fields used in this MVP.
6. Regenerate app icons at a higher source resolution (currently built from
   the website's existing logo mark) before submitting to the App Store/Play
   Store.
