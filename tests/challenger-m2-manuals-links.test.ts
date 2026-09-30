import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { KNOWLEDGE_TOPICS } from '../src/data/knowledge-topics';
import { KnowledgeTopic, DownstreamWorkflow } from '../src/types/survey';
import { EquipmentCard } from '../src/components/knowledge/EquipmentCard';
import { TopicDetailModal } from '../src/components/knowledge/TopicDetailModal';
import { THEME_OPTIONS } from '../src/components/layout/Header';

/**
 * Route parser matching App.tsx specification
 */
function parseAppRoute(rawHash: string) {
  const hash = rawHash.replace(/^#\/?/, '').trim();
  const parts = hash.split('/').filter(Boolean);
  const first = parts[0];

  if (first === 'calculator') {
    const validSubs = ['coord', 'traverse', 'leveling', 'area'] as const;
    const sub = validSubs.includes(parts[1] as any) ? (parts[1] as 'coord' | 'traverse' | 'leveling' | 'area') : undefined;
    return {
      tab: 'calculator' as const,
      subTab: sub,
      topicId: undefined
    };
  }
  if (first === 'map') {
    return {
      tab: 'map' as const,
      subTab: undefined,
      topicId: undefined
    };
  }
  return {
    tab: 'knowledge' as const,
    subTab: undefined,
    topicId: first === 'knowledge' ? parts[1] : undefined
  };
}

describe('Challenger 1 Adversarial Suite: Manuals, Badges & Deep-Linking', () => {

  // =========================================================================
  // SECTION 1: Adversarial Verification of all 9 Knowledge Topics
  // =========================================================================
  describe('1. Authoritative Corpus & Schema Verification (13 Topics)', () => {
    it('must have 13 topics with unique, valid kebab-case IDs', () => {
      expect(KNOWLEDGE_TOPICS).toHaveLength(13);
      const ids = KNOWLEDGE_TOPICS.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(13);

      // Verify kebab-case format
      ids.forEach(id => {
        expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      });
    });

    it('must have verificationStatus === "draft" on all 9 topics initially', () => {
      KNOWLEDGE_TOPICS.forEach(topic => {
        expect(topic.verificationStatus).toBe('draft');
        expect(topic.verificationStatus).not.toBe('verified');
      });
    });

    it('must have substantive, authentic verificationProof citations without placeholders', () => {
      const forbiddenPlaceholders = ['TODO', 'FIXME', 'TBD', 'placeholder', 'lorem ipsum', 'undefined', 'null'];

      KNOWLEDGE_TOPICS.forEach(topic => {
        expect(topic.verificationProof, `Topic ${topic.id} missing verificationProof`).toBeDefined();
        const proof = topic.verificationProof!;
        expect(typeof proof).toBe('string');
        expect(proof.trim().length).toBeGreaterThan(25);

        // Assert no forbidden placeholder text
        forbiddenPlaceholders.forEach(ph => {
          expect(proof.toLowerCase()).not.toContain(ph.toLowerCase());
        });
      });
    });

    it('must have complete downstreamWorkflow contracts on all 9 topics', () => {
      const allowedToolTabs: NonNullable<DownstreamWorkflow['recommendedToolTab']>[] = [
        'coord', 'converter', 'traverse', 'leveling', 'map'
      ];

      KNOWLEDGE_TOPICS.forEach(topic => {
        expect(topic.downstreamWorkflow, `Topic ${topic.id} missing downstreamWorkflow`).toBeDefined();
        const wf = topic.downstreamWorkflow!;

        // Output format check
        expect(typeof wf.outputDataFormat).toBe('string');
        expect(wf.outputDataFormat.trim().length).toBeGreaterThan(0);

        // Output description check
        expect(typeof wf.outputDescription).toBe('string');
        expect(wf.outputDescription.trim().length).toBeGreaterThan(10);

        // Next step title & procedure check
        expect(typeof wf.nextStepTitle).toBe('string');
        expect(wf.nextStepTitle.trim().length).toBeGreaterThan(5);
        expect(typeof wf.nextStepProcedure).toBe('string');
        expect(wf.nextStepProcedure.trim().length).toBeGreaterThan(15);

        // Recommended tool tab check
        expect(wf.recommendedToolTab, `Topic ${topic.id} has invalid tool tab`).toBeDefined();
        expect(allowedToolTabs).toContain(wf.recommendedToolTab);

        // Tool action label check
        expect(wf.toolActionLabel, `Topic ${topic.id} missing toolActionLabel`).toBeDefined();
        expect(typeof wf.toolActionLabel).toBe('string');
        expect(wf.toolActionLabel!.trim().length).toBeGreaterThan(3);
      });
    });

    it('must maintain rich operational structure across all 9 topics', () => {
      KNOWLEDGE_TOPICS.forEach(topic => {
        expect(topic.title.trim().length).toBeGreaterThan(5);
        expect(topic.titleEn.trim().length).toBeGreaterThan(5);
        expect(topic.summary.trim().length).toBeGreaterThan(30);
        expect(topic.badge.trim().length).toBeGreaterThan(2);

        // Equipment list
        expect(Array.isArray(topic.equipmentRequired)).toBe(true);
        expect(topic.equipmentRequired!.length).toBeGreaterThanOrEqual(3);

        // Working principle
        expect(Array.isArray(topic.workingPrinciple)).toBe(true);
        expect(topic.workingPrinciple.length).toBeGreaterThanOrEqual(3);

        // Field procedures
        expect(Array.isArray(topic.fieldProcedures)).toBe(true);
        expect(topic.fieldProcedures.length).toBeGreaterThanOrEqual(3);
        topic.fieldProcedures.forEach(step => {
          expect(step.title.trim().length).toBeGreaterThan(5);
          expect(step.details.trim().length).toBeGreaterThan(15);
        });

        // Error sources & mitigation
        expect(Array.isArray(topic.errorSourcesAndMitigation)).toBe(true);
        expect(topic.errorSourcesAndMitigation.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // =========================================================================
  // SECTION 2: Dynamic State Switching & Badge Rendering Edge Cases
  // =========================================================================
  describe('2. Dynamic Verification State & Badge Rendering Stress Tests', () => {
    const sampleTopic = KNOWLEDGE_TOPICS[0];

    it('renders EquipmentCard with Draft badge (Amber) when verificationStatus is "draft"', () => {
      const html = renderToString(
        React.createElement(EquipmentCard, {
          topic: { ...sampleTopic, verificationStatus: 'draft' },
          onSelect: () => {}
        })
      );

      expect(html).toContain('DRAFT / รอดำเนินการตรวจสอบ');
      expect(html).toContain('bg-amber-500/10');
      expect(html).toContain('text-amber-700');
      expect(html).toContain('border-amber-500/30');
      expect(html).not.toContain('VERIFIED / ตรวจสอบแล้ว');
    });

    it('renders EquipmentCard with Verified badge (Emerald) when dynamically switched to "verified"', () => {
      const verifiedTopic: KnowledgeTopic = {
        ...sampleTopic,
        verificationStatus: 'verified',
        verificationProof: 'กรมแผนที่ทหาร (RTSD) สเปกงานรังวัดระดับชั้น 1 มาตรฐาน พ.ศ. 2562'
      };

      const html = renderToString(
        React.createElement(EquipmentCard, {
          topic: verifiedTopic,
          onSelect: () => {}
        })
      );

      expect(html).toContain('VERIFIED / ตรวจสอบแล้ว');
      expect(html).toContain('bg-emerald-500/10');
      expect(html).toContain('text-emerald-700');
      expect(html).toContain('border-emerald-500/30');
      expect(html).not.toContain('DRAFT / รอดำเนินการตรวจสอบ');
      expect(html).toContain('title="VERIFIED / ตรวจสอบแล้ว: กรมแผนที่ทหาร (RTSD) สเปกงานรังวัดระดับชั้น 1 มาตรฐาน พ.ศ. 2562"');
    });

    it('gracefully handles "verified" status when verificationProof is undefined', () => {
      const noProofVerifiedTopic: KnowledgeTopic = {
        ...sampleTopic,
        verificationStatus: 'verified',
        verificationProof: undefined
      };

      const html = renderToString(
        React.createElement(EquipmentCard, {
          topic: noProofVerifiedTopic,
          onSelect: () => {}
        })
      );

      expect(html).toContain('VERIFIED / ตรวจสอบแล้ว');
      expect(html).toContain('title="VERIFIED / ตรวจสอบแล้ว"');
      expect(html).not.toContain('undefined');
    });

    it('renders TopicDetailModal with Draft disclaimer banner when verificationStatus is "draft"', () => {
      const html = renderToString(
        React.createElement(TopicDetailModal, {
          topic: { ...sampleTopic, verificationStatus: 'draft' },
          onClose: () => {}
        })
      );

      expect(html).toContain('DRAFT / รอดำเนินการตรวจสอบ (Preliminary Draft SOP)');
      expect(html).toContain('bg-amber-50/80');
      expect(html).toContain('border-amber-500/30');
      expect(html).not.toContain('VERIFIED / ผ่านการตรวจรับรองมาตรฐานวิศวกรรม');
    });

    it('renders TopicDetailModal with Emerald certification banner when switched to "verified"', () => {
      const verifiedTopic: KnowledgeTopic = {
        ...sampleTopic,
        verificationStatus: 'verified',
        verificationProof: 'คณะกรรมการมาตรฐานวิศวกรรมสำรวจ วสท. 2568'
      };

      const html = renderToString(
        React.createElement(TopicDetailModal, {
          topic: verifiedTopic,
          onClose: () => {}
        })
      );

      expect(html).toContain('VERIFIED / ผ่านการตรวจรับรองมาตรฐานวิศวกรรม (Verified SOP)');
      expect(html).toContain('bg-emerald-50/80');
      expect(html).toContain('border-emerald-500/30');
      expect(html).toContain('คณะกรรมการมาตรฐานวิศวกรรมสำรวจ วสท. 2568');
      expect(html).not.toContain('DRAFT / รอดำเนินการตรวจสอบ (Preliminary Draft SOP)');
    });

    it('renders TopicDetailModal cleanly when topic is null', () => {
      const html = renderToString(
        React.createElement(TopicDetailModal, {
          topic: null,
          onClose: () => {}
        })
      );

      expect(html).toBe('');
    });

    it('handles adversarial HTML characters in verificationProof without throwing', () => {
      const xssProofTopic: KnowledgeTopic = {
        ...sampleTopic,
        verificationStatus: 'verified',
        verificationProof: 'Standard <script>alert("xss")</script> & RTSD 100% "quotes" \'single\''
      };

      const html = renderToString(
        React.createElement(TopicDetailModal, {
          topic: xssProofTopic,
          onClose: () => {}
        })
      );

      expect(html).toBeDefined();
      // React escapes raw HTML tags in text nodes
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('survives an ultra-long verificationProof string (2,000+ characters)', () => {
      const ultraLongProof = 'RTSD Standard Citation '.repeat(100);
      const longProofTopic: KnowledgeTopic = {
        ...sampleTopic,
        verificationStatus: 'verified',
        verificationProof: ultraLongProof
      };

      const html = renderToString(
        React.createElement(TopicDetailModal, {
          topic: longProofTopic,
          onClose: () => {}
        })
      );

      expect(html).toBeDefined();
      expect(html).toContain(ultraLongProof.slice(0, 100));
    });
  });

  // =========================================================================
  // SECTION 3: URL Hash Routing, Subtabs & Invalid Fallback Testing
  // =========================================================================
  describe('3. URL Hash Routing & Subtab Resolution Resilience', () => {
    describe('Valid Subtab Routes', () => {
      it('resolves #/calculator/coord', () => {
        const route = parseAppRoute('#/calculator/coord');
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe('coord');
        expect(route.topicId).toBeUndefined();
      });

      it('resolves #/calculator/traverse', () => {
        const route = parseAppRoute('#/calculator/traverse');
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe('traverse');
        expect(route.topicId).toBeUndefined();
      });

      it('resolves #/calculator/leveling', () => {
        const route = parseAppRoute('#/calculator/leveling');
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe('leveling');
        expect(route.topicId).toBeUndefined();
      });

      it('resolves #/calculator/area', () => {
        const route = parseAppRoute('#/calculator/area');
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe('area');
        expect(route.topicId).toBeUndefined();
      });

      it('resolves #/map', () => {
        const route = parseAppRoute('#/map');
        expect(route.tab).toBe('map');
        expect(route.subTab).toBeUndefined();
        expect(route.topicId).toBeUndefined();
      });

      it('resolves #/knowledge base overview', () => {
        const route = parseAppRoute('#/knowledge');
        expect(route.tab).toBe('knowledge');
        expect(route.subTab).toBeUndefined();
        expect(route.topicId).toBeUndefined();
      });

      it('resolves all 9 individual #/knowledge/[topicId] routes', () => {
        KNOWLEDGE_TOPICS.forEach(topic => {
          const route = parseAppRoute(`#/knowledge/${topic.id}`);
          expect(route.tab).toBe('knowledge');
          expect(route.subTab).toBeUndefined();
          expect(route.topicId).toBe(topic.id);
        });
      });
    });

    describe('Adversarial & Malformed Hash Fallback Handling', () => {
      it('handles empty hash string by defaulting to knowledge', () => {
        const route = parseAppRoute('');
        expect(route.tab).toBe('knowledge');
        expect(route.subTab).toBeUndefined();
        expect(route.topicId).toBeUndefined();
      });

      it('handles solitary hash "#" by defaulting to knowledge', () => {
        const route = parseAppRoute('#');
        expect(route.tab).toBe('knowledge');
        expect(route.subTab).toBeUndefined();
        expect(route.topicId).toBeUndefined();
      });

      it('handles multiple leading slashes "#///calculator/traverse"', () => {
        const route = parseAppRoute('#///calculator/traverse');
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe('traverse');
      });

      it('handles trailing slashes "#/calculator/leveling/"', () => {
        const route = parseAppRoute('#/calculator/leveling/');
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe('leveling');
      });

      it('falls back subTab to undefined on unknown calculator subtab "#/calculator/unknown-engine"', () => {
        const route = parseAppRoute('#/calculator/unknown-engine');
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBeUndefined();
      });

      it('falls back top-level route to knowledge on arbitrary unknown routes', () => {
        const unknownRoutes = [
          '#/dashboard',
          '#/admin/secrets',
          '#/settings',
          '#/random-404-path',
          '#/null',
          '#/undefined'
        ];

        unknownRoutes.forEach(raw => {
          const route = parseAppRoute(raw);
          expect(route.tab).toBe('knowledge');
          expect(route.subTab).toBeUndefined();
          expect(route.topicId).toBeUndefined();
        });
      });

      it('handles path-traversal-like hashes safely without crashing', () => {
        const dangerousHashes = [
          '#/knowledge/../../etc/passwd',
          '#/calculator/..\\..\\windows',
          '#/knowledge/\0nullbyte',
          '#/knowledge/\' OR 1=1 --'
        ];

        dangerousHashes.forEach(h => {
          expect(() => parseAppRoute(h)).not.toThrow();
        });
      });
    });

    describe('Bi-Directional Deep Link Cross-Module Consistency', () => {
      it('verifies that all 9 topics downstream CTA targets resolve to valid app routes', () => {
        KNOWLEDGE_TOPICS.forEach(topic => {
          const wf = topic.downstreamWorkflow;
          expect(wf).toBeDefined();

          let targetHash = '';
          if (wf!.recommendedToolTab === 'map') {
            targetHash = '#/map';
          } else {
            const sub = wf!.recommendedToolTab === 'converter' ? 'coord' : wf!.recommendedToolTab;
            targetHash = `#/calculator/${sub}`;
          }

          const route = parseAppRoute(targetHash);
          if (wf!.recommendedToolTab === 'map') {
            expect(route.tab).toBe('map');
          } else {
            expect(route.tab).toBe('calculator');
            const expectedSub = wf!.recommendedToolTab === 'converter' ? 'coord' : wf!.recommendedToolTab;
            expect(route.subTab).toBe(expectedSub);
          }
        });
      });

      it('verifies all outbound deep-link references in calculators point to existing topics', () => {
        const calculatorDeepLinks = [
          '#/knowledge/differential-leveling-survey', // from LevelingCalculator.tsx
          '#/knowledge/closed-loop-traverse',        // from TraverseCalculator.tsx (closed loop)
          '#/knowledge/link-open-traverse',          // from TraverseCalculator.tsx (open link)
          '#/knowledge/gnss-rtk-static-survey'       // from CoordinateConverter.tsx
        ];

        const existingTopicIds = new Set(KNOWLEDGE_TOPICS.map(t => t.id));

        calculatorDeepLinks.forEach(link => {
          const route = parseAppRoute(link);
          expect(route.tab).toBe('knowledge');
          expect(route.topicId).toBeDefined();
          expect(
            existingTopicIds.has(route.topicId!),
            `Calculators link to "${route.topicId}", which must exist in KNOWLEDGE_TOPICS`
          ).toBe(true);
        });
      });

      it('verifies WebMap inspection bridge links to valid calculator subtab', () => {
        const mapBridgeHash = '#/calculator/coord';
        const route = parseAppRoute(mapBridgeHash);
        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe('coord');
      });
    });
  });

  // =========================================================================
  // SECTION 4: Dual-Taxonomy Categorization, Meaningful Codes & Multi-Theme Switcher
  // =========================================================================
  describe('4. Dual-Taxonomy Order, Engineering Codes & Multi-Theme System', () => {
    describe('Ordering & Engineering Codes (EQ-01..EQ-05, SOP-01..SOP-08)', () => {
      it('orders all 5 Equipment Manuals (คู่มือใช้งาน) first with EQ-01..EQ-05 codes', () => {
        const eqTopics = KNOWLEDGE_TOPICS.slice(0, 5);
        expect(eqTopics).toHaveLength(5);

        const expectedEqIds = [
          'level-instrument-manual',
          'theodolite-station-setup',
          'gnss-instrument-manual',
          'uav-instrument-manual',
          'lidar-slam-instrument-manual'
        ];

        eqTopics.forEach((topic, idx) => {
          expect(topic.id).toBe(expectedEqIds[idx]);
          expect(topic.badge).toBe('คู่มือใช้งาน');
          expect(topic.categoryName).toBe('คู่มือการใช้งานอุปกรณ์');
          expect(topic.code).toBe(`EQ-0${idx + 1}`);
        });
      });

      it('orders all 8 Field Survey Procedures (คู่มือทำงาน) second with SOP-01..SOP-08 codes', () => {
        const sopTopics = KNOWLEDGE_TOPICS.slice(5, 13);
        expect(sopTopics).toHaveLength(8);

        const expectedSopIds = [
          'differential-leveling-survey',
          'closed-loop-traverse',
          'link-open-traverse',
          'gnss-rtk-static-survey',
          'uav-drone-photogrammetry',
          'terrestrial-lidar-slam',
          'hydrographic-bathymetric-survey',
          'tbm-tunnel-guidance-survey'
        ];

        sopTopics.forEach((topic, idx) => {
          expect(topic.id).toBe(expectedSopIds[idx]);
          expect(topic.badge).toBe('คู่มือทำงาน');
          expect(topic.categoryName).toBe('วิธีการทำงานภาคสนาม');
          expect(topic.code).toBe(`SOP-0${idx + 1}`);
        });
      });

      it('renders EquipmentCard with the assigned engineering code (e.g. EQ-01)', () => {
        const eqTopic = KNOWLEDGE_TOPICS[0];
        const html = renderToString(
          React.createElement(EquipmentCard, {
            topic: eqTopic,
            onSelect: () => {}
          })
        );

        expect(html).toContain('EQ-01');
        expect(html).toContain('คู่มือใช้งาน');
        expect(html.replace(/&amp;/g, '&')).toContain(eqTopic.title);
      });

      it('renders TopicDetailModal with the assigned engineering code in the header', () => {
        const sopTopic = KNOWLEDGE_TOPICS[5]; // differential-leveling-survey
        const html = renderToString(
          React.createElement(TopicDetailModal, {
            topic: sopTopic,
            onClose: () => {}
          })
        );

        expect(html).toContain('SOP-01');
        expect(html).toContain('คู่มือทำงาน');
        expect(html.replace(/&amp;/g, '&')).toContain(sopTopic.title);
      });
    });

    describe('Multi-Theme System (Curated Palettes)', () => {
      it('contains all required Light and Dark theme configurations (4 curated themes)', () => {
        const themeIds = THEME_OPTIONS.map(t => t.id);
        
        // Exact 4 curated themes
        expect(themeIds).toEqual(['nordic', 'warmsand', 'terminal', 'bento']);

        // Required Light themes
        expect(themeIds).toContain('nordic');
        expect(themeIds).toContain('warmsand');

        // Required Dark themes
        expect(themeIds).toContain('terminal');
        expect(themeIds).toContain('bento');
      });

      it('correctly sets isDark boolean matching theme light/dark classification', () => {
        const lightThemes = THEME_OPTIONS.filter(t => !t.isDark).map(t => t.id);
        const darkThemes = THEME_OPTIONS.filter(t => t.isDark).map(t => t.id);

        expect(lightThemes).toEqual(['nordic', 'warmsand']);
        expect(darkThemes).toEqual(['terminal', 'bento']);
      });

      it('provides valid visual tokens (accent color, bg color, names) for every theme option', () => {
        THEME_OPTIONS.forEach(opt => {
          expect(opt.name.trim().length).toBeGreaterThan(2);
          expect(opt.nameEn.trim().length).toBeGreaterThan(2);
          expect(opt.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
          expect(opt.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
      });
    });
  });
});
