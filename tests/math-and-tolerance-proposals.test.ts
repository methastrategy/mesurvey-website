import { describe, it, expect } from 'vitest';
import katex from 'katex';
import { KNOWLEDGE_TOPICS } from '../src/data/knowledge-topics';
import { computeStrapBeamComplete } from '../src/utils/strap-beam';
import { calculateLevelingLoop } from '../src/core/leveling';
import { computeStadia } from '../src/components/calculator/LevelingCalculator';
import { SAMPLE_TRAVERSE_DMS_LEGS, SAMPLE_STADIA_ROWS } from '../src/store/useSurveyStore';
import { SAMPLE_LEVELING_ROWS } from '../src/data/survey-presets';
import { sqMetersToThaiLand } from '../src/core/land-units';

describe('Proposal 1 & 2 & 3 & Math Formula Precision Suite', () => {

  describe('Math Formula Rendering & KaTeX Invariant', () => {
    it('verifies KaTeX parses and renders all formulas in KNOWLEDGE_TOPICS with throwOnError: true', () => {
      let formulaCount = 0;
      for (const topic of KNOWLEDGE_TOPICS) {
        if (topic.formulas && topic.formulas.length > 0) {
          for (const f of topic.formulas) {
            formulaCount++;
            expect(f.formula).toBeTruthy();
            const html = katex.renderToString(f.formula, {
              displayMode: true,
              throwOnError: true,
              output: 'htmlAndMathml'
            });
            expect(html).toContain('katex');
            expect(html).toContain('katex-html');
            expect(html).not.toContain('katex-error');
          }
        }
      }
      expect(formulaCount).toBe(49);
    });

    it('renders complex survey equations with fractions, square roots and Greek symbols', () => {
      const sampleEquations = [
        'HA_{\\text{mean}} = \\frac{HA_{\\text{FL}} + (HA_{\\text{FR}} \\pm 180^\\circ)}{2}',
        'C_{\\text{max}} = \\pm k \\sqrt{K} \\quad (\\text{มิลลิเมตร})',
        'E_L = \\sqrt{(\\sum \\Delta N)^2 + (\\sum \\Delta E)^2}',
        'T = R \\cdot \\tan\\left(\\frac{\\Delta}{2}\\right)',
        'R_1 = P_1 + \\frac{P_1 \\times e}{L - e}',
        'A_s = \\frac{M_{\\text{max}} \\times 10^5}{f_s \\cdot j \\cdot d}',
        '2A = \\left| \\sum_{i=1}^{n} (E_i N_{i+1} - E_{i+1} N_i) \\right| \\implies A = \\frac{1}{2} |2A|'
      ];

      for (const eq of sampleEquations) {
        const rendered = katex.renderToString(eq, { displayMode: true, throwOnError: true });
        expect(rendered).toContain('katex');
        expect(rendered).toContain('katex-mathml');
        expect(rendered).toContain('katex-html');
      }
    });

    it('gracefully handles edge cases and syntactically invalid formulas without crashing', () => {
      // Invalid syntax with throwOnError: false produces katex-error tag
      const invalidRender = katex.renderToString('\\frac{1}', { throwOnError: false });
      expect(invalidRender).toContain('katex-error');
    });
  });

  describe('Proposal 2: Quick Tolerance Callout Invariant for SOP-01 to SOP-08', () => {
    it('guarantees SOP-01 through SOP-08 each possess complete quickTolerance callouts', () => {
      const sops = KNOWLEDGE_TOPICS.filter(t => t.code && /^SOP-0[1-8]$/.test(t.code));
      expect(sops.length).toBe(8);

      for (const sop of sops) {
        expect(sop.quickTolerance).toBeDefined();
        const tol = sop.quickTolerance!;
        expect(tol.standard).toBeTruthy();
        expect(tol.primaryLimit).toBeTruthy();
        expect(tol.badge).toBeTruthy();
      }
    });

    it('verifies specific technical tolerance criteria matching Thai RTSD / EIT standards', () => {
      const sop01 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-01');
      expect(sop01?.quickTolerance?.primaryLimit).toContain('±12√K mm');
      expect(sop01?.quickTolerance?.badge).toContain('±12√K mm');

      const sop02 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-02');
      expect(sop02?.quickTolerance?.primaryLimit).toContain('±1.5\'√n');
      expect(sop02?.quickTolerance?.primaryLimit).toContain('1:5,000');

      const sop03 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-03');
      expect(sop03?.quickTolerance?.primaryLimit).toContain('±20"√n');

      const sop04 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-04');
      expect(sop04?.quickTolerance?.primaryLimit).toContain('RTK Fixed');

      const sop05 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-05');
      expect(sop05?.quickTolerance?.primaryLimit).toContain('RMSE');

      const sop06 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-06');
      expect(sop06?.quickTolerance?.primaryLimit).toContain('≤ ±3 mm');

      const sop07 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-07');
      expect(sop07?.quickTolerance?.primaryLimit).toContain('TVU');

      const sop08 = KNOWLEDGE_TOPICS.find(t => t.code === 'SOP-08');
      expect(sop08?.quickTolerance?.primaryLimit).toContain('Breakthrough');
    });
  });

  describe('Proposal 1 & 3: Mathematical Derivation & Calculation Integrity', () => {
    it('guarantees Strap Beam equilibrium math derivation matches mechanical solver output for WSD', () => {
      const res = computeStrapBeamComplete({
        p1Tons: 40,
        p2Tons: 70,
        colSpacingM: 5.0,
        footing1LengthM: 1.8,
        col1WidthM: 0.30,
        qaTonsPerSqm: 15.0,
        beamWidthCm: 40,
        beamDepthCm: 70,
        rebarGrade: 'SD40',
        designMethod: 'WSD'
      });

      const e = (1.8 - 0.30) / 2; // 0.75m
      expect(res.eccentricityM).toBe(0.75);
      const expectedR1 = Number((40 + (40 * e) / (5.0 - e)).toFixed(2));
      expect(res.r1).toBe(expectedR1);
      const expectedR2 = Number((70 - (40 * e) / (5.0 - e)).toFixed(2));
      expect(res.r2).toBe(expectedR2);
      expect(res.isUplift).toBe(false);
      expect(res.isInvalidGeometry).toBe(false);
      expect(res.mMaxTonM).toBe(Number((40 * e).toFixed(2)));
    });

    it('guarantees Strap Beam handles invalid geometry (e >= L) safely', () => {
      const res = computeStrapBeamComplete({
        p1Tons: 40,
        p2Tons: 70,
        colSpacingM: 0.8, // Column spacing smaller than eccentricity
        footing1LengthM: 2.0,
        col1WidthM: 0.20, // e = (2.0 - 0.20)/2 = 0.9m > 0.8m
        qaTonsPerSqm: 15.0,
        beamWidthCm: 40,
        beamDepthCm: 70,
        rebarGrade: 'SD40',
        designMethod: 'WSD'
      });

      expect(res.isInvalidGeometry).toBe(true);
      expect(res.r1).toBe(0);
      expect(res.r2).toBe(0);
    });

    it('guarantees Strap Beam calculates SDM strength design correctly', () => {
      const resWsd = computeStrapBeamComplete({
        p1Tons: 40,
        p2Tons: 70,
        colSpacingM: 5.0,
        footing1LengthM: 1.8,
        col1WidthM: 0.30,
        qaTonsPerSqm: 15.0,
        beamWidthCm: 40,
        beamDepthCm: 70,
        rebarGrade: 'SD40',
        designMethod: 'WSD'
      });

      const resSdm = computeStrapBeamComplete({
        p1Tons: 40,
        p2Tons: 70,
        colSpacingM: 5.0,
        footing1LengthM: 1.8,
        col1WidthM: 0.30,
        qaTonsPerSqm: 15.0,
        beamWidthCm: 40,
        beamDepthCm: 70,
        rebarGrade: 'SD40',
        designMethod: 'SDM'
      });

      expect(resWsd.mMaxTonM).toBe(resSdm.mMaxTonM);
      expect(resSdm.asReqCm2).toBeGreaterThan(0);
      expect(resSdm.finalAsCm2).toBeGreaterThan(0);
    });

    it('guarantees Leveling Loop arithmetic check satisfies three-fold derivation equality', () => {
      const sampleRows = [
        { id: '1', station: 'BM01', bs: 1.452, ifs: null, fs: null },
        { id: '2', station: 'TP1', bs: 2.135, ifs: null, fs: 1.120 },
        { id: '3', station: 'BM01', bs: null, ifs: null, fs: 2.467 }
      ];
      const result = calculateLevelingLoop(sampleRows, 100.0, 100.0, 0.5);
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(result.closureErrorMm).toBeDefined();
      expect(result.orderCompliance.achievedOrder).toContain('ชั้น');
    });

    it('guarantees Stadia 3-Wire Tacheometry equations satisfy middle hair and distance invariants', () => {
      const result = computeStadia(SAMPLE_STADIA_ROWS, 100.0, 0.5);
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(result.totalDist).toBeGreaterThan(0);
      expect(result.orderCompliance.achievedOrder).toBeTruthy();
      // Test 3-wire midpoint check formula: (Upper + Lower) / 2
      const firstRow = SAMPLE_STADIA_ROWS[0];
      const top = parseFloat(firstRow.bsTop);
      const btm = parseFloat(firstRow.bsBot);
      const mid = parseFloat(firstRow.bsMid);
      expect((top + btm) / 2).toBeCloseTo(mid, 3);
      // Test stadia distance formula: 100 * (Upper - Lower)
      expect(100 * (top - btm)).toBeGreaterThan(0);
    });

    it('guarantees Shoelace Formula correctly computes polygon land parcel area and Thai units', () => {
      // 100m x 100m square = 10,000 sq.m.
      const coords = [
        { easting: 1000, northing: 1000 },
        { easting: 1100, northing: 1000 },
        { easting: 1100, northing: 1100 },
        { easting: 1000, northing: 1100 }
      ];
      let doubleArea = 0;
      for (let i = 0; i < coords.length; i++) {
        const next = (i + 1) % coords.length;
        doubleArea += (coords[i].easting * coords[next].northing) - (coords[next].easting * coords[i].northing);
      }
      const areaM2 = Math.abs(doubleArea) / 2;
      expect(areaM2).toBe(10000);

      // 10,000 m2 = 6 Rai, 1 Ngan, 0 Wah
      const thai = sqMetersToThaiLand(areaM2);
      expect(thai.rai).toBe(6);
      expect(thai.ngan).toBe(1);
      expect(thai.wah).toBe(0);
    });

    it('verifies standard sample data presets exist and are populated with valid items', () => {
      expect(SAMPLE_TRAVERSE_DMS_LEGS.length).toBeGreaterThanOrEqual(4);
      expect(SAMPLE_LEVELING_ROWS.length).toBeGreaterThanOrEqual(3);
      expect(SAMPLE_STADIA_ROWS.length).toBeGreaterThanOrEqual(3);
    });
  });

});

