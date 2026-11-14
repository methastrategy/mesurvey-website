export type SupportedLanguage = 'th' | 'en' | 'zh';

export interface LanguageMeta {
  code: SupportedLanguage;
  label: string;
  shortLabel: string;
  nameNative: string;
  nameEn: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'th',
    label: 'ไทย (TH)',
    shortLabel: 'TH',
    nameNative: 'ไทย',
    nameEn: 'Thai',
    flag: '🇹🇭',
  },
  {
    code: 'en',
    label: 'English (EN)',
    shortLabel: 'EN',
    nameNative: 'English',
    nameEn: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'zh',
    label: '中文 (ZH)',
    shortLabel: '中',
    nameNative: '简体中文',
    nameEn: 'Mandarin (Simplified)',
    flag: '🇨🇳',
  },
];
