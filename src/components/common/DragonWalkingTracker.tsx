import React, { useState, useEffect } from 'react';
import { Navigation, Compass, Zap, MapPin } from 'lucide-react';

export type DragonWalkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type DragonWalkMode = 'animated' | 'sprite' | 'interactive';
export type DragonWalkVariant = 'hud' | 'marker' | 'inline' | 'minimal' | 'card';

export interface DragonWalkingTrackerProps {
  /** ขนาดของมาสคอต (xs=32px, sm=48px, md=72px, lg=100px, xl=140px หรือกำหนด px ตรงๆ) */
  size?: DragonWalkSize;
  /** โหมดการทำงาน: 'animated' (WebP/GIF), 'sprite' (CSS Steps), 'interactive' (ทดสอบเฟรม) */
  mode?: DragonWalkMode;
  /** รูปแบบ UI: 'hud' (การ์ดลอยบนแผนที่), 'marker' (ไอคอนหมุดแผนที่), 'inline' (แถบแนวนอน), 'minimal' (เฉพาะตัว), 'card' (การ์ดเต็ม) */
  variant?: DragonWalkVariant;
  /** ทิศทางการเดิน: 'right' | 'left' | 'auto' (คำนวณจาก heading) */
  direction?: 'right' | 'left' | 'auto';
  /** มุมทิศทางเดิน Azimuth / Heading (0° - 360°) */
  heading?: number | null;
  /** ความเร็วในการเคลื่อนที่ (km/h) หากต้องการปรับจังหวะก้าวตามความเร็วจริง */
  speedKmh?: number | null;
  /** ความแม่นยำของสัญญาณ GPS (เมตร) เช่น 2.5 */
  accuracy?: number | null;
  /** ระยะทางสะสมที่เดินแล้ว (เมตร) */
  distanceMeters?: number | null;
  /** กำลังเคลื่อนที่หรือไม่ (ถ้า false แอนิเมชันจะหยุดชั่วคราว) */
  isMoving?: boolean;
  /** ข้อความหัวข้อหลัก */
  label?: string;
  /** ข้อความรหัส/สถานะภาษาอังกฤษ */
  sublabel?: string;
  /** แสดงแถบข้อมูลสถานะดาวเทียม GPS ด้านล่าง */
  showGpsBadge?: boolean;
  /** คลาส CSS เพิ่มเติม */
  className?: string;
}

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  xs: { width: 32, height: 37 },
  sm: { width: 48, height: 56 },
  md: { width: 72, height: 84 },
  lg: { width: 100, height: 117 },
  xl: { width: 140, height: 163 },
};

export const WALK_FRAME_DESCRIPTIONS = [
  'เฟรม 1: เริ่มต้นก้าวเท้าขวา เคลื่อนที่ไปข้างหน้า',
  'เฟรม 2: แขนซ้ายแกว่งตามจังหวะ ถ่ายน้ำหนักเท้าขวา',
  'เฟรม 3: ส้นเท้าซ้ายเริ่มยก ทรงตัวระนาบก้าว',
  'เฟรม 4: ก้าวเท้าซ้ายขึ้นหน้า จังหวะลำตัวยืดตรง',
  'เฟรม 5: วางเท้าซ้ายสัมผัสพื้น หางสะบัดตามจังหวะ',
  'เฟรม 6: แขนขวาแกว่งไปข้างหน้า เตรียมยกเท้าขวา',
  'เฟรม 7: ยกเท้าขวาพ้นพื้น ลอยตัวจังหวะก้าว (Mid-Stride)',
  'เฟรม 8: เท้าขวาจรดพื้น ครบ 1 รอบวัฏจักรการเดิน (Walk Cycle)',
];

