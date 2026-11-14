/**
 * strap-beam.ts — Strap Beam & Boundary Footing Structural Mechanics Solver
 * Implements vertical & moment equilibrium, shear force, bending moment envelope,
 * and reinforcement design according to EIT / WSD and SDM standards.
 */

export interface StrapBeamInputs {
  p1Tons: number;         // Exterior column load P1 (ton)
  p2Tons: number;         // Interior column load P2 (ton)
  colSpacingM: number;    // Column center-to-center spacing L (m)
  footing1LengthM: number;// Exterior footing length L1 in direction of strap (m)
  col1WidthM: number;     // Exterior column dimension c1 (m)
  qaTonsPerSqm: number;   // Allowable soil bearing capacity qa (ton/m²)
  beamWidthCm: number;    // Strap beam width b (cm)
  beamDepthCm: number;    // Strap beam total depth h (cm)
  rebarGrade: 'SD30' | 'SD40' | 'SD50';
  designMethod: 'WSD' | 'SDM';
}

export interface RebarOption {
  code: string;
  count: number;
  providedArea: number;
  text: string;
}

export interface StrapBeamResults {
  eccentricityM: number;
  LprimeM: number;
  r1: number;
  r2: number;
  r1IncreasePct: number;
  isUplift: boolean;
  upliftWarning: boolean;
  isInvalidGeometry: boolean;
  f1AreaReq: number;
  f1WidthM: number;
  f2AreaReq: number;
  f2SideM: number;
  w1: number;
  x0: number;
  mMaxTonM: number;
  maxShearTon: number;
  asReqCm2: number;
  asMinCm2: number;
  finalAsCm2: number;
  recommendedBars: RebarOption[];
  bestBar: RebarOption;
  stirrupText: string;
}

/**
 * Computes boundary footing equilibrium reactions and eccentricities.
 */
export function computeStrapBeamReactions(
  p1Tons: number,
  p2Tons: number,
  colSpacingL: number,
  footing1LengthL1: number,
  col1WidthC1: number
) {
  const e = Math.max(0, footing1LengthL1 / 2 - col1WidthC1 / 2);
  const Lprime = colSpacingL - e;

  if (Lprime <= 0) {
    throw new Error('Footing eccentricity exceeds or equals column spacing');
  }

  const r1 = (p1Tons * colSpacingL) / Lprime;
  const r2 = p1Tons + p2Tons - r1;
  const isUplift = r2 <= 0;
  const designMomentTonM = p1Tons * e;

  return {
    e,
    Lprime,
    r1,
    r2,
    isUplift,
    designMomentTonM,
    totalLoad: p1Tons + p2Tons,
    sumReactions: r1 + r2,
  };
}

/**
 * Computes required tension steel As for strap beam.
 */
export function computeStrapBeamReinforcement(
  mTonM: number,
  bCm: number,
  hCm: number,
  fyKsc: number = 4000,
  coveringCm: number = 6.5,
  designMethod: 'WSD' | 'SDM' = 'WSD'
) {
  const dCm = Math.max(10, hCm - coveringCm);
  let asReq = 0;

  if (mTonM <= 0) {
    // If no moment, only minimum temperature/shrinkage or minimum steel governs
    asReq = 0;
  } else if (designMethod === 'WSD') {
    const fsKsc = fyKsc >= 4000 ? 1700 : 1500;
    const j = 0.875;
    const mKgCm = mTonM * 1000 * 100;
    asReq = mKgCm / (fsKsc * j * dCm);
  } else {
    // SDM: Mu = 1.4 * M
    const muKgCm = mTonM * 1.4 * 1000 * 100;
    const phi = 0.90;
    asReq = muKgCm / (phi * fyKsc * 0.90 * dCm);
  }

  const asMin = (14 / fyKsc) * bCm * dCm;
  // If moment is 0, beam does not experience flexure from strap action
  const finalAs = mTonM <= 0 ? 0 : Math.max(asReq, asMin);

  return {
    dCm,
    asReq: Math.round(asReq * 100) / 100,
    asMin: Math.round(asMin * 100) / 100,
    finalAs: Math.round(finalAs * 100) / 100,
  };
}

/**
 * Complete solver for Strap Beam & Boundary Footing Calculator.
 */
