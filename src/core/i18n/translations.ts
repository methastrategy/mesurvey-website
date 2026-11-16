import { SupportedLanguage } from './types';

export interface Translations {
  nav: {
    knowledge: string;
    calculator: string;
    map: string;
    about: string;
    offlineMode: string;
    onlineMode: string;
  };
  header: {
    brandSubtitle: string;
    themeSelector: string;
    languageSelector: string;
    aboutTooltip: string;
    currentSubTab: Record<string, string>;
  };
  tools: {
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    clearSearch: string;
    backToDirectory: string;
    domainAll: string;
    domainGeodesy: string;
    domainCivil: string;
    domainCadastral: string;
    domainQaqc: string;
    toolLabel: string;
    launchTool: string;
  };
  knowledge: {
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    clearSearch: string;
    categoryAll: string;
    categoryEquipment: string;
    categorySop: string;
    categoryLaws: string;
    categorySite: string;
    categoryTroubleshooting: string;
    categoryGlossary: string;
    badgeManualUsage: string;
    badgeManualWork: string;
    badgeLaw: string;
    badgeSite: string;
    badgeTrouble: string;
    stepsCount: string;
    openTool: string;
    openMap: string;
    backToList: string;
  };
  common: {
    calculate: string;
    reset: string;
    exportCsv: string;
    copy: string;
    copied: string;
    close: string;
    back: string;
    details: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  th: {
    nav: {
      knowledge: 'คลังความรู้',
      calculator: 'เครื่องมือคำนวณ',
      map: 'แผนที่สนาม',
      about: 'เกี่ยวกับ',
      offlineMode: 'โหมดออฟไลน์ 100%',
      onlineMode: 'ออนไลน์',
    },
    header: {
      brandSubtitle: 'ระบบปฏิบัติการวิศวกรรมสำรวจ',
      themeSelector: 'เปลี่ยนชุดสีและธีม',
      languageSelector: 'เปลี่ยนภาษา',
      aboutTooltip: 'เกี่ยวกับระบบ MESURV (คลิกเพื่อดูข้อมูล)',
      currentSubTab: {
        scientific: 'เครื่องคิดเลข',
        coord: 'แปลงพิกัด',
        traverse: 'ปรับแก้วงรอบ',
        leveling: 'คำนวณระดับ',
        area: 'คำนวณเนื้อที่',
        adjustment: 'ปรับแก้โครงข่าย',
        curve: 'คำนวณโค้งราบ',
        rebar: 'คำนวณเหล็กเสริม',
        'strap-beam': 'คานรั้งฐานราก',
        'rebar-optimizer': 'ตัดเหล็กลดเศษ',
        earthwork: 'ดินขุด-ถม TIN',
      },
    },
    tools: {
      heroTitle: 'สถานีคำนวณและเวิร์กสเปซ',
      heroSubtitle: 'สถานีคำนวณวิศวกรรมสำรวจและปฏิบัติการสนาม Geodesy, Civil, Cadastral, QA/QC',
      searchPlaceholder: 'ค้นหาเครื่องมือ (เช่น วงรอบ, ระดับ, โค้ง, แปลงพิกัด, คานรั้ง, ตัดเหล็ก)...',
      clearSearch: 'ล้าง',
      backToDirectory: '← กลับสู่หน้ารวมเครื่องมือ',
      domainAll: 'ทั้งหมด',
      domainGeodesy: '🧭 งานรังวัด & Geodesy',
      domainCivil: '🏗️ วิศวกรรมโยธาและหน้างาน',
      domainCadastral: '📐 งานที่ดิน & Cadastral',
      domainQaqc: '🔬 ศูนย์ตรวจสอบ QA/QC',
      toolLabel: 'เครื่องมือ',
      launchTool: 'เปิดใช้งาน',
    },
    knowledge: {
      heroTitle: 'คลังความรู้วิศวกรรมสำรวจ',
      heroSubtitle: 'คู่มือการใช้อุปกรณ์ วิธีปฏิบัติงานภาคสนาม (SOP) กฎหมายอาคาร และการแก้ไขปัญหาหน้างานจริง',
      searchPlaceholder: 'ค้นหาคู่มือ (เช่น กล้องระดับ, Total Station, GNSS, โดรน, ระยะร่น, พิกัด)...',
      clearSearch: 'ล้างการค้นหา',
      categoryAll: 'ทั้งหมด',
      categoryEquipment: 'เครื่องมือสำรวจ',
      categorySop: 'วิธีปฏิบัติงานสนาม',
      categoryLaws: 'กฎหมายอาคารและที่ดิน',
      categorySite: 'วิศวกรรมงานก่อสร้าง',
      categoryTroubleshooting: 'แก้ปัญหาและ Blunder',
      categoryGlossary: 'พจนานุกรมคำศัพท์',
      badgeManualUsage: 'คู่มือใช้งาน',
      badgeManualWork: 'คู่มือทำงาน',
      badgeLaw: 'กฎหมายควบคุม',
      badgeSite: 'งานสนามโยธา',
      badgeTrouble: 'แก้ปัญหา Blunder',
      stepsCount: 'ขั้นตอน',
      openTool: 'เปิดเครื่องมือคำนวณที่เกี่ยวข้อง',
      openMap: 'เปิดแผนที่ WebGIS',
      backToList: '← กลับสู่หน้ารวมคู่มือ',
    },
    common: {
      calculate: 'คำนวณ',
      reset: 'รีเซ็ต',
      exportCsv: 'ส่งออก CSV',
      copy: 'คัดลอก',
      copied: 'คัดลอกแล้ว',
      close: 'ปิด',
      back: 'กลับ',
      details: 'ดูรายละเอียด',
    },
  },
  en: {
    nav: {
      knowledge: 'Knowledge Hub',
      calculator: 'Calculators',
      map: 'WebGIS Map',
      about: 'About',
      offlineMode: '100% Offline Mode',
      onlineMode: 'Online',
    },
    header: {
      brandSubtitle: 'Geomatics & Survey Field OS',
      themeSelector: 'Select Theme',
      languageSelector: 'Switch Language',
      aboutTooltip: 'About MESURV Platform',
      currentSubTab: {
        scientific: 'Scientific Calculator',
        coord: 'Coordinate Converter',
        traverse: 'Traverse Adjustment',
        leveling: 'Differential Leveling',
        area: 'Cadastral Land Area',
        adjustment: 'Network Adjustment',
        curve: 'Curve Calculator',
        rebar: 'Rebar Estimator',
        'strap-beam': 'Strap Beam Design',
        'rebar-optimizer': '1D Rebar Optimizer',
        earthwork: 'Earthwork TIN Volume',
      },
    },
    tools: {
      heroTitle: 'Calculation Workstations',
      heroSubtitle: 'Integrated field geomatics workstations: Geodesy, Civil, Cadastral, and QA/QC Studio',
      searchPlaceholder: 'Search tools (e.g. Traverse, Leveling, Curve, Coordinates, Strap Beam, Rebar)...',
      clearSearch: 'Clear',
      backToDirectory: '← Back to Tools Directory',
      domainAll: 'All Tools',
      domainGeodesy: '🧭 Geodesy & Survey',
      domainCivil: '🏗️ Civil & Site Operations',
      domainCadastral: '📐 Cadastral & Land Desk',
      domainQaqc: '🔬 QA/QC Studio',
      toolLabel: 'Tool',
      launchTool: 'Launch Tool',
    },
    knowledge: {
      heroTitle: 'Survey Knowledge Hub',
      heroSubtitle: 'Instrument manuals, field SOPs, building laws, and field troubleshooting',
      searchPlaceholder: 'Search knowledge (e.g. Level, Total Station, GNSS, Drone, Setback, Datum)...',
      clearSearch: 'Clear',
      categoryAll: 'All Categories',
      categoryEquipment: 'Instruments',
      categorySop: 'Field SOPs',
      categoryLaws: 'Laws & Codes',
      categorySite: 'Site Engineering',
      categoryTroubleshooting: 'Troubleshooting',
      categoryGlossary: 'Glossary',
      badgeManualUsage: 'Instrument Manual',
      badgeManualWork: 'Field SOP',
      badgeLaw: 'Regulation',
      badgeSite: 'Site Civil',
      badgeTrouble: 'Diagnostics',
      stepsCount: 'steps',
      openTool: 'Open Relevant Calculator',
      openMap: 'Open WebGIS Map',
      backToList: '← Back to Knowledge Directory',
    },
    common: {
      calculate: 'Calculate',
      reset: 'Reset',
      exportCsv: 'Export CSV',
      copy: 'Copy',
      copied: 'Copied',
      close: 'Close',
      back: 'Back',
      details: 'View Details',
    },
  },
  zh: {
    nav: {
      knowledge: '知识库',
      calculator: '计算终端',
      map: '外业地图',
      about: '关于系统',
      offlineMode: '完全离线模式',
      onlineMode: '在线连接',
    },
    header: {
      brandSubtitle: '测绘与地理信息工程外业系统',
      themeSelector: '界面主题切换',
      languageSelector: '多语言切换',
      aboutTooltip: '关于 MESURV 系统 (点击查看详情)',
      currentSubTab: {
        scientific: '工程计算器',
        coord: '坐标转换中心',
        traverse: '导线测量平差',
        leveling: '水准测量手簿',
        area: '泰国地籍面积',
        adjustment: '控制网平差中心',
        curve: '圆曲线放样',
        rebar: '钢筋搭接计算',
        'strap-beam': '地界基础连系梁',
        'rebar-optimizer': '钢筋截断下料',
        earthwork: '土方量与TIN',
      },
    },
    tools: {
      heroTitle: '计算工具与作业平台',
      heroSubtitle: '全流程外业计算终端：大地测量、土木施工、地籍测量与质量核验控制',
      searchPlaceholder: '搜索工具 (如: 导线平差, 水准测量, 圆曲线, 坐标转换, 连系梁, 钢筋优化)...',
      clearSearch: '清除',
      backToDirectory: '← 返回工具目录',
      domainAll: '全部工具',
      domainGeodesy: '🧭 大地测量与测绘',
      domainCivil: '🏗️ 土木工程与施工',
      domainCadastral: '📐 地籍测量与土地',
      domainQaqc: '🔬 质量核验与控制',
      toolLabel: '工具',
      launchTool: '进入工具',
    },
    knowledge: {
      heroTitle: '测绘工程专业知识库',
      heroSubtitle: '测绘仪器操作手册、外业作业规程(SOP)、建筑法规标准、以及现场疑难排查',
      searchPlaceholder: '搜索知识库 (如: 水准仪, 全站仪, GNSS, 无人机, 退让间距, 坐标系)...',
      clearSearch: '清除',
      categoryAll: '全部分类',
      categoryEquipment: '测绘仪器',
      categorySop: '外业规程',
      categoryLaws: '法规与标准',
      categorySite: '施工工程',
      categoryTroubleshooting: '故障排查',
      categoryGlossary: '测绘词典',
      badgeManualUsage: '操作手册',
      badgeManualWork: '作业规范',
      badgeLaw: '法定规范',
      badgeSite: '现场土木',
      badgeTrouble: '故障排除',
      stepsCount: '步骤',
      openTool: '打开关联计算工具',
      openMap: '打开WebGIS地图',
      backToList: '← 返回知识库列表',
    },
    common: {
      calculate: '计算',
      reset: '重置',
      exportCsv: '导出CSV',
      copy: '复制',
      copied: '已复制',
      close: '关闭',
      back: '返回',
      details: '查看详情',
    },
  },
};

/**
 * English concise titles lookup for topics & cards
 */
export const TOPIC_TITLES_EN: Record<string, string> = {
  // Equipment (EQ-01 to EQ-05)
  'level-instrument-manual': 'Optical & Digital Level Guide',
  'theodolite-station-setup': 'Theodolite & Total Station Guide',
  'gnss-instrument-manual': 'GNSS Receiver & RTK Guide',
  'uav-instrument-manual': 'Survey Drone & LiDAR Guide',
  'lidar-slam-instrument-manual': '3D Laser Scanner & SLAM Guide',

  // Field SOPs (SOP-01 to SOP-08)
  'differential-leveling-survey': 'Differential Leveling & Arithmetic Check SOP',
  'closed-loop-traverse': 'Closed Loop Traverse SOP',
  'link-open-traverse': 'Connecting Link Traverse SOP',
  'gnss-rtk-static-survey': 'GNSS Static & RTK Survey SOP',
  'uav-drone-photogrammetry': 'UAV Photogrammetry & GCP SOP',
  'terrestrial-lidar-slam': 'Terrestrial LiDAR & SLAM SOP',
  'hydrographic-bathymetric-survey': 'Hydrographic Survey SOP',
  'tbm-tunnel-guidance-survey': 'TBM Tunnel Guidance SOP',

  // Consolidated Laws (LAW-01 to LAW-06)
  'law-building-control': 'Building Setbacks & Codes',
  'law-land-cadastral': 'Land Cadastral & Boundary Act',
  'law-uav-drone-aviation': 'UAV Aviation & Drone Law',
  'law-excavation-soil-filling': 'Excavation & Soil Filling Act',
  'law-waterways-marine-ingress': 'Navigation in Thai Waters Act',
  'law-engineering-practice-safety': 'Engineering Practice & Safety',

  // Legacy law IDs (for backwards compatibility)
  'law-setback-openspace': 'Building Setback & Codes',
  'law-highrise-extralarge': 'High-Rise & Large Building Codes',
  'law-fire-safety-survey': 'Fire Safety & Egress Standards',
  'law-land-act-cadastral': 'Land Code & Boundary Disputes',

  // Site Engineering (SITE-01 to SITE-04)
  'site-strap-beam-control': 'Boundary Footing & Strap Beam',
  'site-rebar-cut-management': 'Rebar BBS & Cut Optimizer',
  'site-scurve-progress-tracking': 'S-Curve Progress Tracking',
  'site-building-defect-checklist': 'Building Defect Punch List',

  // Legacy site IDs
  'site-strap-beam': 'Boundary Footing & Strap Beam',
  'site-retaining-wall': 'Retaining Wall Alignment Control',
  'site-piling-cutoff': 'Piling Cutoff & Axis Verification',
  'site-borehole-soil': 'Borehole Staking & Geotechnical',
  'site-precast-alignment': 'Precast Plumbness & Axis Control',

  // Field Troubleshooting (TRBL-01 to TRBL-06)
  'trouble-gnss-float': 'GNSS Stuck in Float Solution',
  'trouble-leveling-twopeg': 'Two-Peg Collimation Failure',
  'trouble-traverse-misclosure': 'Traverse Misclosure Exceeded',
  'trouble-boundary-dispute': 'Boundary Marker Lost / Dispute',
  'trouble-resection-geometry': 'Resection Error Too High',
  'trouble-pile-eccentric': 'Pile Eccentricity Out of Spec',
  'trouble-leveling-misclosure': 'Leveling Misclosure Exceeded',
  'trouble-theodolite-prism': 'Total Station Signal Lost',
  'trouble-uav-blur': 'UAV Motion Blur Recovery',
  'trouble-lidar-multipath': 'LiDAR Ghost Point Cloud Noise',
  'trouble-grid-convergence': 'UTM Grid Convergence Exceeded',
};

/**
 * Thai concise titles lookup for cards
 */
export const TOPIC_TITLES_TH: Record<string, string> = {
  // Consolidated Laws (LAW-01 to LAW-06)
  'law-building-control': 'พ.ร.บ. ควบคุมอาคารและระยะร่น',
  'law-land-cadastral': 'ประมวลกฎหมายที่ดินและแนวเขต',
  'law-uav-drone-aviation': 'กฎหมายการบินโดรนสำรวจ (CAAT/NBTC)',
  'law-excavation-soil-filling': 'พ.ร.บ. การขุดดินและถมดิน',
  'law-waterways-marine-ingress': 'พ.ร.บ. การเดินเรือในน่านน้ำไทย',
  'law-engineering-practice-safety': 'พ.ร.บ. วิศวกรและความปลอดภัยไซต์',

  // Site Engineering (SITE-01 to SITE-04)
  'site-strap-beam-control': 'การควบคุมฐานรากชิดเขตและคานรั้ง',
  'site-rebar-cut-management': 'การตัดดัดเหล็กเส้นและลดเศษสูญเสีย',
  'site-scurve-progress-tracking': 'การติดตามความก้าวหน้าด้วย S-Curve',
  'site-building-defect-checklist': 'เกณฑ์การตรวจรับมอบงานอาคาร',
};

/**
 * Chinese titles lookup for topics
 */
export const TOPIC_TITLES_ZH: Record<string, string> = {
  // Equipment (EQ-01 to EQ-05)
  'level-instrument-manual': '自动与数字水准仪操作指南',
  'theodolite-station-setup': '电子经纬仪与全站仪操作指南',
  'gnss-instrument-manual': 'GNSS RTK与CORS接收机操作指南',
  'uav-instrument-manual': '无人机测绘与航测系统操作指南',
  'lidar-slam-instrument-manual': '地面三维激光扫描仪与移动SLAM操作指南',

  // Field SOPs (SOP-01 to SOP-08)
  'differential-leveling-survey': '外业几何水准测量与算术检核规程',
  'closed-loop-traverse': '闭合导线测量与Bowditch平差规程',
  'link-open-traverse': '附合导线测量与施工轴线控制规程',
  'gnss-rtk-static-survey': '大地GNSS静态测量与网络RTK外业规程',
  'uav-drone-photogrammetry': '无人机航摄与地面像控点布设规程',
  'terrestrial-lidar-slam': '地面激光扫描与点云拼接配准规程',
  'hydrographic-bathymetric-survey': '水体水深测量与水下地形测绘规程',
  'tbm-tunnel-guidance-survey': '盾构机(TBM)地下隧道掘进激光导向测量规程',

  // Consolidated Laws (LAW-01 to LAW-06)
  'law-building-control': '建筑法与退让间距规范',
  'law-land-cadastral': '土地法典与地界调处规程',
  'law-uav-drone-aviation': '无人机航空管制与空域法规',
  'law-excavation-soil-filling': '开挖与填土工程安全法规',
  'law-waterways-marine-ingress': '水路通航与临水建筑法规',
  'law-engineering-practice-safety': '执业工程师与现场安全法',

  // Legacy law IDs
  'law-setback-openspace': '建筑退让间距与空地率规范',
  'law-highrise-extralarge': '高层与超大型建筑控制指标',
  'law-fire-safety-survey': '消防疏散通道与防灾测绘标准',
  'law-land-act-cadastral': '土地法典与地界纠纷调处规程 (第69条)',

  // Site Engineering (SITE-01 to SITE-04)
  'site-strap-beam-control': '边界偏心基础与连系梁施工',
  'site-rebar-cut-management': '钢筋配料下料与损耗优化',
  'site-scurve-progress-tracking': 'S曲线施工进度跟踪分析',
  'site-building-defect-checklist': '建筑工程验收与缺陷排查',

  // Legacy site IDs
  'site-strap-beam': '边界偏心基础与连系梁设计',
  'site-retaining-wall': '挡土墙与钢板桩轴线监测',
  'site-piling-cutoff': '桩位放样与桩顶截桩高程核验',
  'site-borehole-soil': '地质勘探孔坐标测放与地层标注',
  'site-precast-alignment': '预制装配构件垂直度与轴线控制',

  // Troubleshooting (TRBL-01 to TRBL-06)
  'trouble-gnss-float': 'GNSS处于FLOAT单点解无法FIX锁定',
  'trouble-leveling-twopeg': '水准仪视准轴误差超限',
  'trouble-traverse-misclosure': '导线闭合差超限分析',
  'trouble-boundary-dispute': '界桩遗失与边界争议',
  'trouble-resection-geometry': '后方交会几何误差超限',
  'trouble-pile-eccentric': '桩位偏心偏差超标处置',
  'trouble-leveling-misclosure': '水准路线闭合差超限',
  'trouble-theodolite-prism': '全站仪测距信号丢失/反射棱镜无返回',
  'trouble-uav-blur': '航拍照相动态模糊导致三维建模失败',
  'trouble-lidar-multipath': '激光点云镜面反射重影与水体噪点',
  'trouble-grid-convergence': 'UTM子午线收敛角与高斯投影变形超标',
};

/**
 * Chinese titles lookup for tools
 */
export const TOOL_TITLES_ZH: Record<string, { name: string; desc: string }> = {
  traverse: {
    name: '导线测量平差',
    desc: '采用Bowditch法进行外业导线闭合差平差计算，核验角度与距离闭合差及1:N精度等级',
  },
  leveling: {
    name: '水准测量手簿',
    desc: '外业水准测量手簿，支持视线高法(HI)与高差法(Rise & Fall)，含闭合算术检核及公差判定',
  },
  coord: {
    name: '坐标转换中心',
    desc: 'WGS84、UTM 47N/48N与Indian 1975大地坐标转换，支持WebGIS地图交互',
  },
  curve: {
    name: '圆曲线放样与计算',
    desc: '圆曲线要素计算及全站仪偏角法放样手簿，支持桩号自动推算与数据导出',
  },
  'strap-beam': {
    name: '地界基础与连系梁',
    desc: '边界独立基础与连系梁平衡验算，求解支座反力、抗拔验算及抗弯受剪配筋',
  },
  'rebar-optimizer': {
    name: '一维钢筋下料优化',
    desc: '基于最佳适应递减算法(BFD)的钢筋定尺截断优化，大幅降低废料损耗并生成彩色排料图',
  },
  rebar: {
    name: '钢筋重量与搭接长度',
    desc: '标准钢筋理论重量(d²/162)、受拉受压搭接长度验算及下料手簿(BBS)',
  },
  scientific: {
    name: '测绘科学与角度计算器',
    desc: '测绘科学计算器，支持度分秒(DMS)与十进制角度互转、三角函数及高级指数运算',
  },
  area: {
    name: '泰国地籍面积换算',
    desc: '泰国地籍土地面积单位(莱-颜-平方哇)与平方米(m²)、公顷及英亩双向精准换算',
  },
  adjustment: {
    name: 'GNSS与控制网平差中心',
    desc: '集成GNSS双差基线解算、RINEX星历图、一维/二维最小二乘平差与95%误差椭圆评估',
  },
  earthwork: {
    name: '2.5D TIN土方挖填方量计算',
    desc: '基于Delaunay 2.5D不规则三角网与精确棱柱截断积分计算土石方挖填方量，替代Carlson / Civil 3D',
  },
};
