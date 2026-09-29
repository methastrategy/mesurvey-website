import React from 'react';
import { Compass, GitBranch, Info } from 'lucide-react';

interface FooterProps {
  onOpenAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  return (
    <footer className="bg-[var(--surface)] text-[var(--text-2)] text-xs py-4 px-4 sm:px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
          <div className="flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className="font-bold text-[var(--text-1)] tracking-tight">
              ME<span style={{ color: 'var(--accent)' }}>SURV</span>
            </span>
          </div>
          <span className="text-[var(--border-strong)] hidden sm:inline">|</span>
          <span className="text-[var(--text-2)] font-mono text-[11px] break-words">
            FIELD TERMINAL v4.2 • Geomatics & Survey Engineering
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 text-[var(--text-2)] font-mono text-[11px]">
          {onOpenAbout && (
            <>
              <button
                type="button"
                onClick={onOpenAbout}
                className="inline-flex items-center gap-1 hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>เกี่ยวกับระบบ</span>
              </button>
              <span className="text-[var(--border-strong)]">•</span>
            </>
          )}
          <a
            href="https://github.com/methastrategy/mesurvey-website"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-[var(--accent)] transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>GitHub</span>
          </a>
          <span className="text-[var(--border-strong)]">•</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};

