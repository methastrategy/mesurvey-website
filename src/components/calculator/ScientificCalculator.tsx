import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  RotateCcw, 
  Copy, 
  Check, 
  History, 
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { decimalToDms } from '../../core/projections';

type AngleMode = 'DEG' | 'RAD' | 'GRAD';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  dmsResult?: string;
  timestamp: string;
}

interface ScientificCalculatorProps {
  onBackToDirectory?: () => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ onBackToDirectory }) => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [dmsResult, setDmsResult] = useState<string | null>(null);
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [lastAnswer, setLastAnswer] = useState<string>('0');
  const [isSecondFunction, setIsSecondFunction] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Lock scroll in both document body and html for total viewport freeze on mobile & desktop
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origDocOverflow;
    };
  }, []);

  // Safe Math Expression Evaluator
  const evaluateExpression = (expr: string): { val: number; str: string; dms?: string } => {
    let clean = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `${Math.PI}`)
      .replace(/Ans/g, `${parseFloat(lastAnswer) || 0}`)
      .replace(/e\b/g, `${Math.E}`);

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

    const rounded = Math.round(rawVal * 1e10) / 1e10;
    const str = rounded.toLocaleString('en-US', { maximumFractionDigits: 8 });

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

      const item: HistoryItem = {
        id: `calc-${Date.now()}`,
        expression,
        result: str,
        dmsResult: dms,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)] text-[var(--text-1)] select-none overflow-hidden touch-none">
      
      {/* ── Top Bar: Back to Directory + Title + Mode & History ── */}
      <header className="h-13 sm:h-14 px-3 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBackToDirectory && (
            <button
              type="button"
              onClick={onBackToDirectory}
              aria-label="กลับไปหน้ารวมเครื่องมือ"
              className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] flex items-center gap-1.5 text-xs font-semibold transition-colors micro-press focus-ring"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">เครื่องมือทั้งหมด</span>
              <span className="sm:hidden">กลับ</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[var(--text-1)]">
              เครื่องคิดเลขวิทยาศาสตร์
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Angle Mode Selector */}
          <button
            type="button"
            onClick={() => setAngleMode(m => m === 'DEG' ? 'RAD' : m === 'RAD' ? 'GRAD' : 'DEG')}
            aria-label="เปลี่ยนหน่วยมุม"
            className="min-h-[38px] px-2.5 py-1 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--accent)] transition-colors micro-press focus-ring flex items-center gap-1"
          >
            <span className="text-[10px] text-[var(--text-3)]">MODE:</span>
            <span>{angleMode}</span>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setShowHistory(h => !h)}
            aria-label="ดูประวัติการคำนวณ"
            className={`min-h-[38px] px-2.5 py-1 rounded-[var(--btn-radius)] border text-xs font-semibold transition-colors micro-press focus-ring flex items-center gap-1.5 ${
              showHistory
                ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                : 'bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border-[var(--border)]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{history.length}</span>
          </button>
        </div>
      </header>

      {/* ── Main Viewport: Calculator Chassis (Pure Single-Screen, No Scroll) ── */}
      <div className="flex-1 min-h-0 w-full max-w-xl mx-auto flex flex-col p-2 sm:p-4 overflow-hidden relative">
        
        {/* Natural 2-Line Screen Chassis */}
        <div 
          className="rounded-2xl p-3 sm:p-4 border shadow-inner flex flex-col justify-between shrink-0 mb-2 sm:mb-3"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border-strong)',
            minHeight: '84px',
            maxHeight: '120px'
          }}
        >
          {/* Meta line: Mode Indicator & Ans */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-3)] pb-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--accent)] font-bold text-[10px] border border-[var(--border)]">
                {angleMode}
              </span>
              {isSecondFunction && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold text-[10px] border border-amber-500/30">
                  SHIFT
                </span>
              )}
            </div>
            <div className="text-[11px] truncate max-w-[140px]">
              Ans: <span className="text-[var(--text-2)] font-semibold">{lastAnswer}</span>
            </div>
          </div>

          {/* Formula Line */}
          <div className="text-right font-mono text-xs sm:text-sm text-[var(--text-2)] overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 tracking-wide">
            {expression || <span className="opacity-40">0</span>}
          </div>

          {/* Result Line */}
          <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-[var(--border)]">
            <div className="text-left font-mono text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 truncate">
              {dmsResult && <span>📐 {dmsResult}</span>}
            </div>
            
            <div className="flex items-baseline gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.replace(/,/g, ''));
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 1200);
                }}
                className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                title="คัดลอกคำตอบ"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <div className="text-right font-mono text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-1)] tracking-tight">
                {result}
              </div>
            </div>
          </div>
        </div>

        {/* ── Keypad Grid: Full-Stretch to Fill Screen Exactly ── */}
        <div className="flex-1 min-h-0 flex flex-col gap-1 sm:gap-1.5">
          
          {/* Row 1: SHIFT, DMS, Parentheses, DEL */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 flex-1 min-h-0">
            <button
              type="button"
              onClick={() => setIsSecondFunction(s => !s)}
              className={`h-full min-h-[38px] rounded-xl text-xs font-bold font-mono transition-colors micro-press flex items-center justify-center border ${
                isSecondFunction
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                  : 'bg-[var(--surface-2)] text-amber-600 dark:text-amber-400 border-[var(--border)] hover:bg-[var(--surface-3)]'
              }`}
            >
              SHIFT
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('DMS_CONV')}
              className="h-full min-h-[38px] rounded-xl text-xs font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
              title="แปลงค่าเป็นองศา-ลิปดา-ฟิลิปดา (DMS)"
            >
              ° ' "
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('(')}
              className="h-full min-h-[38px] rounded-xl text-xs sm:text-sm font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              (
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress(')')}
              className="h-full min-h-[38px] rounded-xl text-xs sm:text-sm font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              )
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('DEL')}
              className="h-full min-h-[38px] rounded-xl text-xs font-bold font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 transition-colors micro-press flex items-center justify-center"
            >
              DEL
            </button>
          </div>

          {/* Row 2: Trig Functions & AC */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 flex-1 min-h-0">
            <button
              type="button"
              onClick={() => handleKeyPress(isSecondFunction ? 'asin(' : 'sin(')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              {isSecondFunction ? 'sin⁻¹' : 'sin'}
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress(isSecondFunction ? 'acos(' : 'cos(')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              {isSecondFunction ? 'cos⁻¹' : 'cos'}
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress(isSecondFunction ? 'atan(' : 'tan(')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              {isSecondFunction ? 'tan⁻¹' : 'tan'}
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('sqrt(')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              √
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('AC')}
              className="h-full min-h-[38px] rounded-xl text-xs font-extrabold font-mono bg-rose-600 hover:bg-rose-500 text-white shadow-xs border border-rose-500 transition-colors micro-press flex items-center justify-center"
            >
              AC
            </button>
          </div>

          {/* Row 3: Math powers & 7, 8, 9, ÷ */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 flex-1 min-h-0">
            <button
              type="button"
              onClick={() => handleKeyPress('^')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              xʸ
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('7')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('8')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('9')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('÷')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              ÷
            </button>
          </div>

          {/* Row 4: Log & 4, 5, 6, × */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 flex-1 min-h-0">
            <button
              type="button"
              onClick={() => handleKeyPress('log(')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              log
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('4')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('5')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('6')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('×')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Row 5: ln & 1, 2, 3, - */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 flex-1 min-h-0">
            <button
              type="button"
              onClick={() => handleKeyPress('ln(')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              ln
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('1')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('2')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('3')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('-')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              -
            </button>
          </div>

          {/* Row 6: π & 0, ., Ans, + */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 flex-1 min-h-0">
            <button
              type="button"
              onClick={() => handleKeyPress('π')}
              className="h-full min-h-[38px] rounded-xl text-xs font-semibold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              π
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('.')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center shadow-2xs"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('Ans')}
              className="h-full min-h-[38px] rounded-xl text-xs font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-amber-600 dark:text-amber-400 border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              Ans
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('+')}
              className="h-full min-h-[38px] rounded-xl text-base sm:text-lg font-bold font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] transition-colors micro-press flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* Bottom Execution Bar: Equal Button */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => handleKeyPress('=')}
              aria-label="คำนวณผลลัพธ์"
              className="w-full h-11 sm:h-12 rounded-xl text-xl font-black font-mono bg-[var(--accent)] text-[var(--accent-text)] shadow-md transition-all micro-press flex items-center justify-center border border-[var(--accent)]"
            >
              =
            </button>
          </div>

        </div>

      </div>

      {/* ── Slide-Over History Panel Modal ── */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-sm h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-bold text-sm text-[var(--text-1)]">ประวัติการคำนวณ</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="p-1.5 rounded text-[var(--text-3)] hover:text-rose-500 transition-colors"
                    title="ล้างประวัติทั้งหมด"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-[var(--surface-2)] text-[var(--text-1)] hover:bg-[var(--surface-3)]"
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--text-3)]">
                  ยังไม่มีประวัติการคำนวณ
                </div>
              ) : (
                history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setExpression(item.expression);
                      setResult(item.result);
                      if (item.dmsResult) setDmsResult(item.dmsResult);
                      setShowHistory(false);
                    }}
                    className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)] cursor-pointer transition-colors text-right space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-3)] font-mono">
                      <span>{item.timestamp}</span>
                      <span className="truncate max-w-[180px]">{item.expression}</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-[var(--text-1)]">
                      = {item.result}
                    </div>
                    {item.dmsResult && (
                      <div className="text-[10px] text-amber-500 font-mono">
                        📐 {item.dmsResult}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScientificCalculator;
