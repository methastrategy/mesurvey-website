import React, { useState, useMemo } from 'react';
import { Scale, Search, Info, ShieldAlert, CheckCircle2, ChevronRight, BookOpen, ShieldCheck, Zap, Table, Check, AlertTriangle } from 'lucide-react';
import { BUILDING_LAW_ITEMS, CONCRETE_COVERING_RULES, BuildingLawItem } from '../../data/site-knowledge';
import { useI18n, getLocalizedTitle, cleanParenthesizedTitle } from '../../core/i18n';

type RoadWidthCategory = 'under-6' | '6-to-10' | '10-to-20' | 'over-20';
type BuildingHeightCategory = 'under-9' | '9-to-23' | 'over-23';
type WallTypeCategory = 'with-openings' | 'solid-wall' | 'solid-consent';

export const BuildingLawView: React.FC = () => {
  const { language } = useI18n();
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Interactive Matrix Filter States
  const [roadWidth, setRoadWidth] = useState<RoadWidthCategory>('6-to-10');
  const [bldgHeight, setBldgHeight] = useState<BuildingHeightCategory>('under-9');
  const [wallType, setWallType] = useState<WallTypeCategory>('with-openings');

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'public-road', label: 'ถนนสาธารณะ' },
    { id: 'neighbor-boundary', label: 'แนวเขตเพื่อนบ้าน' },
    { id: 'structure-footing', label: 'ฐานรากชิดเขต' },
    { id: 'waterway', label: 'แหล่งน้ำสาธารณะ' },
    { id: 'concrete-covering', label: 'ระยะหุ้มคอนกรีต วสท.' },
  ];

  // Calculate Instant Decision Rule
  const instantDecision = useMemo(() => {
    let roadSetback = '';
    let roadSetbackMeters = 0;
    let roadSetbackRef = 'กึ่งกลางถนน' as 'กึ่งกลางถนน' | 'แนวเขตถนน';
    let roadClause = '';

    if (roadWidth === 'under-6') {
      roadSetback = 'ร่นอย่างน้อย 3.00 ม. จากกึ่งกลางถนนสาธารณะ';
      roadSetbackMeters = 3.0;
      roadSetbackRef = 'กึ่งกลางถนน';
      roadClause = 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2543) ข้อ 41';
    } else if (roadWidth === '6-to-10') {
      if (bldgHeight === 'under-9') {
        roadSetback = 'ร่นอย่างน้อย 1.00 ม. จากแนวเขตถนนสาธารณะ';
        roadSetbackMeters = 1.0;
        roadSetbackRef = 'แนวเขตถนน';
        roadClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 41 (1)';
      } else {
        roadSetback = 'ร่นอย่างน้อย 2.00 ม. จากแนวเขตถนนสาธารณะ';
        roadSetbackMeters = 2.0;
        roadSetbackRef = 'แนวเขตถนน';
        roadClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 41 (2)';
      }
    } else if (roadWidth === '10-to-20') {
      roadSetback = 'ร่นอย่างน้อย 2.00 ม. จากแนวเขตถนนสาธารณะ';
      roadSetbackMeters = 2.0;
      roadSetbackRef = 'แนวเขตถนน';
      roadClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 41 (2)';
    } else {
      roadSetback = 'ร่นอย่างน้อย 2.00 ม. จากแนวเขตถนน (หรือระยะร่น 1:2 ของความสูงสำหรับอาคารสูง)';
      roadSetbackMeters = 2.0;
      roadSetbackRef = 'แนวเขตถนน';
      roadClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 41 (3)';
    }

    let neighborSetback = '';
    let neighborSetbackMeters = 0;
    let neighborClause = '';

    if (wallType === 'with-openings') {
      if (bldgHeight === 'under-9') {
        neighborSetback = 'ร่นอย่างน้อย 2.00 ม. จากแนวเขตที่ดินเพื่อนบ้าน';
        neighborSetbackMeters = 2.0;
        neighborClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 50 (1) [มีหน้าต่าง/ระเบียง/ช่องเปิด]';
      } else {
        neighborSetback = 'ร่นอย่างน้อย 3.00 ม. จากแนวเขตที่ดินเพื่อนบ้าน';
        neighborSetbackMeters = 3.0;
        neighborClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 50 (2) [สูงเกิน 9 ม. แต่ไม่เกิน 23 ม.]';
      }
    } else if (wallType === 'solid-wall') {
      neighborSetback = 'ร่นอย่างน้อย 0.50 ม. จากแนวเขตที่ดินเพื่อนบ้าน (ผนังทึบไม่มีช่องเปิด)';
      neighborSetbackMeters = 0.5;
      neighborClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 50 (3)';
    } else {
      neighborSetback = 'ก่อสร้างชิดแนวเขตได้ 0.00 ม. (ผนังทึบ + หนังสือยินยอมชิดเขต สูงไม่เกิน 15 ม.)';
      neighborSetbackMeters = 0.0;
      neighborClause = 'กฎกระทรวง ฉบับที่ 55 ข้อ 50 วรรคสาม [ความยินยอมเจ้าของที่ดินข้างเคียง]';
    }

    return {
      roadSetback,
      roadSetbackMeters,
      roadSetbackRef,
      roadClause,
      neighborSetback,
      neighborSetbackMeters,
      neighborClause
    };
  }, [roadWidth, bldgHeight, wallType]);

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

      {/* ── Mode Switcher & Filter Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ตารางสรุปด่วน 5 วินาที (Quick Matrix)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ข้อกำหนดฉบับเต็ม (Full Cards)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
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

      {/* ── QUICK SETBACK DECISION MATRIX (MODE: MATRIX) ── */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          {/* Interactive Decision Cockpit */}
          <div className="fusion-card p-5 sm:p-6 space-y-5 border-2 border-[var(--accent)]/30">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-1)]">
                    ระบบคำนวณและชี้ขาดระยะร่นหน้างาน 5 วินาที (Instant Setback Cockpit)
                  </h3>
                  <p className="text-xs text-[var(--text-3)]">
                    เลือกเงื่อนไขสภาพถนน ความสูงอาคาร และผนังข้างเคียง เพื่อคำนวณระยะร่นขั้นต่ำตามกฎหมายทันที
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                กฎกระทรวง ฉบับที่ 55
              </span>
            </div>

            {/* 3 Param Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Road Width */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-2)] flex items-center gap-1.5">
                  <span>1. ความกว้างถนนสาธารณะ (Road Width):</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'under-6', label: '< 6.00 ม. (ซอยแคบ)' },
                    { id: '6-to-10', label: '6.00 – 10.00 ม.' },
                    { id: '10-to-20', label: '10.00 – 20.00 ม.' },
                    { id: 'over-20', label: '≥ 20.00 ม. (ถนนใหญ่)' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRoadWidth(opt.id as RoadWidthCategory)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition text-left cursor-pointer ${
                        roadWidth === opt.id
                          ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]'
                          : 'bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Building Height */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-2)] flex items-center gap-1.5">
                  <span>2. ความสูงอาคาร (Building Height):</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  {[
                    { id: 'under-9', label: '≤ 9.00 ม. (ไม่เกิน 3 ชั้น / บ้านพักอาศัย)' },
                    { id: '9-to-23', label: '9.00 – 23.00 ม. (อาคารพาณิชย์/ตึกแถว)' },
                    { id: 'over-23', label: '> 23.00 ม. (อาคารสูง / อาคารขนาดใหญ่พิเศษ)' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBldgHeight(opt.id as BuildingHeightCategory)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition text-left cursor-pointer ${
                        bldgHeight === opt.id
                          ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]'
                          : 'bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wall Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-2)] flex items-center gap-1.5">
                  <span>3. ผนังชิดเขตที่ดินข้างเคียง (Neighbor Boundary):</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  {[
                    { id: 'with-openings', label: 'มีช่องเปิด / หน้าต่าง / ประตู / ระเบียง' },
                    { id: 'solid-wall', label: 'ผนังทึบ (ไม่มีช่องเปิด / มีแต่บล็อกแก้ว)' },
                    { id: 'solid-consent', label: 'ผนังทึบ + หนังสือยินยอมชิดเขต (≤ 15 ม.)' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setWallType(opt.id as WallTypeCategory)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition text-left cursor-pointer ${
                        wallType === opt.id
                          ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]'
                          : 'bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant Decision Result Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Road Setback Result Card */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border-2 border-[var(--accent)]/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-2)]">🚗 ระยะร่นจากถนนสาธารณะ</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)]">
                    อ้างอิง: {instantDecision.roadSetbackRef}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-[var(--accent)]">
                    ≥ {instantDecision.roadSetbackMeters.toFixed(2)} ม.
                  </span>
                  <span className="text-xs text-[var(--text-2)]">
                    (วัดจาก{instantDecision.roadSetbackRef})
                  </span>
                </div>
                <p className="text-xs text-[var(--text-1)] font-medium leading-relaxed">
                  {instantDecision.roadSetback}
                </p>
                <div className="text-[11px] font-mono text-[var(--text-3)] pt-1 border-t border-[var(--border)]">
                  {instantDecision.roadClause}
                </div>
              </div>

              {/* Neighbor Boundary Result Card */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border-2 border-[var(--accent)]/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-2)]">🏡 ระยะร่นจากแนวเขตเพื่อนบ้าน</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)]">
                    แนวรั้ว / โฉนด
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-[var(--accent)]">
                    ≥ {instantDecision.neighborSetbackMeters.toFixed(2)} ม.
                  </span>
                  <span className="text-xs text-[var(--text-2)]">
                    {instantDecision.neighborSetbackMeters === 0 ? '(สร้างชิดเขตได้)' : '(ห้ามล้ำเด็ดขาด)'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-1)] font-medium leading-relaxed">
                  {instantDecision.neighborSetback}
                </p>
                <div className="text-[11px] font-mono text-[var(--text-3)] pt-1 border-t border-[var(--border)]">
                  {instantDecision.neighborClause}
                </div>
              </div>
            </div>

            {/* Survey Operational Alert */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="leading-relaxed">
                <span className="font-bold">คำเตือนงานวางผังหน้างาน (Staking Caution):</span> ระยะร่นตามกฎหมายคิดถึง <strong>ผิวนอกสุดของอาคารรวมปูนฉาบและระเบียง</strong> (รวมถึงชายคาที่ยื่นเกิน 0.50 ม.) และ <strong>ฐานรากใต้ดินทุกส่วนห้ามล้ำแนวเขตโฉนดแม้แต่ 1 มม.</strong> (ต้องใช้ฐานรากตีนเป็ด Strap Footing เท่านั้น)
              </div>
            </div>
          </div>

          {/* Master 5-Second Field Matrix Table */}
          <div className="fusion-card p-5 sm:p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-base font-bold text-[var(--text-1)]">
                  ตารางสรุปเกณฑ์ระยะร่น พ.ร.บ. ควบคุมอาคาร (Master Setback Reference Matrix)
                </h3>
              </div>
              <span className="text-xs text-[var(--text-3)] font-mono">ฉบับปรับปรุง 2566</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--text-2)] font-mono text-[11px]">
                    <th className="py-2.5 px-3">ประเภทแนวเขต / สภาพแวดล้อม</th>
                    <th className="py-2.5 px-3">ความกว้างเขตทาง / สภาพ</th>
                    <th className="py-2.5 px-3">ความสูงอาคาร</th>
                    <th className="py-2.5 px-3">ระยะร่นขั้นต่ำ</th>
                    <th className="py-2.5 px-3">จุดอ้างอิงการวัด</th>
                    <th className="py-2.5 px-3">มาตราอ้างอิง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3 font-semibold text-[var(--text-1)]" rowSpan={4}>ถนนสาธารณะ</td>
                    <td className="py-2.5 px-3">น้อยกว่า 6.00 ม. (ซอยแคบ)</td>
                    <td className="py-2.5 px-3">ทุกระดับความสูง</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 3.00 ม.</td>
                    <td className="py-2.5 px-3">กึ่งกลางถนนสาธารณะ</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 41</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3" rowSpan={2}>6.00 ถึง 10.00 ม.</td>
                    <td className="py-2.5 px-3">≤ 9.00 ม. (ไม่เกิน 3 ชั้น)</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 1.00 ม.</td>
                    <td className="py-2.5 px-3">แนวเขตถนน</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 41 (1)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3">&gt; 9.00 ม. (เกิน 3 ชั้น)</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 2.00 ม.</td>
                    <td className="py-2.5 px-3">แนวเขตถนน</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 41 (2)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3">10.00 ถึง 20.00 ม.</td>
                    <td className="py-2.5 px-3">ทุกระดับความสูง</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 2.00 ม.</td>
                    <td className="py-2.5 px-3">แนวเขตถนน</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 41 (2)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3 font-semibold text-[var(--text-1)]" rowSpan={3}>แนวเขตที่ดินเพื่อนบ้าน</td>
                    <td className="py-2.5 px-3">มีช่องเปิด / หน้าต่าง / ระเบียง</td>
                    <td className="py-2.5 px-3">≤ 9.00 ม.</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 2.00 ม.</td>
                    <td className="py-2.5 px-3">แนวเขตที่ดิน</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 50 (1)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3">มีช่องเปิด / หน้าต่าง / ระเบียง</td>
                    <td className="py-2.5 px-3">9.00 – 23.00 ม.</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 3.00 ม.</td>
                    <td className="py-2.5 px-3">แนวเขตที่ดิน</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 50 (2)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3">ผนังทึบ (ไม่มีช่องเปิด)</td>
                    <td className="py-2.5 px-3">ความสูงไม่เกิน 15.00 ม.</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 0.50 ม. (หรือ 0.00 ม. เมื่อยินยอม)</td>
                    <td className="py-2.5 px-3">แนวเขตที่ดิน</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 50 (3)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3 font-semibold text-[var(--text-1)]" rowSpan={3}>แหล่งน้ำสาธารณะ</td>
                    <td className="py-2.5 px-3">กว้างน้อยกว่า 10.00 ม.</td>
                    <td className="py-2.5 px-3">ทุกระดับความสูง</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 3.00 ม.</td>
                    <td className="py-2.5 px-3">แนวเขตแหล่งน้ำ</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 42 (1)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3">กว้างตั้งแต่ 10.00 ม. ขึ้นไป</td>
                    <td className="py-2.5 px-3">ทุกระดับความสูง</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 6.00 ม.</td>
                    <td className="py-2.5 px-3">แนวเขตแหล่งน้ำ</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 42 (2)</td>
                  </tr>
                  <tr className="hover:bg-[var(--surface-2)] transition">
                    <td className="py-2.5 px-3">ทะเล / บึง / ทะเลสาบ</td>
                    <td className="py-2.5 px-3">ทุกระดับความสูง</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">≥ 12.00 ม.</td>
                    <td className="py-2.5 px-3">แนวชายฝั่งทะเล</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-3)]">ข้อ 42 (3)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FULL CLAUSES CARD VIEW (MODE: CARDS) ── */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {/* Category filter pills for card view */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface)]'
                }`}
              >
                {c.label}
              </button>
            ))}
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
      )}
    </div>
  );
};

export default BuildingLawView;
