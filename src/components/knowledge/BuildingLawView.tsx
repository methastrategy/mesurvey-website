import React, { useState, useMemo } from 'react';
import { Scale, Search, Info, ShieldAlert, CheckCircle2, ChevronRight, BookOpen, ShieldCheck } from 'lucide-react';
import { BUILDING_LAW_ITEMS, CONCRETE_COVERING_RULES, BuildingLawItem } from '../../data/site-knowledge';
import { useI18n, getLocalizedTitle, cleanParenthesizedTitle } from '../../core/i18n';

export const BuildingLawView: React.FC = () => {
  const { language } = useI18n();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'public-road', label: 'ถนนสาธารณะ' },
    { id: 'neighbor-boundary', label: 'แนวเขตเพื่อนบ้าน' },
    { id: 'structure-footing', label: 'ฐานรากชิดเขต' },
    { id: 'waterway', label: 'แหล่งน้ำสาธารณะ' },
    { id: 'concrete-covering', label: 'ระยะหุ้มคอนกรีต วสท.' },
  ];

  const filteredItems = useMemo(() => {
    if (activeCategory === 'concrete-covering') return [];
    return BUILDING_LAW_ITEMS.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = search.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch = 
        item.title.toLowerCase().includes(q) ||
        item.requirement.toLowerCase().includes(q) ||
        item.condition.toLowerCase().includes(q) ||
        item.fieldTips.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const filteredCovering = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'concrete-covering') return [];
    const q = search.toLowerCase().trim();
    if (!q) return CONCRETE_COVERING_RULES;
    return CONCRETE_COVERING_RULES.filter(item => 
      item.member.toLowerCase().includes(q) ||
      item.condition.toLowerCase().includes(q) ||
      item.standardClause.toLowerCase().includes(q) ||
      item.fieldTips.toLowerCase().includes(q)
    );
  }, [search, activeCategory]);

  return (
    <div className="space-y-6">
      {/* ── Sub-header Banner ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] font-semibold">
              LAW-REGULATION • พ.ร.บ. ควบคุมอาคาร 2566
            </span>
            <span className="text-xs text-[var(--text-3)] font-mono">กฎกระทรวง ฉบับที่ 55 & ฉบับที่ 6</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-1)] mt-1">
            เกณฑ์ระยะร่นอาคาร & ระยะหุ้มคอนกรีต (Building Setback & Concrete Covering)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5 max-w-3xl">
            สรุปข้อกฎหมายควบคุมอาคารสำคัญสำหรับวิศวกรสำรวจและโยธา: ระยะร่นกึ่งกลางถนน แนวเขตเพื่อนบ้าน ข้อห้ามฐานรากล้ำเขต และระยะหุ้มเหล็ก วสท.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <span className="text-[10px] text-[var(--text-3)] font-mono block">มาตราฐานความปลอดภัย</span>
            <span className="text-xs font-bold text-[var(--accent)] font-mono">100% สอดคล้องกฎหมาย</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                activeCategory === c.id
                  ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-3)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาข้อกฎหมาย หรือระยะร่น..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* ── Cards Grid: Building Setbacks ── */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className="fusion-card p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Category & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)]">
                    {item.categoryLabel}
                  </span>
                  <span className="text-[10px] text-[var(--text-3)] font-mono truncate max-w-[200px]">
                    {item.legalClause}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-[var(--text-1)] leading-snug">
                  {getLocalizedTitle(item.id, item.title, undefined, language)}
                </h3>

                {/* Condition */}
                <div className="text-xs text-[var(--text-2)] bg-[var(--surface-2)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="font-semibold text-[var(--text-1)]">เงื่อนไข: </span>
                  {item.condition}
                </div>

                {/* Requirement (Highlight) */}
                <div className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--accent)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>ข้อกำหนดระยะร่น:</span>
                  </span>
                  <p className="text-xs font-semibold text-[var(--text-1)] leading-relaxed">
                    {item.requirement}
                  </p>
                </div>

                {/* Penalty / Risk Warning */}
                <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong className="font-semibold">ความเสี่ยงหากฝ่าฝืน:</strong> {item.penaltyOrRisk}</span>
                </div>
              </div>

              {/* Field Surveyor Tips Footer */}
              <div className="pt-3 border-t border-[var(--border)] mt-2">
                <div className="flex items-start gap-2 text-xs text-[var(--text-3)] bg-[var(--surface-2)] p-2 rounded-lg border border-[var(--border)]">
                  <Info className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-2)] font-semibold">ข้อแนะนำช่างสำรวจ:</strong> {item.fieldTips}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Concrete Covering Cards ── */}
      {filteredCovering.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-1)]">
              ข้อกำหนดระยะหุ้มคอนกรีตมาตรฐาน (วสท. 1007-34 / กฎกระทรวง ฉบับที่ 6)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCovering.map(item => (
              <div
                key={item.id}
                className="fusion-card p-4 space-y-3 border hover:border-[var(--accent)] transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-3)]">
                      {item.standardClause}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]">
                      {item.minCoveringCm} ซม.
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--text-1)]">
                    {item.member}
                  </h4>
                  <p className="text-xs text-[var(--text-2)]">
                    {item.condition}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-3)]">
                  <strong className="text-[var(--text-2)]">ข้อแนะนำ: </strong>{item.fieldTips}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingLawView;
