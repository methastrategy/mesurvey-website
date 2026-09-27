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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Layers className="w-5 h-5 text-survey-600 dark:text-survey-400" />
          ระบบคำนวณและแปลงหน่วยที่ดินไทย (Thai Land & Cadastral Area Unit Converter)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          แปลงหน่วยระหว่างตารางเมตร เฮกตาร์ และหน่วยทางการตามโฉนดที่ดินไทย (1 ไร่ = 4 งาน = 400 ตร.ว. = 1,600 ตร.ม.)
        </p>
      </div>

      {/* Two Column Input Converter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Metric Input Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
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
              value={sqMetersInput}
              onChange={(e) => handleUpdateM2(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-survey-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">เฮกตาร์ (Hectare):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {result.hectares.toLocaleString()} ha
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">เอเคอร์ (Acre):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {result.acres.toLocaleString()} ac
              </span>
            </div>
          </div>
        </div>

        {/* Thai Cadastral Input Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-survey-600 dark:text-survey-400 uppercase tracking-wider">
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
                value={raiInput}
                onChange={(e) => handleUpdateThai(e.target.value, nganInput, wahInput)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white"
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
                value={nganInput}
                onChange={(e) => handleUpdateThai(raiInput, e.target.value, wahInput)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white"
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
                value={wahInput}
                onChange={(e) => handleUpdateThai(raiInput, nganInput, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-survey-50/60 dark:bg-survey-950/40 border border-survey-200/60 dark:border-survey-800/60">
            <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">
              รูปแบบการเขียนตามโฉนดที่ดิน (Cadastral Format):
            </span>
            <span className="font-bold text-survey-800 dark:text-survey-200 text-sm">
              {formatThaiLandString(result.rai, result.ngan, result.wah)}
            </span>
          </div>
        </div>

      </div>

      {/* Cadastral Valuation Calculator */}
      <div className="bg-gradient-to-br from-survey-900 to-survey-950 rounded-3xl border border-survey-700/60 p-5 sm:p-6 text-white shadow-geo">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-survey-800">
          <div>
            <h4 className="font-bold text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              การประเมินราคาที่ดินเบื้องต้น (Land Valuation Estimator)
            </h4>
            <p className="text-xs text-survey-200/80 mt-0.5">
              คำนวณมูลค่าที่ดินรวมจากราคาประเมินหรือราคาตลาดต่อตารางวา
            </p>
          </div>

          <div className="w-full sm:w-60">
            <label className="text-[11px] font-semibold text-survey-200 block mb-1">
              ราคาประเมินต่อตารางวา (บาท/ตร.ว.)
            </label>
            <input
              type="number"
              value={pricePerWah}
              onChange={(e) => setPricePerWah(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-survey-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs sm:text-sm">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-survey-300 block text-[11px] font-sans">จำนวนตารางวารวม:</span>
            <span className="font-bold text-base">
              {totalWah.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ตร.ว.
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-survey-300 block text-[11px] font-sans">ราคาเฉลี่ยต่อไร่:</span>
            <span className="font-bold text-base text-amber-300">
              {(unitPrice * 400).toLocaleString('en-US')} บาท/ไร่
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 border border-survey-400/40">
            <span className="text-survey-300 block text-[11px] font-sans">มูลค่ารวมโดยประมาณ:</span>
            <span className="font-bold text-lg text-emerald-400">
              {estimatedTotalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
