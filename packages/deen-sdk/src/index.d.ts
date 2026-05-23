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
export function getFontList(): Array<Record<string, unknown>>;
export function getHaramainCompilations(): Array<Record<string, unknown>>;
export function getHaramainCompilation(id: string): Record<string, unknown> | null;
export function getAyahTimestamps(surahNumber: number, reciterId?: string): Array<Record<string, unknown>>;
export function getWordTimestamps(surahNumber: number, ayahNumber: number, reciterId?: string): Array<Record<string, unknown>>;
export function getPageTimestamps(pageNumber: number, reciterId?: string): Record<string, unknown>;
export function getFontCss(): string;
export function downloadToClient(url: string, fileName?: string): void;
export function githubRawUrl(filePath: string, options?: { owner?: string; repo?: string; ref?: string }): string;
export function createRawDataClient(options?: {
  owner?: string;
  repo?: string;
  ref?: string;
  fetchImpl?: typeof fetch;
}): {
  indexUrl: string;
  loadIndex(): Promise<Record<string, unknown>>;
  loadQuran(): Promise<Record<string, unknown>>;
  loadHadith(): Promise<Record<string, unknown>>;
  loadAudio(): Promise<Record<string, unknown>>;
  loadFonts(): Promise<Record<string, unknown>>;
  loadSurah(number: number): Promise<Record<string, unknown>>;
  rawUrl(filePath: string): string;
};
