import { describe, it, expect } from 'vitest';
import { 
  CIVIL_SURVEY_GLOSSARY, 
  BUILDING_LAW_ITEMS, 
  CONCRETE_COVERING_RULES, 
  FIELD_TROUBLESHOOTING_ITEMS,
  CONSOLIDATED_LAW_ENACTMENTS,
  type GlossaryCategory 
} from '../src/data/site-knowledge';
import { KNOWLEDGE_TOPICS } from '../src/data/knowledge-topics';

describe('Site Knowledge & Engineering Data Layer Invariants', () => {
  it('guarantees KNOWLEDGE_TOPICS preserves the strict length invariant of 13 SOPs', () => {
    expect(KNOWLEDGE_TOPICS).toBeDefined();
    expect(KNOWLEDGE_TOPICS.length).toBe(13);
  });

  it('guarantees CIVIL_SURVEY_GLOSSARY contains complete 262 bilingual terms', () => {
    expect(CIVIL_SURVEY_GLOSSARY).toBeDefined();
    expect(CIVIL_SURVEY_GLOSSARY.length).toBe(262);
  });

  it('verifies all 262 glossary terms have unique IDs and non-empty definitions and field tips', () => {
    const seenIds = new Set<string>();
    for (const item of CIVIL_SURVEY_GLOSSARY) {
      expect(item.id).toBeTruthy();
      expect(seenIds.has(item.id)).toBe(false);
      seenIds.add(item.id);

      expect(item.termEn.trim().length).toBeGreaterThan(0);
      expect(item.termTh.trim().length).toBeGreaterThan(0);
      expect(item.definition.trim().length).toBeGreaterThan(0);
      expect(item.fieldUsage.trim().length).toBeGreaterThan(0);
      expect(item.categoryLabel.trim().length).toBeGreaterThan(0);
    }
  });

  it('verifies all 12 engineering categories are present in CIVIL_SURVEY_GLOSSARY', () => {
    const requiredCategories: GlossaryCategory[] = [
      'earthwork',
      'foundation',
      'concrete',
      'rebar',
      'survey',
      'masonry',
      'finishing',
      'plumbing',
      'electrical',
      'road',
      'contract',
      'legal',
    ];

    const presentCategories = new Set(CIVIL_SURVEY_GLOSSARY.map(item => item.category));

    for (const cat of requiredCategories) {
      expect(presentCategories.has(cat)).toBe(true);
      const count = CIVIL_SURVEY_GLOSSARY.filter(item => item.category === cat).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('guarantees BUILDING_LAW_ITEMS contains 8 structural setback provisions', () => {
    expect(BUILDING_LAW_ITEMS.length).toBe(8);
    for (const law of BUILDING_LAW_ITEMS) {
      expect(law.id).toBeTruthy();
      expect(law.title).toBeTruthy();
      expect(law.requirement).toBeTruthy();
      expect(law.legalClause).toBeTruthy();
      expect(law.fieldTips).toBeTruthy();
    }
  });

  it('guarantees CONCRETE_COVERING_RULES contains 5 standard clauses from EIT 1007-34', () => {
    expect(CONCRETE_COVERING_RULES.length).toBe(5);
    for (const rule of CONCRETE_COVERING_RULES) {
      expect(rule.id).toBeTruthy();
      expect(rule.minCoveringCm).toBeGreaterThan(0);
      expect(rule.standardClause).toBeTruthy();
    }
  });

  it('guarantees FIELD_TROUBLESHOOTING_ITEMS contains 6 field emergency resolution workflows', () => {
    expect(FIELD_TROUBLESHOOTING_ITEMS.length).toBe(6);
    for (const item of FIELD_TROUBLESHOOTING_ITEMS) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.symptom).toBeTruthy();
      expect(item.rootCauses.length).toBeGreaterThan(0);
      expect(item.fieldDiagnostics.length).toBeGreaterThan(0);
      expect(item.actionSteps.length).toBeGreaterThan(0);
      expect(item.prevention).toBeTruthy();
    }
  });

  it('guarantees CONSOLIDATED_LAW_ENACTMENTS groups laws into 4 master enactments', () => {
    expect(CONSOLIDATED_LAW_ENACTMENTS.length).toBe(4);
    for (const law of CONSOLIDATED_LAW_ENACTMENTS) {
      expect(law.id).toBeTruthy();
      expect(law.code).toMatch(/^LAW-0[1-4]$/);
      expect(law.title).toBeTruthy();
      expect(law.provisions.length).toBeGreaterThan(0);
      expect(law.fieldSurveyorGuidance.length).toBeGreaterThan(0);
    }
  });
});
