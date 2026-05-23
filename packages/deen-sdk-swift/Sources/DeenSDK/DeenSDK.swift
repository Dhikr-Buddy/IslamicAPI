import Foundation

public final class DeenSDK {
    public static let defaultOwner = "Dhikr-Buddy"
    public static let defaultRepo = "IslamicAPI"
    public static let defaultRef = "master"
    
    // Calculates Qibla direction (compass bearing in degrees)
    public static func getQiblaDirection(latitude: Double, longitude: Double) -> Double {
        let lat = latitude * .pi / 180.0
        let lon = longitude * .pi / 180.0
        let kaabaLat = 21.422487 * .pi / 180.0
        let kaabaLon = 39.826206 * .pi / 180.0
        
        let deltaLon = kaabaLon - lon
        let y = sin(deltaLon)
        let x = cos(lat) * tan(kaabaLat) - sin(lat) * cos(deltaLon)
        
        let degrees = atan2(y, x) * 180.0 / .pi
        return (degrees.truncatingRemainder(dividingBy: 360.0) + 360.0).truncatingRemainder(dividingBy: 360.0)
    }
    
    // Standard calculation methods structure
    public struct CalculationMethod {
        public let name: String
        public let fajrAngle: Double
        public let ishaAngle: Double?
        public let ishaMinutes: Double?
        public let maghribMinutes: Double?
    }
    
    public static let calculationMethods: [String: CalculationMethod] = [
        "MuslimWorldLeague": CalculationMethod(name: "MuslimWorldLeague", fajrAngle: 18.0, ishaAngle: 17.0, ishaMinutes: nil, maghribMinutes: nil),
        "Egyptian": CalculationMethod(name: "Egyptian", fajrAngle: 19.5, ishaAngle: 17.5, ishaMinutes: nil, maghribMinutes: nil),
        "Karachi": CalculationMethod(name: "Karachi", fajrAngle: 18.0, ishaAngle: 18.0, ishaMinutes: nil, maghribMinutes: nil),
        "UmmAlQura": CalculationMethod(name: "UmmAlQura", fajrAngle: 18.5, ishaAngle: nil, ishaMinutes: 90.0, maghribMinutes: nil),
        "Dubai": CalculationMethod(name: "Dubai", fajrAngle: 18.2, ishaAngle: 18.2, ishaMinutes: nil, maghribMinutes: nil),
        "MoonsightingCommittee": CalculationMethod(name: "MoonsightingCommittee", fajrAngle: 18.0, ishaAngle: 18.0, ishaMinutes: nil, maghribMinutes: nil),
        "ISNA": CalculationMethod(name: "ISNA", fajrAngle: 15.0, ishaAngle: 15.0, ishaMinutes: nil, maghribMinutes: nil)
    ]
    
    // Normalizes method names
    public static func normalizeMethodName(_ methodName: String?) -> String {
        guard let name = methodName, !name.isEmpty else { return "MuslimWorldLeague" }
        let clean = name.lowercased().replacingOccurrences(of: "[\\s_.-]", with: "", options: .regularExpression)
        if clean == "isna" { return "ISNA" }
        if clean == "egyptian" || clean == "egypt" { return "Egyptian" }
        if clean == "karachi" || clean == "universityofislamicscienceskarachi" { return "Karachi" }
        if clean == "ummalqura" || clean == "ummulqura" || clean == "makkah" { return "UmmAlQura" }
        if clean == "dubai" { return "Dubai" }
        if clean == "moonsightingcommittee" || clean == "moonsighting" { return "MoonsightingCommittee" }
        if clean == "muslimworldleague" || clean == "mwl" { return "MuslimWorldLeague" }
        
        for key in calculationMethods.keys {
            if key.lowercased() == clean {
                return key
            }
        }
        return "MuslimWorldLeague"
    }
    
