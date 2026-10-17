import React, { useState, useEffect } from 'react';

export type DragonLoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
export type DragonLoaderMode = 'animated' | 'sprite' | 'interactive';
export type DragonLoaderVariant = 'card' | 'fullscreen' | 'inline' | 'minimal' | 'transparent';

export interface DragonSurveyorLoaderProps {
  /** ขนาดของตัวละครมาสคอต (xs=36px, sm=56px, md=88px, lg=128px, xl=160px, 2xl=200px หรือระบุ px ตรงๆ) */
  size?: DragonLoaderSize;
  /** โหมดการแสดงผล: 'animated' (WebP/GIF คุณภาพสูง เบา GPU), 'sprite' (CSS Steps Animation), 'interactive' (มีแผงควบคุมเฟรม) */
  mode?: DragonLoaderMode;
  /** รูปแบบกล่องบรรจุ: 'card' (การ์ดพื้นหลังพร้อมกรอบ), 'fullscreen' (เต็มหน้าจอ), 'inline' (แนวนอนย่อ), 'minimal' (เฉพาะตัวมังกร), 'transparent' (โปร่งใส) */
  variant?: DragonLoaderVariant;
  /** ข้อความหัวข้อหลัก */
  label?: string;
  /** ข้อความรหัส/รายละเอียดภาษาอังกฤษด้านล่าง */
  sublabel?: string;
  /** เปิดการสลับข้อความสถานะการรังวัดอัตโนมัติ */
  cycleMessages?: boolean;
  /** ขยายความสูงเต็มพื้นที่ container (min-h-[60vh] หรือ 100dvh) */
  fullHeight?: boolean;
  /** ความคืบหน้า (0-100) หากต้องการแสดงแถบความคืบหน้า */
  progress?: number;
  /** ความเร็วแอนิเมชันสำหรับ CSS Sprite (วินาทีต่อรอบ เช่น 1.15) */
  durationSec?: number;
  /** คลาส CSS เพิ่มเติม */
  className?: string;
}

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  xs: { width: 36, height: 40 },
  sm: { width: 56, height: 62 },
  md: { width: 88, height: 98 },
  lg: { width: 128, height: 143 },
  xl: { width: 160, height: 178 },
  '2xl': { width: 200, height: 223 },
};

export const DEFAULT_SURVEY_MESSAGES = [
  'กำลังปรับสมดุลฟองระดับกล้อง Total Station...',
  'กำลังเล็งเป้าปริซึมและวัดระยะลาด (EDM Slope Distance)...',
  'กำลังอ่านค่ามุมราบและมุมดิ่ง (Horizontal & Zenith Angle)...',
  'กำลังคำนวณพิกัดฉากระนาบ UTM Zone 47N / 48N...',
  'กำลังตรวจแก้ความคลาดเคลื่อนบรรจบวงรอบ (Closure Check)...',
  'รังวัดพิกัดเสร็จสมบูรณ์ พร้อมแสดงผลบนแผนที่ 👍',
];

export const FRAME_DESCRIPTIONS = [
  'เฟรม 1: เริ่มต้นปรับตั้งกล้องส่องสำรวจ',
  'เฟรม 2: ขยับหาง เล็งเป้าปริซึมเข้าแนวศูนย์',
  'เฟรม 3: หรี่ตาส่องเลนส์ตา (Eyepiece Alignment)',
  'เฟรม 4: ยิงสัญญาณ EDM อ่านค่าพิกัด',
  'เฟรม 5: บันทึกข้อมูลรังวัด ตรวจสอบความถูกต้อง',
  'เฟรม 6: เยี่ยมมาก! รังวัดสำเร็จ (Thumbs Up 👍)',
];

