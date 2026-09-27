import React from 'react';
import { Award, GitBranch } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-4 px-4 sm:px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-survey-400 shrink-0" />
          <span>
            พัฒนาโดย: <strong className="text-slate-200">นายเมธา ตรีประพันธ์กิจ (6610554196)</strong>
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-300">
            วิศวกรรมสำรวจและสารสนเทศภูมิศาสตร์ มหาวิทยาลัยเกษตรศาสตร์
          </span>
        </div>

        <div className="flex items-center space-x-4 text-slate-400">
          <span className="flex items-center space-x-1">
            <GitBranch className="w-3.5 h-3.5 text-survey-400" />
            <span>Vercel + GitHub Ready</span>
          </span>
          <span>© {new Date().getFullYear()} MESURV Platform</span>
        </div>
      </div>
    </footer>
  );
};
