export interface Provenance {
  sourceUrl: string;
  license?: string;
  retrievedAt: string;
}

export interface Ayah {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  text: Record<string, string>;
  provenance: Provenance[];
}

export interface Surah {
  number: number;
  name?: string;
  englishName?: string;
  ayahCount?: number;
  ayahs?: Ayah[];
}

export interface Hadith {
  id: string;
  collection: string;
  book?: string;
  number?: string;
  text: Record<string, string>;
  grade?: string;
  provenance: Provenance[];
}

export function getSurah(number: number): Surah | null;
export function getAyah(surahNumber: number, ayahNumber: number): Ayah | null;
export function search(query: string, options?: { limit?: number }): Ayah[];
export function getHadith(id: string): Hadith | null;
export function randomHadith(options?: { collection?: string }): Hadith | null;
export function calculatePrayerTimes(input: {
  latitude: number;
  longitude: number;
  date?: string;
  timezone?: number;
  method?: string;
  madhab?: "shafi" | "hanafi";
  dhuhrMinutes?: number;
}): Record<string, string | number>;
export function getQiblaDirection(latitude: number, longitude: number): number;
export function getReciterList(): Array<Record<string, unknown>>;
export function getAudioUrl(reciterId: string, surahNumber: number, ayahNumber: number): string | null;
