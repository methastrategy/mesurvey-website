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
    <div className="fixed inset-0 z-[2000] bg-black/75 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md p-6 relative"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--card-radius)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่างนำเข้าข้อมูล"
          className="btn-outline absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <h3
          className="font-bold text-base flex items-center gap-2 mb-1"
          style={{ color: 'var(--text-1)' }}
        >
          <FileCode className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          นำเข้าข้อมูลเชิงพื้นที่ (Import Spatial Data)
        </h3>
        <p className="text-xs mb-4 leading-normal" style={{ color: 'var(--text-2)' }}>
          รองรับไฟล์เวกเตอร์ GeoJSON มาตรฐาน RFC 7946 (WGS84 EPSG:4326) เพื่อแสดงผลขอบเขตแปลงที่ดิน แนวกึ่งกลางคลอง หรือหมุดสำรวจบนแผนที่
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {warningMsg && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
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
          className="border border-dashed rounded-lg p-8 text-center transition-colors relative"
          style={{
            backgroundColor: dragActive ? 'var(--surface-2)' : 'transparent',
            borderColor: dragActive ? 'var(--accent)' : 'var(--border)'
          }}
        >
          <Upload
            className="w-10 h-10 mx-auto mb-2.5 stroke-[1.8]"
            style={{ color: 'var(--accent)' }}
          />
          <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            ลากและวางไฟล์ GeoJSON ลงที่นี่
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ (.geojson, .json)
          </p>

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
            className="btn-outline min-h-[44px] min-w-[44px] px-5 py-2.5 font-medium text-xs flex items-center justify-center"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
