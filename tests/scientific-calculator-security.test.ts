import { describe, it, expect } from 'vitest';

// Extract the formula evaluation logic identical to ScientificCalculator.tsx
function evaluateFormula(clean: string, angleMode: 'DEG' | 'GRAD' | 'RAD' = 'DEG') {
  const toRad = (angleVal: number) => {
    if (angleMode === 'DEG') return (angleVal * Math.PI) / 180;
    if (angleMode === 'GRAD') return (angleVal * Math.PI) / 200;
    return angleVal;
  };

  const fromRad = (radVal: number) => {
    if (angleMode === 'DEG') return (radVal * 180) / Math.PI;
    if (angleMode === 'GRAD') return (radVal * 200) / Math.PI;
    return radVal;
  };

  const sin = (x: number) => Math.sin(toRad(x));
  const cos = (x: number) => Math.cos(toRad(x));
  const tan = (x: number) => Math.tan(toRad(x));
  const asin = (x: number) => fromRad(Math.asin(x));
  const acos = (x: number) => fromRad(Math.acos(x));
  const atan = (x: number) => fromRad(Math.atan(x));

  const sinh = (x: number) => Math.sinh(x);
  const cosh = (x: number) => Math.cosh(x);
  const tanh = (x: number) => Math.tanh(x);

  const sqrt = (x: number) => Math.sqrt(x);
  const cbrt = (x: number) => Math.cbrt(x);
  const ln = (x: number) => Math.log(x);
  const log = (x: number) => Math.log10(x);
  const abs = (x: number) => Math.abs(x);
  const PI = Math.PI;
  const E = Math.E;

  clean = clean.replace(/\^/g, '**');

  if (!/^[0-9+\-*/().\s,a-zA-Z_]+$/.test(clean)) {
    throw new Error('Invalid characters in formula');
  }

  // SAST Taint Guard: Strict Whitelist of Mathematical Tokens
  const allowedTokens = new Set([
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh', 'sqrt', 'cbrt', 'ln', 'log', 'abs',
    'PI', 'E'
  ]);
  const identifiers = clean.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
  for (const id of identifiers) {
    if (!allowedTokens.has(id)) {
      throw new Error(`ไม่อนุญาตให้ใช้คำสั่ง "${id}" ในสูตรคำนวณ`);
    }
  }

  const evaluator = new Function(
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh', 'sqrt', 'cbrt', 'ln', 'log', 'abs', 'PI', 'E',
    `"use strict"; return (${clean});`
  );

  return evaluator(
    sin, cos, tan, asin, acos, atan,
    sinh, cosh, tanh, sqrt, cbrt, ln, log, abs, PI, E
  );
}

describe('ScientificCalculator Mathematical Security & Sandbox Integrity', () => {
  it('correctly evaluates legitimate trigonometric and algebraic formulas', () => {
    expect(evaluateFormula('sin(90)')).toBeCloseTo(1, 5);
    expect(evaluateFormula('cos(0)')).toBeCloseTo(1, 5);
    expect(evaluateFormula('sqrt(16) + 2 * 3')).toBe(10);
    expect(evaluateFormula('PI * 2')).toBeCloseTo(Math.PI * 2, 5);
    expect(evaluateFormula('ln(E)')).toBeCloseTo(1, 5);
  });

  it('strictly blocks arbitrary global objects and execution attempts', () => {
    expect(() => evaluateFormula('window')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "window"');
    expect(() => evaluateFormula('document')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "document"');
    expect(() => evaluateFormula('fetch(1)')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "fetch"');
    expect(() => evaluateFormula('alert(1)')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "alert"');
    expect(() => evaluateFormula('localStorage.clear()')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "localStorage"');
    expect(() => evaluateFormula('location.href')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "location"');
    expect(() => evaluateFormula('eval(1)')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "eval"');
    expect(() => evaluateFormula('constructor')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "constructor"');
    expect(() => evaluateFormula('globalThis')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "globalThis"');
    expect(() => evaluateFormula('process.exit()')).toThrow('ไม่อนุญาตให้ใช้คำสั่ง "process"');
  });

  it('rejects forbidden special characters before evaluation', () => {
    expect(() => evaluateFormula('2 + 2; alert(1)')).toThrow('Invalid characters in formula');
    expect(() => evaluateFormula('<script>')).toThrow('Invalid characters in formula');
    expect(() => evaluateFormula('`test`')).toThrow('Invalid characters in formula');
  });
});
