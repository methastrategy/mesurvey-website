import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Copy, Check, Lightbulb, Sparkles, Filter, Layers } from 'lucide-react';
import { CIVIL_SURVEY_GLOSSARY, GlossaryItem, GlossaryCategory } from '../../data/site-knowledge';

export const GlossaryView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => [
    { id: 'all', label: 'ทั้งหมด', count: CIVIL_SURVEY_GLOSSARY.length },
    { id: 'earthwork', label: 'งานดิน', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'earthwork').length },
    { id: 'foundation', label: 'ฐานราก & เสาเข็ม', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'foundation').length },
    { id: 'concrete', label: 'คอนกรีต & แบบหล่อ', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'concrete').length },
    { id: 'rebar', label: 'เหล็กเสริม', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'rebar').length },
    { id: 'survey', label: 'งานสำรวจ', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'survey').length },
    { id: 'masonry', label: 'ก่ออิฐฉาบปูน', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'masonry').length },
    { id: 'finishing', label: 'สถาปัตย์ & ผิว', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'finishing').length },
    { id: 'plumbing', label: 'สุขาภิบาล & ท่อ', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'plumbing').length },
    { id: 'electrical', label: 'ระบบไฟฟ้า', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'electrical').length },
    { id: 'road', label: 'งานทาง & ถนน', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'road').length },
    { id: 'contract', label: 'สัญญา & บริหาร', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'contract').length },
    { id: 'legal', label: 'กฎหมายอาคาร', count: CIVIL_SURVEY_GLOSSARY.filter(i => i.category === 'legal').length },
  ], []);

  const filteredItems = useMemo(() => {
    return CIVIL_SURVEY_GLOSSARY.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = search.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch =
        item.termEn.toLowerCase().includes(q) ||
        item.termTh.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.fieldUsage.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleCopy = (item: GlossaryItem) => {
    const text = `${item.termEn} (${item.termTh})\nหมวดหมู่: ${item.categoryLabel}\n\nคำจำกัดความ:\n${item.definition}\n\nข้อแนะนำหน้างาน (Field Tip):\n${item.fieldUsage}`;
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
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] font-semibold">
              ENGINEERING DICTIONARY • คลังศัพท์ 2 ภาษา
            </span>
            <span className="text-xs text-[var(--text-3)] font-mono">12 หมวดหมู่งานก่อสร้างและสำรวจ</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-1)] mt-1">
            พจนานุกรมศัพท์ช่าง & วิศวกรรมสำรวจ (Bilingual Technical Glossary)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5 max-w-3xl">
            รวม 262 คำศัพท์เทคนิควิศวกรรมโยธา งานสำรวจ งานโครงสร้าง และงานระบบ พร้อมคำแปลภาษาไทยและข้อแนะนำการใช้งานจริงหน้างาน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <span className="text-[10px] text-[var(--text-3)] font-mono block">คลังศัพท์มาตรฐาน</span>
            <span className="text-xs font-bold text-[var(--accent)] font-mono">262 คำศัพท์ครบถ้วน</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="fusion-card p-3 sm:p-4 space-y-3">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาคำศัพท์ภาษาไทย หรือ English (เช่น Invert Level, Lap Length, Backfill, Two-Peg)..."
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
              {filteredItems.length} คำ
            </span>
          </div>
        </div>

        {/* 12 Category Filter Pills */}
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

      {/* ── Cards Grid ── */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className="fusion-card group p-5 flex flex-col justify-between h-full border hover:border-[var(--accent)] transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Top Meta: Category badge & Copy Button */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)]">
                      {item.categoryLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      title="คัดลอกคำศัพท์และคำจำกัดความ"
                      className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Terms Header */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                      {item.termEn}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--accent)] mt-0.5">
                      {item.termTh}
                    </p>
                  </div>

                  {/* Definition */}
                  <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                    {item.definition}
                  </p>
                </div>

                {/* Field Usage Pro-Tip Box */}
                <div className="mt-4 pt-3 border-t border-[var(--border)]">
                  <div className="p-2.5 rounded-xl bg-[var(--surface-2)]/80 border border-[var(--border)] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-1)]">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>ข้อแนะนำหน้างาน (Field Pro-Tip)</span>
                    </div>
                    <p className="text-xs text-[var(--text-2)] leading-relaxed pl-5">
                      {item.fieldUsage}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="fusion-card p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-[var(--text-3)] opacity-50" />
          <h3 className="text-base font-bold text-[var(--text-1)]">ไม่พบคำศัพท์ที่ตรงกับการค้นหา</h3>
          <p className="text-xs text-[var(--text-3)] max-w-md mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือคลิกเลือกหมวดหมู่ "ทั้งหมด" เพื่อดูคำศัพท์วิศวกรรมทั้ง 262 รายการ
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setActiveCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black dark:text-white text-xs font-semibold"
          >
            รีเซ็ตการค้นหา
          </button>
        </div>
      )}
    </div>
  );
};

export default GlossaryView;
