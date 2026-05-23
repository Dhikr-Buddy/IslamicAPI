import 'dart:convert';
import 'dart:math' as math;

class DeenSDK {
  static const String defaultOwner = "Dhikr-Buddy";
  static const String defaultRepo = "IslamicAPI";
  static const String defaultRef = "master";

  // Calculates Qibla direction (compass bearing in degrees)
  static double getQiblaDirection(double latitude, double longitude) {
    final double lat = latitude * math.pi / 180.0;
    final double lon = longitude * math.pi / 180.0;
    final double kaabaLat = 21.422487 * math.pi / 180.0;
    final double kaabaLon = 39.826206 * math.pi / 180.0;

    final double deltaLon = kaabaLon - lon;
    final double y = math.sin(deltaLon);
    final double x = math.cos(lat) * math.tan(kaabaLat) - math.sin(lat) * math.cos(deltaLon);

    final double degrees = math.atan2(y, x) * 180.0 / math.pi;
    return (degrees % 360.0 + 360.0) % 360.0;
  }

  // Standard prayer times calculation methods
  static const Map<String, Map<String, double>> calculationMethods = {
    "MuslimWorldLeague": {"fajrAngle": 18, "ishaAngle": 17},
    "Egyptian": {"fajrAngle": 19.5, "ishaAngle": 17.5},
    "Karachi": {"fajrAngle": 18, "ishaAngle": 18},
    "UmmAlQura": {"fajrAngle": 18.5, "ishaMinutes": 90},
    "Dubai": {"fajrAngle": 18.2, "ishaAngle": 18.2},
    "MoonsightingCommittee": {"fajrAngle": 18, "ishaAngle": 18},
    "ISNA": {"fajrAngle": 15, "ishaAngle": 15},
  };

  // Normalizes prayer times calculation method names
  static String normalizeMethodName(String? methodName) {
    if (methodName == null || methodName.isEmpty) return "MuslimWorldLeague";
    final clean = methodName.toLowerCase().replaceAll(RegExp(r'[\s_.-]'), '');
    if (clean == "isna") return "ISNA";
    if (clean == "egyptian" || clean == "egypt") return "Egyptian";
    if (clean == "karachi" || clean == "universityofislamicscienceskarachi") return "Karachi";
    if (clean == "ummalqura" || clean == "ummulqura" || clean == "makkah") return "UmmAlQura";
    if (clean == "dubai") return "Dubai";
    if (clean == "moonsightingcommittee" || clean == "moonsighting") return "MoonsightingCommittee";
    if (clean == "muslimworldleague" || clean == "mwl") return "MuslimWorldLeague";

    for (final key in calculationMethods.keys) {
      if (key.toLowerCase() == clean) return key;
    }
    return "MuslimWorldLeague";
  }

  // Calculates daily prayer times offline
  static Map<String, String> calculatePrayerTimes({
    required double latitude,
    required double longitude,
    DateTime? date,
    double? timezone,
    String method = "MuslimWorldLeague",
    String madhab = "shafi",
    double dhuhrMinutes = 0.0,
  }) {
    final DateTime targetDate = date ?? DateTime.now();
    final double tz = timezone ?? (targetDate.timeZoneOffset.inSeconds / 3600.0);
    final String normalizedKey = normalizeMethodName(method);
    final Map<String, double> params = calculationMethods[normalizedKey]!;

    final int day = _dayOfYear(targetDate);
    final double declination = 23.45 * math.sin((360.0 / 365.0) * (day - 81) * math.pi / 180.0);
    final double equation = _equationOfTime(day);

    final double noon = 12.0 + tz - (longitude / 15.0) - (equation / 60.0);
    
    final double fajr = noon - _hourAngle(latitude, declination, 90.0 + params["fajrAngle"]!) / 15.0;
    final double sunrise = noon - _hourAngle(latitude, declination, 90.833) / 15.0;
    final double dhuhr = noon + (dhuhrMinutes / 60.0);
    final double asr = noon + _asrHourAngle(latitude, declination, madhab == "hanafi" ? 2 : 1) / 15.0;
    final double sunset = noon + _hourAngle(latitude, declination, 90.833) / 15.0;
    final double maghrib = sunset + (params["maghribMinutes"] ?? 0.0) / 60.0;
    
    final double isha = params.containsKey("ishaMinutes")
        ? sunset + (params["ishaMinutes"]! / 60.0)
        : noon + _hourAngle(latitude, declination, 90.0 + params["ishaAngle"]!) / 15.0;

    return {
      "method": normalizedKey,
      "date": "${targetDate.year}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.day.toString().padLeft(2, '0')}",
      "timezone": tz.toString(),
      "fajr": _formatTime(fajr),
      "sunrise": _formatTime(sunrise),
      "dhuhr": _formatTime(dhuhr),
      "asr": _formatTime(asr),
      "maghrib": _formatTime(maghrib),
      "isha": _formatTime(isha),
    };
  }

  // Build GitHub raw URLs
  static String githubRawUrl(String filePath, {String owner = defaultOwner, String repo = defaultRepo, String ref = defaultRef}) {
    final cleanPath = filePath.replaceFirst(RegExp(r'^/+'), '');
    return "https://raw.githubusercontent.com/$owner/$repo/$ref/$cleanPath";
  }

  // Standard audio URL templates filler
  static String fillAudioTemplate(String template, int surahNumber, int ayahNumber) {
    return template
        .replaceAll("{surah}", surahNumber.toString())
        .replaceAll("{ayah}", ayahNumber.toString())
        .replaceAll("{surah3}", surahNumber.toString().padLeft(3, '0'))
        .replaceAll("{ayah3}", ayahNumber.toString().padLeft(3, '0'));
  }

  static double _toRadians(double degrees) => degrees * math.pi / 180.0;
  static double _toDegrees(double radians) => radians * 180.0 / math.pi;

  static int _dayOfYear(DateTime date) {
    final diff = date.difference(DateTime(date.year, 1, 1));
    return diff.inDays + 1;
  }

  static double _equationOfTime(int day) {
    final double b = (360.0 / 365.0) * (day - 81) * math.pi / 180.0;
    return 9.87 * math.sin(2.0 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b);
  }

  static double _hourAngle(double latitude, double declination, double zenith) {
    final double lat = _toRadians(latitude);
    final double dec = _toRadians(declination);
    final double cosH = (math.cos(_toRadians(zenith)) - math.sin(lat) * math.sin(dec)) / (math.cos(lat) * math.cos(dec));
    return _toDegrees(math.acos(cosH.clamp(-1.0, 1.0)));
  }

  static double _asrHourAngle(double latitude, double declination, int shadowFactor) {
    final double angle = _toDegrees(math.atan(1.0 / (shadowFactor + math.tan((latitude - declination).abs() * math.pi / 180.0))));
    return _hourAngle(latitude, declination, 90.0 - angle);
  }

  static String _formatTime(double hours) {
    final int totalMinutes = (((hours % 24.0) + 24.0) % 24.0 * 60.0).round();
    final int h = (totalMinutes ~/ 60) % 24;
    final int m = totalMinutes % 60;
    return "${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}";
  }
}
