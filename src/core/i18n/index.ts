import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageMeta } from './types';
import { TRANSLATIONS, TOPIC_TITLES_ZH, TOOL_TITLES_ZH, Translations } from './translations';

export * from './types';
export * from './translations';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: (typeof window !== 'undefined' && (localStorage.getItem('mesurv-lang') as SupportedLanguage)) || 'th',
      setLanguage: (lang: SupportedLanguage) => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('mesurv-lang', lang);
            document.documentElement.setAttribute('lang', lang);
          }
        } catch {}
        set({ language: lang });
      },
    }),
    {
      name: 'mesurv-lang-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Remove parenthesized English or transliterated suffixes from Thai titles
 * Example:
 * "คู่มือการใช้งานกล้องระดับ (Automatic & Digital Level Instrument Manual)"
 * -> "คู่มือการใช้งานกล้องระดับ"
 */
export function cleanParenthesizedTitle(str: string): string {
  if (!str) return '';
  return str.replace(/\s*\([A-Za-z0-9\s/&,._\-+°%—–:#]+\)\s*$/, '').trim();
}

/**
 * Returns localized title based on the active language:
 * - 'th': Strips parenthesized translations, keeping clean Thai text
 * - 'en': Uses provided titleEn or strips Thai before parentheses
 * - 'zh': Looks up Chinese translation table, falls back to titleEn or clean Thai
 */
export function getLocalizedTitle(
  id: string,
  rawTitle: string,
  titleEn?: string,
  lang: SupportedLanguage = 'th'
): string {
  if (lang === 'zh') {
    if (TOPIC_TITLES_ZH[id]) return TOPIC_TITLES_ZH[id];
    if (titleEn) return titleEn;
    return cleanParenthesizedTitle(rawTitle);
  }

  if (lang === 'en') {
    if (titleEn && titleEn.trim().length > 0) return titleEn.trim();
    // Check if rawTitle has parenthesized English
    const match = rawTitle.match(/\(([A-Za-z0-9\s/&,._\-+°%—–:#]+)\)\s*$/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return rawTitle;
  }

  // Default 'th'
  return cleanParenthesizedTitle(rawTitle);
}

/**
 * Hook to get current translations and active language
 */
export function useI18n(): {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  currentMeta: LanguageMeta;
  allLanguages: LanguageMeta[];
} {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = TRANSLATIONS[language] || TRANSLATIONS.th;
  const currentMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return {
    language,
    setLanguage,
    t,
    currentMeta,
    allLanguages: SUPPORTED_LANGUAGES,
  };
}
