# Mobile Client SDKs

IslamicAPI offers pre-packaged, zero-dependency source libraries for three major native mobile development environments: **Flutter (Dart)**, **Swift**, and **Kotlin (Android)**.

These libraries implement offline calculation routines, Qibla compass alignment calculations, and flexible keyword/normalization parameters natively.

---

## 1. Flutter (Dart)

### Installation
Copy the Dart file from `packages/deen-sdk-flutter/lib/deen_sdk.dart` into your Flutter `lib/` folder.

### Usage

```dart
import 'package:your_app/deen_sdk.dart';

void main() {
  // 1. Calculate Qibla angle (compass bearing)
  double qiblaAngle = DeenSDK.getQiblaDirection(40.7128, -74.006);
  print("Qibla Bearing: $qiblaAngle°");

  // 2. Offline Prayer Times
  var prayerTimes = DeenSDK.calculatePrayerTimes(
    latitude: 40.7128,
    longitude: -74.006,
    method: "isna", // Automatically normalized
    date: DateTime.now(),
  );

  print("Fajr: ${prayerTimes['fajr']}");
  print("Isha: ${prayerTimes['isha']}");
}
```

---

## 2. iOS (Swift)

### Installation
Integrate the Swift source file from `packages/deen-sdk-swift/Sources/DeenSDK/DeenSDK.swift` into your Xcode target.

### Usage

```swift
import Foundation
import DeenSDK

// 1. Compass Bearing
let qibla = DeenSDK.getQiblaDirection(latitude: 40.7128, longitude: -74.006)
print("Qibla Angle: \(qibla)°")

// 2. Offline Prayer Calculations
let times = DeenSDK.calculatePrayerTimes(
    latitude: 40.7128,
    longitude: -74.006,
    method: "umm ul qura" // Automatically normalized to standard keys
)
print("Fajr: \(times["fajr"] ?? ""), Maghrib: \(times["maghrib"] ?? "")")
```

---

## 3. Android (Kotlin)

### Installation
Copy the Kotlin object from `packages/deen-sdk-kotlin/src/main/kotlin/deensdk/DeenSDK.kt` into your Android project's `java/` or `kotlin/` packages directory.

### Usage

```kotlin
import deensdk.DeenSDK
import java.util.Date

fun main() {
    // 1. Qibla Bearing
    val qibla = DeenSDK.getQiblaDirection(40.7128, -74.006)
    println("Qibla Angle: $qibla°")

    // 2. Offline Prayer Calculations
    val times = DeenSDK.calculatePrayerTimes(
        latitude = 40.7128,
        longitude = -74.006,
        method = "karachi" // Case and space insensitive normalization
    )
    println("Fajr: ${times["fajr"]}, Asr: ${times["asr"]}")
}
```