export const DragonSurveyorLoader: React.FC<DragonSurveyorLoaderProps> = ({
  size = 'md',
  mode = 'animated',
  variant = 'transparent',
  label = 'กำลังประมวลผลข้อมูลรังวัดและพิกัดภูมิศาสตร์...',
  sublabel = 'GEOMATICS ENGINE COMPUTATION ACTIVE',
  cycleMessages = false,
  fullHeight = false,
  progress,
  durationSec = 1.15,
  className = '',
}) => {
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [interactiveFrame, setInteractiveFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(5);

  // คำนวณความกว้างและความสูงตามสัดส่วน 165 : 184 (w : h)
  const dims = typeof size === 'number'
    ? { width: size, height: Math.round((size * 184) / 165) }
    : SIZE_MAP[size] || SIZE_MAP.md;

  // วงรอบสลับข้อความการรังวัด
  useEffect(() => {
    if (!cycleMessages) return;
    const interval = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % DEFAULT_SURVEY_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [cycleMessages]);

  // วงรอบ Interactive Frame Player เมื่อเปิดโหมด interactive และกำลังเล่น
  useEffect(() => {
    if (mode !== 'interactive' || !isPlaying) return;
    const interval = setInterval(() => {
      setInteractiveFrame((prev) => (prev + 1) % 6);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [mode, isPlaying, fps]);

  const activeLabel = cycleMessages ? DEFAULT_SURVEY_MESSAGES[currentMsgIndex] : label;

  // ส่วนแสดงแอนิเมชันมาสคอต
  const renderMascot = () => {
    if (mode === 'interactive') {
      return (
        <div
          className="relative overflow-hidden inline-block select-none"
          style={{ width: dims.width, height: dims.height }}
          title={FRAME_DESCRIPTIONS[interactiveFrame]}
        >
          <img
            src="/assets/mascot/sprite_dragon_surveyor_action_6frames.png"
            alt="Surveyor Dragon Sprite"
            className="pixel-art absolute top-0 left-0 h-full max-w-none pointer-events-none"
            style={{
              width: '600%',
              transform: `translateX(-${(interactiveFrame * 100) / 6}%)`,
              transition: 'none',
            }}
          />
        </div>
      );
    }

    if (mode === 'sprite') {
      return (
        <div
          className="relative overflow-hidden inline-block select-none"
          style={{ width: dims.width, height: dims.height }}
        >
          <img
            src="/assets/mascot/sprite_dragon_surveyor_action_6frames.png"
            alt="Dragon Surveyor 6-Frame Sprite"
            className="pixel-art absolute top-0 left-0 h-full max-w-none dragon-sprite-strip-anim pointer-events-none"
            style={{
              width: '600%',
              animationDuration: `${durationSec}s`,
            }}
          />
        </div>
      );
    }

    // Default: 'animated' (WebP with GIF fallback)
    return (
      <picture className="inline-block select-none pointer-events-none">
        <source srcSet="/assets/mascot/dragon_surveyor_loading.webp" type="image/webp" />
        <img
          src="/assets/mascot/dragon_surveyor_loading.gif"
          alt="Dragon Surveyor Loading Animation"
          className="pixel-art object-contain"
          style={{ width: dims.width, height: dims.height }}
          loading="eager"
        />
      </picture>
    );
  };

  // แถบควบคุมโหมด Interactive
  const renderInteractiveControls = () => {
    if (mode !== 'interactive') return null;
    return (
      <div className="mt-4 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] max-w-sm w-full space-y-2 text-xs">
        <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-2)]">
          <span className="font-semibold text-[var(--text-1)]">เฟรม: {interactiveFrame + 1} / 6</span>
          <span className="text-[var(--accent)]">{fps} FPS</span>
        </div>
        <p className="text-[11px] font-medium text-[var(--accent)] truncate">
          {FRAME_DESCRIPTIONS[interactiveFrame]}
        </p>

        {/* Frame selector dots */}
        <div className="grid grid-cols-6 gap-1 pt-1">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInteractiveFrame(idx);
                setIsPlaying(false);
              }}
              className={`py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                interactiveFrame === idx
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--surface)] text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              F{idx + 1}
            </button>
          ))}
        </div>

        {/* Play / Pause & Speed Slider */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] font-semibold text-[11px] hover:border-[var(--accent)]"
          >
            {isPlaying ? '⏸ หยุดชั่วคราว' : '▶ เล่นต่อเนื่อง'}
          </button>
          <input
            type="range"
            min="1"
            max="12"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)] cursor-pointer"
            title="ปรับความเร็ว FPS (1-12)"
          />
        </div>
      </div>
    );
  };

  // Minimal variant: mascot only
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderMascot()}
      </div>
    );
  }

  // Inline variant: mascot + text horizontally
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        <div className="shrink-0">{renderMascot()}</div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-[var(--text-1)] truncate">
            {activeLabel}
          </p>
          {sublabel && (
            <p className="text-[10px] font-mono tracking-wider text-[var(--accent)] uppercase truncate">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Content block for Card, Transparent, and Fullscreen
  const content = (
    <div className="flex flex-col items-center justify-center text-center select-none anim-fade-in p-4">
      {/* Mascot Container with subtle aura glow */}
      <div className="relative flex items-center justify-center">
        {/* Subtle radial pulse behind mascot */}
        <div
          className="absolute -inset-4 rounded-full bg-[var(--accent)]/10 blur-xl animate-pulse pointer-events-none"
          style={{ animationDuration: '3s' }}
        />
        <div className="relative z-10 transition-transform duration-200 micro-lift">
          {renderMascot()}
        </div>
      </div>

      {/* Text Labels */}
      <div className="mt-4 space-y-1 max-w-md w-full px-2">
        <p className="text-sm sm:text-base font-bold text-[var(--text-1)] tracking-tight leading-snug">
          {activeLabel}
        </p>
        {sublabel && (
          <p className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[var(--accent)] font-semibold uppercase">
            {sublabel}
          </p>
        )}
      </div>

      {/* Progress Bar (Optional) */}
      {typeof progress === 'number' && (
        <div className="w-full max-w-xs mt-3 space-y-1">
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-[var(--text-3)] text-right font-medium">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Interactive Controls (If mode === 'interactive') */}
      {renderInteractiveControls()}
    </div>
  );

  // Fullscreen Overlay
  if (variant === 'fullscreen') {
    return (
      <div
        className={`fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="fusion-card max-w-sm w-full p-6 bg-[var(--surface)] border border-[var(--border)] shadow-xl flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  // Card Variant
  if (variant === 'card') {
    return (
      <div
        className={`fusion-card p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--card-radius)] shadow-sm max-w-md w-full mx-auto ${className}`}
        role="status"
        aria-live="polite"
      >
        {content}
      </div>
    );
  }

  // Transparent Variant (Standard)
  return (
    <div
      className={`flex items-center justify-center w-full ${
        fullHeight ? 'min-h-[100dvh]' : 'min-h-[50vh]'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {content}
    </div>
  );
};

export default DragonSurveyorLoader;
