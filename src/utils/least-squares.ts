/**
 * 🌌 MESURV Geomatics Core: Least Squares Network Adjustment (LSA)
 * Parametric Gauss-Markov Adjustment Engine for 1D Leveling & 2D Survey Networks
 * Implements standard geodetic formulas, error ellipses, and Baarda data snooping.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. PURE ZERO-DEPENDENCY MATRIX ALGEBRA
// ─────────────────────────────────────────────────────────────────────────────

export type Matrix = number[][];

/** Transposes an m x n matrix into an n x m matrix */
export function matrixTranspose(A: Matrix): Matrix {
  const m = A.length;
  const n = A[0].length;
  const AT: Matrix = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      AT[j][i] = A[i][j];
    }
  }
  return AT;
}

/** Multiplies an m x k matrix A with a k x n matrix B */
export function matrixMultiply(A: Matrix, B: Matrix): Matrix {
  const m = A.length;
  const k = A[0].length;
  const n = B[0].length;
  const C: Matrix = Array.from({ length: m }, () => Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let p = 0; p < k; p++) {
        sum += A[i][p] * B[p][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

/** Inverts an n x n square matrix using Gauss-Jordan elimination with partial pivoting */
export function matrixInvert(A: Matrix): Matrix | null {
  const n = A.length;
  // Augment with identity matrix
  const M: Matrix = Array.from({ length: n }, (_, i) => [
    ...A[i],
    ...Array.from({ length: n }, (__, j) => (i === j ? 1 : 0))
  ]);

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > maxVal) {
        maxVal = Math.abs(M[r][i]);
        maxRow = r;
      }
    }

    if (maxVal < 1e-13) {
      return null; // Singular matrix or rank deficient
    }

    // Swap max row with current row
    if (maxRow !== i) {
      const temp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = temp;
    }

    // Normalize pivot row
    const pivot = M[i][i];
    for (let c = i; c < 2 * n; c++) {
      M[i][c] /= pivot;
    }

    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = M[r][i];
        if (Math.abs(factor) > 1e-14) {
          for (let c = i; c < 2 * n; c++) {
            M[r][c] -= factor * M[i][c];
          }
        }
      }
    }
  }

  // Extract inverse
  const inv: Matrix = Array.from({ length: n }, (_, i) => M[i].slice(n));
  return inv;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 1D LEVELING NETWORK ADJUSTMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelingPoint {
  id: string;
  isFixed: boolean;
  knownElevation?: number;
  approxElevation?: number;
}

export interface LevelingObservation {
  id: string;
  fromStation: string;
  toStation: string;
  measuredDh: number; // in meters (dH = to - from)
  distanceKm?: number; // length in km
  stdDevMm?: number; // a priori standard error in mm (default: 2.0 * sqrt(distanceKm))
  weight?: number;
}

export interface LevelingAdjustedPoint {
  id: string;
  adjustedElevation: number;
  stdDevMm: number;
  isFixed: boolean;
}

export interface LevelingAdjustedObs {
  id: string;
  fromStation: string;
  toStation: string;
  measuredDh: number;
  adjustedDh: number;
  residualMm: number;
  normalizedResidual: number;
  isOutlier: boolean;
  weight: number;
}

export interface LevelingAdjustmentResult {
  converged: boolean;
  dof: number; // Degrees of freedom (r = n - u)
  sigma0: number; // Standard error of unit weight (dimensionless or mm)
  points: LevelingAdjustedPoint[];
  observations: LevelingAdjustedObs[];
  totalMisclosureMm: number;
  hasOutliers: boolean;
}

