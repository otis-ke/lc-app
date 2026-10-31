# Google Play Console — Setup Notes

Reference notes for publishing **L&C Modeling Academy** to Google Play.

## 1. Create app

| Field | Value |
|---|---|
| App name | `L&C Modeling Academy` |
| Package name | `com.lcmodelingacademy.app` |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |

**Declarations** — check all three:
- [x] Confirm app meets Developer Program Policies
- [x] Accept Play App Signing Terms of Service
- [x] Accept US export laws

There is no "access code" anywhere in this form.

## 2. App content → App access

The app requires sign-in to see most features, so Google's reviewer needs a
way in. Provide test credentials here (a demo account email + password) so
the reviewer can sign in and see the real app, not just the login screen.

- Test account email: `___________________`
- Test account password: `___________________`
- Notes for reviewer: *(e.g. "Sign in, then open the Connect tab to see nearby
  instructors" — point them at the core feature)*

## 3. App content → Data safety

| Data type | Collected? | Shared with 3rd parties? | Optional? | Purpose |
|---|---|---|---|---|
| Name | Yes | No | No | Account management |
| Email address | Yes | No | No | Account management |
| Photos | Yes | No | No | App functionality (portfolio) |
| Location (approximate or precise) | Yes | No | Yes | App functionality (nearby matching) |
| Messages (in-app) | Yes | No | No | App functionality |
| Financial info (other) | Yes | No | No | App functionality |
| Device/other IDs (push token) | Yes | No | No | App functionality (notifications) |
| App activity | Yes | No | No | App functionality, analytics |

For every row: data encrypted in transit (Yes), users can request deletion
(Yes — in-app via Account → Delete Account, or email), not shared with third
parties (Firebase/Cloudinary/Expo are service providers, not "sharing").

## 4. App content → Privacy policy

`https://lcmodelingschool.com/privacy-policy.html`

## 5. Testing → Internal testing → Closed testing

Upload `mobile-app/android/app/build/outputs/bundle/release/app-release.aab`
to **Internal testing** first, confirm it installs, then promote to
**Closed testing** with 20+ tester emails and let it run 14 continuous days
(required for new developer accounts before Production access unlocks).

## Keystore reminder

`mobile-app/release.keystore.jks` + `mobile-app/keystore.properties` +
`mobile-app/android_keystore_credentials.txt` are all gitignored — back
them up outside this machine (password manager / encrypted cloud storage).
Losing them means you can never publish another update to this app.
