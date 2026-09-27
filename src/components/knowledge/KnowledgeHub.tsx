import React, { useState } from 'react';
import { 
  Search, 
  Compass, 
  Ruler, 
  Radio, 
  Camera, 
  Boxes, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Cpu,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  BookmarkCheck
} from 'lucide-react';
import { KNOWLEDGE_TOPICS } from '../../data/knowledge-topics';
import { KnowledgeTopic, KnowledgeCategory, DeviceScreenStep } from '../../types/survey';

interface KnowledgeHubProps {
  onNavigateTab?: (tab: 'calculator' | 'map') => void;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(KNOWLEDGE_TOPICS[0]?.id || '');
  const [activeReaderTab, setActiveReaderTab] = useState<'overview' | 'sop' | 'math' | 'qaqc' | 'downstream'>('sop');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const getTopicIcon = (iconName: string, className: string = "w-4 h-4") => {
    switch (iconName) {
      case 'Compass': return <Compass className={className} />;
      case 'Ruler': return <Ruler className={className} />;
      case 'Radio': return <Radio className={className} />;
      case 'Camera': return <Camera className={className} />;
      case 'Boxes': return <Boxes className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  const categories: { id: string; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: 'ทั้งหมด (All SOPs)', count: KNOWLEDGE_TOPICS.length, icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'total-station', label: 'กล้องประมวลผลรวม', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'total-station').length, icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'differential-leveling', label: 'กล้องระดับ', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'differential-leveling').length, icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'gnss-geodesy', label: 'ดาวเทียม GNSS & Geodesy', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'gnss-geodesy').length, icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'drone-photogrammetry', label: 'โดรน UAV & ภาพถ่าย', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'drone-photogrammetry').length, icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'lidar-scan-bim', label: '3D LiDAR & BIM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'lidar-scan-bim').length, icon: <Boxes className="w-3.5 h-3.5" /> },
  ];

  const filteredTopics = KNOWLEDGE_TOPICS.filter((t) => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCategory;
    const matchQuery = (
      t.title.toLowerCase().includes(q) ||
      t.titleEn.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      (t.courseRelation && t.courseRelation.toLowerCase().includes(q))
    );
    return matchCategory && matchQuery;
  });

  const activeTopic: KnowledgeTopic | undefined = KNOWLEDGE_TOPICS.find((t) => t.id === selectedTopicId) || KNOWLEDGE_TOPICS[0];
  const deviceSteps: DeviceScreenStep[] = activeTopic?.deviceWorkflow || [];
  const currentStep: DeviceScreenStep | undefined = deviceSteps[activeStepIndex] || deviceSteps[0];

  const handleSelectTopic = (id: string) => {
    setSelectedTopicId(id);
    setActiveStepIndex(0);
  };

  const handleCopySummary = () => {
    if (!activeTopic) return;
    const textToCopy = `${activeTopic.title}\n${activeTopic.titleEn}\n\n${activeTopic.summary}\n\nขั้นตอนสนาม:\n` +
      activeTopic.fieldProcedures.map((p, idx) => `${idx + 1}. ${p.title}\n${p.details}`).join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner: Digital Knowledge Library Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 border border-white/15 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wide text-slate-200">DIGITAL FIELD VAULT • คลังหนังสือคู่มือวิศวกรรมสำรวจ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            คู่มือปฏิบัติการ & ขั้นตอนการใช้เครื่องมือสำรวจ
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            รวบรวมขั้นตอนมาตรฐาน (SOP) การใช้งานเครื่องมือสำรวจภาคสนาม ลำดับขั้นการกดปุ่มบนตัวเครื่อง (Keypad Sequences) หน้าจอกล้องจำลองจริง (Device Display Simulation) เกณฑ์การตรวจสอบความคลาดเคลื่อน (QA/QC) และขั้นตอนการนำข้อมูลไปใช้งานต่อ
          </p>

          {/* Search Box */}
          <div className="pt-2 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อกล้อง, รหัสปุ่มกด, ขั้นตอนรังวัด (เช่น Resection, Two-Peg, Backsight, RTK, NTRIP, GSD)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue backdrop-blur-md transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Background Ambient Glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-ios-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Category Pills Shelf */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-slate-950/10'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected 
                  ? 'bg-white/20 dark:bg-black/10' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Master-Detail Digital Library Shelf & Reader View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Bookshelf Directory (4 Cols) */}
        <div className="lg:col-span-4 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="px-2 py-1 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-ios-blue" />
              ชั้นหนังสือคู่มือ ({filteredTopics.length} เล่ม)
            </span>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredTopics.map((topic) => {
              const isActive = topic.id === activeTopic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex flex-col space-y-2 relative border ${
                    isActive
                      ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-700 shadow-lg shadow-slate-950/20'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-md ${
                      isActive 
                        ? 'bg-ios-blue text-white' 
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {topic.badge}
                    </span>
                    <span className={`text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {getTopicIcon(topic.iconName)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                      {topic.title}
                    </h4>
                    <p className={`text-[10px] sm:text-[11px] font-mono mt-1 line-clamp-1 ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}>
                      {topic.titleEn}
                    </p>
                  </div>

                  <div className={`pt-1 flex items-center justify-between text-[10px] border-t ${
                    isActive ? 'border-white/10 text-slate-400' : 'border-slate-200/60 dark:border-slate-700/60 text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      คู่มือขั้นตอนสนาม & ปุ่มกด
                    </span>
                    {isActive ? (
                      <span className="font-semibold text-emerald-400 flex items-center gap-0.5">
                        กำลังอ่าน <ChevronRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="hover:underline">เปิดอ่าน</span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredTopics.length === 0 && (
              <div className="text-center py-12 px-4 text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs">ไม่พบคู่มือที่ตรงกับคำค้นหา "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Reader Document Viewer (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6">
          {!activeTopic ? (
            <div className="py-16 px-6 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-ios-blue/10 dark:bg-ios-blue/20 flex items-center justify-center text-ios-blue dark:text-ios-blueDark border border-ios-blue/20">
                <BookOpen className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Awaiting Course Materials • รอการนำเข้าเนื้อหา
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  คลังคู่มือพร้อมสำหรับการจัดโครงสร้างใหม่
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  เนื้อหาเดิมถูกล้างออกเรียบร้อยแล้ว เพื่อเตรียมพร้อมนำไฟล์เอกสารประกอบการเรียนและคู่มือปฏิบัติการจริงมาแกะวิเคราะห์ จัดหมวดหมู่ และเรียบเรียงเป็นคู่มือมาตรฐาน (SOP)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-left space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  โครงสร้างหัวข้อที่เตรียมรองรับ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-ios-blue shrink-0" />
                    <span>กล้องประมวลผลรวม (Total Station)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>กล้องระดับ (Leveling & Two-Peg)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>ดาวเทียม GNSS (RTK / Static / CORS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>โดรน UAV & ภาพถ่ายทางอากาศ</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                * คุณสามารถส่งไฟล์บทเรียน สไลด์ หรือข้อความสรุปเข้ามา เพื่อให้เริ่มกระบวนการสกัดเนื้อหาและขึ้นคู่มือตามมาตรฐานได้ทันที
              </p>
            </div>
          ) : (
            <>
              {/* Document Header & Meta */}
              <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-ios-blue/10 text-ios-blue dark:text-ios-blueDark border border-ios-blue/20">
                      {activeTopic.badge}
                    </span>
                    <span className="text-xs text-slate-400">
                      หมวด: {activeTopic.categoryName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopySummary}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                      title="คัดลอกข้อความสรุป"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอก SOP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeTopic.title}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-slate-400 dark:text-slate-500 mt-1">
                {activeTopic.titleEn}
              </p>
            </div>

            {/* iOS Segmented Reader Tabs */}
            <div className="pt-2">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none gap-1 border border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => setActiveReaderTab('sop')}
                  className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
                    activeReaderTab === 'sop'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                  <span>คู่มือปุ่มกด & จอกล้อง</span>
                </button>

                <button
                  onClick={() => setActiveReaderTab('overview')}
                  className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
                    activeReaderTab === 'overview'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-ios-blue" />
                  <span>ภาพรวม & ทฤษฎี</span>
                </button>

                <button
                  onClick={() => setActiveReaderTab('math')}
                  className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
                    activeReaderTab === 'math'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-purple-500" />
                  <span>สูตรคำนวณ</span>
                </button>

                <button
                  onClick={() => setActiveReaderTab('qaqc')}
                  className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
                    activeReaderTab === 'qaqc'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>QA/QC ตรวจสอบ</span>
                </button>

                <button
                  onClick={() => setActiveReaderTab('downstream')}
                  className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
                    activeReaderTab === 'downstream'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
                  <span>ผลลัพธ์ & ส่งต่อ</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: SOP & SIMULATED DEVICE DISPLAY (The Core Highlight) */}
          {activeReaderTab === 'sop' && (
            <div className="space-y-6">
              
              {/* Device Simulation Showcase */}
              {deviceSteps.length > 0 && currentStep && (
                <div className="rounded-3xl border border-slate-700 bg-slate-950 text-white overflow-hidden shadow-2xl">
                  
                  {/* Instrument Chassis Header */}
                  <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
                        {currentStep.targetHardware}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                      <span>STEP {currentStep.stepNumber} OF {deviceSteps.length}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] font-semibold">
                        SIMULATOR ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Instrument Screen & Keypad Mockup */}
                  <div className="p-5 sm:p-6 space-y-4">
                    
                    {/* Simulated High-Contrast Screen Display */}
                    <div className="rounded-2xl border-2 border-emerald-950/80 bg-black/90 p-4 sm:p-5 font-mono shadow-inner relative overflow-hidden">
                      <div className="absolute top-2 right-3 text-[10px] text-emerald-600 tracking-widest uppercase">
                        MONOCHROME LCD • 240x128
                      </div>

                      <div className="text-xs font-bold text-emerald-400 border-b border-emerald-900/60 pb-1.5 mb-2.5 flex items-center justify-between">
                        <span>▶ {currentStep.screenTitle}</span>
                        <span className="text-[10px] text-emerald-500/80">BAT 100% | TILT ON</span>
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm text-emerald-300 font-mono tracking-wide leading-relaxed">
                        {currentStep.screenLines.map((line, lIdx) => (
                          <div key={lIdx} className="hover:bg-emerald-950/30 px-1 rounded transition-colors">
                            {line}
                          </div>
                        ))}
                      </div>

                      {/* Sub-display soft keys */}
                      <div className="mt-4 pt-2 border-t border-emerald-950 flex items-center justify-between text-[11px] text-emerald-400/90 font-mono font-bold">
                        <span>[F1: DIST]</span>
                        <span>[F2: COORD]</span>
                        <span>[F3: SET]</span>
                        <span>[F4: REC]</span>
                      </div>
                    </div>

                    {/* Step Stepper Navigation Bar */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeStepIndex === 0}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>ขั้นตอนก่อนหน้า</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {deviceSteps.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            onClick={() => setActiveStepIndex(dotIdx)}
                            className={`h-2 rounded-full transition-all ${
                              dotIdx === activeStepIndex
                                ? 'w-6 bg-emerald-400'
                                : 'w-2 bg-slate-700 hover:bg-slate-600'
                            }`}
                            title={`ขั้นตอนที่ ${dotIdx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => setActiveStepIndex((prev) => Math.min(deviceSteps.length - 1, prev + 1))}
                        disabled={activeStepIndex === deviceSteps.length - 1}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors"
                      >
                        <span>ขั้นตอนถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Step Action Breakdown Box */}
                    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Terminal className="w-4 h-4" />
                          ปุ่มที่ต้องกด: <code className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-xs">{currentStep.buttonKey}</code>
                        </span>
                        <span className="text-xs text-slate-400">
                          {currentStep.stageName}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {currentStep.explanation}
                      </p>

                      {currentStep.qaCheck && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>เกณฑ์ตรวจสอบหน้างาน (QA Check):</strong> {currentStep.qaCheck}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Complete Step-by-Step Field Operating Procedures Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ลำดับขั้นการปฏิบัติงานภาคสนามอย่างละเอียด (Field Operating Procedures)
                  </h3>
                  <span className="text-xs text-slate-400">
                    {activeTopic.fieldProcedures.length} ขั้นตอนมาตรฐาน
                  </span>
                </div>

                <div className="space-y-3">
                  {activeTopic.fieldProcedures.map((proc, pIdx) => (
                    <div 
                      key={pIdx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-[11px] font-mono shrink-0">
                          {pIdx + 1}
                        </span>
                        <span>{proc.title}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                        {proc.details}
                      </p>
                      {proc.criticalCaution && (
                        <div className="ml-7 mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>ข้อควรระวังภาคสนาม:</strong> {proc.criticalCaution}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment Checklist */}
              {activeTopic.equipmentRequired && activeTopic.equipmentRequired.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-ios-blue" />
                    รายการอุปกรณ์และเครื่องมือที่ต้องจัดเตรียม (Field Equipment Checklist)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {activeTopic.equipmentRequired.map((eq, eqIdx) => (
                      <div key={eqIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{eq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: OVERVIEW & THEORY */}
          {activeReaderTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                  <BookOpen className="w-4 h-4 text-ios-blue" />
                  สรุปภาพรวมและวัตถุประสงค์ (Overview & Objectives)
                </h4>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {activeTopic.summary}
                </p>
                {activeTopic.courseRelation && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>มาตรฐานอ้างอิง: {activeTopic.courseRelation}</span>
                  </div>
                )}
              </div>

              {/* Working Principles */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                  <Layers className="w-4 h-4 text-ios-blue" />
                  หลักการทางวิศวกรรมและทฤษฎียีโอเดซี (Working Principles)
                </h3>
                <div className="space-y-2.5">
                  {activeTopic.workingPrinciple.map((wp, wpIdx) => (
                    <div key={wpIdx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="w-5 h-5 rounded-full bg-ios-blue/10 text-ios-blue dark:text-ios-blueDark flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                        {wpIdx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {wp}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FORMULAS & MATH */}
          {activeReaderTab === 'math' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                <Activity className="w-4 h-4 text-purple-500" />
                สูตรคำนวณและสมการความถูกต้องทางวิศวกรรม (Formulas & Equations)
              </h3>

              {activeTopic.formulas && activeTopic.formulas.length > 0 ? (
                <div className="space-y-4">
                  {activeTopic.formulas.map((f, fIdx) => (
                    <div key={fIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        {f.label}
                      </span>
                      <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-emerald-400 bg-white dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                        {f.formula}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {f.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  ไม่มีสูตรคำนวณเฉพาะในหัวข้อนี้
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QA/QC & MITIGATION */}
          {activeReaderTab === 'qaqc' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC & Error Mitigation)
              </h3>

              <div className="space-y-3">
                {activeTopic.errorSourcesAndMitigation.map((err, eIdx) => (
                  <div key={eIdx} className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {err}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DATA OUTPUT & DOWNSTREAM ACTIONS */}
          {activeReaderTab === 'downstream' && (
            <div className="space-y-6">
              
              {activeTopic.downstreamWorkflow ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-sky-500" />
                      รูปแบบไฟล์และข้อมูลที่ได้จากกล้อง (Data Output Formats)
                    </h4>
                    <div className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      {activeTopic.downstreamWorkflow.outputDataFormat}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {activeTopic.downstreamWorkflow.outputDescription}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-ios-blue/5 to-emerald-500/5 border border-ios-blue/20 dark:border-ios-blue/30 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-ios-blue/15 text-ios-blue dark:text-ios-blueDark text-[11px] font-bold">
                        NEXT STEP DIRECTIVE
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeTopic.downstreamWorkflow.nextStepTitle}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeTopic.downstreamWorkflow.nextStepProcedure}
                    </p>

                    {activeTopic.downstreamWorkflow.toolActionLabel && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            if (activeTopic.downstreamWorkflow?.recommendedToolTab === 'map') {
                              onNavigateTab?.('map');
                            } else {
                              onNavigateTab?.('calculator');
                            }
                          }}
                          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-md transition-all group"
                        >
                          <span>{activeTopic.downstreamWorkflow.toolActionLabel}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  ไม่มีข้อกำหนดการส่งต่อเฉพาะ
                </div>
              )}

            </div>
          )}
        </>
      )}

    </div>

      </div>

    </div>
  );
};