    // Offline prayer times calculator
    public static func calculatePrayerTimes(
        latitude: Double,
        longitude: Double,
        date: Date = Date(),
        timezone: Double? = nil,
        method: String = "MuslimWorldLeague",
        madhab: String = "shafi",
        dhuhrMinutes: Double = 0.0
    ) -> [String: String] {
        let tz = timezone ?? Double(TimeZone.current.secondsFromGMT(for: date)) / 3600.0
        let normalizedKey = normalizeMethodName(method)
        let params = calculationMethods[normalizedKey] ?? calculationMethods["MuslimWorldLeague"]!
        
        let calendar = Calendar.current
        let day = calendar.ordinality(of: .day, in: .year, for: date) ?? 1
        
        let declination = 23.45 * sin((360.0 / 365.0) * Double(day - 81) * .pi / 180.0)
        let equation = equationOfTime(day: day)
        
        let noon = 12.0 + tz - (longitude / 15.0) - (equation / 60.0)
        
        let fajr = noon - hourAngle(latitude: latitude, declination: declination, zenith: 90.0 + params.fajrAngle) / 15.0
        let sunrise = noon - hourAngle(latitude: latitude, declination: declination, zenith: 90.833) / 15.0
        let dhuhr = noon + (dhuhrMinutes / 60.0)
        let asr = noon + asrHourAngle(latitude: latitude, declination: declination, shadowFactor: madhab == "hanafi" ? 2 : 1) / 15.0
        let sunset = noon + hourAngle(latitude: latitude, declination: declination, zenith: 90.833) / 15.0
        let maghrib = sunset + (params.maghribMinutes ?? 0.0) / 60.0
        
        let isha: Double
        if let ishaMinutes = params.ishaMinutes {
            isha = sunset + (ishaMinutes / 60.0)
        } else {
            isha = noon + hourAngle(latitude: latitude, declination: declination, zenith: 90.0 + (params.ishaAngle ?? 15.0)) / 15.0
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: date)
        
        return [
            "method": normalizedKey,
            "date": dateString,
            "timezone": String(tz),
            "fajr": formatTime(hours: fajr),
            "sunrise": formatTime(hours: sunrise),
            "dhuhr": formatTime(hours: dhuhr),
            "asr": formatTime(hours: asr),
            "maghrib": formatTime(hours: maghrib),
            "isha": formatTime(hours: isha)
        ]
    }
    
    // Builds raw github URLs
    public static func githubRawUrl(filePath: String, owner: String = defaultOwner, repo: String = defaultRepo, ref: String = defaultRef) -> String {
        let cleanPath = filePath.hasPrefix("/") ? String(filePath.dropFirst()) : filePath
        return "https://raw.githubusercontent.com/\(owner)/\(repo)/\(ref)/\(cleanPath)"
    }
    
    // Fill audio templates
    public static func fillAudioTemplate(template: String, surahNumber: Int, ayahNumber: Int) -> String {
        return template
            .replacingOccurrences(of: "{surah}", with: String(surahNumber))
            .replacingOccurrences(of: "{ayah}", with: String(ayahNumber))
            .replacingOccurrences(of: "{surah3}", with: String(format: "%03d", surahNumber))
            .replacingOccurrences(of: "{ayah3}", with: String(format: "%03d", ayahNumber))
    }
    
    private static func toRadians(_ degrees: Double) -> Double { degrees * .pi / 180.0 }
    private static func toDegrees(_ radians: Double) -> Double { radians * 180.0 / .pi }
    
    private static func equationOfTime(day: Int) -> Double {
        let b = (360.0 / 365.0) * Double(day - 81) * .pi / 180.0
        return 9.87 * sin(2.0 * b) - 7.53 * cos(b) - 1.5 * sin(b)
    }
    
    private static func hourAngle(latitude: Double, declination: Double, zenith: Double) -> Double {
        let lat = toRadians(latitude)
        let dec = toRadians(declination)
        let cosH = (cos(toRadians(zenith)) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec))
        let clampedCosH = max(-1.0, min(1.0, cosH))
        return toDegrees(acos(clampedCosH))
    }
    
    private static func asrHourAngle(latitude: Double, declination: Double, shadowFactor: Double) -> Double {
        let angle = toDegrees(atan(1.0 / (shadowFactor + tan(abs(latitude - declination) * .pi / 180.0))))
        return hourAngle(latitude: latitude, declination: declination, zenith: 90.0 - angle)
    }
    
    private static func formatTime(hours: Double) -> String {
        let totalMinutes = Int(round(((hours.truncatingRemainder(dividingBy: 24.0) + 24.0).truncatingRemainder(dividingBy: 24.0)) * 60.0))
        let h = (totalMinutes / 60) % 24
        let m = totalMinutes % 60
        return String(format: "%02d:%02d", h, m)
    }
}
