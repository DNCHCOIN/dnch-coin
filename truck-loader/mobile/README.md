# Товарене на ремарке — Android
Android app from the existing DNCHCOIN/dnch-coin/truck-loader website. Shares the exact JS planning algorithm. Includes local web assets for offline operation. The existing web site is not modified.

## Build
Open GitHub Actions > Truck Loader Android APK, run it on the development branch, then download the DNCH-Truck-Loader-Android-debug artifact and extract app-debug.apk. This is an installable debug build, not a signed Google Play release.

## Features
- Automatic and manual loading layouts; stacking, weight limit, free spaces and pallet equivalents
- Saves current input on Android device via localStorage; website and APK use separate storage
- Save plan opens Android file picker for JSON; Import plan uses file input
- Print / PDF opens Android print dialog, where you can choose Save as PDF
- Temperature/suggestions need Internet; location permission requested after tapping the weather button
- Mobile CSS in the built copy optimizes cards and leaves the cargo table horizontally scrollable

## Local development
Install Node 22+, Java 21, Android SDK API 36. In truck-loader/mobile run npm install, npm run prepare, npx cap add android, npx cap sync android. Copy native/*.java to android/app/src/main/java/com/dnch/truckloader/, add the location permissions, and run android/gradlew assembleDebug. GitHub Actions automates these steps.

## Verification status
Compilation and real Android device testing (PDF, JSON picker, touch dragging, GPS) are required before calling this a finished release.

Cargo plan is advisory; axle loads, load securement and structural bearing capacity require separate verification.
