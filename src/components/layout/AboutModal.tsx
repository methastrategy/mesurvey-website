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
    <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="raycast-panel w-full max-w-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col text-slate-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#090b10] border-b border-white/[0.08] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-normal">เกี่ยวกับ MESURV Platform</h3>
              <p className="text-xs font-mono text-slate-400">Universal Geomatics & Survey Engineering Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่างเกี่ยวกับ MESURV"
            className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300 leading-normal">
          
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5 leading-normal">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              เป้าหมายของแพลตฟอร์ม (Platform Objective)
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              MESURV เป็นแพลตฟอร์มเว็บแอปพลิเคชันโอเพนวิศวกรรมสำหรับงานสำรวจรังวัดและสารสนเทศภูมิศาสตร์ (Geomatics Engineering) ออกแบบมาเพื่อให้วิศวกรสำรวจ ช่างสำรวจ นิสิตนักศึกษา และผู้ปฏิบัติงานภาคสนามสามารถเข้าถึงคู่มือทางเทคนิค เครื่องมือคำนวณพิกัด และแผนที่ WebGIS ได้อย่างรวดเร็ว แม่นยำ และเป็นมาตรฐานสากล
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2.5 flex items-center gap-1.5 leading-normal">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              มาตรฐานอ้างอิงทางวิชาการและวิศวกรรม (Engineering Standards & References)
            </h4>
            <ul className="space-y-2 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong>มาตรฐานการรังวัดทำระดับและโครงข่ายพิกัด:</strong> อ้างอิงเกณฑ์ความคลาดเคลื่อนและพารามิเตอร์ 7 ตัวของกรมแผนที่ทหาร (Royal Thai Survey Department - RTSD)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong>การแปลงระบบพิกัดและพื้นผิวระนาบ:</strong> WGS84 (EPSG:4326), UTM Zone 47N/48N (EPSG:32647, 32648), Indian 1975 (EPSG:24047, 24048) และแบบจำลองยอยด์ TGM2017</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong>องค์ความรู้และสถิติภาคสนาม:</strong> ประยุกต์ใช้จากเอกสารวิชาการและการปฏิบัติงานจริงของภาควิชาวิศวกรรมสำรวจและสารสนเทศภูมิศาสตร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <h4 className="font-bold text-white mb-1 flex items-center gap-1.5 leading-normal">
              <Award className="w-4 h-4 text-amber-400" />
              ผู้ริเริ่มและพัฒนาโครงการ (Project Origin & Development)
            </h4>
            <p className="text-xs leading-relaxed text-slate-300">
              ริเริ่มและพัฒนาโดย <strong>นายเมธา ตรีประพันธ์กิจ (Metha Treeprapankit)</strong> นิสิตวิศวกรรมสำรวจและสารสนเทศภูมิศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ เพื่อเป็นศูนย์รวมเครื่องมือและแหล่งอ้างอิงวิชาการสำหรับแวดวงงานสำรวจไทย
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
            <span className="text-slate-400 font-mono">Open Geomatics Architecture</span>
            <a 
              href="https://github.com/methastrategy/mesurvey-website" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 leading-normal"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#090b10] border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs leading-normal transition-colors flex items-center justify-center"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