export const DragonWalkingTracker: React.FC<DragonWalkingTrackerProps> = ({
  size = 'md',
  mode = 'animated',
  variant = 'minimal',
  direction = 'auto',
  heading = null,
  speedKmh = null,
  accuracy = null,
  distanceMeters = null,
  isMoving = true,
  label = 'กำลังเดินสำรวจและติดตามเส้นทาง GPS...',
  sublabel = 'LIVE GNSS KINEMATIC TRACKING',
  showGpsBadge = true,
  className = '',
}) => {
  const [interactiveFrame, setInteractiveFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(isMoving);
  const [fps, setFps] = useState(9);

  // คำนวณขนาดตามสัดส่วน 120 : 140
  const dims = typeof size === 'number'
    ? { width: size, height: Math.round((size * 140) / 120) }
    : SIZE_MAP[size] || SIZE_MAP.md;

  // ตัดสินทิศทางหันหน้า: ถ้า heading 180°-360° (ทิศตะวันตก) ให้กลับด้านเป็นเดินไปทางซ้าย
  const shouldFlipLeft = (() => {
    if (direction === 'left') return true;
    if (direction === 'right') return false;
    if (typeof heading === 'number') {
      const normHeading = ((heading % 360) + 360) % 360;
      return normHeading > 180 && normHeading < 360;
    }
    return false;
  })();

  // คำนวณความเร็วรอบการก้าว (Cycle Duration) ตามความเร็วเดิน
  // ความเร็วปกติ 3-5 km/h -> 0.88s; วิ่งเร็ว > 6 km/h -> 0.65s; เดินช้า < 2 km/h -> 1.1s
  const strideDuration = (() => {
    if (!speedKmh || speedKmh <= 0) return 0.88;
    if (speedKmh > 6) return 0.62;
    if (speedKmh > 4) return 0.78;
    if (speedKmh < 2.5) return 1.05;
    return 0.88;
  })();

  // โหมด Interactive Frame Player
  useEffect(() => {
    if (mode !== 'interactive' || !isPlaying) return;
    const interval = setInterval(() => {
      setInteractiveFrame((prev) => (prev + 1) % 8);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [mode, isPlaying, fps]);

  const renderMascot = () => {
    const flipStyle: React.CSSProperties = shouldFlipLeft
      ? { transform: 'scaleX(-1)' }
      : {};

    if (mode === 'interactive') {
      return (
        <div
          className="relative overflow-hidden inline-block select-none"
          style={{ width: dims.width, height: dims.height, ...flipStyle }}
          title={WALK_FRAME_DESCRIPTIONS[interactiveFrame]}
        >
          <img
            src="/assets/mascot/sprite_dragon_walk_8frames.png"
            alt="Walking Dragon Sprite"
            className="pixel-art absolute top-0 left-0 h-full max-w-none pointer-events-none"
            style={{
              width: '800%',
              transform: `translateX(-${(interactiveFrame * 100) / 8}%)`,
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
          style={{ width: dims.width, height: dims.height, ...flipStyle }}
        >
          <img
            src="/assets/mascot/sprite_dragon_walk_8frames.png"
            alt="Walking Dragon 8-Frame Sprite"
            className={`pixel-art absolute top-0 left-0 h-full max-w-none pointer-events-none ${
              isMoving ? 'dragon-walk-strip-anim' : 'dragon-walk-strip-anim-paused'
            }`}
            style={{
              width: '800%',
              animationDuration: `${strideDuration}s`,
            }}
          />
        </div>
      );
    }

    // Default: 'animated' (WebP with GIF fallback)
    return (
      <picture
        className="inline-block select-none pointer-events-none"
        style={flipStyle}
      >
        <source srcSet="/assets/mascot/dragon_walk.webp" type="image/webp" />
        <img
          src="/assets/mascot/dragon_walk.gif"
          alt="Walking Dragon Navigator"
          className="pixel-art object-contain"
          style={{
            width: dims.width,
            height: dims.height,
            filter: isMoving ? 'none' : 'grayscale(0.3) opacity(0.85)',
          }}
          loading="eager"
        />
      </picture>
    );
  };

  // แผงควบคุมโหมด Interactive
  const renderInteractiveControls = () => {
    if (mode !== 'interactive') return null;
    return (
      <div className="mt-4 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] max-w-sm w-full space-y-2 text-xs">
        <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-2)]">
          <span className="font-semibold text-[var(--text-1)]">เฟรมการเดิน: {interactiveFrame + 1} / 8</span>
          <span className="text-[var(--accent)]">{fps} FPS</span>
        </div>
        <p className="text-[11px] font-medium text-[var(--accent)] truncate">
          {WALK_FRAME_DESCRIPTIONS[interactiveFrame]}
        </p>

        {/* Frame selector dots */}
        <div className="grid grid-cols-8 gap-1 pt-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
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
              {idx + 1}
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
            {isPlaying ? '⏸ หยุดก้าว' : '▶ เดินต่อ'}
          </button>
          <input
            type="range"
            min="2"
            max="16"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)] cursor-pointer"
            title="ปรับความเร็วการก้าว (2-16 FPS)"
          />
        </div>
      </div>
    );
  };

  // Telemetry Badges Bar
  const renderGpsTelemetry = () => {
    if (!showGpsBadge) return null;
    return (
      <div className="flex items-center gap-2 flex-wrap justify-center text-[10px] font-mono text-[var(--text-2)] mt-2">
        {typeof heading === 'number' && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1">
            <Compass className="w-3 h-3 text-[var(--accent)]" />
            <span>{Math.round(heading)}°</span>
          </span>
        )}
        {typeof speedKmh === 'number' && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{speedKmh.toFixed(1)} km/h</span>
          </span>
        )}
        {typeof accuracy === 'number' && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1">
            <Navigation className="w-3 h-3 text-emerald-500" />
            <span>±{accuracy.toFixed(1)}m</span>
          </span>
        )}
        {typeof distanceMeters === 'number' && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>{distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${Math.round(distanceMeters)} m`}</span>
          </span>
        )}
      </div>
    );
  };

  // 1. Minimal Variant: Only the walking dragon
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderMascot()}
      </div>
    );
  }

  // 2. Marker Variant: Formatted for Leaflet Custom DivIcon
  if (variant === 'marker') {
    return (
      <div className={`relative flex flex-col items-center select-none pointer-events-none ${className}`}>
        <div className="relative">
          {/* Subtle radar ripple beneath feet */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full bg-black/20 dark:bg-white/20 blur-[1px]" />
          {renderMascot()}
        </div>
        {typeof accuracy === 'number' && (
          <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-black/75 text-white text-[9px] font-mono font-bold leading-tight shadow-sm">
            ±{accuracy.toFixed(1)}m
          </span>
        )}
      </div>
    );
  }

  // 3. Inline Variant: For Navigation drawer / status bar
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none p-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] ${className}`}>
        <div className="shrink-0">{renderMascot()}</div>
        <div className="min-w-0 pr-2">
          <p className="text-xs font-semibold text-[var(--text-1)] truncate">
            {label}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {sublabel && (
              <span className="text-[10px] font-mono tracking-wider text-[var(--accent)] uppercase truncate">
                {sublabel}
              </span>
            )}
            {renderGpsTelemetry()}
          </div>
        </div>
      </div>
    );
  }

  // 4. Floating HUD Variant: Overlay on Maps during Route Navigation
  if (variant === 'hud') {
    return (
      <div
        className={`fusion-card p-3 rounded-2xl bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-lg flex items-center gap-3 select-none anim-fade-in ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="absolute -inset-2 rounded-full bg-[var(--accent)]/10 blur-md animate-pulse pointer-events-none" />
          <div className="relative z-10">{renderMascot()}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-bold text-[var(--text-1)] truncate">
              {label}
            </h5>
            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
              GPS LIVE
            </span>
          </div>
          <p className="text-[10px] font-mono text-[var(--text-3)] truncate mt-0.5">
            {sublabel}
          </p>
          {renderGpsTelemetry()}
        </div>
      </div>
    );
  }

  // 5. Card Variant: Standard Standalone Widget
  return (
    <div
      className={`fusion-card p-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--card-radius)] shadow-sm flex flex-col items-center text-center select-none anim-fade-in ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-3 rounded-full bg-[var(--accent)]/15 blur-lg animate-pulse pointer-events-none" />
        <div className="relative z-10">{renderMascot()}</div>
      </div>

      <div className="mt-3 space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-[var(--text-1)] tracking-tight">
          {label}
        </h4>
        {sublabel && (
          <p className="text-[10px] font-mono tracking-widest text-[var(--accent)] font-semibold uppercase">
            {sublabel}
          </p>
        )}
      </div>

      {renderGpsTelemetry()}
      {renderInteractiveControls()}
    </div>
  );
};

export default DragonWalkingTracker;