export function computeStrapBeamComplete(inputs: StrapBeamInputs): StrapBeamResults {
  const { 
    p1Tons, 
    p2Tons, 
    colSpacingM, 
    footing1LengthM, 
    col1WidthM, 
    qaTonsPerSqm, 
    beamWidthCm, 
    beamDepthCm, 
    rebarGrade, 
    designMethod 
  } = inputs;

  const e = Math.max(0, Math.round((footing1LengthM / 2 - col1WidthM / 2) * 1000) / 1000);
  const Lprime = colSpacingM - e;
  const isInvalidGeometry = Lprime <= 0;

  if (isInvalidGeometry) {
    const defaultBar: RebarOption = { code: 'DB20', count: 0, providedArea: 0, text: 'N/A' };
    return {
      eccentricityM: e,
      LprimeM: Lprime,
      r1: 0,
      r2: 0,
      r1IncreasePct: 0,
      isUplift: false,
      upliftWarning: false,
      isInvalidGeometry: true,
      f1AreaReq: 0,
      f1WidthM: 0,
      f2AreaReq: 0,
      f2SideM: 0,
      w1: 0,
      x0: 0,
      mMaxTonM: 0,
      maxShearTon: 0,
      asReqCm2: 0,
      asMinCm2: 0,
      finalAsCm2: 0,
      recommendedBars: [],
      bestBar: defaultBar,
      stirrupText: 'N/A'
    };
  }

  // 1. Equilibrium Reactions
  const r1 = (p1Tons * colSpacingM) / Lprime;
  const r2 = p1Tons + p2Tons - r1;
  const isUplift = r2 <= 0;
  const upliftWarning = r2 < p2Tons * 0.25;

  // 2. Footing Sizes
  const f1AreaReq = qaTonsPerSqm > 0 ? r1 / qaTonsPerSqm : 0;
  const f1WidthM = footing1LengthM > 0 ? f1AreaReq / footing1LengthM : 0;
  const f2AreaReq = qaTonsPerSqm > 0 ? Math.max(0, r2) / qaTonsPerSqm : 0;
  const f2SideM = Math.sqrt(f2AreaReq);

  // 3. Strap Beam Shear and Bending Moment
  const w1 = footing1LengthM > 0 ? r1 / footing1LengthM : 0;
  const x0 = w1 > 0 ? p1Tons / w1 : 0;

  // Moment at zero shear: M(x0) = P1 * (x0 - c1/2) - 0.5 * w1 * x0^2
  // When e = 0 (footing centered on column), moment is 0.
  const mAtZeroShear = (e > 0 && w1 > 0)
    ? Math.max(0, (0.5 * p1Tons * p1Tons / w1) - (p1Tons * col1WidthM / 2))
    : 0;
  const mSimplified = e > 0 ? p1Tons * e : 0;
  const designMomentTonM = Math.max(mAtZeroShear, mSimplified);

  // 4. Maximum Shear
  const maxShearTon = e > 0 ? Math.max(p1Tons, r1 - p1Tons) : 0;

  // 5. Reinforcement Design
  const fyKsc = rebarGrade === 'SD50' ? 5000 : rebarGrade === 'SD40' ? 4000 : 3000;
  const reinf = computeStrapBeamReinforcement(
    designMomentTonM,
    beamWidthCm,
    beamDepthCm,
    fyKsc,
    6.5,
    designMethod
  );

  const rebarOptions = [
    { code: 'DB16', area: 2.01 },
    { code: 'DB20', area: 3.14 },
    { code: 'DB25', area: 4.91 },
    { code: 'DB28', area: 6.16 },
    { code: 'DB32', area: 8.04 },
  ];

  const recommendedBars: RebarOption[] = rebarOptions.map(opt => {
    const count = reinf.finalAs > 0 ? Math.ceil(reinf.finalAs / opt.area) : 0;
    const providedArea = count * opt.area;
    return {
      code: opt.code,
      count,
      providedArea: Math.round(providedArea * 100) / 100,
      text: count > 0 ? `${count}-${opt.code} (As = ${providedArea.toFixed(2)} cm²)` : `0-${opt.code}`
    };
  });

  const bestBar = reinf.finalAs > 0
    ? (recommendedBars.find(b => b.count >= 3 && b.count <= 6) || recommendedBars[2] || recommendedBars[1])
    : { code: 'N/A', count: 0, providedArea: 0, text: 'ไม่ต้องเสริมเหล็กรับโมเมนต์ (e = 0)' };

  const stirrupMaxSpacingCm = Math.min(30, Math.round(reinf.dCm / 2));

  return {
    eccentricityM: e,
    LprimeM: Math.round(Lprime * 1000) / 1000,
    r1: Math.round(r1 * 100) / 100,
    r2: Math.round(r2 * 100) / 100,
    r1IncreasePct: p1Tons > 0 ? Math.round(((r1 - p1Tons) / p1Tons) * 1000) / 10 : 0,
    isUplift,
    upliftWarning,
    isInvalidGeometry: false,
    f1AreaReq: Math.round(f1AreaReq * 100) / 100,
    f1WidthM: Math.round(f1WidthM * 100) / 100,
    f2AreaReq: Math.round(f2AreaReq * 100) / 100,
    f2SideM: Math.round(f2SideM * 100) / 100,
    w1: Math.round(w1 * 100) / 100,
    x0: Math.round(x0 * 100) / 100,
    mMaxTonM: Math.round(designMomentTonM * 100) / 100,
    maxShearTon: Math.round(maxShearTon * 100) / 100,
    asReqCm2: reinf.asReq,
    asMinCm2: reinf.asMin,
    finalAsCm2: reinf.finalAs,
    recommendedBars,
    bestBar,
    stirrupText: e > 0 ? `2-RB9 @ ${stirrupMaxSpacingCm} ซม.` : 'เหล็กปลอกขั้นต่ำตามมาตรฐาน'
  };
}
