import React from 'react';
import { Compass, GitBranch } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07080a]/60 backdrop-blur-md text-slate-500 text-xs py-4 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-bold text-slate-300 tracking-tight">MESURV</span>
          <span className="text-white/15">|</span>
          <span className="text-slate-500 font-mono text-[11px]">
            Geomatics & Survey Engineering Field Terminal
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
          <a
            href="https://github.com/methastrategy/mesurvey-website"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-indigo-300 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>GitHub</span>
          </a>
          <span className="text-white/15">•</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};
