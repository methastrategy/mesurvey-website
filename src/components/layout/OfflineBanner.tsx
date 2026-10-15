import React from 'react';
import { WifiOff, Wifi, X, CheckCircle2, HardDrive } from 'lucide-react';
import type { NetworkStatus } from '../../hooks/useNetworkStatus';

interface OfflineBannerProps {
  network: NetworkStatus;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ network }) => {
  const { isOnline, wasOffline, isDismissed, dismissBanner } = network;

  // Show reconnected banner briefly when connection restores
  if (isOnline && wasOffline) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-950/95 dark:bg-emerald-950/95 text-emerald-100 border-b border-emerald-500/40 px-3 sm:px-6 py-2 shadow-md transition-all duration-300 z-50"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-300">กลับสู่ออนไลน์ (Back Online)</span>
            <span className="hidden md:inline text-emerald-200/80 truncate">
              — ระบบเชื่อมต่อเครือข่ายแล้ว ชั้นข้อมูลและแผนที่ดาวเทียมซิงค์ตามปกติ
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // Show offline banner when disconnected and not dismissed
  if (!isOnline && !isDismissed) {
    return (
      <aside
        role="alert"
        aria-live="assertive"
        className="w-full bg-amber-950/95 dark:bg-amber-950/95 text-amber-100 border-b border-amber-500/50 px-3 sm:px-6 py-2.5 shadow-lg transition-all duration-300 z-50 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-amber-900/60 border border-amber-500/40 shrink-0">
              <WifiOff className="w-4 h-4 text-amber-400" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 shrink-0">
                <span>โหมดรังวัดออฟไลน์ภาคสนาม 100%</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OFFLINE FIELD READY
                </span>
              </div>
              <p className="text-amber-200/90 text-[11px] sm:text-xs truncate">
                ฐานความรู้, สูตรคำนวณรังวัด (วงรอบ/ระดับ/พิกัด), และแผนที่ออฟไลน์พร้อมใช้งานโดยไม่ต้องต่อเน็ต
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 text-[11px] font-mono border border-amber-600/30">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Service Worker Cached</span>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="p-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-900/80 text-amber-300 hover:text-amber-100 border border-amber-600/30 transition-colors focus-ring"
              title="ปิดการแจ้งเตือน (สถานะออฟไลน์ยังคงแสดงที่แถบด้านบน)"
              aria-label="ปิดการแจ้งเตือนโหมดออฟไลน์"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return null;
};
