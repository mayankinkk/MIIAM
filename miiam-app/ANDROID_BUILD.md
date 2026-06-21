# MIIAM Android WebView App

## Setup

### Prerequisites
1. **Android Studio** — https://developer.android.com/studio
2. **JDK 17+**

### Open in Android Studio
```
File → Open → select miiam-app/android-app/
```

### Build
```
# Debug APK (test on device)
Build → Build Bundle(s) / APK(s) → Build APK(s)
# Output: android-app/app/build/outputs/apk/debug/app-debug.apk

# Release AAB (Play Store)
Build → Generate Signed Bundle / APK
→ Android App Bundle
→ Create keystore (first time) or select existing
→ Release
# Output: android-app/app/build/outputs/bundle/release/app-release.aab
```

## Generate Release Keystore
```bash
keytool -genkey -v \
  -keystore miiam-release.keystore \
  -alias miiam \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
**Store this securely. You cannot update your app without it.**

Then in `app/build.gradle`, add:
```gradle
android {
    signingConfigs {
        release {
            storeFile file("../miiam-release.keystore")
            storePassword "your-store-password"
            keyAlias "miiam"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Google Play Console Steps

### 1. Create Account
https://play.google.com/console — pay one-time $25 fee

### 2. Create App
- App Name: **MIIAM**
- Default Language: English
- App Category: Food & Drink
- Type: App
- Price: Free

### 3. Upload AAB
```
Release → Production → Create New Release
→ Upload app-release.aab
→ Add release notes
→ Save
```

### 4. Store Listing
- **App name:** MIIAM
- **Short description:** Your super app for food, services & more
- **Full description:** (4000 chars max — describe features)
- **Screenshots:** min 2 phone screenshots (16:9 ratio)
- **App icon:** 512×512 PNG
- **Feature graphic:** 1024×500 PNG

### 5. Required Forms
- **Data Safety** — data you collect (location, contacts, etc.)
- **Content Rating** — fill questionnaire
- **App Access** — login credentials if needed for review
- **Ads** — Yes/No declaration
- **Target Audience** — age groups

### 6. Submit
```
Production → Review Release → Start Rollout
```
Review: hours to a few days.

## App Details

| Field | Value |
|-------|-------|
| Package | `com.miiam.superapp` |
| Min SDK | 23 (Android 6.0) |
| Target SDK | 35 (Android 15) |
| URL | `https://miiam.in` |
| Permissions | Internet, Camera, Location, Notifications, Phone |

## Troubleshooting

**White screen:** Check internet connection. WebView loads miiam.in remotely.

**App rejected:**
- Ensure targetSdk >= 34
- Add Privacy Policy URL
- Complete Data Safety form
- Add valid screenshots

**Can't build:** Open `android-app/` in Android Studio, let Gradle sync, then build.
