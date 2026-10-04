import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  RotateCcw, 
  Copy, 
  Check, 
  History, 
  Compass, 
  Ruler, 
  Sparkles, 
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { decimalToDms, dmsToDecimal } from '../../core/projections';

type AngleMode = 'DEG' | 'RAD' | 'GRAD';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  dmsResult?: string;
  timestamp: string;
}

export const ScientificCalculator: React.FC = () => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [dmsResult, setDmsResult] = useState<string | null>(null);
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [lastAnswer, setLastAnswer] = useState<string>('0');
  const [isSecondFunction, setIsSecondFunction] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showSurveyAssistant, setShowSurveyAssistant] = useState<boolean>(true);
  const [surveyAssistTab, setSurveyAssistTab] = useState<'polrec' | 'dms' | 'corrections'>('polrec');
  const [mobileTab, setMobileTab] = useState<'calc' | 'tools'>('calc');

  // Lock viewport scroll while scientific calculator is active (user request)
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Survey Assistant Form States
  const [polDe, setPolDe] = useState<string>('120.450');
  const [polDn, setPolDn] = useState<string>('85.320');
  const [polResult, setPolResult] = useState<{ dist: number; azDeg: number; azDms: string } | null>(null);

  const [recDist, setRecDist] = useState<string>('147.608');
  const [recAzDms, setRecAzDms] = useState<string>('54°42\'30"');
  const [recResult, setRecResult] = useState<{ de: number; dn: number } | null>(null);

  const [dmsDeg, setDmsDeg] = useState<string>('13');
  const [dmsMin, setDmsMin] = useState<string>('50');
  const [dmsSec, setDmsSec] = useState<string>('47.90');
  const [dmsToDdResult, setDmsToDdResult] = useState<number | null>(null);

  const [ddInput, setDdInput] = useState<string>('13.846639');
  const [ddToDmsResult, setDdToDmsResult] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Evaluate Pol(dE, dN)
  const calculatePol = (deStr = polDe, dnStr = polDn) => {
    const de = parseFloat(deStr);
    const dn = parseFloat(dnStr);
    if (isNaN(de) || isNaN(dn)) return;
    const dist = Math.hypot(de, dn);
    let azRad = Math.atan2(de, dn); // Survey azimuth: 0 = North, clockwise towards East
    let azDeg = (azRad * 180) / Math.PI;
    if (azDeg < 0) azDeg += 360;
    const dms = decimalToDms(azDeg, true);
    const azDms = `${dms.deg}° ${dms.min}' ${dms.sec.toFixed(2)}"`;
    setPolResult({ dist, azDeg, azDms });
  };

  // Evaluate Rec(Dist, Azimuth)
  const calculateRec = (distStr = recDist, azStr = recAzDms) => {
    const dist = parseFloat(distStr);
    if (isNaN(dist)) return;

    // Parse Azimuth (supports "123.456" or "123°45'30\"")
    let azDeg = 0;
    const dmsMatch = azStr.match(/(\d+)[°\s]+(\d+)?['\s]*([\d.]+)?/);
    if (dmsMatch) {
      const d = parseFloat(dmsMatch[1]) || 0;
      const m = parseFloat(dmsMatch[2]) || 0;
      const s = parseFloat(dmsMatch[3]) || 0;
      azDeg = dmsToDecimal(d, m, s);
    } else {
      azDeg = parseFloat(azStr) || 0;
    }

    const azRad = (azDeg * Math.PI) / 180;
    const de = dist * Math.sin(azRad);
    const dn = dist * Math.cos(azRad);
    setRecResult({ de, dn });
  };

  // Run initial calculations
  useEffect(() => {
    calculatePol();
    calculateRec();
  }, []);

  // Safe Math Expression Evaluator
  const evaluateExpression = (expr: string): { val: number; str: string; dms?: string } => {
    let clean = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `${Math.PI}`)
      .replace(/Ans/g, `${parseFloat(lastAnswer) || 0}`)
      .replace(/e\b/g, `${Math.E}`);

    // Convert trigonometric functions with active angle mode
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

    // Replace power operator
    clean = clean.replace(/\^/g, '**');

    // Prevent unsafe execution: only allow digits, operators, parentheses, commas, whitespace and allowed identifiers
    if (!/^[0-9+\-*/().\s,a-zA-Z_]+$/.test(clean)) {
      throw new Error('Invalid characters in formula');
    }

    const evaluator = new Function(
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
      'sinh', 'cosh', 'tanh', 'sqrt', 'cbrt', 'ln', 'log', 'abs', 'PI', 'E',
      `"use strict"; return (${clean});`
    );

    const rawVal = evaluator(
      sin, cos, tan, asin, acos, atan,
      sinh, cosh, tanh, sqrt, cbrt, ln, log, abs, PI, E
    );

    if (typeof rawVal !== 'number' || !isFinite(rawVal)) {
      throw new Error('Math Error');
    }

    // Format display string
    const rounded = Math.round(rawVal * 1e10) / 1e10;
    const str = rounded.toLocaleString('en-US', { maximumFractionDigits: 8 });

    // Calculate DMS if numeric value is in angle-like range (0 to 360)
    let dms: string | undefined;
    if (Math.abs(rawVal) <= 360 && Math.abs(rawVal) > 0.00001) {
      const d = decimalToDms(Math.abs(rawVal), true);
      dms = `${rawVal < 0 ? '-' : ''}${d.deg}° ${d.min}' ${d.sec.toFixed(2)}"`;
    }

    return { val: rawVal, str, dms };
  };

  const handleCalculate = () => {
    if (!expression.trim()) return;
    try {
      const { str, dms } = evaluateExpression(expression);
      setResult(str);
      setDmsResult(dms || null);
      setLastAnswer(str.replace(/,/g, ''));

      // Add to history
      const item: HistoryItem = {
        id: `calc-${Date.now()}`,
        expression,
        result: str,
        dmsResult: dms,
        timestamp: new Date().toLocaleTimeString('th-TH')
      };
      setHistory(prev => [item, ...prev.slice(0, 19)]);
    } catch {
      setResult('Syntax Error');
      setDmsResult(null);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'AC') {
      setExpression('');
      setResult('0');
      setDmsResult(null);
    } else if (key === 'DEL') {
      setExpression(prev => prev.slice(0, -1));
    } else if (key === '=') {
      handleCalculate();
    } else if (key === 'Ans') {
      setExpression(prev => prev + 'Ans');
    } else if (key === 'DMS_CONV') {
      // Convert current result to DMS or vice-versa
      const num = parseFloat(result.replace(/,/g, ''));
      if (!isNaN(num)) {
        const d = decimalToDms(Math.abs(num), true);
        const formatted = `${num < 0 ? '-' : ''}${d.deg}° ${d.min}' ${d.sec.toFixed(2)}"`;
        setDmsResult(formatted);
      }
    } else {
      setExpression(prev => prev + key);
    }
  };

  // Keyboard navigation & typing handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture if not focused in another text input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (['+', '-', '*', '/', '(', ')', '.', '^'].includes(e.key)) {
        const mapped = e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key;
        handleKeyPress(mapped);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('DEL');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleKeyPress('AC');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, lastAnswer, angleMode]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0" style={{ maxHeight: '92dvh', overflow: 'hidden' }}>
      
      {/* Top Controls Strip: Compact Status & Mode Switchers */}
      <div 
        className="p-3 sm:p-4 rounded-[var(--card-radius)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            CALC-00
          </span>
          <h2 className="text-sm sm:text-base font-bold text-[var(--text-1)] flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-500 shrink-0" />
            <span>CASIO fx-991EX Natural Textbook Console</span>
          </h2>
        </div>

        {/* Quick Mode & History Toggles */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAngleMode(m => m === 'DEG' ? 'RAD' : m === 'RAD' ? 'GRAD' : 'DEG')}
            className="px-3 py-2 rounded-xl border text-xs font-mono font-bold transition hover:scale-105 active:scale-95 duration-150 flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--accent)'
            }}
            title="สลับโหมดหน่วยมุม (DEG / RAD / GRAD)"
          >
            <span>MODE:</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold">{angleMode}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHistory(h => !h)}
            className={`p-2 rounded-xl border text-xs font-medium transition hover:scale-105 active:scale-95 duration-150 flex items-center gap-1.5 ${
              showHistory ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="ประวัติการคำนวณ (Calculation Tape)"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">ประวัติ ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible only on < lg screens to guarantee zero-scroll viewport) */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('calc')}
          className={`flex-1 py-1.5 rounded-lg text-center transition ${mobileTab === 'calc' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📟 แป้นพิมพ์ CASIO
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('tools')}
          className={`flex-1 py-1.5 rounded-lg text-center transition ${mobileTab === 'tools' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          🧭 เครื่องมือเสริม &amp; ประวัติ
        </button>
      </div>

      {/* Main Layout: Calculator Body on Left, Survey Toolkit & History on Right */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start overflow-hidden">
        
        {/* ========================================================================= */}
        {/* CASIO HARDWARE PHYSICAL CASING & KEYPAD (7 COLS on Desktop)              */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-7 bg-slate-900 text-slate-100 rounded-3xl p-3 sm:p-5 shadow-2xl border border-slate-800 flex flex-col gap-2.5 font-sans select-none h-full overflow-hidden ${mobileTab === 'calc' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Top Casio Logo & Solar Cell Stripe */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-slate-400">CASIO</span>
              <span className="text-[10px] font-mono tracking-wider text-slate-500">fx-991EX / MESURV PLUS</span>
            </div>
            {/* Decorative Solar Panel */}
            <div className="grid grid-cols-4 gap-0.5 p-1 rounded-sm bg-amber-950/40 border border-amber-800/40 opacity-70">
              <div className="w-3.5 h-3 bg-amber-700/60 rounded-xs"></div>
              <div className="w-3.5 h-3 bg-amber-700/60 rounded-xs"></div>
              <div className="w-3.5 h-3 bg-amber-700/60 rounded-xs"></div>
              <div className="w-3.5 h-3 bg-amber-700/60 rounded-xs"></div>
            </div>
          </div>

          {/* Natural Textbook Display (2-Line LCD Glass Screen) */}
          <div className="p-4 rounded-2xl bg-[#0c131d] border-2 border-slate-700/80 shadow-inner flex flex-col justify-between min-h-[110px] space-y-2 relative overflow-hidden">
            
            {/* Status annunciator icons (DEG, M, STO, 2nd) */}
            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-slate-400 border-b border-slate-800/80 pb-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50">
                  {angleMode}
                </span>
                {isSecondFunction && (
                  <span className="px-1 py-0.2 rounded font-bold text-amber-300 bg-amber-950/60 border border-amber-800/50">
                    SHIFT
                  </span>
                )}
                {hasMemory && (
                  <span className="px-1 py-0.2 rounded font-bold text-blue-400 bg-blue-950/60 border border-blue-800/50">
                    M
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Ans = {lastAnswer}
              </div>
            </div>

            {/* Expression Input Line */}
            <div className="text-right font-mono text-sm sm:text-base text-slate-300 tracking-wide overflow-x-auto whitespace-nowrap scrollbar-none py-1">
              {expression || <span className="text-slate-600">0</span>}
            </div>

            {/* Main Result Line & DMS Companion Badge */}
            <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-800/40">
              <div className="text-left font-mono text-xs text-amber-400/90 truncate max-w-[200px]">
                {dmsResult && (
                  <span className="inline-flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40" title="ค่าในหน่วยองศา-ลิปดา-ฟิลิปดา (DMS)">
                    <span>📐</span>
                    <span>{dmsResult}</span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.replace(/,/g, ''));
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 1500);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-200 transition"
                  title="คัดลอกผลลัพธ์"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className="text-right font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {result}
                </div>
              </div>
            </div>
          </div>

          {/* Keypad Grid (Special Casio Tactile Keys) */}
          <div className="flex-1 min-h-0 space-y-2 overflow-y-auto scrollbar-none">
            
            {/* Top Control Bar: SHIFT, MODE, DMS, DEL, AC */}
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setIsSecondFunction(s => !s)}
                className={`py-2 rounded-xl text-xs font-bold font-mono transition duration-100 ease-spring active:scale-95 shadow-sm border ${
                  isSecondFunction
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                }`}
              >
                SHIFT
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('DMS_CONV')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition duration-100 ease-spring active:scale-95"
                title="แปลงค่าเป็น องศา-ลิปดา-ฟิลิปดา (° ' &quot;)"
              >
                ° ' " (DMS)
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('(')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                (
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress(')')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                )
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('DEL')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition duration-100 ease-spring active:scale-95"
              >
                DEL
              </button>
            </div>

            {/* Scientific Function Row 1 */}
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleKeyPress(isSecondFunction ? 'asin(' : 'sin(')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                {isSecondFunction ? 'sin⁻¹' : 'sin'}
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress(isSecondFunction ? 'acos(' : 'cos(')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                {isSecondFunction ? 'cos⁻¹' : 'cos'}
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress(isSecondFunction ? 'atan(' : 'tan(')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                {isSecondFunction ? 'tan⁻¹' : 'tan'}
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('^')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                xʸ
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('sqrt(')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                √
              </button>
            </div>

            {/* Scientific Function Row 2: Pol, Rec, log, ln, 1/x */}
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSurveyAssistTab('polrec');
                  setShowSurveyAssistant(true);
                }}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 transition duration-100 ease-spring active:scale-95"
                title="Polar conversion (Distance & Azimuth from dE, dN)"
              >
                Pol(
              </button>
              <button
                type="button"
                onClick={() => {
                  setSurveyAssistTab('polrec');
                  setShowSurveyAssistant(true);
                }}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 transition duration-100 ease-spring active:scale-95"
                title="Rectangular conversion (dE, dN from Distance & Azimuth)"
              >
                Rec(
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('log(')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                log
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('ln(')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                ln
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('AC')}
                className="py-2 rounded-xl text-xs font-bold font-mono bg-rose-600 hover:bg-rose-500 text-white shadow-sm border border-rose-400 transition duration-100 ease-spring active:scale-95"
              >
                AC
              </button>
            </div>

            {/* Standard Keypad & Operations */}
            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800">
              {/* Row 1 */}
              <button
                type="button"
                onClick={() => handleKeyPress('7')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('8')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('9')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('÷')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 transition duration-100 ease-spring active:scale-95"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => handleKeyPress('4')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('5')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('6')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('×')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 transition duration-100 ease-spring active:scale-95"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => handleKeyPress('1')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('2')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('3')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('-')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 transition duration-100 ease-spring active:scale-95"
              >
                -
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('.')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/70 transition duration-100 ease-spring active:scale-95"
              >
                .
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('Ans')}
                className="py-3 rounded-2xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                Ans
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('+')}
                className="py-3 rounded-2xl text-base font-bold font-mono bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 transition duration-100 ease-spring active:scale-95"
              >
                +
              </button>
            </div>

            {/* Bottom Final Row: Constants & Equal Key */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleKeyPress('π')}
                className="py-2.5 rounded-2xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                π (Pi)
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('e')}
                className="py-2.5 rounded-2xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                e (Euler)
              </button>
              <button
                type="button"
                onClick={() => {
                  const num = parseFloat(result.replace(/,/g, ''));
                  if (!isNaN(num)) {
                    setMemory(m => m + num);
                    setHasMemory(true);
                  }
                }}
                className="py-2.5 rounded-2xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition duration-100 ease-spring active:scale-95"
              >
                M+
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('=')}
                className="py-2.5 rounded-2xl text-lg font-black font-mono bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400 transition duration-100 ease-spring active:scale-95"
              >
                =
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SURVEY SUPERPOWERS & COMPUTATION HISTORY                   */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-5 space-y-4 overflow-y-auto h-full scrollbar-none pr-0.5 ${mobileTab === 'tools' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Survey Specialized Toolkit Card */}
          <div 
            className="p-5 rounded-2xl border shadow-sm space-y-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  เครื่องมือคำนวณงานสำรวจเฉพาะทาง (Survey Power Tools)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                CASIO FX-SURV
              </span>
            </div>

            {/* Sub-tab navigation: Pol/Rec, DMS, Geodetic */}
            <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 gap-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSurveyAssistTab('polrec')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  surveyAssistTab === 'polrec'
                    ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pol / Rec
              </button>
              <button
                type="button"
                onClick={() => setSurveyAssistTab('dms')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  surveyAssistTab === 'dms'
                    ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ° ' " (DMS ↔ DD)
              </button>
              <button
                type="button"
                onClick={() => setSurveyAssistTab('corrections')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  surveyAssistTab === 'corrections'
                    ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                สูตรแก้ไขสำรวจ
              </button>
            </div>

            {/* 1. POL / REC CALCULATOR */}
            {surveyAssistTab === 'polrec' && (
              <div className="space-y-4 pt-1">
                {/* Pol Section */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Pol(ΔE, ΔN) → ระยะทาง &amp; มุม Azimuth</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block font-mono font-medium mb-1">ΔE (Departure m)</label>
                      <input
                        type="number"
                        value={polDe}
                        onChange={(e) => {
                          setPolDe(e.target.value);
                          calculatePol(e.target.value, polDn);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block font-mono font-medium mb-1">ΔN (Latitude m)</label>
                      <input
                        type="number"
                        value={polDn}
                        onChange={(e) => {
                          setPolDn(e.target.value);
                          calculatePol(polDe, e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>
                  {polResult && (
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans block">ระยะทาง (Distance):</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">{polResult.dist.toFixed(3)} m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans block">Azimuth (แบริ่ง):</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">{polResult.azDms}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rec Section */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Rec(Distance, Azimuth) → ΔE, ΔN</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block font-mono font-medium mb-1">ระยะทาง (Distance m)</label>
                      <input
                        type="number"
                        value={recDist}
                        onChange={(e) => {
                          setRecDist(e.target.value);
                          calculateRec(e.target.value, recAzDms);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block font-mono font-medium mb-1">Azimuth (DD หรือ DMS)</label>
                      <input
                        type="text"
                        value={recAzDms}
                        onChange={(e) => {
                          setRecAzDms(e.target.value);
                          calculateRec(recDist, e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>
                  {recResult && (
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-blue-800 dark:text-blue-300 font-sans block">ΔE (Departure):</span>
                        <span className="font-bold text-blue-900 dark:text-blue-200">{recResult.de >= 0 ? '+' : ''}{recResult.de.toFixed(3)} m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-800 dark:text-blue-300 font-sans block">ΔN (Latitude):</span>
                        <span className="font-bold text-blue-900 dark:text-blue-200">{recResult.dn >= 0 ? '+' : ''}{recResult.dn.toFixed(3)} m</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. DMS ↔ DECIMAL DEGREES CONVERTER */}
            {surveyAssistTab === 'dms' && (
              <div className="space-y-4 pt-1">
                {/* DMS to DD */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    1. แปลง องศา-ลิปดา-ฟิลิปดา (DMS) → ทศนิยม (DD)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">องศา (Deg °)</span>
                      <input
                        type="number"
                        value={dmsDeg}
                        onChange={(e) => {
                          setDmsDeg(e.target.value);
                          const d = parseFloat(e.target.value) || 0;
                          const m = parseFloat(dmsMin) || 0;
                          const s = parseFloat(dmsSec) || 0;
                          setDmsToDdResult(dmsToDecimal(d, m, s));
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">ลิปดา (Min ')</span>
                      <input
                        type="number"
                        value={dmsMin}
                        onChange={(e) => {
                          setDmsMin(e.target.value);
                          const d = parseFloat(dmsDeg) || 0;
                          const m = parseFloat(e.target.value) || 0;
                          const s = parseFloat(dmsSec) || 0;
                          setDmsToDdResult(dmsToDecimal(d, m, s));
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">ฟิลิปดา (Sec ")</span>
                      <input
                        type="number"
                        value={dmsSec}
                        onChange={(e) => {
                          setDmsSec(e.target.value);
                          const d = parseFloat(dmsDeg) || 0;
                          const m = parseFloat(dmsMin) || 0;
                          const s = parseFloat(e.target.value) || 0;
                          setDmsToDdResult(dmsToDecimal(d, m, s));
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-mono flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300 font-sans">ทศนิยม (Decimal Degrees):</span>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      {dmsToDdResult !== null ? `${dmsToDdResult.toFixed(7)}°` : `${dmsToDecimal(parseFloat(dmsDeg)||0, parseFloat(dmsMin)||0, parseFloat(dmsSec)||0).toFixed(7)}°`}
                    </span>
                  </div>
                </div>

                {/* DD to DMS */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    2. แปลง ทศนิยม (DD) → องศา-ลิปดา-ฟิลิปดา (DMS)
                  </span>
                  <div>
                    <input
                      type="number"
                      step="0.000001"
                      value={ddInput}
                      onChange={(e) => {
                        setDdInput(e.target.value);
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) {
                          const d = decimalToDms(num, true);
                          setDdToDmsResult(`${d.deg}° ${d.min}' ${d.sec.toFixed(2)}"`);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                      placeholder="ใส่ค่าทศนิยม เช่น 13.846639"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs font-mono flex items-center justify-between">
                    <span className="text-blue-700 dark:text-blue-300 font-sans">DMS Format:</span>
                    <span className="font-bold text-blue-900 dark:text-blue-200">
                      {ddToDmsResult || (() => {
                        const d = decimalToDms(parseFloat(ddInput) || 0, true);
                        return `${d.deg}° ${d.min}' ${d.sec.toFixed(2)}"`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SURVEY SHORTCUT CORRECTIONS */}
            {surveyAssistTab === 'corrections' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    1. ผลแก้ความโค้งผิวโลกและการหักเหแสง (Curvature &amp; Refraction)
                  </span>
                  <div className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    c = 0.0675 × D_km² (m)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    สำหรับงานรังวัดระดับระยะไกลเพื่อลดความคลาดเคลื่อนจากความโค้งของโลก
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    2. แปลงระยะเอียงเป็นระยะราบ (Slope to Horizontal)
                  </span>
                  <div className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    H = S × cos(α) หรือ H = √(S² - Δh²)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    เมื่อ S คือระยะเอียงทางสายตา และ α คือมุมดิ่ง (Zenith / Vertical angle)
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    3. การแก้ระยะเข้าสู่เส้นโครงแผนที่กริด (Grid Scale Factor)
                  </span>
                  <div className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    S_grid = S_ground × k_point
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    UTM Scale factor ที่เส้นเมริเดียนกลาง k₀ = 0.9996
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Calculation History Log Tape */}
          {showHistory && (
            <div 
              className="p-4 rounded-2xl border shadow-sm space-y-2.5 max-h-72 overflow-y-auto anim-spring-down"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  <span>สมุดประวัติการคำนวณ (Calculation Tape)</span>
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="text-[10px] text-slate-400 hover:text-rose-500 transition"
                  >
                    ล้างประวัติ
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-mono">
                  ยังไม่มีประวัติการคำนวณ
                </div>
              ) : (
                <div className="space-y-1.5 font-mono text-xs">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setExpression(item.expression);
                        setResult(item.result);
                        setDmsResult(item.dmsResult || null);
                      }}
                      className="p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="truncate max-w-[200px]">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{item.expression} =</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.result}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
