import React, { useState } from 'react';
import { Upload, X, FileCode, AlertCircle, AlertTriangle } from 'lucide-react';
import { validateGeoJsonRFC7946 } from '../../core/geojson-validator';

interface GeoJsonUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onGeoJsonLoaded: (data: any, fileName: string) => void;
}

export const GeoJsonUploader: React.FC<GeoJsonUploaderProps> = ({
  isOpen,
  onClose,
  onGeoJsonLoaded
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    setWarningMsg(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          setErrorMsg('โครงสร้างไฟล์ผิดพลาด: ไฟล์ต้องเป็น JSON ที่ถูกต้องตามหลักไวยากรณ์ (JSON Syntax Error)');
          return;
        }

        const validation = validateGeoJsonRFC7946(parsed);
        if (!validation.isValid) {
          setErrorMsg(validation.error || 'ไฟล์ไม่ตรงตามมาตรฐาน RFC 7946 GeoJSON');
          return;
        }

        if (validation.warning) {
          setWarningMsg(validation.warning);
        }

        onGeoJsonLoaded(parsed, file.name);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์');
      }
    };

    reader.onerror = () => {
      setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์จากดิสก์');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 relative">
        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่างนำเข้าข้อมูล"
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <FileCode className="w-5 h-5 text-survey-600 dark:text-survey-400" />
          นำเข้าข้อมูลเชิงพื้นที่ (Import Spatial Data)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-normal">
          รองรับไฟล์เวกเตอร์ GeoJSON มาตรฐาน RFC 7946 (WGS84 EPSG:4326) เพื่อแสดงผลขอบเขตแปลงที่ดิน แนวกึ่งกลางคลอง หรือหมุดสำรวจบนแผนที่
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {warningMsg && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{warningMsg}</span>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? 'border-survey-500 bg-survey-50/50 dark:bg-survey-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-survey-500'
          }`}
        >
          <Upload className="w-10 h-10 text-survey-600 dark:text-survey-400 mx-auto mb-2.5 stroke-[1.8]" />
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            ลากและวางไฟล์ GeoJSON ลงที่นี่
          </p>
          <p className="text-xs text-slate-400 mt-1">หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ (.geojson, .json)</p>

          <input
            type="file"
            accept=".geojson,.json"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 transition-colors flex items-center justify-center"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