export function adjust1DLevelingNetwork(
  points: LevelingPoint[],
  observations: LevelingObservation[]
): LevelingAdjustmentResult {
  const unknownPoints = points.filter((p) => !p.isFixed);
  const fixedPoints = points.filter((p) => p.isFixed);

  if (fixedPoints.length === 0) {
    throw new Error('ต้องมีหมุดหลักฐานอ้างอิงความสูง (Fixed Benchmark) อย่างน้อย 1 หมุด');
  }

  const u = unknownPoints.length;
  const n = observations.length;
  const r = n - u;

  if (r < 0) {
    throw new Error(`จำนวนค่าสังเกต (${n}) น้อยกว่าจำนวนหมุดที่ไม่ทราบค่า (${u}) ไม่สามารถปรับแก้ได้`);
  }

  // Map unknown point IDs to unknown vector indices
  const unknownIndexMap = new Map<string, number>();
  unknownPoints.forEach((p, idx) => unknownIndexMap.set(p.id, idx));

  // Map known elevations
  const elevationMap = new Map<string, number>();
  points.forEach((p) => {
    if (p.isFixed && p.knownElevation !== undefined) {
      elevationMap.set(p.id, p.knownElevation);
    } else {
      elevationMap.set(p.id, p.approxElevation ?? 0);
    }
  });

  // Build Design Matrix A (n x u), Misclosure Vector L (n x 1), Weight Matrix P (n x n)
  const A: Matrix = Array.from({ length: n }, () => Array(u).fill(0));
  const L: Matrix = Array.from({ length: n }, () => [0]);
  const P: Matrix = Array.from({ length: n }, () => Array(n).fill(0));

  observations.forEach((obs, i) => {
    // dH = H_to - H_from
    const fromUnknownIdx = unknownIndexMap.get(obs.fromStation);
    const toUnknownIdx = unknownIndexMap.get(obs.toStation);

    if (toUnknownIdx !== undefined) {
      A[i][toUnknownIdx] = 1;
    }
    if (fromUnknownIdx !== undefined) {
      A[i][fromUnknownIdx] = -1;
    }

    // Misclosure l_i = observed_dH - (approx_H_to - approx_H_from)
    const approxFrom = elevationMap.get(obs.fromStation) ?? 0;
    const approxTo = elevationMap.get(obs.toStation) ?? 0;
    const approxDh = approxTo - approxFrom;
    L[i][0] = obs.measuredDh - approxDh;

    // Weight formulation: p_i = 1 / sigma_i^2 (in 1/m^2)
    const dist = obs.distanceKm && obs.distanceKm > 0 ? obs.distanceKm : 1.0;
    const stdMm = obs.stdDevMm !== undefined && obs.stdDevMm > 0 ? obs.stdDevMm : 2.0 * Math.sqrt(dist);
    const stdM = stdMm / 1000.0;
    const w = obs.weight !== undefined && obs.weight > 0 ? obs.weight : 1.0 / Math.max(1e-10, stdM * stdM);
    P[i][i] = w;
  });

  // Normal equations: N = A^T P A, W = A^T P L
  const AT = matrixTranspose(A);
  const ATP = matrixMultiply(AT, P);
  const N = matrixMultiply(ATP, A);
  const W = matrixMultiply(ATP, L);

  const N_inv = matrixInvert(N);
  if (!N_inv) {
    throw new Error('โครงข่ายไม่มีความต่อเนื่องทางเรขาคณิต (Matrix is singular) กรุณาตรวจสอบเส้นทางเดินระดับ');
  }

  // Corrections dX = N^-1 * W
  const dX = matrixMultiply(N_inv, W);

  // Residuals: V = A * dX - L
  const AdX = matrixMultiply(A, dX);
  const V: number[] = observations.map((_, i) => AdX[i][0] - L[i][0]);

  // V^T P V
  let VTPV = 0;
  observations.forEach((obs, i) => {
    const w = P[i][i];
    VTPV += w * V[i] * V[i];
  });

  // Standard error of unit weight: sigma0 = sqrt(V^T P V / r)
  const sigma0 = r > 0 ? Math.sqrt(VTPV / r) : 0;

  // Covariance matrix of parameters: Sigma_X = sigma0^2 * N^-1
  // Q_v = P^-1 - A * N^-1 * A^T
  const ANinv = matrixMultiply(A, N_inv);
  const ANinvAT = matrixMultiply(ANinv, AT);

  // Compile adjusted points
  const adjustedPoints: LevelingAdjustedPoint[] = points.map((p) => {
    if (p.isFixed) {
      return {
        id: p.id,
        adjustedElevation: p.knownElevation ?? 0,
        stdDevMm: 0,
        isFixed: true
      };
    }
    const idx = unknownIndexMap.get(p.id)!;
    const correction = dX[idx][0];
    const finalElev = (elevationMap.get(p.id) ?? 0) + correction;
    const q_ii = N_inv[idx][idx];
    const stdDevM = sigma0 > 0 ? sigma0 * Math.sqrt(Math.max(0, q_ii)) : 0;
    return {
      id: p.id,
      adjustedElevation: finalElev,
      stdDevMm: stdDevM * 1000,
      isFixed: false
    };
  });

  // Compile adjusted observations & data snooping
  let hasOutliers = false;
  let totalMisclosureSum = 0;

  const adjustedObs: LevelingAdjustedObs[] = observations.map((obs, i) => {
    const vM = V[i];
    const vMm = vM * 1000;
    totalMisclosureSum += Math.abs(vMm);

    // Baarda Data Snooping: w_i = |v_i| / sqrt(q_vi) (using a priori unit weight sigma0=1.0)
    // to prevent Pope tau-test bound deflation in networks with small degrees of freedom
    const q_vi = Math.max(1e-12, 1 / P[i][i] - ANinvAT[i][i]);
    const sigma_v_priori = Math.sqrt(q_vi);
    const normalizedRes = Math.abs(vM / sigma_v_priori);
    const isOutlier = normalizedRes > 2.576; // 99% confidence critical value
    if (isOutlier) hasOutliers = true;

    return {
      id: obs.id,
      fromStation: obs.fromStation,
      toStation: obs.toStation,
      measuredDh: obs.measuredDh,
      adjustedDh: obs.measuredDh + vM,
      residualMm: vMm,
      normalizedResidual: normalizedRes,
      isOutlier,
      weight: P[i][i]
    };
  });

  return {
    converged: true,
    dof: r,
    sigma0,
    points: adjustedPoints,
    observations: adjustedObs,
    totalMisclosureMm: totalMisclosureSum,
    hasOutliers
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 2D NETWORK ADJUSTMENT & ERROR ELLIPSES
// ─────────────────────────────────────────────────────────────────────────────

export interface Station2D {
  id: string;
  isFixed: boolean;
  knownE?: number;
  knownN?: number;
  approxE?: number;
  approxN?: number;
}

export type Observation2DType = 'distance' | 'azimuth' | 'baseline_vector';

export interface Observation2D {
  id: string;
  type: Observation2DType;
  fromStation: string;
  toStation: string;
  measuredValue: number; // distance (m), azimuth (degrees), or dE (m)
  measuredValue2?: number; // for baseline_vector: dN (m)
  stdDev: number; // e.g. 0.005 m for distance, 5 arc-sec for angle, 0.008 m for GNSS
  stdDev2?: number; // for dN
}

export interface ErrorEllipse {
  semiMajorAxisMm: number; // a in mm (1-sigma)
  semiMinorAxisMm: number; // b in mm (1-sigma)
  orientationDeg: number; // theta in degrees (Azimuth from North)
  conf95MajorMm: number; // 95% Confidence semi-major axis (k = 2.447)
  conf95MinorMm: number; // 95% Confidence semi-minor axis
}

export interface AdjustedStation2D {
  id: string;
  isFixed: boolean;
  easting: number;
  northing: number;
  sigmaEMm: number;
  sigmaNMm: number;
  errorEllipse?: ErrorEllipse;
}

export interface AdjustedObs2D {
  id: string;
  type: Observation2DType;
  fromStation: string;
  toStation: string;
  measured: number;
  adjusted: number;
  residual: number; // m for distance, arc-sec for azimuth
  normalizedResidual: number;
  isOutlier: boolean;
}

export interface Network2DAdjustmentResult {
  converged: boolean;
  iterations: number;
  dof: number;
  sigma0: number; // Standard error of unit weight
  stations: AdjustedStation2D[];
  observations: AdjustedObs2D[];
  chiSquarePassed: boolean;
  chiSquareBounds: [number, number];
}

/** Degrees to Radians */
const DEG2RAD = Math.PI / 180;
/** Radians to Degrees */
const RAD2DEG = 180 / Math.PI;
/** Radians to Arc-Seconds */
const RAD2SEC = (180 / Math.PI) * 3600;

export function adjust2DNetwork(
  stations: Station2D[],
  observations: Observation2D[]
): Network2DAdjustmentResult {
  const unknownStations = stations.filter((s) => !s.isFixed);
  const fixedStations = stations.filter((s) => s.isFixed);

  if (fixedStations.length === 0) {
    throw new Error('ต้องมีหมุดหลักฐานอ้างอิงพิกัด (Fixed Control Station) อย่างน้อย 1 หมุด');
  }

  const u = unknownStations.length * 2; // Each unknown station has [dE, dN]
  const unknownMap = new Map<string, number>();
  unknownStations.forEach((s, i) => unknownMap.set(s.id, i * 2));

  // Count total equations
  let totalObsCount = 0;
  observations.forEach((obs) => {
    if (obs.type === 'baseline_vector') {
      totalObsCount += 2; // dE and dN
    } else {
      totalObsCount += 1;
    }
  });

  const n = totalObsCount;
  const r = n - u;
  if (r < 0) {
    throw new Error(`จำนวนค่าสังเกต (${n}) ไม่เพียงพอสำหรับปรับแก้ตัวแปรพิกัด (${u})`);
  }

  // Working coordinates map
  const coordE = new Map<string, number>();
  const coordN = new Map<string, number>();

  stations.forEach((s) => {
    coordE.set(s.id, s.isFixed ? (s.knownE ?? 0) : (s.approxE ?? 0));
    coordN.set(s.id, s.isFixed ? (s.knownN ?? 0) : (s.approxN ?? 0));
  });

  let iterations = 0;
  const MAX_ITER = 10;
  let maxCorrection = 1.0;
  let finalNinv: Matrix | null = null;
  let finalA: Matrix = [];
  let finalL: Matrix = [];
  let finalP: Matrix = [];
  let finalV: number[] = [];
  let finalSigma0 = 1.0;

  while (iterations < MAX_ITER && maxCorrection > 0.0001) {
    iterations++;

    // Design Matrix A (n x u), Misclosure Vector L (n x 1), Weight Matrix P (n x n)
    const A: Matrix = Array.from({ length: n }, () => Array(u).fill(0));
    const L: Matrix = Array.from({ length: n }, () => [0]);
    const P: Matrix = Array.from({ length: n }, () => Array(n).fill(0));

    let rowIdx = 0;

    observations.forEach((obs) => {
      const e_i = coordE.get(obs.fromStation)!;
      const n_i = coordN.get(obs.fromStation)!;
      const e_j = coordE.get(obs.toStation)!;
      const n_j = coordN.get(obs.toStation)!;

      const dE = e_j - e_i;
      const dN = n_j - n_i;
      const dist = Math.hypot(dE, dN);
      const azimuthRad = Math.atan2(dE, dN);

      const fromIdx = unknownMap.get(obs.fromStation);
      const toIdx = unknownMap.get(obs.toStation);

      if (obs.type === 'distance') {
        // dS = -sin(alpha) * dE_i - cos(alpha) * dN_i + sin(alpha) * dE_j + cos(alpha) * dN_j
        const sinA = dE / dist;
        const cosA = dN / dist;

        if (fromIdx !== undefined) {
          A[rowIdx][fromIdx] = -sinA;
          A[rowIdx][fromIdx + 1] = -cosA;
        }
        if (toIdx !== undefined) {
          A[rowIdx][toIdx] = sinA;
          A[rowIdx][toIdx + 1] = cosA;
        }

        L[rowIdx][0] = obs.measuredValue - dist;
        const varS = Math.max(1e-8, obs.stdDev * obs.stdDev);
        P[rowIdx][rowIdx] = 1.0 / varS;
        rowIdx++;
      } else if (obs.type === 'azimuth') {
        // dAlpha = -cos(alpha)/S * dE_i + sin(alpha)/S * dN_i + cos(alpha)/S * dE_j - sin(alpha)/S * dN_j
        const sinA = dE / dist;
        const cosA = dN / dist;
        const invS = 1.0 / dist;

        if (fromIdx !== undefined) {
          A[rowIdx][fromIdx] = -cosA * invS;
          A[rowIdx][fromIdx + 1] = sinA * invS;
        }
        if (toIdx !== undefined) {
          A[rowIdx][toIdx] = cosA * invS;
          A[rowIdx][toIdx + 1] = -sinA * invS;
        }

        let obsRad = obs.measuredValue * DEG2RAD;
        let diffRad = obsRad - azimuthRad;
        // Normalize diff to [-pi, pi]
        while (diffRad > Math.PI) diffRad -= 2 * Math.PI;
        while (diffRad < -Math.PI) diffRad += 2 * Math.PI;

        L[rowIdx][0] = diffRad;
        const stdRad = (obs.stdDev / 3600) * DEG2RAD;
        P[rowIdx][rowIdx] = 1.0 / Math.max(1e-12, stdRad * stdRad);
        rowIdx++;
      } else if (obs.type === 'baseline_vector') {
        // dE = e_j - e_i
        if (fromIdx !== undefined) A[rowIdx][fromIdx] = -1;
        if (toIdx !== undefined) A[rowIdx][toIdx] = 1;
        L[rowIdx][0] = obs.measuredValue - dE;
        P[rowIdx][rowIdx] = 1.0 / Math.max(1e-8, obs.stdDev * obs.stdDev);
        rowIdx++;

        // dN = n_j - n_i
        if (fromIdx !== undefined) A[rowIdx][fromIdx + 1] = -1;
        if (toIdx !== undefined) A[rowIdx][toIdx + 1] = 1;
        const stdN = obs.stdDev2 ?? obs.stdDev;
        L[rowIdx][0] = (obs.measuredValue2 ?? 0) - dN;
        P[rowIdx][rowIdx] = 1.0 / Math.max(1e-8, stdN * stdN);
        rowIdx++;
      }
    });

    const AT = matrixTranspose(A);
    const ATP = matrixMultiply(AT, P);
    const N = matrixMultiply(ATP, A);
    const W = matrixMultiply(ATP, L);

    const N_inv = matrixInvert(N);
    if (!N_inv) {
      throw new Error('โครงข่าย 2D ไม่เสถียร (Singular Normal Matrix) กรุณาตรวจสอบการกระจายหมุดและค่าสังเกต');
    }

    const dX = matrixMultiply(N_inv, W);

    // Apply corrections
    maxCorrection = 0;
    unknownStations.forEach((s) => {
      const idx = unknownMap.get(s.id)!;
      const corrE = dX[idx][0];
      const corrN = dX[idx + 1][0];

      coordE.set(s.id, coordE.get(s.id)! + corrE);
      coordN.set(s.id, coordN.get(s.id)! + corrN);

      maxCorrection = Math.max(maxCorrection, Math.abs(corrE), Math.abs(corrN));
    });

    if (iterations === MAX_ITER || maxCorrection <= 0.0001) {
      finalNinv = N_inv;
      finalA = A;
      finalL = L;
      finalP = P;

      const AdX = matrixMultiply(A, dX);
      finalV = Array.from({ length: n }, (_, i) => AdX[i][0] - L[i][0]);

      let VTPV = 0;
      for (let i = 0; i < n; i++) {
        VTPV += P[i][i] * finalV[i] * finalV[i];
      }
      finalSigma0 = r > 0 ? Math.sqrt(VTPV / r) : 1.0;
    }
  }

  if (!finalNinv) {
    throw new Error('การปรับแก้โครงข่ายไม่ลู่เข้า (Failed to converge)');
  }

  // Covariance matrix of unknown coordinates: Sigma_X = sigma0^2 * N^-1
  const Q = finalNinv;
  const sigma0Sq = finalSigma0 * finalSigma0;

  // Process adjusted stations & Error Ellipses
  const adjustedStations: AdjustedStation2D[] = stations.map((s) => {
    const finalE = coordE.get(s.id)!;
    const finalN = coordN.get(s.id)!;

    if (s.isFixed) {
      return {
        id: s.id,
        isFixed: true,
        easting: finalE,
        northing: finalN,
        sigmaEMm: 0,
        sigmaNMm: 0
      };
    }

    const idx = unknownMap.get(s.id)!;
    const qEE = Q[idx][idx];
    const qNN = Q[idx + 1][idx + 1];
    const qEN = Q[idx][idx + 1];

    const sigmaEMm = finalSigma0 * Math.sqrt(Math.max(0, qEE)) * 1000;
    const sigmaNMm = finalSigma0 * Math.sqrt(Math.max(0, qNN)) * 1000;

    // Standard Error Ellipse calculation (1-sigma)
    // a^2, b^2 = sigma0^2 * 0.5 * (qEE + qNN +/- sqrt((qEE - qNN)^2 + 4 * qEN^2))
    const term1 = qEE + qNN;
    const term2 = Math.sqrt((qEE - qNN) * (qEE - qNN) + 4 * qEN * qEN);
    const qA = 0.5 * (term1 + term2);
    const qB = 0.5 * Math.max(0, term1 - term2);

    const aMm = finalSigma0 * Math.sqrt(Math.max(0, qA)) * 1000;
    const bMm = finalSigma0 * Math.sqrt(Math.max(0, qB)) * 1000;

    // Orientation angle of major axis from North: theta = 0.5 * atan2(2*qEN, qNN - qEE)
    let thetaRad = 0.5 * Math.atan2(2 * qEN, qNN - qEE);
    let thetaDeg = thetaRad * RAD2DEG;
    if (thetaDeg < 0) thetaDeg += 360;

    // 95% Confidence Ellipse factor for 2D: k = sqrt(5.991) = 2.447
    const K_95 = 2.447;

    const errorEllipse: ErrorEllipse = {
      semiMajorAxisMm: aMm,
      semiMinorAxisMm: bMm,
      orientationDeg: thetaDeg,
      conf95MajorMm: aMm * K_95,
      conf95MinorMm: bMm * K_95
    };

    return {
      id: s.id,
      isFixed: false,
      easting: finalE,
      northing: finalN,
      sigmaEMm,
      sigmaNMm,
      errorEllipse
    };
  });

  // Compile adjusted observations
  const adjustedObservations: AdjustedObs2D[] = [];
  let rowTracker = 0;

  observations.forEach((obs) => {
    const fromE = coordE.get(obs.fromStation)!;
    const fromN = coordN.get(obs.fromStation)!;
    const toE = coordE.get(obs.toStation)!;
    const toN = coordN.get(obs.toStation)!;

    if (obs.type === 'distance') {
      const calcDist = Math.hypot(toE - fromE, toN - fromN);
      const resM = finalV[rowTracker];
      const normRes = Math.abs(resM / Math.max(1e-6, obs.stdDev));
      adjustedObservations.push({
        id: obs.id,
        type: 'distance',
        fromStation: obs.fromStation,
        toStation: obs.toStation,
        measured: obs.measuredValue,
        adjusted: calcDist,
        residual: resM,
        normalizedResidual: normRes,
        isOutlier: normRes > 2.576
      });
      rowTracker++;
    } else if (obs.type === 'azimuth') {
      let calcAzRad = Math.atan2(toE - fromE, toN - fromN);
      let calcAzDeg = calcAzRad * RAD2DEG;
      if (calcAzDeg < 0) calcAzDeg += 360;

      const resRad = finalV[rowTracker];
      const resSec = resRad * RAD2SEC;
      const normRes = Math.abs(resSec / Math.max(1e-6, obs.stdDev));
      adjustedObservations.push({
        id: obs.id,
        type: 'azimuth',
        fromStation: obs.fromStation,
        toStation: obs.toStation,
        measured: obs.measuredValue,
        adjusted: calcAzDeg,
        residual: resSec,
        normalizedResidual: normRes,
        isOutlier: normRes > 2.576
      });
      rowTracker++;
    } else if (obs.type === 'baseline_vector') {
      const calcDE = toE - fromE;
      const resDE = finalV[rowTracker];
      const normResDE = Math.abs(resDE / Math.max(1e-6, obs.stdDev));
      adjustedObservations.push({
        id: `${obs.id}_dE`,
        type: 'baseline_vector',
        fromStation: obs.fromStation,
        toStation: obs.toStation,
        measured: obs.measuredValue,
        adjusted: calcDE,
        residual: resDE,
        normalizedResidual: normResDE,
        isOutlier: normResDE > 2.576
      });
      rowTracker++;

      const calcDN = toN - fromN;
      const resDN = finalV[rowTracker];
      const stdN = obs.stdDev2 ?? obs.stdDev;
      const normResDN = Math.abs(resDN / Math.max(1e-6, stdN));
      adjustedObservations.push({
        id: `${obs.id}_dN`,
        type: 'baseline_vector',
        fromStation: obs.fromStation,
        toStation: obs.toStation,
        measured: obs.measuredValue2 ?? 0,
        adjusted: calcDN,
        residual: resDN,
        normalizedResidual: normResDN,
        isOutlier: normResDN > 2.576
      });
      rowTracker++;
    }
  });

  // Chi-Square global test bounds at alpha = 0.05
  // Approximate bounds for r dof
  const chiSqLower = Math.max(0.1, r - 1.96 * Math.sqrt(2 * r));
  const chiSqUpper = r + 1.96 * Math.sqrt(2 * r);
  const sampleChiSq = r * finalSigma0 * finalSigma0;
  const chiSquarePassed = sampleChiSq >= chiSqLower && sampleChiSq <= chiSqUpper;

  return {
    converged: true,
    iterations,
    dof: r,
    sigma0: finalSigma0,
    stations: adjustedStations,
    observations: adjustedObservations,
    chiSquarePassed,
    chiSquareBounds: [chiSqLower, chiSqUpper]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REALISTIC PRESET DATASETS (SAMPLE NETWORKS)
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_LEVELING_NETWORK = {
  points: [
    { id: 'BM-01', isFixed: true, knownElevation: 100.0 },
    { id: 'BM-02', isFixed: true, knownElevation: 104.285 },
    { id: 'P1', isFixed: false, approxElevation: 101.5 },
    { id: 'P2', isFixed: false, approxElevation: 103.2 }
  ],
  observations: [
    { id: 'L1', fromStation: 'BM-01', toStation: 'P1', measuredDh: 1.542, distanceKm: 0.8 },
    { id: 'L2', fromStation: 'P1', toStation: 'P2', measuredDh: 1.698, distanceKm: 0.6 },
    { id: 'L3', fromStation: 'P2', toStation: 'BM-02', measuredDh: 1.041, distanceKm: 0.7 },
    { id: 'L4', fromStation: 'BM-01', toStation: 'P2', measuredDh: 3.245, distanceKm: 1.2 },
    { id: 'L5', fromStation: 'P1', toStation: 'BM-02', measuredDh: 2.746, distanceKm: 1.1 }
  ]
};

export const SAMPLE_2D_TRAVERSE_NETWORK = {
  stations: [
    { id: 'STN-1', isFixed: true, knownE: 669500.0, knownN: 1531000.0 },
    { id: 'STN-2', isFixed: true, knownE: 670200.0, knownN: 1531000.0 },
    { id: 'P-A', isFixed: false, approxE: 669750.0, approxN: 1531400.0 },
    { id: 'P-B', isFixed: false, approxE: 670050.0, approxN: 1531350.0 }
  ],
  observations: [
    { id: 'D1', type: 'distance' as const, fromStation: 'STN-1', toStation: 'P-A', measuredValue: 471.695, stdDev: 0.005 },
    { id: 'D2', type: 'distance' as const, fromStation: 'P-A', toStation: 'P-B', measuredValue: 304.142, stdDev: 0.005 },
    { id: 'D3', type: 'distance' as const, fromStation: 'P-B', toStation: 'STN-2', measuredValue: 380.785, stdDev: 0.005 },
    { id: 'D4', type: 'distance' as const, fromStation: 'STN-1', toStation: 'P-B', measuredValue: 651.924, stdDev: 0.008 },
    { id: 'D5', type: 'distance' as const, fromStation: 'P-A', toStation: 'STN-2', measuredValue: 570.089, stdDev: 0.008 },
    { id: 'A1', type: 'azimuth' as const, fromStation: 'STN-1', toStation: 'P-A', measuredValue: 32.005, stdDev: 5.0 },
    { id: 'A2', type: 'azimuth' as const, fromStation: 'P-A', toStation: 'P-B', measuredValue: 99.462, stdDev: 5.0 }
  ]
};
