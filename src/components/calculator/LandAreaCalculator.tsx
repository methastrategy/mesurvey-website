import React, { useState } from 'react';
import { sqMetersToThaiLand, thaiLandToSqMeters, formatThaiLandString } from '../../core/land-units';
import { Layers, ArrowRightLeft, DollarSign } from 'lucide-react';

export const LandAreaCalculator: React.FC = () => {
  const [sqMetersInput, setSqMetersInput] = useState<string>('3450');

  const [raiInput, setRaiInput] = useState<string>('2');
  const [nganInput, setNganInput] = useState<string>('0');
  const [wahInput, setWahInput] = useState<string>('62.5');

  const [pricePerWah, setPricePerWah] = useState<string>('25000');

  // Sync state
  const [currentM2, setCurrentM2] = useState<number>(3450);

  const handleUpdateM2 = (val: string) => {
    setSqMetersInput(val);
    const m2 = parseFloat(val) || 0;
    setCurrentM2(m2);
    const t = sqMetersToThaiLand(m2);
    setRaiInput(t.rai.toString());
    setNganInput(t.ngan.toString());
    setWahInput(t.wah.toString());
  };

  const handleUpdateThai = (r: string, n: string, w: string) => {
    setRaiInput(r);
    setNganInput(n);
    setWahInput(w);
    const m2 = thaiLandToSqMeters(parseFloat(r) || 0, parseFloat(n) || 0, parseFloat(w) || 0);
    setCurrentM2(m2);
    setSqMetersInput(m2.toString());
  };

  const result = sqMetersToThaiLand(currentM2);
  const totalWah = currentM2 / 4;
  const unitPrice = parseFloat(pricePerWah) || 0;
  const estimatedTotalPrice = totalWah * unitPrice;

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          ระบบคำนวณและแปลงหน่วยที่ดินไทย (Thai Land & Cadastral Area Unit Converter)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          แปลงหน่วยระหว่างตารางเมตร เฮกตาร์ และหน่วยทางการตามโฉนดที่ดินไทย (1 ไร่ = 4 งาน = 400 ตร.ว. = 1,600 ตร.ม.)
        </p>
      </div>

      {/* Two Column Input Converter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Metric Input Card */}
        <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-[#27272a]">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              หน่วยสากล (Metric Units)
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              พื้นที่เป็นตารางเมตร (Square Meters - m²)
            </label>
            <input
              type="number"
              step="0.01"
              aria-label="พื้นที่เป็นตารางเมตร (Square Meters)"
              value={sqMetersInput}
              onChange={(e) => handleUpdateM2(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
              <span className="text-slate-400 block mb-0.5">เฮกตาร์ (Hectare):</span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {result.hectares.toLocaleString()} ha
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
              <span className="text-slate-400 block mb-0.5">เอเคอร์ (Acre):</span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {result.acres.toLocaleString()} ac
              </span>
            </div>
          </div>
        </div>

        {/* Thai Cadastral Input Card */}
        <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-[#27272a]">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              หน่วยโฉนดที่ดินไทย (Rai - Ngan - Wah)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ไร่ (Rai)
              </label>
              <input
                type="number"
                aria-label="ไร่ (Rai)"
                value={raiInput}
                onChange={(e) => handleUpdateThai(e.target.value, nganInput, wahInput)}
                className="w-full min-h-[44px] px-2.5 sm:px-3 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                งาน (Ngan)
              </label>
              <input
                type="number"
                min="0"
                max="3"
                aria-label="งาน (Ngan)"
                value={nganInput}
                onChange={(e) => handleUpdateThai(raiInput, e.target.value, wahInput)}
                className="w-full min-h-[44px] px-2.5 sm:px-3 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ตารางวา (Wah²)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="99.99"
                aria-label="ตารางวา (Wah)"
                value={wahInput}
                onChange={(e) => handleUpdateThai(raiInput, nganInput, e.target.value)}
                className="w-full min-h-[44px] px-2.5 sm:px-3 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20">
            <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">
              รูปแบบการเขียนตามโฉนดที่ดิน (Cadastral Format):
            </span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
              {formatThaiLandString(result.rai, result.ngan, result.wah)}
            </span>
          </div>
        </div>

      </div>

      {/* Cadastral Valuation Calculator */}
      <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] border-l-2 border-l-indigo-500 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border dark:border-[#27272a]">
          <div>
            <h4 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <DollarSign className="w-5 h-5 text-amber-500" />
              การประเมินราคาที่ดินเบื้องต้น (Land Valuation Estimator)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คำนวณมูลค่าที่ดินรวมจากราคาประเมินหรือราคาตลาดต่อตารางวา
            </p>
          </div>

          <div className="w-full sm:w-60">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ราคาประเมินต่อตารางวา (บาท/ตร.ว.)
            </label>
            <input
              type="number"
              aria-label="ราคาประเมินต่อตารางวา (บาท/ตร.ว.)"
              value={pricePerWah}
              onChange={(e) => setPricePerWah(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a] text-slate-900 dark:text-white font-mono tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono tabular-nums text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
            <span className="text-slate-400 block text-xs font-sans">จำนวนตารางวารวม:</span>
            <span className="font-bold text-base text-slate-900 dark:text-white">
              {totalWah.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ตร.ว.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
            <span className="text-slate-400 block text-xs font-sans">ราคาเฉลี่ยต่อไร่:</span>
            <span className="font-bold text-base text-amber-600 dark:text-amber-400">
              {(unitPrice * 400).toLocaleString('en-US')} บาท/ไร่
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 shadow-sm">
            <span className="text-slate-500 dark:text-slate-400 block text-xs font-sans">มูลค่ารวมโดยประมาณ:</span>
            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {estimatedTotalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
