import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Wrench, 
  HelpCircle, 
  Copy, 
  Check, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { FIELD_TROUBLESHOOTING_ITEMS, TroubleshootingItem } from '../../data/site-knowledge';
import { useI18n, getLocalizedTitle, cleanParenthesizedTitle } from '../../core/i18n';

export const TroubleshootingView: React.FC = () => {
  const { language } = useI18n();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => [
    { id: 'all', label: 'ทั้งหมด', count: FIELD_TROUBLESHOOTING_ITEMS.length },
    { id: 'gnss', label: 'GNSS RTK', count: FIELD_TROUBLESHOOTING_ITEMS.filter(i => i.category === 'gnss').length },
    { id: 'leveling', label: 'งานระดับ', count: FIELD_TROUBLESHOOTING_ITEMS.filter(i => i.category === 'leveling').length },
    { id: 'traverse', label: 'งานวงรอบ & สกัดย้อน', count: FIELD_TROUBLESHOOTING_ITEMS.filter(i => i.category === 'traverse').length },
    { id: 'cadastral', label: 'แนวเขตที่ดิน', count: FIELD_TROUBLESHOOTING_ITEMS.filter(i => i.category === 'cadastral').length },
    { id: 'construction', label: 'โครงสร้าง & เข็ม', count: FIELD_TROUBLESHOOTING_ITEMS.filter(i => i.category === 'construction').length },
  ], []);

  const filteredItems = useMemo(() => {
    return FIELD_TROUBLESHOOTING_ITEMS.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = search.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.symptom.toLowerCase().includes(q) ||
        item.prevention.toLowerCase().includes(q) ||
        item.rootCauses.some(r => r.toLowerCase().includes(q)) ||
        item.actionSteps.some(a => a.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleCopy = (item: TroubleshootingItem) => {
    const text = `[กู้วิกฤตหน้างาน] ${item.title}\nหมวดหมู่: ${item.categoryLabel}\n\nอาการผิดปกติ:\n${item.symptom}\n\nสาเหตุที่เป็นไปได้:\n${item.rootCauses.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nวิธีตรวจเช็คหน้างาน:\n${item.fieldDiagnostics.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nการแก้ปัญหาเฉพาะหน้า:\n${item.actionSteps.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nวิธีป้องกันระยะยาว:\n${item.prevention}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-header Banner ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
              FIELD CRISIS RESOLUTION • แผนกู้วิกฤตสนาม
            </span>
            <span className="text-xs text-[var(--text-3)] font-mono">คู่มือตรวจวินิจฉัยด่วน</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-1)] mt-1">
            กู้วิกฤตหน้างาน & ตรวจแก้ปัญหาเฉพาะหน้า (Field Troubleshooting)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5 max-w-3xl">
            คู่มือวินิจฉัยสาเหตุ ขั้นตอนตรวจเช็ค และวิธีแก้ปัญหาเฉพาะหน้าทันทีเมื่ออุปกรณ์สำรวจหรือผลการรังวัดหลุดเกณฑ์มาตรฐาน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <span className="text-[10px] text-[var(--text-3)] font-mono block">สถานะความพร้อม</span>
            <span className="text-xs font-bold text-emerald-500 font-mono">100% พร้อมใช้งานออฟไลน์</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="fusion-card p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาอาการผิดปกติ (เช่น Float, Two-Peg, Misclosure, เสาเข็มหนีศูนย์, สกัดย้อน)..."
            className="w-full min-h-[44px] pl-10 pr-24 sm:pr-32 py-2 rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] placeholder-[var(--text-3)] text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-2 py-1 rounded text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text-1)] bg-[var(--surface)] border border-[var(--border)] transition-colors"
              >
                ล้าง
              </button>
            )}
            <span className="hidden xs:inline-block px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono tabular-nums text-[var(--text-2)]">
              {filteredItems.length} กรณี
            </span>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-[var(--border)]">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`group min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)] shadow-sm'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--text-1)]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isSelected
                      ? 'bg-black/15 dark:bg-white/20 text-current'
                      : 'bg-[var(--surface)] text-[var(--text-3)] border border-[var(--border)]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Troubleshooting Cards List ── */}
      <div className="space-y-5">
        {filteredItems.map((item) => {
          const isCopied = copiedId === item.id;
          return (
            <div
              key={item.id}
              className="fusion-card p-5 sm:p-6 space-y-5 border hover:border-[var(--accent)] transition-all duration-200"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)]">
                      {item.categoryLabel}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-3)]">
                      ID: {item.id}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-1)] leading-snug">
                    {getLocalizedTitle(item.id, item.title, undefined, language)}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface)] text-xs text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกวิธีแก้</span>
                    </>
                  )}
                </button>
              </div>

              {/* Symptom Callout (Red / Amber) */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-[var(--text-1)] space-y-1">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>อาการผิดปกติที่สังเกตได้ในสนาม (Field Symptom):</span>
                </div>
                <p className="leading-relaxed pl-6 text-[var(--text-2)]">
                  {item.symptom}
                </p>
              </div>

              {/* 2-Col Diagnostics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Root Causes */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-1)]">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>สาเหตุที่เป็นไปได้ (Root Causes):</span>
                  </div>
                  <ul className="space-y-1.5 pl-2 text-[var(--text-2)]">
                    {item.rootCauses.map((rc, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="leading-relaxed">{rc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Field Diagnostics */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-1)]">
                    <Activity className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>วิธีตรวจเช็คหน้างาน (Field Diagnostics):</span>
                  </div>
                  <ul className="space-y-1.5 pl-2 text-[var(--text-2)]">
                    {item.fieldDiagnostics.map((diag, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-mono text-[10px] px-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-3)] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{diag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Steps (Immediate Fix) */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>การแก้ปัญหาเฉพาะหน้าทันที (Immediate Action Steps):</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {item.actionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--text-1)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention / Best Practice */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] flex items-start gap-2 text-xs text-[var(--text-2)]">
                <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--text-1)]">วิธีป้องกันไม่ให้เกิดซ้ำ: </span>
                  <span>{item.prevention}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TroubleshootingView;
