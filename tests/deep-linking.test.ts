import { describe, it, expect } from 'vitest';
import { KNOWLEDGE_TOPICS } from '../src/data/knowledge-topics';

/**
 * Canonical route parser matching App.tsx and CalculatorHub.tsx contract
 */
export function parseRouteHash(rawHash: string) {
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

/**
 * Route hash generator matching navigation components and downstream CTAs
 */
export function buildRouteHash(
  tab: 'knowledge' | 'calculator' | 'map',
  sub?: 'coord' | 'traverse' | 'leveling' | 'area' | string
): string {
  if (tab === 'calculator') {
    return sub ? `#/calculator/${sub}` : '#/calculator';
  }
  if (tab === 'map') {
    return '#/map';
  }
  return sub ? `#/knowledge/${sub}` : '#/knowledge';
}

describe('Deep-Linking & Hash Routing Engine', () => {
  describe('Calculator Subtabs Hash Routing', () => {
    const expectedSubTabs = ['coord', 'traverse', 'leveling', 'area'] as const;

    expectedSubTabs.forEach(subTab => {
      it(`should correctly resolve and parse #/calculator/${subTab}`, () => {
        const hash = `#/calculator/${subTab}`;
        const route = parseRouteHash(hash);

        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe(subTab);
        expect(route.topicId).toBeUndefined();
      });

      it(`should handle leading slash variations like #//calculator/${subTab}`, () => {
        const hash = `#//calculator/${subTab}`;
        const route = parseRouteHash(hash);

        expect(route.tab).toBe('calculator');
        expect(route.subTab).toBe(subTab);
      });
    });

    it('should resolve base #/calculator without subtab', () => {
      const route = parseRouteHash('#/calculator');
      expect(route.tab).toBe('calculator');
      expect(route.subTab).toBeUndefined();
      expect(route.topicId).toBeUndefined();
    });

    it('should ignore invalid calculator subtab and leave subTab undefined', () => {
      const route = parseRouteHash('#/calculator/unknown-tool');
      expect(route.tab).toBe('calculator');
      expect(route.subTab).toBeUndefined();
    });
  });

  describe('WebGIS Map Hash Routing', () => {
    it('should resolve #/map', () => {
      const route = parseRouteHash('#/map');
      expect(route.tab).toBe('map');
      expect(route.subTab).toBeUndefined();
      expect(route.topicId).toBeUndefined();
    });

    it('should resolve #//map/ with extra slashes', () => {
      const route = parseRouteHash('#//map/');
      expect(route.tab).toBe('map');
      expect(route.subTab).toBeUndefined();
    });
  });

  describe('Knowledge Topics Hash Routing', () => {
    it('should resolve base #/knowledge hub', () => {
      const route = parseRouteHash('#/knowledge');
      expect(route.tab).toBe('knowledge');
      expect(route.subTab).toBeUndefined();
      expect(route.topicId).toBeUndefined();
    });

    it('should resolve all 13 specific knowledge topics by id', () => {
      expect(KNOWLEDGE_TOPICS.length).toBe(13);

      KNOWLEDGE_TOPICS.forEach(topic => {
        const hash = `#/knowledge/${topic.id}`;
        const route = parseRouteHash(hash);

        expect(route.tab).toBe('knowledge');
        expect(route.subTab).toBeUndefined();
        expect(route.topicId).toBe(topic.id);
      });
    });

    it('should fallback unknown top-level routes to knowledge hub', () => {
      const emptyRoute = parseRouteHash('');
      expect(emptyRoute.tab).toBe('knowledge');
      expect(emptyRoute.topicId).toBeUndefined();

      const hashOnlyRoute = parseRouteHash('#');
      expect(hashOnlyRoute.tab).toBe('knowledge');

      const unknownRoute = parseRouteHash('#/arbitrary-unknown-route');
      expect(unknownRoute.tab).toBe('knowledge');
      expect(unknownRoute.topicId).toBeUndefined();
    });
  });

  describe('Bi-Directional Deep-Linking Bridges (Manuals to Tools)', () => {
    it('should verify that all topics with downstream workflows map to valid hash targets', () => {
      KNOWLEDGE_TOPICS.forEach(topic => {
        const workflow = topic.downstreamWorkflow;
        if (!workflow || !workflow.recommendedToolTab) return;

        let targetHash = '';
        if (workflow.recommendedToolTab === 'map') {
          targetHash = buildRouteHash('map');
        } else if (workflow.recommendedToolTab === 'coord' || workflow.recommendedToolTab === 'converter') {
          targetHash = buildRouteHash('calculator', 'coord');
        } else {
          targetHash = buildRouteHash('calculator', workflow.recommendedToolTab);
        }

        expect(targetHash.startsWith('#/')).toBe(true);
        const resolved = parseRouteHash(targetHash);

        if (workflow.recommendedToolTab === 'map') {
          expect(resolved.tab).toBe('map');
        } else {
          expect(resolved.tab).toBe('calculator');
          const expectedSub = workflow.recommendedToolTab === 'converter' ? 'coord' : workflow.recommendedToolTab;
          expect(resolved.subTab).toBe(expectedSub);
        }
      });
    });

    it('should verify round-trip URL generation and parsing integrity', () => {
      const testCases: { tab: 'knowledge' | 'calculator' | 'map'; sub?: any; expectedTab: string; expectedSub?: string; expectedTopic?: string }[] = [
        { tab: 'knowledge', expectedTab: 'knowledge' },
        { tab: 'knowledge', sub: 'closed-loop-traverse', expectedTab: 'knowledge', expectedTopic: 'closed-loop-traverse' },
        { tab: 'calculator', expectedTab: 'calculator' },
        { tab: 'calculator', sub: 'traverse', expectedTab: 'calculator', expectedSub: 'traverse' },
        { tab: 'calculator', sub: 'leveling', expectedTab: 'calculator', expectedSub: 'leveling' },
        { tab: 'calculator', sub: 'coord', expectedTab: 'calculator', expectedSub: 'coord' },
        { tab: 'calculator', sub: 'area', expectedTab: 'calculator', expectedSub: 'area' },
        { tab: 'map', expectedTab: 'map' },
      ];

      testCases.forEach(tc => {
        const generatedHash = buildRouteHash(tc.tab, tc.sub);
        const parsed = parseRouteHash(generatedHash);

        expect(parsed.tab).toBe(tc.expectedTab);
        if (tc.expectedSub) {
          expect(parsed.subTab).toBe(tc.expectedSub);
        }
        if (tc.expectedTopic) {
          expect(parsed.topicId).toBe(tc.expectedTopic);
        }
      });
    });
  });
});
