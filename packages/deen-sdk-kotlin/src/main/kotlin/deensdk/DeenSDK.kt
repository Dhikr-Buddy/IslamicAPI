package deensdk

import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.*

object DeenSDK {
    const val DEFAULT_OWNER = "Dhikr-Buddy"
    const val DEFAULT_REPO = "IslamicAPI"
    const val DEFAULT_REF = "master"

    // Calculates Qibla direction (compass bearing in degrees)
    fun getQiblaDirection(latitude: Double, longitude: Double): Double {
        val lat = Math.toRadians(latitude)
        val lon = Math.toRadians(longitude)
        val kaabaLat = Math.toRadians(21.422487)
        val kaabaLon = Math.toRadians(39.826206)

        val deltaLon = kaabaLon - lon
        val y = sin(deltaLon)
        val x = cos(lat) * tan(kaabaLat) - sin(lat) * cos(deltaLon)

        val degrees = Math.toDegrees(atan2(y, x))
        return (degrees % 360.0 + 360.0) % 360.0
    }

    class CalculationMethod(
        val name: String,
        val fajrAngle: Double,
        val ishaAngle: Double? = null,
        val ishaMinutes: Double? = null,
        val maghribMinutes: Double? = null
    )

    val calculationMethods = mapOf(
        "MuslimWorldLeague" to CalculationMethod("MuslimWorldLeague", 18.0, ishaAngle = 17.0),
        "Egyptian" to CalculationMethod("Egyptian", 19.5, ishaAngle = 17.5),
        "Karachi" to CalculationMethod("Karachi", 18.0, ishaAngle = 18.0),
        "UmmAlQura" to CalculationMethod("UmmAlQura", 18.5, ishaMinutes = 90.0),
        "Dubai" to CalculationMethod("Dubai", 18.2, ishaAngle = 18.2),
        "MoonsightingCommittee" to CalculationMethod("MoonsightingCommittee", 18.0, ishaAngle = 18.0),
        "ISNA" to CalculationMethod("ISNA", 15.0, ishaAngle = 15.0)
    )

    // Normalizes method names
    fun normalizeMethodName(methodName: String?): String {
        if (methodName.isNullOrEmpty()) return "MuslimWorldLeague"
        val clean = methodName.lowercase().replace(Regex("[\\s_.-]"), "")
        if (clean == "isna") return "ISNA"
        if (clean == "egyptian" || clean == "egypt") return "Egyptian"
        if (clean == "karachi" || clean == "universityofislamicscienceskarachi") return "Karachi"
        if (clean == "ummalqura" || clean == "ummulqura" || clean == "makkah") return "UmmAlQura"
        if (clean == "dubai") return "Dubai"
        if (clean == "moonsightingcommittee" || clean == "moonsighting") return "MoonsightingCommittee"
        if (clean == "muslimworldleague" || clean == "mwl") return "MuslimWorldLeague"

        for (key in calculationMethods.keys) {
            if (key.lowercase() == clean) {
                return key
            }
        }
        return "MuslimWorldLeague"
    }

    // Calculates daily prayer times offline
    fun calculatePrayerTimes(
        latitude: Double,
        longitude: Double,
        date: Date = Date(),
        timezone: Double? = null,
        method: String = "MuslimWorldLeague",
        madhab: String = "shafi",
        dhuhrMinutes: Double = 0.0
    ): Map<String, String> {
        val calendar = Calendar.getInstance().apply { time = date }
        val tz = timezone ?: (calendar.timeZone.rawOffset / 3600000.0)
        
        val normalizedKey = normalizeMethodName(method)
        val params = calculationMethods[normalizedKey] ?: calculationMethods["MuslimWorldLeague"]!!

        val day = calendar.get(Calendar.DAY_OF_YEAR)
        val declination = 23.45 * sin(Math.toRadians((360.0 / 365.0) * (day - 81)))
        val equation = equationOfTime(day)

        val noon = 12.0 + tz - (longitude / 15.0) - (equation / 60.0)

        val fajr = noon - hourAngle(latitude, declination, 90.0 + params.fajrAngle) / 15.0
        val sunrise = noon - hourAngle(latitude, declination, 90.833) / 15.0
        val dhuhr = noon + (dhuhrMinutes / 60.0)
        val asr = noon + asrHourAngle(latitude, declination, if (madhab == "hanafi") 2 else 1) / 15.0
        val sunset = noon + hourAngle(latitude, declination, 90.833) / 15.0
        val maghrib = sunset + (params.maghribMinutes ?: 0.0) / 60.0

        val isha = if (params.ishaMinutes != null) {
            sunset + (params.ishaMinutes / 60.0)
        } else {
            noon + hourAngle(latitude, declination, 90.0 + (params.ishaAngle ?: 15.0)) / 15.0
        }

        val sdf = SimpleDateFormat("yyyy-MM-DD", Locale.US)
        val dateString = sdf.format(date)

        return mapOf(
            "method" to normalizedKey,
            "date" to dateString,
            "timezone" to tz.toString(),
            "fajr" to formatTime(fajr),
            "sunrise" to formatTime(sunrise),
            "dhuhr" to formatTime(dhuhr),
            "asr" to formatTime(asr),
            "maghrib" to formatTime(maghrib),
            "isha" to formatTime(isha)
        )
    }

    // Builds raw GitHub URLs
    fun githubRawUrl(filePath: String, owner: String = DEFAULT_OWNER, repo: String = DEFAULT_REPO, ref: String = DEFAULT_REF): String {
        val cleanPath = filePath.removePrefix("/")
        return "https://raw.githubusercontent.com/$owner/$repo/$ref/$cleanPath"
    }

    // Fills audio URL templates
    fun fillAudioTemplate(template: String, surahNumber: Int, ayahNumber: Int): String {
        return template
            .replace("{surah}", surahNumber.toString())
            .replace("{ayah}", ayahNumber.toString())
            .replace("{surah3}", String.format("%03d", surahNumber))
            .replace("{ayah3}", String.format("%03d", ayahNumber))
    }

    private fun equationOfTime(day: Int): Double {
        val b = Math.toRadians((360.0 / 365.0) * (day - 81))
        return 9.87 * sin(2.0 * b) - 7.53 * cos(b) - 1.5 * sin(b)
    }

    private fun hourAngle(latitude: Double, declination: Double, zenith: Double): Double {
        val lat = Math.toRadians(latitude)
        val dec = Math.toRadians(declination)
        val cosH = (cos(Math.toRadians(zenith)) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec))
        val clampedCosH = cosH.coerceIn(-1.0, 1.0)
        return Math.toDegrees(acos(clampedCosH))
    }

    private fun asrHourAngle(latitude: Double, declination: Double, shadowFactor: Int): Double {
        val angle = Math.toDegrees(atan(1.0 / (shadowFactor + tan(abs(Math.toRadians(latitude - declination))))))
        return hourAngle(latitude, declination, 90.0 - angle)
    }

    private fun formatTime(hours: Double): String {
        val totalMinutes = Math.round(((hours % 24.0 + 24.0) % 24.0) * 60.0).toInt()
        val h = (totalMinutes / 60) % 24
        val m = totalMinutes % 60
        return String.format("%02d:%02d", h, m)
    }
}
