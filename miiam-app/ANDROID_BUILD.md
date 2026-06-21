# MIIAM Android WebView App

## Setup Instructions

### Prerequisites
1. **Android Studio** — Download from https://developer.android.com/studio
2. **Java JDK 17+** — Required for Gradle builds
3. **Node.js 18+** — Already installed

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Sync Capacitor with Android
npm run android:sync

# 3. Open in Android Studio
npm run android:open
```

### Build Commands
```bash
# Debug APK (for testing)
npm run android:build
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Release AAB (for Play Store)
npm run android:build:release
# Output: android/app/build/outputs/bundle/release/app-release.aab

# Clean build
npm run android:clean
```

## Play Store Submission

### 1. Generate Signing Key
```bash
keytool -genkey -v -keystore miiam-release.keystore -alias miiam -keyalg RSA -keysize 2048 -validity 10000
```
**IMPORTANT:** Store this keystore securely! You cannot update your app without it.

### 2. Configure Signing in Android Studio
1. Open Android Studio → Build → Generate Signed Bundle/APK
2. Select "Android App Bundle"
3. Create/use keystore
4. Select "release" build variant

### 3. Version Bumping
Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 1      // Increment for each release (integer)
    versionName "1.0"  // Human-readable version
}
```

### 4. Store Listing Requirements
- **App Name:** MIIAM
- **Short Description:** Your super app for food, services & more
- **Category:** Food & Drink or Shopping
- **Content Rating:** Complete questionnaire in Play Console
- **Privacy Policy URL:** https://miiam.in/privacy (or your policy URL)

### 5. Screenshots Needed
- Phone: 16:9 ratio, min 2 screenshots
- Tablet (optional): 7-10 inch
- Feature Graphic: 1024x500px

## Push Notifications (FCM)

For push notifications to work, you need:

1. Create a **Firebase Project** at https://console.firebase.google.com
2. Add Android app with package name `com.miiam.superapp`
3. Download `google-services.json`
4. Place it at `android/app/google-services.json`
5. Add your FCM server key to `.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-key
   VAPID_PRIVATE_KEY=your-private-key
   ```

## Architecture

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml          # Permissions & config
│   │   ├── java/.../MainActivity.java   # Capacitor bridge
│   │   └── res/
│   │       ├── drawable/splash.xml      # Splash screen
│   │       ├── drawable/ic_launcher_foreground.xml
│   │       ├── mipmap-*/                # App icons
│   │       ├── values/colors.xml        # Brand colors
│   │       ├── values/styles.xml        # Theme
│   │       └── xml/
│   │           ├── file_paths.xml       # FileProvider
│   │           └── network_security_config.xml
│   └── build.gradle                     # App config
├── build.gradle                         # Project config
└── variables.gradle                     # SDK versions
```

## Troubleshooting

### Build fails
```bash
cd android && ./gradlew clean && cd ..
npm run android:sync
```

### White screen / blank page
- Ensure `server.url` in `capacitor.config.ts` points to your live URL
- Check that the URL is accessible from the device

### Push notifications not working
- Ensure `google-services.json` is in `android/app/`
- Ensure Firebase project has the correct SHA-1 fingerprint
- Test with `adb shell am start -a android.intent.action.VIEW -d "miiam://deep-link"`

### App rejected on Play Store
- Ensure targetSdkVersion >= 34 (currently 35)
- Ensure minSdkVersion >= 21 (currently 23)
- Complete the Data Safety section in Play Console
- Add a valid Privacy Policy URL
