import React, { useEffect } from 'react';
import { X, Compass, Award, ExternalLink, ShieldCheck, BookOpen } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-survey-950 via-survey-900 to-survey-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-survey-500/20 border border-survey-400/40 flex items-center justify-center">
              <Compass className="w-6 h-6 text-survey-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">เกี่ยวกับ MESURV Platform</h3>
              <p className="text-xs text-survey-200/80">Universal Geomatics & Survey Engineering Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-survey-300 hover:text-white hover:bg-survey-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          <div className="p-4 rounded-2xl bg-survey-50/60 dark:bg-survey-950/40 border border-survey-200/60 dark:border-survey-800/60">
            <h4 className="font-bold text-survey-900 dark:text-survey-200 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-survey-600 dark:text-survey-400" />
              เป้าหมายของแพลตฟอร์ม (Platform Objective)
            </h4>
            <p className="text-xs sm:text-sm">
              MESURV เป็นแพลตฟอร์มเว็บแอปพลิเคชันโอเพนวิศวกรรมสำหรับงานสำรวจรังวัดและสารสนเทศภูมิศาสตร์ (Geomatics Engineering) ออกแบบมาเพื่อให้วิศวกรสำรวจ ช่างสำรวจ นิสิตนักศึกษา และผู้ปฏิบัติงานภาคสนามสามารถเข้าถึงคู่มือทางเทคนิค เครื่องมือคำนวณพิกัด และแผนที่ WebGIS ได้อย่างรวดเร็ว แม่นยำ และเป็นมาตรฐานสากล
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-survey-600 dark:text-survey-400" />
              มาตรฐานอ้างอิงทางวิชาการและวิศวกรรม (Engineering Standards & References)
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-survey-500 font-bold">•</span>
                <span><strong>มาตรฐานการรังวัดทำระดับและโครงข่ายพิกัด:</strong> อ้างอิงเกณฑ์ความคลาดเคลื่อนและพารามิเตอร์ 7 ตัวของกรมแผนที่ทหาร (Royal Thai Survey Department - RTSD)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-survey-500 font-bold">•</span>
                <span><strong>การแปลงระบบพิกัดและพื้นผิวระนาบ:</strong> WGS84 (EPSG:4326), UTM Zone 47N/48N (EPSG:32647, 32648), Indian 1975 (EPSG:24047, 24048) และแบบจำลองยอยด์ TGM2017</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-survey-500 font-bold">•</span>
                <span><strong>องค์ความรู้และสถิติภาคสนาม:</strong> ประยุกต์ใช้จากเอกสารวิชาการและการปฏิบัติงานจริงของภาควิชาวิศวกรรมสำรวจและสารสนเทศภูมิศาสตร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              ผู้ริเริ่มและพัฒนาโครงการ (Project Origin & Development)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              ริเริ่มและพัฒนาโดย <strong>นายเมธา ตรีประพันธ์กิจ (Metha Treeprapankit)</strong> นิสิตวิศวกรรมสำรวจและสารสนเทศภูมิศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ เพื่อเป็นศูนย์รวมเครื่องมือและแหล่งอ้างอิงวิชาการสำหรับแวดวงงานสำรวจไทย
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400">Open Geomatics Architecture</span>
            <a 
              href="https://github.com/methastrategy/mesurvey-website" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-survey-600 dark:text-survey-400 hover:underline flex items-center gap-1"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-survey-700 hover:bg-survey-600 text-white font-medium text-xs transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
