import { describe, it, expect, beforeEach } from 'vitest';
import { 
  useLanguageStore, 
  cleanParenthesizedTitle, 
  getLocalizedTitle,
  TRANSLATIONS,
  TOPIC_TITLES_ZH,
  TOOL_TITLES_ZH
} from '../src/core/i18n';

describe('i18n Multi-Language Switcher and Title De-cluttering', () => {
  beforeEach(() => {
    useLanguageStore.getState().setLanguage('th');
  });

  it('stores and switches between th, en, and zh languages', () => {
    expect(useLanguageStore.getState().language).toBe('th');
    
    useLanguageStore.getState().setLanguage('en');
    expect(useLanguageStore.getState().language).toBe('en');

    useLanguageStore.getState().setLanguage('zh');
    expect(useLanguageStore.getState().language).toBe('zh');
  });

  it('cleans parenthesized translations cleanly from Thai titles', () => {
    const raw = 'คู่มือการใช้งานกล้องระดับ (Automatic & Digital Level Instrument Manual)';
    const cleaned = cleanParenthesizedTitle(raw);
    expect(cleaned).toBe('คู่มือการใช้งานกล้องระดับ');
    expect(cleaned).not.toContain('(');
    expect(cleaned).not.toContain(')');
  });

  it('returns appropriate localized titles across th, en, and zh', () => {
    const id = 'differential-leveling-survey';
    const rawTh = 'การเดินระดับภาคสนามและการตรวจสอบเลขคณิต (Differential Leveling & Arithmetic Check)';
    const titleEn = 'Differential Leveling & Arithmetic Check SOP';

    // Thai: Cleaned title without brackets
    const thResult = getLocalizedTitle(id, rawTh, titleEn, 'th');
    expect(thResult).toBe('การเดินระดับภาคสนามและการตรวจสอบเลขคณิต');

    // English: English title
    const enResult = getLocalizedTitle(id, rawTh, titleEn, 'en');
    expect(enResult).toBe('Differential Leveling & Arithmetic Check SOP');

    // Chinese: Mandarin title from dictionary
    const zhResult = getLocalizedTitle(id, rawTh, titleEn, 'zh');
    expect(zhResult).toBe('外业几何水准测量与算术检核规程');
  });

  it('has comprehensive dictionaries for th, en, and zh', () => {
    expect(TRANSLATIONS.th.nav.knowledge).toBe('คลังความรู้');
    expect(TRANSLATIONS.en.nav.knowledge).toBe('Knowledge Hub');
    expect(TRANSLATIONS.zh.nav.knowledge).toBe('知识库');

    expect(TRANSLATIONS.th.tools.domainCivil).toContain('วิศวกรรมโยธา');
    expect(TRANSLATIONS.en.tools.domainCivil).toContain('Civil');
    expect(TRANSLATIONS.zh.tools.domainCivil).toContain('土木工程');

    expect(Object.keys(TOPIC_TITLES_ZH).length).toBeGreaterThanOrEqual(13);
    expect(Object.keys(TOOL_TITLES_ZH).length).toBeGreaterThanOrEqual(10);
  });
});
