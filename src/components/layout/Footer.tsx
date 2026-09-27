import React, { useState } from 'react';
import { Compass, GitBranch, Info } from 'lucide-react';
import { AboutModal } from './AboutModal';

export const Footer: React.FC = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-survey-400 shrink-0" />
            <span className="font-semibold text-slate-200">MESURV Platform</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Universal Geomatics & Survey Engineering Suite
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-survey-300 transition-colors flex items-center space-x-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>เกี่ยวกับระบบ & มาตรฐานอ้างอิง</span>
            </button>
            <span className="text-slate-700">|</span>
            <a
              href="https://github.com/methastrategy/mesurvey-website"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-white transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-survey-400" />
              <span>GitHub</span>
            </a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};
