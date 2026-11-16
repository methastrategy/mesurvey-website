/**
 * site-knowledge.ts — Lifelong Engineering Knowledge Extension for MESURV
 * Extracted & synthesized from 'ฟงหวิน giveaway' (กฎหมายควบคุมอาคาร 2566, คำศัพท์ช่าง 262 คำ, SOPs)
 * & Thai Geomatics Engineering Standards.
 */

export interface BuildingLawItem {
  id: string;
  category: 'public-road' | 'neighbor-boundary' | 'waterway' | 'structure-footing';
  categoryLabel: string;
  title: string;
  condition: string;
  requirement: string;
  legalClause: string;
  penaltyOrRisk: string;
  fieldTips: string;
}

export interface ConcreteCoveringItem {
  id: string;
  member: string;
  condition: string;
  minCoveringCm: number;
  standardClause: string;
  fieldTips: string;
}

export interface TroubleshootingItem {
  id: string;
  category: 'gnss' | 'leveling' | 'traverse' | 'cadastral' | 'construction';
  categoryLabel: string;
  title: string;
  symptom: string;
  rootCauses: string[];
  fieldDiagnostics: string[];
  actionSteps: string[];
  prevention: string;
  imagePath?: string;
  imageCaption?: string;
}

export type GlossaryCategory = 
  | 'earthwork'
  | 'foundation'
  | 'concrete'
  | 'rebar'
  | 'survey'
  | 'masonry'
  | 'finishing'
  | 'plumbing'
  | 'electrical'
  | 'road'
  | 'contract'
  | 'legal';

export interface GlossaryItem {
  id: string;
  termEn: string;
  termTh: string;
  category: GlossaryCategory | 'civil' | 'geotech';
  categoryLabel: string;
  definition: string;
  fieldUsage: string;
}

export const BUILDING_LAW_ITEMS: BuildingLawItem[] = [
  {
    id: 'law-road-narrow',
    category: 'public-road',
    categoryLabel: 'ระยะร่นจากถนนสาธารณะ',
    title: 'ถนนสาธารณะกว้างน้อยกว่า 6.00 เมตร',
    condition: 'ถนนสาธารณะมีความกว้างของเขตทางน้อยกว่า 6.00 เมตร',
    requirement: "อาคารต้องร่นแนวอาคารห่างจาก 'กึ่งกลางถนนสาธารณะ' ไม่น้อยกว่า 3.00 เมตร",
    legalClause: 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542) ข้อ 41 ตาม พ.ร.บ. ควบคุมอาคาร',
    penaltyOrRisk: 'หากล้ำกึ่งกลาง 3.00 ม. เจ้าพนักงานท้องถิ่นมีอำนาจสั่งระงับการก่อสร้างและสั่งรื้อถอน',
    fieldTips: 'ช่างสำรวจต้องรังวัดหาขอบทางทั้งสองฝั่งเพื่อเฉลี่ยหากึ่งกลางถนน (Centerline) ก่อนนำมารังวัดร่นเข้าหาตัวอาคาร'
  },
  {
    id: 'law-road-6-10m',
    category: 'public-road',
    categoryLabel: 'ระยะร่นจากถนนสาธารณะ',
    title: 'ถนนสาธารณะกว้างตั้งแต่ 6.00 ม. ถึงน้อยกว่า 10.00 ม.',
    condition: 'ถนนสาธารณะมีความกว้างเขตทางตั้งแต่ 6.00 เมตรขึ้นไปแต่น้อยกว่า 10.00 เมตร อาคารสูงไม่เกิน 3 ชั้น หรือไม่เกิน 14 เมตร',
    requirement: "อาคารต้องร่นแนวอาคารห่างจาก 'แนวเขตถนนสาธารณะ' ไม่น้อยกว่า 3.00 เมตร",
    legalClause: 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542) ข้อ 41 (1)',
    penaltyOrRisk: 'ไม่ออกใบอนุญาตก่อสร้าง (อ.1) หรือไม่ผ่านการตรวจรับอาคาร',
    fieldTips: 'วัดจากแนวเขตทางสาธารณะ (ไม่ใช่ขอบผิวจราจรลาดยาง) ต้องสังเกตหมุดเขตทางหรือแนวเสาไฟฟ้า'
  },
  {
    id: 'law-road-10-20m',
    category: 'public-road',
    categoryLabel: 'ระยะร่นจากถนนสาธารณะ',
    title: 'ถนนสาธารณะกว้างตั้งแต่ 10.00 ม. ถึงน้อยกว่า 20.00 ม.',
    condition: 'ถนนสาธารณะมีความกว้างตั้งแต่ 10.00 เมตรขึ้นไปแต่ไม่เกิน 20.00 เมตร อาคารสูงเกิน 3 ชั้น หรือเกิน 14 เมตร',
    requirement: "อาคารต้องร่นแนวอาคารห่างจาก 'แนวเขตถนนสาธารณะ' ไม่น้อยกว่า 5.00 เมตร",
    legalClause: 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542) ข้อ 41 (2)',
    penaltyOrRisk: 'ผิดข้อกำหนดอาคารขนาดใหญ่ / อาคารพาณิชย์',
    fieldTips: 'ตรวจสอบแนวเวนคืนและผังเมืองรวม เพราะแนวเขตถนนอาจมีการขยายในอนาคต'
  },
  {
    id: 'law-neighbor-opening',
    category: 'neighbor-boundary',
    categoryLabel: 'ระยะร่นแนวเขตที่ดินข้างเคียง',
    title: 'อาคารสูงไม่เกิน 9.00 เมตร (มีช่องเปิด/หน้าต่าง/ระเบียง)',
    condition: 'ผนังอาคารมีประตู หน้าต่าง ช่องระบายอากาศ หรือระเบียง สูงไม่เกิน 9.00 เมตร',
    requirement: 'ต้องร่นห่างจากแนวเขตที่ดินข้างเคียงไม่น้อยกว่า 2.00 เมตร',
    legalClause: 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542) ข้อ 50 (1)',
    penaltyOrRisk: 'เพื่อนบ้านมีสิทธิ์ฟ้องร้องบังคับให้ปิดช่องเปิดหรือรื้อถอนได้ตาม ป.พ.พ.',
    fieldTips: 'จุดรังวัดคือระยะห่างจากขอบระเบียงหรือชายคาที่ยื่นออกมามากที่สุดถึงแนวเขตที่ดิน'
  },
  {
    id: 'law-neighbor-opening-tall',
    category: 'neighbor-boundary',
    categoryLabel: 'ระยะร่นแนวเขตที่ดินข้างเคียง',
    title: 'อาคารสูงเกิน 9.00 เมตร แต่ไม่เกิน 23.00 เมตร (มีช่องเปิด)',
    condition: 'ผนังอาคารมีช่องเปิด ประตู หน้าต่าง ช่องแสง สูงเกิน 9.00 เมตร',
    requirement: 'ต้องร่นห่างจากแนวเขตที่ดินข้างเคียงไม่น้อยกว่า 3.00 เมตร',
    legalClause: 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542) ข้อ 50 (2)',
    penaltyOrRisk: 'ถูกสั่งปิดช่องเปิดและห้ามใช้อาคาร',
    fieldTips: 'ตั้งกล้อง Total Station เช็คดิ่งผนังอาคาร (Plumb Alignment) ตลอดแนวความสูง'
  },
  {
    id: 'law-neighbor-blind-wall',
    category: 'neighbor-boundary',
    categoryLabel: 'ระยะร่นแนวเขตที่ดินข้างเคียง',
    title: 'ผนังทึบชิดแนวเขตที่ดิน (ความยินยอมข้างเคียง)',
    condition: 'ผนังทึบไม่มีช่องเปิดใดๆ อาคารสูงไม่เกิน 15.00 เมตร',
    requirement: 'สร้างห่างแนวเขตไม่น้อยกว่า 0.50 เมตร หรือชิดเขตที่ดิน (0.00 ม.) ได้โดยต้องมีหนังสือยินยอมเป็นลายลักษณ์อักษรจากเจ้าของที่ดินข้างเคียง',
    legalClause: 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542) ข้อ 50 วรรคสาม',
    penaltyOrRisk: 'หากไม่มีหนังสือยินยอมแล้วสร้างชิดเขต มีโทษปรับและสั่งรื้อถอน',
    fieldTips: 'ก่อนวางผังหมุดชิดเขต ต้องตรวจสอบว่าหนังสือยินยอมได้รับการรับรองถูกต้องและเจ้าของที่ดินลงนามจริง'
  },
  {
    id: 'law-structure-footing',
    category: 'structure-footing',
    categoryLabel: 'ฐานรากและโครงสร้างชิดเขต',
    title: 'ฐานรากตีนเป็ดและคานดึง (Combined Footing & Strap Beam)',
    condition: 'การก่อสร้างฐานรากอาคารชิดแนวเขตที่ดินเพื่อนบ้าน',
    requirement: 'ฐานรากคอนกรีต เสาเข็ม และส่วนโครงสร้างใต้ดินทุกชนิด ห้ามล้ำแนวเขตที่ดินเด็ดขาด',
    legalClause: 'ประมวลกฎหมายแพ่งและพาณิชย์ และ พ.ร.บ. ควบคุมอาคาร',
    penaltyOrRisk: 'การรุกล้ำอสังหาริมทรัพย์ ละเมิดสิทธิครอบครอง ถูกฟ้องร้องเรียกค่าเสียหายและทุบรื้อ',
    fieldTips: 'ใช้ฐานรากแบบเยื้องศูนย์ (Eccentric Footing) พร้อม Strap Beam เพื่อรั้งเสาไม่ให้ล้ม และรังวัดตรวจสอบตำแหน่งเสาเข็มต้นชิดเขตอย่างเข้มงวด'
  },
  {
    id: 'law-waterway',
    category: 'waterway',
    categoryLabel: 'ระยะร่นจากแหล่งน้ำสาธารณะ',
    title: 'ระยะร่นจากแม่น้ำ ลำคลอง หรือแหล่งน้ำสาธารณะ',
    condition: 'แหล่งน้ำสาธารณะกว้างน้อยกว่า 10 เมตร (ร่น 3 ม.) / กว้าง 10 เมตรขึ้นไป (ร่น 6 ม.) / แหล่งน้ำขนาดใหญ่ เช่น ทะเลสาบหรือทะเล (ร่น 12 ม.)',
    requirement: 'ร่นแนวอาคารห่างจากขอบเขตแหล่งน้ำสาธารณะตามขนาดความกว้างที่กำหนด',
    legalClause: 'กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542) ข้อ 42',
    penaltyOrRisk: 'ถูกปฏิเสธการขออนุญาตก่อสร้าง และผิด พ.ร.บ. การเดินเรือในน่านน้ำไทย',
    fieldTips: 'ขอบเขตแหล่งน้ำคิดจากแนวระดับน้ำขึ้นสูงสุดตามปกติ หรือแนวคันกั้นน้ำสาธารณะ'
  }
];

export const CONCRETE_COVERING_RULES: ConcreteCoveringItem[] = [
  {
    id: 'cov-footing-ground',
    member: 'ฐานรากและส่วนโครงสร้างใต้ดิน',
    condition: 'คอนกรีตหล่อติดกับดินโดยตรงและสัมผัสดินตลอดเวลา',
    minCoveringCm: 7.5,
    standardClause: 'วสท. 1007-34 / ACI 318 Section 20.6.1.3.1',
    fieldTips: 'ต้องหนุนลูกปูนคอนกรีตทรงลูกบาศก์ขนาด 7.5 ซม. ใต้เหล็กตะแกรงฐานราก ห้ามวางเหล็กบนดินโคลน'
  },
  {
    id: 'cov-column-weather',
    member: 'เสาและคานภายนอก',
    condition: 'สัมผัสสภาพอากาศ ผึ่งแดดผึ่งฝน หรือสัมผัสดินหลังถอดแบบ',
    minCoveringCm: 4.0,
    standardClause: 'กฎกระทรวง ฉบับที่ 6 (พ.ศ. 2527) ข้อ 19',
    fieldTips: 'ใช้ลูกปูนหนุนข้างแบบหล่อขนาด 4.0 หรือ 5.0 ซม. ผูกติดกับเหล็กปลอกเสา-คานทุกระยะ 1.0 ม.'
  },
  {
    id: 'cov-beam-inside',
    member: 'คานและเสาภายในอาคาร',
    condition: 'อยู่ภายในอาคาร ไม่สัมผัสอากาศภายนอกหรือดิน',
    minCoveringCm: 3.0,
    standardClause: 'วสท. มาตรฐานคอนกรีตเสริมเหล็ก',
    fieldTips: 'วัดจากผิวหน้าเหล็กปลอกนอกสุดถึงผิวแบบหล่อ ไม่ใช่วัดจากเหล็กแกน'
  },
  {
    id: 'cov-slab-inside',
    member: 'พื้นและผนังภายในอาคาร',
    condition: 'แผ่นพื้นและผนังคอนกรีตภายในอาคาร',
    minCoveringCm: 2.0,
    standardClause: 'กฎกระทรวง ฉบับที่ 6 ข้อ 19',
    fieldTips: 'พื้นหนา 10-15 ซม. ใช้ลูกปูนหนุน 2.0 ซม. รองตะแกรงล่าง และใช้เก้าอี้ดัดเหล็ก (Chair Bar) รับตะแกรงบน'
  },
  {
    id: 'cov-marine',
    member: 'โครงสร้างชายฝั่งทะเล / สภาพแวดล้อมรุนแรง',
    condition: 'สัมผัสน้ำทะเล ละอองน้ำเค็ม หรือไอเกลือ',
    minCoveringCm: 7.0,
    standardClause: 'มาตรฐาน วสท. งานคอนกรีตในสภาวะแวดล้อมรุนแรง',
    fieldTips: 'เพิ่มระยะหุ้มเป็น 7.0 ซม. พร้อมใช้ปูนซีเมนต์ทนซัลเฟตและสารเคลือบผิวกันการแทรกซึมของคลอไรด์'
  }
];

export const FIELD_TROUBLESHOOTING_ITEMS: TroubleshootingItem[] = [
  {
    id: 'trouble-gnss-float',
    imagePath: '/images/troubleshooting/gnss-float.jpg',
    imageCaption: 'หน้าจอคอนโทรลเลอร์แสดงสถานะ Float / Loss of Lock จากสัญญาณสะท้อน Multipath',
    category: 'gnss',
    categoryLabel: 'จีเอ็นเอสเอส (GNSS RTK)',
    title: 'GNSS RTK ค้างสถานะ Float ไม่ยอมเปลี่ยนเป็น Fixed',
    symptom: 'ตัวรับสัญญาณ Rover แสดงสถานะ DGPS หรือ Float ต่อเนื่อง ค่าพิกัดแกว่งเกิน ±20-50 ซม. ไม่สามารถกดบันทึกพิกัดชั้น 1 ได้',
    rootCauses: [
      'สัญญาณ Multipath สะท้อนจากอาคารสูง กระจก หรือแนวต้นไม้หนาทึบ',
      'ค่าเรขาคณิตดาวเทียมแย่ (PDOP > 3.0 หรือ HDOP > 2.0)',
      'คลื่นวิทยุ UHF ภายใน (Internal Radio) ช่องสัญญาณชนกับกลุ่มสำรวจอื่น',
      'เสาส่งสัญญาณ Base ถูกสิ่งกีดขวางบดบัง หรือระยะทาง Baseline ไกลเกินพิกัด (> 10-15 กม.)'
    ],
    fieldDiagnostics: [
      'ตรวจจำนวนดาวเทียมที่รับได้ทั้ง 4 ระบบ (GPS, GLONASS, Galileo, BeiDou) ต้อง ≥ 18 ดวง',
      'ตรวจค่า SNR (Signal-to-Noise Ratio) หากต่ำกว่า 35 dB-Hz แสดงว่ามีสัญญาณรบกวน',
      'ตรวจสถานะไฟรับสัญญาณ Correction (ไฟ Link ต้องกะพริบสม่ำเสมอทุก 1 วินาที)'
    ],
    actionSteps: [
      'ปรับตั้ง Elevation Mask จาก 10° เป็น 15° เพื่อตัดดาวเทียมมุมต่ำที่สะท้อนขอบฟ้า',
      'เปลี่ยนช่องความถี่วิทยุ UHF (Frequency Channel) หรือเปลี่ยน Protocol เช่น TrimTalk450s ↔ Transparent',
      'หากสัญญาณวิทยุบอด ให้สลับไปใช้ NTRIP 4G CORS ผ่าน N-Trip Caster ทันที',
      'กรณีมุมอับใต้อาคาร ให้ตั้งหมุดชั่วคราวในที่โล่ง 2 จุด (Fixed 100%) แล้วส่องรังวัดต่อด้วย Total Station หรือเทปวัดระยะ Offset'
    ],
    prevention: 'วางแผนคาบเวลาการรังวัดล่วงหน้าด้วยซอฟต์แวร์ GNSS Planning ตรวจสอบค่า PDOP ก่อนออกสนาม'
  },
  {
    id: 'trouble-leveling-twopeg',
    imagePath: '/images/troubleshooting/level-misclosure.jpg',
    imageCaption: 'การตรวจสอบสายใยกล้องระดับ Two-Peg Test และการปรับแก้สกรูสายใยราบ',
    category: 'leveling',
    categoryLabel: 'งานระดับ (Leveling)',
    title: 'ตรวจสอบกล้องระดับ Two-Peg Test หลุดเกณฑ์มาตรฐาน',
    symptom: 'ผลต่างสายใยหน้า-หลังสองตำแหน่งคำนวณได้ค่าความคลาดเคลื่อนแนวเล็ง (Collimation Error) C เกินเกณฑ์ (เช่น > 0.003 ม. ต่อ 60 ม.)',
    rootCauses: [
      'ลูกตุ้มชดเชยแม่เหล็ก (Magnetic Compensator) ติดขัดจากการกระแทกหรือการขนส่งบนทางขรุขระ',
      'สกรูปรับแนวสายใยหลังกล้อง (Reticle Adjusting Screw) คลายตัว',
      'อุณหภูมิลำกล้องขยายตัวไม่สม่ำเสมอจากการตากแดดด้านเดียวนานเกินไป'
    ],
    fieldDiagnostics: [
      'ตั้งหมุด A และ B ห่างกันประมาณ 50-60 เมตร',
      'ตั้งกล้องกึ่งกลางอ่านหมุด A และ B ได้ความต่างระดับ deltaH1',
      'ย้ายกล้องไปตั้งชิดหมุด A (ห่าง 3-5 ม.) อ่านหมุด A และ B ได้ deltaH2 เทียบ deltaH1'
    ],
    actionSteps: [
      'หากผลต่าง deltaH1 กับ deltaH2 เกิน 3 มม. ให้เปิดฝาครอบท้ายลำกล้อง',
      'ใช้เข็มปรับแต่ง (Adjusting Pin) ค่อยๆ หมุนสกรูสายใยปรับแนวสายใยราบขึ้นหรือลงทีละ 1/8 รอบ',
      'สูตรแก้ปัญหาเฉพาะหน้าขณะทำงาน: ให้ตั้งกล้องรักษาระยะห่างสายใยหลังและสายใยหน้าให้เท่ากันเป๊ะ (D_BS = D_FS) เสมอ Error จะหักล้างกันเองเป็นศูนย์'
    ],
    prevention: 'ทำ Two-Peg Test ตรวจสอบกล้องระดับทุกสัปดาห์ หรือทุกครั้งก่อนเริ่มงานถ่ายระดับหมุดหลักฐานสำคัญ'
  },
  {
    id: 'trouble-traverse-misclosure',
    imagePath: '/images/troubleshooting/collimation-error.jpg',
    imageCaption: 'การคำนวณทิศทางของเวกเตอร์คลาดเคลื่อนบรรจบวงรอบและตรวจค่าคงที่ปริซึม',
    category: 'traverse',
    categoryLabel: 'งานวงรอบ (Traverse)',
    title: 'ความคลาดเคลื่อนบรรจบวงรอบ (Closure Error) เกินเกณฑ์ 1:N',
    symptom: 'คำนวณวงรอบปิดแล้วได้ Linear Misclosure เกินเกณฑ์ชั้นงาน (เช่น ชั้น 3 ต้องได้ 1:10,000 แต่คำนวณได้ 1:3,500)',
    rootCauses: [
      'ความผิดพลาดเชิงมุม (Angular Error): ส่องเป้าหมายเอียง หรือลูกน้ำฟองยาวบนฐานกล้องไม่ตรงจุด',
      'ความผิดพลาดเชิงระยะ (Linear Distance Error): ป้อนค่า Prism Constant ผิดพลาด (เช่น ใช้เป้า 0 มม. แต่ตั้งค่า -30 มม.)',
      'ขากล้องทรุดตัวในผิวดินนิ่มระหว่างส่องวัดมุมซ้ำสองกล้อง'
    ],
    fieldDiagnostics: [
      'ตรวจสอบผลรวมมุมภายในเทียบกับทฤษฎี (n - 2) * 180° หาก Angular Error ปกติ แสดงว่าเกิดจากระยะทาง',
      'คำนวณทิศทางของเวกเตอร์คลาดเคลื่อน (Azimuth of Misclosure = atan2(dE, dN))',
      'หากทิศทางของ Misclosure ตรงหรือขนานกับด้านใดด้านหนึ่งของวงรอบ แสดงว่าด้านนั้นวัดระยะผิดพลาด 100%'
    ],
    actionSteps: [
      'ตรวจสอบค่าแก้ Prism Constant (-30mm vs 0mm) ของปริซึมที่ใช้งานทุกตัว',
      'ส่องรังวัดทวนซ้ำเฉพาะด้านที่ทิศทางตรงกับเวกเตอร์คลาดเคลื่อน โดยไม่ต้องเดินรังวัดใหม่ทั้งวงรอบ',
      'หากเป็นความผิดพลาดเชิงมุม ให้เฉลี่ยค่าแก้มุมเท่ากันทุกสถานีก่อนคำนวณพิกัดใหม่'
    ],
    prevention: 'ใช้โหมดวัดมุมสองหน้ากล้อง (Face Left & Face Right) เสมอเพื่อตัด Error จากแกนกล้อง'
  },
  {
    id: 'trouble-boundary-dispute',
    imagePath: '/images/troubleshooting/cadastral-discrepancy.jpg',
    imageCaption: 'การเปรียบเทียบรูปแปลงแผนที่โฉนดที่ดินกับหมุดหลักเขตจริงเพื่อชี้จุดคลาดเคลื่อน',
    category: 'cadastral',
    categoryLabel: 'งานที่ดินและแนวเขต (Cadastral)',
    title: 'หมุดหลักเขตที่ดินเดิมสูญหาย หรือแนวเขตคลาดเคลื่อนจากระวาง',
    symptom: 'หาหมุดหลักเขตเดิมไม่พบ หรือขุดพบหมุดแต่ตำแหน่งไม่สอดคล้องกับระยะในรูปแผนที่โฉนดที่ดิน',
    rootCauses: [
      'หมุดถูกเคลื่อนย้ายโดยรถปรับเกรดดิน หรือการลักลอบย้ายหลักเขต',
      'การแปลงพิกัดจากระบบระวางรูปถ่ายทางอากาศเดิม (Indian 1975) สู่ UTM WGS84 มีค่า Displacement ประจำถิ่น',
      'มาตราส่วนในโฉนดโบราณมีข้อคลาดเคลื่อนจากการหดตัวของกระดาษ'
    ],
    fieldDiagnostics: [
      'รังวัดโยงยึดหมุดข้างเคียงอย่างน้อย 3-4 หมุดเพื่อตรวจทานรูปทรงเรขาคณิต (Geometry Check)',
      'ตรวจสอบชื่อผู้ถือกรรมสิทธิ์ข้างเคียง และเลขหลักเขตที่ดินที่สลักบนหัวหมุด'
    ],
    actionSteps: [
      'ห้ามตอกหมุดถาวรใหม่เองโดยพลการ ให้ตอกเฉพาะหมุดพยานชั่วคราว (TBM)',
      "แจ้งเจ้าของที่ดินยื่นคำร้องขอ 'รังวัดชี้ระวังแนวเขตและตรวจสอบเนื้อที่' ต่อสำนักงานที่ดินในพื้นที่",
      'เตรียมตารางเปรียบเทียบพิกัดและระยะตามโฉนดเทียบกับสภาพจริงหน้างานเพื่อส่งมอบให้ช่างรังวัดหลวง'
    ],
    prevention: 'ทำพยานหมุดอ้างอิง (Reference Marks / Offsets) ไว้บนสิ่งก่อสร้างถาวรข้างเคียงเสมอ'
  },
  {
    id: 'trouble-resection-geometry',
    imagePath: '/images/troubleshooting/drone-blur.jpg',
    imageCaption: 'การตรวจสอบเรขาคณิตการเล็งสกัดย้อน (Resection) หลีกเลี่ยงวงกลมอันตราย',
    category: 'traverse',
    categoryLabel: 'งานสกัดย้อน (Resection)',
    title: 'การเล็งสกัดย้อน (Resection Error) ขึ้นค่าความคลาดเคลื่อนสูง',
    symptom: 'กล้อง Total Station คำนวณพิกัดจุดตั้งกล้องแบบ Resection แล้วขึ้น Standard Deviation (SD) เกินเกณฑ์ (เช่น dE > 20 มม., dN > 20 มม.)',
    rootCauses: [
      'จุดตั้งกล้องและหมุดควบคุม 3 จุดอยู่ในแนวเส้นรอบวงเดียวกัน (Dangerous Circle Problem)',
      'มุมระหว่างหมุดควบคุมแคบเกินไป (< 30° หรือ > 150°)',
      'ใส่ความสูงเป้าปริซึมผิดสถานี หรือเป้าเอียงขณะส่องวัด'
    ],
    fieldDiagnostics: [
      'ตรวจสอบเรขาคณิตของหมุดควบคุม ต้องกระจายตัวโอบล้อมจุดตั้งกล้อง มุมตัดที่ดีที่สุดคือใกล้เคียง 90°',
      'ตรวจสอบ Residual ของแต่ละหมุดว่าหมุดใดมี Error โดดเด่นกว่าหมุดอื่น'
    ],
    actionSteps: [
      'ส่องรังวัดเพิ่มหมุดควบคุมจุดที่ 4 เพื่อเพิ่ม Degree of Freedom',
      'หากติดเงื่อนไข Dangerous Circle ให้ย้ายจุดตั้งกล้องออกจากแนววงกลมหมุดทันที',
      'ตรวจเช็คฟองน้ำบนเป้าปริซึมและวัดความสูงเป้าด้วยตลับเมตรทวนซ้ำ'
    ],
    prevention: 'เลือกจุดตั้งกล้องที่มีมุมเปิดมองเห็นหมุดควบคุมกว้างกว่า 60° ขึ้นไปเสมอ'
  },
  {
    id: 'trouble-pile-eccentric',
    imagePath: '/images/troubleshooting/pile-drift.jpg',
    imageCaption: 'การวัดระยะเสาเข็มตอกหนีศูนย์เกินเกณฑ์ 5 ซม. เพื่อส่งวิศวกรออกแบบขยายฐานรากแก้ไข',
    category: 'construction',
    categoryLabel: 'งานโครงสร้าง (Construction)',
    title: 'เสาเข็มตอกหนีศูนย์เกินเกณฑ์มาตรฐาน (> 5-7 ซม.)',
    symptom: 'ช่างสำรวจทำ As-built หัวเสาเข็มแล้วพบว่าศูนย์กลางเสาเข็มที่ตอกจริงเบี่ยงเบนจากแนว Grid Line เกินค่าพิกัดยอมรับได้',
    rootCauses: [
      'ปลายเข็มชนเศษหินหรือสิ่งกีดขวางใต้ดินทำให้เข็มเบี่ยงเบน',
      'ดินอ่อนผิวดินสไลด์ดันหัวเข็มระหว่างขุดเปิดหน้าดิน',
      'การตั้งไลน์ปั้นจั่นเอียงไม่ได้ดิ่งสองทิศทาง'
    ],
    fieldDiagnostics: [
      'รังวัดพิกัด (X, Y) หัวเข็มทุกต้นในกลุ่มฐานรากเพื่อหาจุดศูนย์ถ่วงใหม่ (Centroid of Pile Group)',
      'คำนวณระยะเยื้องศูนย์ e_x และ e_y เทียบกับแกนเสาตอม่อ'
    ],
    actionSteps: [
      'ออกผัง As-built Pile Deviation พร้อมค่า e_x, e_y ส่งให้วิศวกรโครงสร้างคำนวณตรวจสอบทันที',
      'หากโมเมนต์ดัดเกินกำลังเสาเข็ม ให้ขยายขนาดฐานราก (Enlarge Footing) หรือเพิ่มเสาเข็มแซม (Replacement Pile)',
      'เสริมเหล็กคานคอดิน (Strap Beam / Tie Beam) เพื่อช่วยถ่ายแรงโมเมนต์ดัด'
    ],
    prevention: 'ช่างสำรวจต้องตั้งกล้องเช็คดิ่งสองแนวตั้งฉากตลอดช่วงการตอกเสาเข็มจนได้ Last 10 Blows'
  }
];

export const CIVIL_SURVEY_GLOSSARY: GlossaryItem[] = [
  {
    "id": "g-earth-cut-fill",
    "termEn": "Cut and Fill",
    "termTh": "งานดินตัดและดินถม",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "กระบวนการขุดดินส่วนเกินออก (Cut) และนำดินมาถมปรับระดับในส่วนที่ต่ำ (Fill) เพื่อให้ได้ระดับความสูงตามแบบแปลนก่อสร้าง",
    "fieldUsage": "คำนวณปริมาตรดินด้วยวิธี Average End Area หรือ Grid Method จากเส้นชั้นความสูง (Contour)"
  },
  {
    "id": "g-earth-subgrade",
    "termEn": "Subgrade",
    "termTh": "ดินคันทาง / ดินเดิมรองรับโครงสร้าง",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "ชั้นดินธรรมชาติหรือดินคัดเลือกที่ผ่านการบดอัดแน่นเพื่อทำหน้าที่เป็นฐานรองรับโครงสร้างทางหรือพื้นอาคาร",
    "fieldUsage": "ต้องรังวัดระดับผิวดินเดิมและระดับหลังบดอัดเพื่อควบคุมความหนาชั้นโครงสร้างถนน"
  },
  {
    "id": "g-earth-compaction",
    "termEn": "Soil Compaction",
    "termTh": "การบดอัดดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "กระบวนการเพิ่มความหนาแน่นของมวลดินโดยการใช้พลังงานกลไล่อากาศออกจากช่องว่างระหว่างเม็ดดิน เพื่อเพิ่มกำลังรับน้ำหนักและลดการทรุดตัว",
    "fieldUsage": "ควบคุมความหนาบดอัดทีละชั้นไม่เกิน 15-30 ซม. และเช็คระดับก่อน-หลังบดอัดทุกชั้น"
  },
  {
    "id": "g-earth-field-density",
    "termEn": "Field Density Test (FDT)",
    "termTh": "การทดสอบความหนาแน่นดินในสนาม",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "การทดสอบเพื่อหาค่าความหนาแน่นแห้งของดินในสนาม เปรียบเทียบกับค่าความหนาแน่นแห้งสูงสุดจากห้องปฏิบัติการ (Modified/Standard Proctor)",
    "fieldUsage": "วิธี Sand Cone Method มักกำหนดเกณฑ์บดอัดไม่น้อยกว่า 95% ของ Standard หรือ Modified Proctor"
  },
  {
    "id": "g-earth-omc",
    "termEn": "Optimum Moisture Content (OMC)",
    "termTh": "ปริมาณความชื้นที่เหมาะสมที่สุด",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "ปริมาณความชื้นของดินที่ทำให้สามารถบดอัดดินจนได้ค่าความหนาแน่นแห้งสูงสุด (Maximum Dry Density: MDD)",
    "fieldUsage": "หากดินในสนามแห้งเกินไปต้องรดน้ำพรมให้ใกล้เคียง OMC ±2% ก่อนให้รถบดเดินเครื่อง"
  },
  {
    "id": "g-earth-cbr",
    "termEn": "California Bearing Ratio (CBR)",
    "termTh": "อัตราส่วนความสามารถรับน้ำหนักซีบีอาร์",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "ค่าดัชนีบ่งชี้กำลังรับแรงเฉือนของดินคันทางและวัสดุชั้นทาง โดยเปรียบเทียบกับความสามารถรับแรงของหินบดมาตรฐานที่การจมลึกเดียวกัน",
    "fieldUsage": "ดิน Subgrade ทางหลวงทั่วไปกำหนด CBR ≥ 4% ถึง 6% หากต่ำกว่าเกณฑ์ต้องขุดเปลี่ยนวัสดุ (Soil Improvement)"
  },
  {
    "id": "g-earth-slope-stability",
    "termEn": "Slope Stability",
    "termTh": "เสถียรภาพของลาดดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "ความสามารถของลาดดินธรรมชาติหรือลาดดินขุดในการต้านทานการพังทลายหรือการเลื่อนไถล (Slope Failure)",
    "fieldUsage": "บ่อขุดลึกต้องเปิดมุมลาดเอียงตามประเภทดิน (เช่น ดินเหนียว 1:1 ถึง 1:1.5) หรือติดตั้ง Sheet Pile Shoring ป้องกันดินสไลด์"
  },
  {
    "id": "g-earth-dewatering",
    "termEn": "Dewatering",
    "termTh": "การลดระดับน้ำใต้ดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "การสูบระบายน้ำผิวดินและน้ำใต้ดินออกจากพื้นที่ก่อสร้าง เพื่อให้สามารถทำงานในสภาพแห้ง (Dry Condition) ได้อย่างปลอดภัย",
    "fieldUsage": "ระบบ Deep Well หรือ Wellpoint System ต้องระวังผลกระทบการทรุดตัวของอาคารข้างเคียงจากการลดลงของแรงดันน้ำใต้ดิน"
  },
  {
    "id": "g-earth-cofferdam",
    "termEn": "Cofferdam",
    "termTh": "คอกดักน้ำ / เขื่อนกั้นน้ำชั่วคราว",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "โครงสร้างชั่วคราวที่สร้างขึ้นเพื่อกั้นน้ำในแม่น้ำ ลำคลอง หรือพื้นที่น้ำขัง เพื่อสูบน้ำออกและเปิดหน้างานแห้งสำหรับก่อสร้างตอม่อ",
    "fieldUsage": "ต้องรังวัดติดตามการเคลื่อนตัวของผนังคอกกั้นน้ำระหว่างการขุดดินลึกตลอดเวลา"
  },
  {
    "id": "g-earth-sheet-pile",
    "termEn": "Sheet Pile",
    "termTh": "เข็มพืดเหล็ก",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "แผ่นเหล็กรูปรางคลื่นที่ตอกต่อกันด้วยรอยต่อ Interlock รอบแนวบ่อขุด เพื่อทำหน้าที่เป็นกำแพงกันดินและกันน้ำซึม",
    "fieldUsage": "ช่างสำรวจต้องตั้งแนวและเช็คดิ่งของ Sheet Pile ทุกต้นเพื่อป้องกันรอยต่อหลุดระหว่างตอก"
  },
  {
    "id": "g-earth-sump-pit",
    "termEn": "Sump Pit & Pump",
    "termTh": "บ่อพักน้ำซึมและปั๊มระบายน้ำ",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "หลุมต่ำที่ขุดไว้ที่ก้นบ่อก่อสร้างเพื่อรวบรวมน้ำซึมผิวดินและน้ำฝน ก่อนติดตั้งปั๊มจุ่ม (Submersible Pump) สูบออกนอกพื้นที่",
    "fieldUsage": "ต้องขุดบ่อพักให้อยู่นอกแนวขอบฐานรากเพื่อไม่ให้ก้นฐานรากถูกน้ำเซาะพัง"
  },
  {
    "id": "g-earth-borrow-pit",
    "termEn": "Borrow Pit",
    "termTh": "บ่อยืมดิน / แหล่งดินถม",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "แหล่งขุดดินภายนอกที่ได้รับการทดสอบคุณสมบัติแล้วว่ามีเกณฑ์วิศวกรรมเหมาะสมเพื่อนำมาใช้เป็นดินถมโครงการ",
    "fieldUsage": "สำรวจรังวัด Cross Section แหล่งยืมดินก่อนและหลังการขุดเพื่อคำนวณปริมาตรดินจ่ายเงิน"
  },
  {
    "id": "g-earth-spoil-bank",
    "termEn": "Spoil Bank / Disposal Area",
    "termTh": "กองดินทิ้ง / ที่ทิ้งดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "พื้นที่ที่กำหนดไว้สำหรับนำดินขุดส่วนเกินที่ไม่ได้คุณภาพหรือไม่ต้องการใช้งานไปทิ้งหรือเกลี่ยกอง",
    "fieldUsage": "ต้องสำรวจระดับพื้นที่ทิ้งดินและวางแผนทางระบายน้ำไม่ให้ดินไหลไปรบกวนที่ดินข้างเคียง"
  },
  {
    "id": "g-earth-trenching",
    "termEn": "Trenching & Excavation",
    "termTh": "การขุดร่องดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "การขุดดินเป็นร่องแคบยาวตามแนวเพื่อวางท่อระบายน้ำ ท่อประปา หรือสายไฟใต้ดิน",
    "fieldUsage": "ร่องขุดลึกเกิน 1.50 ม. ตามกฎหมายความปลอดภัยต้องติดตั้งค้ำยัน (Trench Box / Shoring) เสมอ"
  },
  {
    "id": "g-earth-grader",
    "termEn": "Motor Grader",
    "termTh": "รถเกลี่ยดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "เครื่องจักรกลหนักที่มีใบมีดยาวปรับมุมได้ สำหรับเกลี่ยดิน ปรับระดับความลาดเอียง และแต่งขอบคันทางให้ได้ระดับตามหมุดบอกระดับ",
    "fieldUsage": "ช่างสำรวจจะตอกหมุดบอกระดับ (Blue Top Pins) ทุก 20-25 ม. ให้คนขับเกลี่ยตามยอดหมุด"
  },
  {
    "id": "g-earth-shoring",
    "termEn": "Shoring System",
    "termTh": "ระบบค้ำยันดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "โครงสร้างชั่วคราวประกอบด้วยเสาเข็มพืด คานรัดรอบ (Waling) และค้ำยันเฉียง (Strut) เพื่อพยุงผนังบ่อขุดลึก",
    "fieldUsage": "ติดตั้งหมุด Settlement Monitoring และ Inclinometer ติดตามการเสียรูปของกำแพงค้ำยัน"
  },
  {
    "id": "g-earth-slurry-wall",
    "termEn": "Diaphragm Wall / Slurry Wall",
    "termTh": "กำแพงไดอะแฟรม",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "กำแพงคอนกรีตเสริมเหล็กหล่อในที่ใต้ดินลึก ก่อสร้างโดยใช้สารละลายเบนโทไนต์พยุงร่องขุด นิยมใช้ในชั้นใต้ดินอาคารสูงและสถานีรถไฟฟ้าใต้ดิน",
    "fieldUsage": "ตรวจสอบดิ่งร่องขุดด้วยเครื่อง Ultrasonic Monitor (Koden) ก่อนหย่อนกรงเหล็ก"
  },
  {
    "id": "g-earth-soil-nail",
    "termEn": "Soil Nailing",
    "termTh": "การตอกเสริมเหล็กยึดดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "เทคนิคเสริมกำลังลาดดินโดยการเจาะสว่านสอดเหล็กข้ออ้อย ฉีดอัดน้ำปูนเกราต์ และพ่นคอนกรีต (Shotcrete) ปิดผิวลาด",
    "fieldUsage": "ทดสอบแรงดึงถอน (Pull-out Test) ของเหล็ก Soil Nail เพื่อยืนยันกำลังยึดเหนี่ยวตามแบบคำนวณ"
  },
  {
    "id": "g-earth-geotextile",
    "termEn": "Geotextile",
    "termTh": "แผ่นใยสังเคราะห์รองงานดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "แผ่นผ้าสังเคราะห์ชนิดทอหรือไม่ทอ ใช้ทำหน้าที่แยกชั้นวัสดุ (Separation) กรองน้ำ (Filtration) และเสริมกำลังลาดดิน (Reinforcement)",
    "fieldUsage": "ปูใต้ชั้นหินคลุกบนดินอ่อนเพื่อป้องกันหินคลุกจมหายลงไปในชั้นดินเหนียว"
  },
  {
    "id": "g-earth-stripping",
    "termEn": "Topsoil Stripping",
    "termTh": "การลอกหน้าดินเดิม",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "การขูดลอกชั้นดินบนสุดที่มีซากวัชพืช รากไม้ และอินทรียวัตถุออกหนาประมาณ 15-30 ซม. ก่อนเริ่มงานถมดินทางวิศวกรรม",
    "fieldUsage": "ต้องสำรวจระดับ Ground Elevation ทั้งก่อนและหลังการลอกหน้าดินเพื่อคิดปริมาตร Clearing & Grubbing"
  },
  {
    "id": "g-earth-backfill",
    "termEn": "Backfill",
    "termTh": "งานดินถมคืน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "การนำดินคัดเลือก หินคลุก หรือทรายถมกลับเข้าไปในหลุมฐานรากหรือร่องท่อหลังก่อสร้างโครงสร้างใต้ดินเสร็จสิ้น",
    "fieldUsage": "ห้ามใช้เศษขยะ เศษอิฐหัก หรือดินโคลนเป็นดินถมคืน และต้องบดอัดแน่นเป็นชั้นๆ เพื่อกันพื้นทรุดรอบอาคาร"
  },
  {
    "id": "g-earth-swelling",
    "termEn": "Soil Swelling & Shrinkage",
    "termTh": "การบวมตัวและการหดตัวของดิน",
    "category": "earthwork",
    "categoryLabel": "งานดิน & งานขุดถม",
    "definition": "พฤติกรรมของดินที่ขยายตัวเมื่อสัมผัสน้ำและหดตัวแตกระแหงเมื่อแห้ง โดยเฉพาะดินเหนียวประเภทแอกทีฟสูง",
    "fieldUsage": "งานวางท่อและฐานรากบนดินบวมตัวต้องออกแบบรอยต่อท่อแบบยืดหยุ่น (Flexible Joint) รองรับการขยับตัว"
  },
  {
    "id": "g-fnd-driven-pile",
    "termEn": "Driven Precast Pile",
    "termTh": "เสาเข็มคอนกรีตอัดแรงหล่อสำเร็จตอก",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "เสาเข็มคอนกรีตอัดแรงรูปไอ (I-Section) หรือสี่เหลี่ยมตัน ที่ผลิตจากโรงงานและตอกลงดินด้วยปั้นจั่นลูกตุ้มหรือดีเซลแฮมเมอร์",
    "fieldUsage": "ช่างสำรวจต้องคอยเล็งกล้อง 2 ตัวตั้งฉากกันตรวจแนวดิ่งตลอดช่วงการตอกเสาเข็ม"
  },
  {
    "id": "g-fnd-bored-pile",
    "termEn": "Bored Cast-in-Place Pile",
    "termTh": "เสาเข็มเจาะ",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "เสาเข็มที่ก่อสร้างโดยการเจาะเปิดหลุมดินลงไป หย่อนกรงเหล็กเสริม แล้วเทคอนกรีตสดแทนที่ เหมาะกับพื้นที่ชิดเขตเพื่อนบ้านเพื่อลดแรงสั่นสะเทือน",
    "fieldUsage": "ต้องรังวัดพิกัดศูนย์กลางปลอกเหล็กกันดิน (Temporary Casing) ทั้งก่อนเจาะและหลังหย่อนกรงเหล็ก"
  },
  {
    "id": "g-fnd-micropile",
    "termEn": "Micropile",
    "termTh": "เสาเข็มไมโครไพล์",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "เสาเข็มขนาดเล็กเส้นผ่านศูนย์กลาง 15-25 ซม. สปันหรือเหล็กกลวง ใช้ปั้นจั่นขนาดกะทัดรัด นิยมใช้ในงานต่อเติมบ้านหรือพื้นที่แคบชิดอาคารเดิม",
    "fieldUsage": "ตรวจสอบรอยต่อเชื่อมหัวเข็มไมโครไพล์ให้แนบสนิทและเชื่อมรอบเต็มรอยก่อนตอกท่อนถัดไป"
  },
  {
    "id": "g-fnd-pile-cap",
    "termEn": "Pile Cap",
    "termTh": "ฐานรากครอบหัวเสาเข็ม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "โครงสร้างคอนกรีตเสริมเหล็กที่หล่อครอบกลุ่มหัวเสาเข็มเพื่อรวมและถ่ายน้ำหนักจากเสาหรือตอม่อลงสู่เสาเข็มอย่างสม่ำเสมอ",
    "fieldUsage": "ต้องสกัดหัวเข็ม (Cut-off Pile) ให้ได้ระดับ Cut-off Level ที่ระบุในแบบ และเหล็กเดือยเข็มต้องยาวฝังเข้าฐานรากตามมาตรฐาน"
  },
  {
    "id": "g-fnd-isolated-footing",
    "termEn": "Isolated Footing (Pad Footing)",
    "termTh": "ฐานรากเดี่ยว / ฐานแผ่เดี่ยว",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "ฐานรากที่รองรับน้ำหนักจากเสาเพียงต้นเดียว สามารถเป็นได้ทั้งฐานรากวางบนดินโดยตรง (Shallow Footing) หรือวางบนหัวเสาเข็ม",
    "fieldUsage": "วางผังตะปูกลางฐานและตรวจสอบระดับก้นหลุมก่อนเทคอนกรีตหยาบ (Lean Concrete)"
  },
  {
    "id": "g-fnd-combined-footing",
    "termEn": "Combined Footing",
    "termTh": "ฐานรากร่วม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "ฐานรากผืนเดียวที่รองรับเสาตั้งแต่สองต้นขึ้นไป นิยมใช้เมื่อเสาอยู่ใกล้กันมากจนฐานรากเดี่ยวซ้อนทับกัน หรือเสาชิดแนวเขตที่ดิน",
    "fieldUsage": "การคำนวณต้องให้จุดศูนย์ถ่วงของพื้นที่ฐานรากตรงกับจุดศูนย์ถ่วงรวมของน้ำหนักเสาเพื่อลดโมเมนต์ดัด"
  },
  {
    "id": "g-fnd-strap-footing",
    "termEn": "Strap Footing (Cantilever Footing)",
    "termTh": "ฐานรากคานรั้ง / ฐานรากตีนเป็ด",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "ระบบฐานรากสองฐานที่เชื่อมต่อกันด้วยคานรั้งแข็งเกร็ง (Strap Beam) เพื่อถ่ายแรงดัดจากฐานรากเยื้องศูนย์ชิดเขตไปยังฐานรากต้นใน",
    "fieldUsage": "วิศวกรสำรวจต้องให้ไลน์แกนคานดึงตรงกับแนวศูนย์กลางเสาเพื่อป้องกันแรงบิด (Torsion)"
  },
  {
    "id": "g-fnd-raft-mat",
    "termEn": "Mat / Raft Foundation",
    "termTh": "ฐานรากแพ",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "ฐานรากคอนกรีตเสริมเหล็กแผ่นหนาต่อเนื่องขนาดใหญ่ที่รองรับเสาทั้งหมดของอาคาร ช่วยกระจายน้ำหนักลงดินและลดการทรุดตัวต่างระดับ",
    "fieldUsage": "ต้องควบคุมอุณหภูมิระหว่างการบ่มคอนกรีตหนาพิเศษ (Mass Concrete) ป้องกันการแตกร้าวจากความร้อน"
  },
  {
    "id": "g-fnd-strip-footing",
    "termEn": "Strip Footing (Wall Footing)",
    "termTh": "ฐานรากแนวยาว / ฐานรากกำแพง",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "ฐานรากคอนกรีตรองรับแนวยาวต่อเนื่องใต้ผนังรับน้ำหนัก (Bearing Wall) หรือกำแพงกันดิน",
    "fieldUsage": "ตรวจสอบระดับท้องคานแนวยาวให้ได้ระนาบเพื่อไม่ให้ผนังก่อด้านบนเกิดรอยร้าวเฉียง"
  },
  {
    "id": "g-fnd-end-bearing",
    "termEn": "End Bearing Capacity",
    "termTh": "กำลังรับน้ำหนักที่ปลายเสาเข็ม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "ความสามารถในการรับน้ำหนักของเสาเข็มที่ได้จากแรงต้านทานที่ปลายเข็มหยั่งลึกลงในชั้นดินแข็งหรือชั้นหิน",
    "fieldUsage": "ควบคุมการตอกเข็มให้ได้เกณฑ์ Last 10 Blows ตามรายการคำนวณของวิศวกรโครงสร้าง"
  },
  {
    "id": "g-fnd-skin-friction",
    "termEn": "Skin Friction (Shaft Resistance)",
    "termTh": "แรงเสียดทานผิวเสาเข็ม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "แรงต้านทานการทรุดตัวของเสาเข็มที่เกิดขึ้นระหว่างผิวด้านข้างของเสาเข็มกับมวลดินโดยรอบ",
    "fieldUsage": "ในชั้นดินเหนียวกรุงเทพฯ ช่วง 0-15 ม. แรงเสียดทานผิวเป็นกลไกหลักในการรับน้ำหนักของเข็มสั้น"
  },
  {
    "id": "g-fnd-dynamic-load-test",
    "termEn": "Dynamic Load Test (PDA)",
    "termTh": "การทดสอบกำลังรับน้ำหนักเสาเข็มแบบพลศาสตร์",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "การทดสอบกำลังรับน้ำหนักของเสาเข็มโดยใช้ลูกตุ้มกระแทกหัวเข็มและตรวจจับคลื่นความเค้นด้วยหัววัด Strain Transducer และ Accelerometer",
    "fieldUsage": "วิเคราะห์ผลด้วยสมการ CAPWAP ยืนยันกำลังรับน้ำหนักปลอดภัยและความสมบูรณ์ของท่อนเข็ม"
  },
  {
    "id": "g-fnd-static-load-test",
    "termEn": "Static Pile Load Test",
    "termTh": "การทดสอบกำลังรับน้ำหนักเสาเข็มแบบสถิตศาสตร์",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "การทดสอบโดยใช้น้ำหนักบรรทุกจริง (Kentledge) หรือเสาเข็มสมอยึด แม่แรงไฮดรอลิกกดหัวเข็มและวัดการทรุดตัวด้วย Dial Gauge",
    "fieldUsage": "เป็นการทดสอบที่แม่นยำที่สุดตามมาตรฐาน ASTM D1143 ใช้ยืนยันความจุแบกทานของเสาเข็มต้นทดสอบก่อนเริ่มงานจริง"
  },
  {
    "id": "g-fnd-seismic-sonic-test",
    "termEn": "Sonic Echo / Low Strain Integrity Test",
    "termTh": "การทดสอบความสมบูรณ์เสาเข็มด้วยคลื่นเสียง (Seismic)",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "การใช้ค้อนเคาะหัวเสาเข็มเพื่อส่งคลื่นเสียงความถี่ต่ำลงไป และรับสัญญาณสะท้อนกลับเพื่อตรวจหาคอคอด รอยแตก หรือโพรงในเข็มเจาะ",
    "fieldUsage": "หัวเข็มต้องสกัดคอนกรีตที่แตกร้าวออกให้ถึงเนื้อคอนกรีตดีและผิวเรียบก่อนติดตั้ง Accelerometer"
  },
  {
    "id": "g-fnd-cross-hole-sonic",
    "termEn": "Cross-hole Sonic Logging (CSL)",
    "termTh": "การทดสอบความสมบูรณ์เสาเข็มเจาะแบบอัลตราโซนิกข้ามท่อ",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "การหย่อนหัววัดคลื่นเสียงอัลตราโซนิกผ่านท่อเหล็ก (Sonic Tubes) ที่ผูกติดกรงเหล็กเข็มเจาะ เพื่อสแกนหาข้อบกพร่องตลอดความยาวเข็ม",
    "fieldUsage": "ต้องกรอกน้ำสะอาดให้เต็มท่อโซนิกทันทีหลังเทคอนกรีตเสร็จเพื่อป้องกันท่อบุบและเป็นตัวกลางส่งคลื่น"
  },
  {
    "id": "g-fnd-pile-deviation",
    "termEn": "Pile Deviation / Eccentricity",
    "termTh": "เสาเข็มหนีศูนย์",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "ระยะห่างระหว่างตำแหน่งศูนย์กลางของเสาเข็มที่ตอกจริงเทียบกับพิกัดที่กำหนดในแบบแปลน",
    "fieldUsage": "หากหนีศูนย์เกิน 5-7 ซม. ช่างสำรวจต้องทำผัง As-built Pile Deviation ให้วิศวกรโครงสร้างคำนวณขยายฐานรากหรือเสริมคานดึง"
  },
  {
    "id": "g-fnd-negative-skin-friction",
    "termEn": "Negative Skin Friction (Downdrag)",
    "termTh": "แรงฉุดลงผิวเสาเข็ม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "แรงดึงลงที่กระทำต่อผิวเสาเข็มเมื่อดินรอบเสาเข็มเกิดการทรุดตัวเร็วกว่าตัวเสาเข็ม เช่น บริเวณที่มีการถมดินใหม่หนามาก",
    "fieldUsage": "ต้องพิจารณาบวกค่าน้ำหนักฉุดลงนี้เพิ่มเข้าไปในแรงกดเสาเข็ม หรือใช้สารเคลือบ Asphalt Coat ผิวเข็ม"
  },
  {
    "id": "g-fnd-underpinning",
    "termEn": "Underpinning",
    "termTh": "การเสริมฐานรากอาคารเดิม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "กระบวนการเสริมความมั่นคงแข็งแรงให้กับฐานรากเดิมที่ชำรุด หรือเมื่อมีการขุดดินลึกติดอาคารเดิม โดยการกดเข็มไมโครไพล์หรือเจาะเกราต์เสริม",
    "fieldUsage": "ต้องติดตั้งเซนเซอร์ตรวจวัดระดับและการเอียง (Tilt Sensor) บันทึกค่าแบบเรียลไทม์ระหว่างทำงาน"
  },
  {
    "id": "g-fnd-differential-settlement",
    "termEn": "Differential Settlement",
    "termTh": "การทรุดตัวต่างระดับ",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "สภาพที่ส่วนต่างๆ ของฐานรากอาคารทรุดตัวไม่เท่ากัน ทำให้โครงสร้างเกิดความเค้นดัดและบิดตัวจนเกิดรอยร้าว",
    "fieldUsage": "งานสำรวจติดตาม (Settlement Monitoring) ต้องใช้กล้องระดับความละเอียดสูง Class 1 ส่องวัดทุกสัปดาห์"
  },
  {
    "id": "g-fnd-lean-concrete",
    "termEn": "Lean Concrete (Blinding Concrete)",
    "termTh": "คอนกรีตหยาบรองก้นหลุม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "คอนกรีตผสมบาง (กำลังอัดประมาณ 100-150 ksc) เทรองก้นหลุมขุดหนา 5-10 ซม. เพื่อเป็นผิวสะอาดสำหรับผูกเหล็กและป้องกันสิ่งสกปรกปนเปื้อน",
    "fieldUsage": "ห้ามวางลูกปูนและกรงเหล็กฐานรากลงบนดินโคลนโดยไม่มีคอนกรีตหยาบรอง"
  },
  {
    "id": "g-fnd-pile-blow-count",
    "termEn": "Blow Count & Last 10 Blows",
    "termTh": "จำนวนครั้งการตอกและสิบค้อนสุดท้าย",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "การนับจำนวนครั้งที่ลูกตุ้มปั้นจั่นกระแทกเสาเข็ม และระยะการจมลงของเสาเข็มในการตอก 10 ครั้งสุดท้ายเพื่อคำนวณหากำลังแบกทานตามสูตรการตอก",
    "fieldUsage": "บันทึกค่าระยะจม (Set) ลงบนกระดาษกราฟที่แนบข้างเสาเข็มจริงขณะตอก"
  },
  {
    "id": "g-fnd-caisson",
    "termEn": "Open Caisson / Well Foundation",
    "termTh": "ฐานรากบ่อจม",
    "category": "foundation",
    "categoryLabel": "งานฐานราก & เสาเข็ม",
    "definition": "โครงสร้างคอนกรีตทรงกระบอกกลวงขนาดใหญ่ที่หล่อบนผิวดินแล้วขุดดินจากภายในบ่อออก เพื่อให้ตัวบ่อค่อยๆ จมลงด้วยน้ำหนักตัวเองจนถึงชั้นดินแข็ง",
    "fieldUsage": "นิยมใช้ก่อสร้างตอม่อสะพานข้ามแม่น้ำ ต้องควบคุมแนวดิ่งไม่ให้บ่อเอียงระหว่างขุดจม"
  },
  {
    "id": "g-con-ready-mix",
    "termEn": "Ready-Mixed Concrete (RMC)",
    "termTh": "คอนกรีตผสมเสร็จ",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "คอนกรีตที่ผสมตามอัตราส่วนชั่งตวงวัดจากโรงงาน (Batching Plant) และขนส่งด้วยรถโม่คอนกรีตมาเทที่หน้างานก่อสร้าง",
    "fieldUsage": "ต้องบันทึกเวลาที่รถออกจากแพลนต์ คอนกรีตต้องเทลงแบบหล่อให้เสร็จภายในเวลาไม่เกิน 1.5 - 2 ชั่วโมง"
  },
  {
    "id": "g-con-slump-test",
    "termEn": "Slump Test",
    "termTh": "การทดสอบความยุบตัวของคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "การทดสอบความสามารถในการเทได้และความคงตัวของคอนกรีตสดก่อนเทลงแบบหล่อ โดยใช้โคนทดสอบทรงกรวยมาตรฐาน",
    "fieldUsage": "คานและเสาทั่วไปสลัมป์ประมาณ 10 ± 2.5 ซม. หากสลัมป์ไม่ได้เกณฑ์ห้ามเติมน้ำหน้างานเด็ดขาด"
  },
  {
    "id": "g-con-water-cement-ratio",
    "termEn": "Water-Cement Ratio (w/c)",
    "termTh": "อัตราส่วนน้ำต่อซีเมนต์",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "อัตราส่วนโดยน้ำหนักของน้ำต่อน้ำยาประสาน (ซีเมนต์และเถ้าลอย) ซึ่งเป็นตัวแปรหลักที่ควบคุมกำลังอัดและความคงทนของคอนกรีต",
    "fieldUsage": "ค่ายิ่งต่ำกำลังอัดยิ่งสูง คอนกรีตโครงสร้างทั่วไปควบคุม w/c ระหว่าง 0.40 - 0.50"
  },
  {
    "id": "g-con-compressive-strength",
    "termEn": "Compressive Strength (fc')",
    "termTh": "กำลังอัดประลัยของคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "ค่าความสามารถในการต้านทานแรงอัดสูงสุดของคอนกรีตที่อายุ 28 วัน วัดเป็นหน่วย ksc (กก./ตร.ซม.) หรือ MPa",
    "fieldUsage": "ต้องระบุชัดเจนว่าเป็นตัวอย่างทรงกระบอก (Cylinder 15x30 ซม.) หรือทรงลูกบาศก์ (Cube 15x15 ซม.) โดย Cube มีค่าสูงกว่า Cylinder ประมาณ 1.25 เท่า"
  },
  {
    "id": "g-con-bleeding",
    "termEn": "Bleeding",
    "termTh": "การเยิ้มน้ำของคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "ปรากฏการณ์ที่น้ำในคอนกรีตสดลอยตัวขึ้นสู่ผิวด้านบนเนื่องจากการตกตะกอนของมวลรวมหนัก",
    "fieldUsage": "หากเยิ้มน้ำมากเกินไปผิวหน้าจะร่วนและหลุดร่อนง่าย ห้ามปาดผิวแต่งหน้าจนกว่าน้ำเยิ้มจะระเหยหมด"
  },
  {
    "id": "g-con-segregation",
    "termEn": "Segregation",
    "termTh": "การแยกตัวของคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "การแยกตัวของหินหรือมวลรวมหยาบออกจากเนื้อปูนซีเมนต์เพสต์ เกิดจากการเทตกอิสระจากที่สูงเกินไปหรือการจี้เขย่ามากเกินไป",
    "fieldUsage": "ระยะเทตกอิสระ (Free Fall) ต้องไม่เกิน 1.50 ม. หากเทเสาสูงต้องใช้ท่อเท (Tremie Pipe หรือ Drop Chute)"
  },
  {
    "id": "g-con-honeycomb",
    "termEn": "Honeycomb",
    "termTh": "โพรงรวงผึ้งในคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "โพรงช่องว่างในเนื้อคอนกรีตที่เกิดจากหินอัดตัวไม่แน่นและไม่มีมอร์ตาร์เข้าไปแทรก มักพบตามมุมแบบและใต้เหล็กเสริมหนาแน่น",
    "fieldUsage": "ป้องกันได้โดยการใช้เครื่องจี้คอนกรีต (Vibrator) ที่ถูกวิธี และเคาะแบบหล่อภายนอกช่วย"
  },
  {
    "id": "g-con-cold-joint",
    "termEn": "Cold Joint",
    "termTh": "รอยต่อคอนกรีตที่แข็งตัวก่อน (รอยต่อเย็น)",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "รอยต่อที่ไม่พึงประสงค์ เกิดจากการเทคอนกรีตชุดใหม่ลงบนคอนกรีตชุดเดิมที่เริ่มแข็งตัวไปแล้ว ทำให้ไม่ประสานเป็นเนื้อเดียวกัน",
    "fieldUsage": "วางแผนจังหวะรถปูนไม่ให้ขาดตอน หากเกิดรอยต่อต้องสกัดผิวให้ขรุขระ ทำความสะอาด และทาน้ำยาประสานคอนกรีต"
  },
  {
    "id": "g-con-curing",
    "termEn": "Concrete Curing",
    "termTh": "การบ่มคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "กระบวนการควบคุมความชื้นและอุณหภูมิของคอนกรีตหลังแข็งตัว เพื่อให้ปฏิกิริยาไฮเดรชันดำเนินไปอย่างสมบูรณ์จนได้กำลังตามที่ออกแบบ",
    "fieldUsage": "ต้องบ่มชื้นต่อเนื่องอย่างน้อย 7 วัน สำหรับปูนซีเมนต์ปอร์ตแลนด์ประเภท 1 โดยการขังน้ำ บ่มกระสอบเปียก หรือพ่นน้ำยาบ่ม"
  },
  {
    "id": "g-con-formwork",
    "termEn": "Formwork / Shuttering",
    "termTh": "แบบหล่อคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "โครงสร้างชั่วคราวทำจากไม้ เหล็ก หรือพลาสติก เพื่อพยุงและกักคอนกรีตสดให้อยู่ในรูปทรงและขนาดตามแบบแปลนจนกว่าจะแข็งตัวรับน้ำหนักได้",
    "fieldUsage": "ช่างสำรวจต้องตรวจระดับท้องคาน (Soffit) และแนวดิ่งของแบบเสาก่อนเทคอนกรีตเสมอ"
  },
  {
    "id": "g-con-falsework",
    "termEn": "Falsework / Shoring Props",
    "termTh": "นั่งร้านค้ำยันแบบหล่อ",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "ระบบเสาค้ำยันและนั่งร้านชั่วคราวที่รองรับน้ำหนักของแบบหล่อ คอนกรีตสด เหล็กเสริม และคนทำงาน",
    "fieldUsage": "ห้ามถอดค้ำยันท้องคานจนกว่าคอนกรีตจะมีกำลังรับน้ำหนักได้ตามเกณฑ์มาตรฐาน (อย่างน้อย 14-28 วัน)"
  },
  {
    "id": "g-con-admixture",
    "termEn": "Chemical Admixture",
    "termTh": "น้ำยาผสมคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "สารเคมีที่เติมลงในคอนกรีตระหว่างการผสมเพื่อปรับปรุงคุณสมบัติ เช่น หน่วงการก่อตัว เพิ่มการไหลตัว หรือลดปริมาณน้ำ",
    "fieldUsage": "น้ำยา Superplasticizer ช่วยลดน้ำได้สูงถึง 20-30% ทำให้ได้คอนกรีตกำลังสูงพิเศษ (High-Strength Concrete)"
  },
  {
    "id": "g-con-retarder",
    "termEn": "Retarding Admixture",
    "termTh": "น้ำยาหน่วงการก่อตัว",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "สารเคมีผสมเพิ่มที่ช่วยชะลออัตราการเกิดปฏิกิริยาไฮเดรชัน ทำให้คอนกรีตแข็งตัวช้าลง เหมาะกับการขนส่งระยะไกลหรืองานเท Mass Concrete",
    "fieldUsage": "ช่วยป้องกันการเกิด Cold Joint ในโครงสร้างขนาดใหญ่ที่มีปริมาณการเทต่อเนื่องหลายร้อยคิว"
  },
  {
    "id": "g-con-accelerator",
    "termEn": "Accelerating Admixture",
    "termTh": "น้ำยาเร่งการก่อตัว",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "สารเคมีที่ช่วยเร่งอัตราการเกิดปฏิกิริยาไฮเดรชัน ทำให้คอนกรีตก่อตัวเร็วและพัฒนากำลังในระยะต้นได้สูงขึ้น",
    "fieldUsage": "นิยมใช้ในงานซ่อมแซมผิวจราจรเร่งด่วน หรืองานที่ต้องการถอดแบบหล่อเร็ว (Precast Yard)"
  },
  {
    "id": "g-con-vibrator",
    "termEn": "Concrete Vibrator (Poker)",
    "termTh": "เครื่องจี้เขย่าคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "อุปกรณ์สร้างแรงสั่นสะเทือนเพื่อช่วยไล่ฟองอากาศและทำให้คอนกรีตสดไหลห่อหุ้มเหล็กเสริมได้อย่างทั่วถึง",
    "fieldUsage": "จุ่มหัวจี้ในแนวดิ่ง ระยะห่างแต่ละจุดประมาณ 1.5 เท่าของรัศมีหัวจี้ จุ่มค้าง 5-15 วินาที ห้ามใช้หัวจี้ลากปูน"
  },
  {
    "id": "g-con-chamfer",
    "termEn": "Chamfer Strip",
    "termTh": "บัวลบเหลี่ยม / ไม้สามเหลี่ยมลบมุม",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "แถบไม้หรือพลาสติกสามเหลี่ยมที่ติดไว้ตามขอบมุมของแบบหล่อ เพื่อให้ขอบเสาหรือคานมีมุมตัดเฉียงสวยงามและไม่บิ่นแตกง่าย",
    "fieldUsage": "ติดตั้งตามแนวขอบมุมเสาและคานภายนอกที่ต้องโชว์ผิวคอนกรีตเปลือย"
  },
  {
    "id": "g-con-mass-concrete",
    "termEn": "Mass Concrete",
    "termTh": "คอนกรีตหลา / คอนกรีตมวลหนา",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "โครงสร้างคอนกรีตที่มีขนาดความหนามาก (เกิน 0.8 - 1.0 ม.) ซึ่งความร้อนจากปฏิกิริยาไฮเดรชันภายในอาจสูงจนทำให้ผิวแตกร้าว",
    "fieldUsage": "ต้องควบคุมผลต่างอุณหภูมิระหว่างแกนกลางและผิวคอนกรีตไม่ให้เกิน 20°C โดยติดหัววัด Thermocouple ติดตามผล"
  },
  {
    "id": "g-con-plastic-shrinkage",
    "termEn": "Plastic Shrinkage Cracking",
    "termTh": "รอยแตกร้าวจากการหดตัวขณะคอนกรีตยังเหลว",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "รอยร้าวที่ผิวคอนกรีตสด เกิดจากอัตราการระเหยของน้ำที่ผิวหน้าเร็วกว่าอัตราการลอยตัวของน้ำเยิ้ม (เกิน 1.0 กก./ตร.ม./ชม.)",
    "fieldUsage": "ป้องกันโดยการกั้นลม บังแดด และพ่นละอองหมอกน้ำ (Fog Spray) หรือทาน้ำยาเคลือบผิวทันทีที่แต่งผิวเสร็จ"
  },
  {
    "id": "g-con-lean-leveling",
    "termEn": "Lean Screed & Leveling",
    "termTh": "การปาดระดับคอนกรีต",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "ขั้นตอนการใช้สามเกลอหรือไม้บรรทัดปาดผิวคอนกรีตสดตามแนวยอดหมุดระดับที่ช่างสำรวจวางไว้เพื่อให้ได้ระดับและระนาบตามแบบ",
    "fieldUsage": "จับระดับด้วยหมุดเหล็กหรือปุ่มปูนทุกระยะ 2.0 - 3.0 เมตร"
  },
  {
    "id": "g-con-shotcrete",
    "termEn": "Shotcrete (Sprayed Concrete)",
    "termTh": "คอนกรีตพ่น",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "คอนกรีตหรือมอร์ตาร์ที่ลำเลียงผ่านท่อและพ่นด้วยแรงลมความเร็วสูงลงบนพื้นผิว นิยมใช้ในงานอุโมงค์ งานป้องกันลาดหิน และสระว่ายน้ำ",
    "fieldUsage": "ต้องควบคุมเปอร์เซ็นต์การกระดอนกลับ (Rebound) ไม่ให้เกินเกณฑ์มาตรฐาน"
  },
  {
    "id": "g-con-post-tension",
    "termEn": "Post-Tensioned Concrete (PT)",
    "termTh": "คอนกรีตอัดแรงทีหลัง",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "ระบบโครงสร้างคอนกรีตที่ร้อยลวดอัดแรง (PC Strand) ในท่อดักท์ แล้วทำการดึงลวดอัดแรงหลังจากคอนกรีตแข็งตัวจนได้กำลังตามข้อกำหนด",
    "fieldUsage": "ต้องสำรวจระดับก่อนดึงลวดและหลังดึงลวดเพื่อตรวจสอบค่าการแอ่นตัวยกขึ้น (Camber) ของพื้น"
  },
  {
    "id": "g-con-grouting",
    "termEn": "Non-Shrink Grout",
    "termTh": "ปูนเกราต์ไม่หดตัว",
    "category": "concrete",
    "categoryLabel": "งานคอนกรีต & แบบหล่อ",
    "definition": "มอร์ตาร์ผสมพิเศษที่มีคุณสมบัติไม่หดตัว ให้กำลังอัดสูง ไหลตัวได้ดี ใช้สำหรับเทใต้แผ่นเหล็กหัวเสา (Base Plate) หรือฝังพุกเคมี",
    "fieldUsage": "ก่อนเทเกราต์ต้องสกัดผิวคอนกรีตเดิมให้ขรุขระ ทำความสะอาด และบ่มน้ำจนอิ่มตัวแต่ไม่มีน้ำขัง (SSD)"
  },
  {
    "id": "g-reb-deformed-bar",
    "termEn": "Deformed Bar (DB)",
    "termTh": "เหล็กข้ออ้อย",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "เหล็กเส้นกลมที่มีบั้งหรือครีบที่ผิวเพื่อเพิ่มแรงยึดเหนี่ยวระหว่างเหล็กและคอนกรีต มอก. 24-2559 ชั้นคุณภาพ SD30, SD40, SD50",
    "fieldUsage": "สูตรคำนวณน้ำหนักเหล็กเร็วหน้างาน: W = d²/162 กก./ม. (เช่น DB12 = 0.888 กก./ม., DB20 = 2.47 กก./ม.)"
  },
  {
    "id": "g-reb-round-bar",
    "termEn": "Round Bar (RB)",
    "termTh": "เหล็กเส้นกลมผิวเรียบ",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "เหล็กเส้นหน้าตัดกลมผิวเรียบ มอก. 20-2559 ชั้นคุณภาพ SR24 นิยมใช้ทำเหล็กปลอกเสา-คาน (RB6, RB9)",
    "fieldUsage": "เหล็กเส้นกลมรับแรงดึงต้องดัดงอปลายขอมาตรฐาน (Standard Hook 180° หรือ 90°) เสมอเพื่อการยึดเหนี่ยว"
  },
  {
    "id": "g-reb-lap-length",
    "termEn": "Lap Length (Splice Length)",
    "termTh": "ระยะทาบเหล็ก",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ระยะความยาวที่เหล็กเส้นเสริมสองเส้นต้องทาบซ้อนกันเพื่อให้สามารถถ่ายแรงดึงหรือแรงอัดผ่านคอนกรีตได้อย่างต่อเนื่องปลอดภัย",
    "fieldUsage": "มาตรฐาน วสท./ACI: เหล็กข้ออ้อยรับแรงดึงกำหนดระยะทาบ Class B ประมาณ 40d ถึง 48d (เหล็กบนคูณเพิ่ม 1.3 เท่า)"
  },
  {
    "id": "g-reb-development-length",
    "termEn": "Development Length (Ld)",
    "termTh": "ระยะฝังยึดเหล็ก",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ความยาวต่ำสุดของเหล็กเสริมที่ต้องฝังลึกเข้าไปในคอนกรีตเพื่อให้เหล็กสามารถพัฒนากำลังคราก (Yield Strength) ได้เต็มที่โดยไม่หลุดรูด",
    "fieldUsage": "ตรวจสอบระยะฝังเหล็กเดือยจากฐานรากเข้าเสา และเหล็กคานยื่นเข้าเสาให้ครบตามตารางระยะฝังในแบบ"
  },
  {
    "id": "g-reb-stirrup",
    "termEn": "Stirrup / Shear Link",
    "termTh": "เหล็กปลอกคาน",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "เหล็กเสริมที่ดัดเป็นรูปวงปิดหรือวงเปิดโอบรัดเหล็กแกนตามยาวของคาน เพื่อทำหน้าที่ต้านทานแรงเฉือนและยึดเหล็กแกนให้อยู่ในตำแหน่ง",
    "fieldUsage": "บริเวณหัว-ท้ายคาน (ระยะ 2 เท่าของความลึกคาน) จะมีแรงเฉือนสูง จึงต้องใส่เหล็กปลอกถี่กว่าช่วงกลางคาน"
  },
  {
    "id": "g-reb-tie-column",
    "termEn": "Column Tie",
    "termTh": "เหล็กปลอกเสา",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "เหล็กปลอกที่โอบรอบเหล็กแกนเสาเพื่อป้องกันไม่ให้เหล็กแกนเสาเกิดการโก่งเดาะ (Buckling) จากแรงอัด และช่วยโอบรัดคอนกรีตแกนเสา",
    "fieldUsage": "มุมของเหล็กปลอกต้องดัดงอขอแผ่นดินไหว 135° ฝังเข้าเนื้อคอนกรีตตามมาตรฐานต้านทานแผ่นดินไหว วสท."
  },
  {
    "id": "g-reb-clear-cover",
    "termEn": "Clear Concrete Cover",
    "termTh": "ระยะหุ้มคอนกรีต",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ระยะห่างระหว่างผิวนอกสุดของเหล็กเสริม (รวมเหล็กปลอก) ถึงผิวคอนกรีตภายนอก เพื่อปกป้องเหล็กจากสนิม สนิมไฟ และการกัดกร่อน",
    "fieldUsage": "ตามกฎกระทรวงและ วสท.: ฐานรากสัมผัสดินตรงๆ ห้ามต่ำกว่า 7.5 ซม., คาน-เสาสัมผัสสภาพอากาศ 4.0-5.0 ซม., พื้นภายในอาคาร 2.0 ซม."
  },
  {
    "id": "g-reb-spacer-chair",
    "termEn": "Cover Block / Chair Bar",
    "termTh": "ลูกปูนหนุนและขาหยั่งเหล็ก",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ก้อนคอนกรีตหล่อสำเร็จรูปหรือขาเหล็กดัด เพื่อรองหนุนเหล็กเสริมให้ได้ระยะหุ้มตามที่กำหนดก่อนเทคอนกรีต",
    "fieldUsage": "ห้ามใช้เศษไม้หรือเศษท่อพีวีซีหนุนเหล็กเด็ดขาด ลูกปูนต้องมีลวดผูกติดกับเหล็กเสริมอย่างมั่นคง"
  },
  {
    "id": "g-reb-bbs",
    "termEn": "Bar Bending Schedule (BBS)",
    "termTh": "ตารางดัดเหล็ก / บัญชีตัดเหล็ก",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ตารางรายละเอียดที่ระบุขนาด ความยาว รูปแบบการดัด และจำนวนชิ้นของเหล็กเส้นแต่ละเบอร์ที่ต้องตัดและดัดสำหรับแต่ละชิ้นส่วนโครงสร้าง",
    "fieldUsage": "ใช้สำหรับควบคุมการสั่งซื้อเหล็กเส้นเข้าหน้างานและวางแผนตัดเหล็กด้วย Rebar Cut Optimizer เพื่อลดเศษสูญเสีย"
  },
  {
    "id": "g-reb-dowel",
    "termEn": "Dowel Bar",
    "termTh": "เหล็กเดือย / เหล็กฝาก",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ท่อนเหล็กสั้นที่ฝังยื่นออกมาจากโครงสร้างเดิม เช่น จากฐานรากสู่เสา หรือระหว่างรอยต่อถนนคอนกรีต เพื่อถ่ายแรงเฉือน",
    "fieldUsage": "รอยต่อถนนคอนกรีตต้องทาจาระบีหรือสวมปลอกพลาสติกครึ่งหนึ่งของ Dowel เพื่อให้คอนกรีตยืดหดตัวได้อย่างอิสระ"
  },
  {
    "id": "g-reb-wire-mesh",
    "termEn": "Welded Wire Mesh",
    "termTh": "ตะแกรงเหล็กไวร์เมช",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ตะแกรงเหล็กกล้าดึงเย็นที่เชื่อมติดกันด้วยไฟฟ้าเป็นตารางสี่เหลี่ยม มอก. 737 นิยมใช้เสริมในพื้นคอนกรีตวางบนดิน (Slab on Ground)",
    "fieldUsage": "ต้องหนุนลูกปูนให้ตะแกรงลอยอยู่ในระดับ 1/3 บนของความหนาพื้น ห้ามเหยียบจมติดดิน"
  },
  {
    "id": "g-reb-coupler",
    "termEn": "Rebar Mechanical Coupler",
    "termTh": "ข้อต่อเหล็กกลไก / ข้อต่อเกลียว",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "อุปกรณ์ปลอกต่อเหล็กเส้นเสริมคอนกรีตโดยใช้เกลียวหรือการบีบอัด แทนการทาบซ้อน เหมาะกับเหล็กขนาดใหญ่ (DB25 ขึ้นไป)",
    "fieldUsage": "ช่วยลดความแออัดของเหล็กเสริมที่รอยต่อเสา และประหยัดเหล็กทาบซ้อนได้อย่างมีนัยสำคัญ"
  },
  {
    "id": "g-reb-hook-bend",
    "termEn": "Standard Hook and Bend",
    "termTh": "ขอดัดมาตรฐาน",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "การดัดงอปลายเหล็กเสริมเป็นมุม 90°, 135° หรือ 180° รอบแกนดัด (Mandrel) ที่มีรัศมีตามมาตรฐานเพื่อไม่ให้เหล็กแตกร้าว",
    "fieldUsage": "เส้นผ่านศูนย์กลางแกนดัดต้องไม่น้อยกว่า 4d-6d ขึ้นอยู่กับขนาดเหล็กและเกรดเหล็ก"
  },
  {
    "id": "g-reb-yield-strength",
    "termEn": "Yield Strength (fy)",
    "termTh": "กำลังครากของเหล็กเสริม",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "จุดความเค้นที่เหล็กเสริมเริ่มเปลี่ยนรูปถาวรโดยแรงดึงไม่เพิ่มขึ้น เป็นค่ากำลังหลักที่ใช้ออกแบบโครงสร้าง (SD30: 3,000 ksc, SD40: 4,000 ksc)",
    "fieldUsage": "ตรวจใบเซอร์ผลทดสอบจากโรงงาน (Mill Certificate) และสุ่มตัดส่งดึงทดสอบตามสัดส่วนที่สัญญากำหนด"
  },
  {
    "id": "g-reb-tensile-strength",
    "termEn": "Ultimate Tensile Strength (fu)",
    "termTh": "กำลังดึงประลัยของเหล็กเสริม",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "แรงดึงสูงสุดต่อหนึ่งหน่วยพื้นที่หน้าตัดที่เหล็กเสริมสามารถต้านทานได้ก่อนขาดออกจากกัน",
    "fieldUsage": "อัตราส่วน fu / fy ต้องมีค่าไม่น้อยกว่า 1.25 ตามเกณฑ์ความเหนียวต้านทานแรงแผ่นดินไหว"
  },
  {
    "id": "g-reb-kerf",
    "termEn": "Cutting Kerf Width",
    "termTh": "ขนาดความกว้างใบตัดเหล็ก",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ความหนาของรอยตัดหรือเนื้อเหล็กที่สูญเสียไปเป็นผงเหล็กขณะเครื่องตัดเหล็กทำงาน (ประมาณ 3-5 มม.)",
    "fieldUsage": "ต้องนำมารวมคำนวณในโปรแกรม Rebar Cut Optimizer เพื่อไม่ให้ความยาวท่อนสุดท้ายสั้นกว่าแบบ"
  },
  {
    "id": "g-reb-top-rebar",
    "termEn": "Top Reinforcement",
    "termTh": "เหล็กเสริมบน",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "เหล็กเส้นที่วางอยู่ส่วนบนของหน้าตัดคานหรือพื้น เพื่อรับแรงดึงที่เกิดจากโมเมนต์ดัดลบ เช่น บริเวณหัวเสาหรือปลายคานยื่น",
    "fieldUsage": "คอนกรีตใต้เหล็กบนที่หนาเกิน 30 ซม. จะส่งผลให้น้ำเยิ้มสะสมใต้ผิวเหล็ก จึงต้องคูณเพิ่มระยะทาบ 1.3 เท่า"
  },
  {
    "id": "g-reb-spacing",
    "termEn": "Clear Rebar Spacing",
    "termTh": "ระยะห่างช่องว่างเหล็กเสริม",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ระยะช่องว่างต่ำสุดระหว่างผิวเหล็กเส้นคู่ขนาน เพื่อให้คอนกรีตสดและหินสามารถไหลผ่านได้อย่างสะดวก",
    "fieldUsage": "มาตรฐานกำหนดระยะห่างไม่น้อยกว่า 1 เท่าของเส้นผ่านศูนย์กลางเหล็ก, 2.5 ซม., หรือ 1.33 เท่าของขนาดหินโตสุด"
  },
  {
    "id": "g-reb-bundled-bars",
    "termEn": "Bundled Bars",
    "termTh": "เหล็กมัดรวม",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "กลุ่มเหล็กเส้นขนานตั้งแต่ 2 ถึง 4 เส้นที่มัดสัมผัสแนบสนิทกันเพื่อประหยัดพื้นที่ในหน้าตัดเสาหรือคานที่มีเหล็กหนาแน่น",
    "fieldUsage": "การหาจุดตัดและระยะทาบของเหล็กมัดต้องสับหว่างรอยต่อไม่ให้ตรงกันในตำแหน่งเดียวกัน"
  },
  {
    "id": "g-reb-cracking-moment",
    "termEn": "Cracking Moment (Mcr)",
    "termTh": "โมเมนต์ดัดแตกร้าว",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ค่าโมเมนต์ดัดที่ทำให้หน่วยแรงดึงในคอนกรีตเกินกำลังดึงประลัย จนเริ่มเกิดรอยร้าวแรกที่ผิวล่างของคาน",
    "fieldUsage": "ปริมาณเหล็กเสริมต่ำสุด (As,min) ต้องมีเพียงพอที่จะรับโมเมนต์ได้อย่างน้อย 1.2 เท่าของ Mcr เพื่อป้องกันคานหักทันที"
  },
  {
    "id": "g-reb-corrosion",
    "termEn": "Rebar Corrosion & Rust",
    "termTh": "สนิมเหล็กเสริม",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "ปฏิกิริยาเคมีไฟฟ้าที่ผิวเหล็กเมื่อสัมผัสน้ำและออกซิเจน ทำให้เกิดสนิมเหล็กที่ขยายปริมาตร 2-6 เท่าดันคอนกรีตแตกกะเทาะ (Spalling)",
    "fieldUsage": "สนิมผิวสีส้มบางๆ ยอมรับได้ แต่หากเป็นสนิมเกล็ดขุยที่กัดกินเนื้อเหล็กจนเส้นผ่านศูนย์กลางลดลงต้องคัดแยกทิ้ง"
  },
  {
    "id": "g-reb-bending-schedule",
    "termEn": "Cut-Piece Optimization",
    "termTh": "การจัดเรียงตัดเหล็กลดเศษ",
    "category": "rebar",
    "categoryLabel": "งานเหล็กเสริมโครงสร้าง",
    "definition": "การใช้อัลกอริทึมคณิตศาสตร์ (1D Bin Packing / FFD) จับคู่ความยาวชิ้นงานตัดลงในท่อนมาตรฐาน 10 ม. หรือ 12 ม. ให้เหลือเศษน้อยที่สุด",
    "fieldUsage": "ช่วยลดเศษเหล็กเหลือทิ้งหน้างานจากปกติ 8-12% ให้เหลือต่ำกว่า 3-5% ประหยัดต้นทุนโครงการมหาศาล"
  },
  {
    "id": "g-surv-bm",
    "termEn": "Benchmark (BM)",
    "termTh": "หมุดระดับ / หมุดหลักฐานความสูง",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "จุดอ้างอิงความสูงถาวรที่ทราบค่าระดับเทียบกับระดับน้ำทะเลปานกลาง (Mean Sea Level: MSL) แน่นอน ใช้เป็นฐานในการถ่ายระดับความสูง",
    "fieldUsage": "หมุด BM ทองเหลืองของกรมแผนที่ทหาร (RTSD) ตอกบนคอนกรีตถาวร สำหรับใช้เริ่มและปิดงานทำระดับ"
  },
  {
    "id": "g-surv-tbm",
    "termEn": "Temporary Benchmark (TBM)",
    "termTh": "หมุดระดับชั่วคราว",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "จุดอ้างอิงความสูงที่สร้างขึ้นชั่วคราวภายในพื้นที่ก่อสร้าง เช่น บนฐานรากมั่นคง หรือหัวเสาเข็ม เพื่อความสะดวกในการใช้งานประจำวัน",
    "fieldUsage": "ต้องถ่ายระดับจากหมุด BM จริงมาฝากไว้ที่ TBM ภายในไซต์งาน พร้อมตรวจสอบค่าระดับอย่างน้อยสัปดาห์ละ 1 ครั้ง"
  },
  {
    "id": "g-surv-azimuth",
    "termEn": "Azimuth (Grid Azimuth)",
    "termTh": "มุมแอซิมัท / มุมอาซิมุด",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "มุมราบที่วัดเวียนตามเข็มนาฬิกาจากทิศเหนือ (ทิศเหนือกริด หรือ ทิศเหนือจริง) ไปยังแนวเส้นสำรวจ มีค่าตั้งแต่ 0° ถึง 360°",
    "fieldUsage": "ใช้ในการคำนวณค่าพิกัดราบ Latitude & Departure ของแนวเส้นวงรอบ"
  },
  {
    "id": "g-surv-bearing",
    "termEn": "Bearing",
    "termTh": "ทิศทางบริ่ง",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "มุมราบที่วัดจากแกนเหนือหรือแกนใต้ ไปทางทิศตะวันออกหรือตะวันตก มีค่าตั้งแต่ 0° ถึง 90° พร้อมระบุจตุภาค (เช่น N 45° 30' E)",
    "fieldUsage": "มักปรากฏในระเบียบรังวัดที่ดินและแบบแปลนโฉนดที่ดินรุ่นเก่า"
  },
  {
    "id": "g-surv-collimation",
    "termEn": "Collimation Error",
    "termTh": "ความคลาดเคลื่อนแนวเล็ง",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "ข้อคลาดเคลื่อนที่เกิดจากแนวสายตาของกล้องไม่ได้ตั้งฉากกับแกนดิ่ง หรือไม่อยู่ในแนวราบแท้จริงเมื่อฟองน้ำอยู่กึ่งกลาง",
    "fieldUsage": "ตรวจและแก้ไขได้ด้วยวิธี Two-Peg Test ในกล้องระดับ หรือการส่องสองหน้ากล้องในกล้องวัดมุม"
  },
  {
    "id": "g-surv-asbuilt",
    "termEn": "As-Built Survey",
    "termTh": "การสำรวจเก็บสภาพจริงหลังก่อสร้าง",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "การรังวัดตำแหน่ง ขนาด และระดับความสูงของโครงสร้างที่ก่อสร้างเสร็จจริงเพื่อนำไปจัดทำแบบ As-Built Drawings",
    "fieldUsage": "ใช้ตรวจสอบตำแหน่งเสาเข็มหนีศูนย์ (Pile Deviation) และระดับท่อระบายน้ำก่อนส่งมอบงาน"
  },
  {
    "id": "g-surv-staking",
    "termEn": "Staking Out / Setting Out",
    "termTh": "การวางผังปักหมุด",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "กระบวนการนำค่าพิกัดและระยะจากแบบแปลนก่อสร้างไปถ่ายทอดลงบนผิวดินจริงด้วยหมุด ตะปู หรือไม้บอกตำแหน่ง",
    "fieldUsage": "การปักหมุดแนวแกนอาคาร (Grid Line), หมุดศูนย์กลางเสาเข็ม, และหมุดแนวขอบถนน"
  },
  {
    "id": "g-surv-geoid-height",
    "termEn": "Geoid Undulation / Separation (N)",
    "termTh": "ระยะห่างระหว่างยีออยด์และทรงรี",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "ระยะห่างทางดิ่งระหว่างผิวจีออยด์ (ระดับน้ำทะเลปานกลาง) และผิวทรงรีอ้างอิง WGS84 โดย h = H + N",
    "fieldUsage": "ในประเทศไทยใช้แบบจำลอง TGM2017 เพื่อแปลงค่าความสูงจากดาวเทียม (h) เป็นความสูงออร์โธเมตริก (H)"
  },
  {
    "id": "g-surv-resection",
    "termEn": "Resection / Free Station",
    "termTh": "การเล็งสกัดย้อน / ตั้งกล้องแบบอิสระ",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "วิธีหาค่าพิกัดและมุมเปิดของจุดตั้งกล้องที่ไม่ทราบพิกัด โดยการส่องวัดมุมและระยะทางไปยังหมุดควบคุมที่ทราบพิกัดอย่างน้อย 2-3 จุด",
    "fieldUsage": "นิยมใช้ในไซต์ก่อสร้างที่หมุดหลักถูกบดบัง ทำให้สามารถตั้งกล้องบนตำแหน่งใดก็ได้ที่มองเห็นเป้าหมายชัดเจน"
  },
  {
    "id": "g-surv-two-peg",
    "termEn": "Two-Peg Test",
    "termTh": "การตรวจสอบกล้องระดับแบบสองหมุด",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "วิธีการทดสอบภาคสนามเพื่อหาค่าความคลาดเคลื่อนแนวเล็ง (Collimation Error C) ของกล้องระดับอัตโนมัติ",
    "fieldUsage": "หากระยะอ่านหมุดใกล้และไกลมีผลต่างเกิน 3 มม. ต้องเปิดฝาท้ายปรับสกรูสายใยราบ"
  },
  {
    "id": "g-surv-three-wire",
    "termEn": "Three-Wire Leveling",
    "termTh": "การทำระดับแบบสามสายใย",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "การอ่านค่าไม้สต๊าฟพร้อมกันทั้งสามสายใย (สายใยบน กลาง ล่าง) เพื่อตรวจสอบเลขคณิตและคำนวณระยะทางจากสเตเดีย",
    "fieldUsage": "ใช้ในงานระดับชั้น 1 และชั้น 2 โดยผลต่าง (Upper - Middle) ต้องเท่ากับ (Middle - Lower) ภายใน 1-2 มม."
  },
  {
    "id": "g-surv-bowditch",
    "termEn": "Bowditch Compass Rule",
    "termTh": "วิธีปรับแก้วงรอบแบบเข็มทิศ (บาวดิตช์)",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "วิธีปรับแก้ความคลาดเคลื่อนบรรจบของวงรอบปิด โดยกระจายค่าแก้พิกัด Latitude และ Departure ตามสัดส่วนความยาวด้าน",
    "fieldUsage": "เป็นมาตรฐานการคำนวณวงรอบของกรมแผนที่ทหารและงานวิศวกรรมโยธาทั่วไป"
  },
  {
    "id": "g-surv-total-station",
    "termEn": "Total Station",
    "termTh": "กล้องประมวลผลรวม",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "เครื่องมือสำรวจที่รวมกล้องวัดมุมอิเล็กทรอนิกส์ (Theodolite) เครื่องวัดระยะทางอิเล็กทรอนิกส์ (EDM) และไมโครโพรเซสเซอร์ไว้ในเครื่องเดียวกัน",
    "fieldUsage": "ตรวจสอบค่าแก้ Prism Constant (-30mm vs 0mm) และป้อนค่าอุณหภูมิ-ความกดอากาศ (PPM) ก่อนเริ่มส่องวัด"
  },
  {
    "id": "g-surv-gnss-rtk",
    "termEn": "GNSS Real-Time Kinematic (RTK)",
    "termTh": "การรังวัดดาวเทียมจลน์แบบเรียลไทม์",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "ระบบหาพิกัดความละเอียดสูงระดับเซนติเมตร โดยรับคลื่นเฟสจากดาวเทียมและข้อมูลค่าแก้ (Correction Data) จากสถานีฐานผ่านคลื่นวิทยุหรือ NTRIP 4G",
    "fieldUsage": "ต้องตรวจสอบสถานะ Fix และค่าพิกัดต้องมีค่าความคลาดเคลื่อนทางราบและทางดิ่งไม่เกิน ±15-20 มม."
  },
  {
    "id": "g-surv-cors",
    "termEn": "Continuously Operating Reference Station (CORS)",
    "termTh": "สถานีรับสัญญาณดาวเทียมถาวรต่อเนื่อง",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "โครงข่ายสถานีฐานรับสัญญาณดาวเทียม GNSS ถาวรที่กระจายอยู่ทั่วประเทศ ให้บริการส่งค่าแก้พิกัดความถูกต้องสูงผ่านอินเทอร์เน็ต",
    "fieldUsage": "ในไทยใช้งานโครงข่ายของกรมที่ดิน, กรมแผนที่ทหาร, และ สสน."
  },
  {
    "id": "g-surv-invar-staff",
    "termEn": "Invar Barcode Staff",
    "termTh": "ไม้วัดระดับอินวาร์แบบบาร์โค้ด",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "ไม้ระดับที่มีแถบวัดทำจากโลหะผสมอินวาร์ (Invar) ซึ่งมีค่าสัมประสิทธิ์การขยายตัวเนื่องจากอุณหภูมิต่ำมาก ใช้คู่กับกล้องระดับดิจิทัล",
    "fieldUsage": "ใช้งานในการทำระดับชั้น 1 และงานตรวจวัดการทรุดตัวของอาคาร (Settlement Monitoring)"
  },
  {
    "id": "g-surv-edm-offset",
    "termEn": "EDM Distance Measurement",
    "termTh": "การวัดระยะทางด้วยคลื่นแม่เหล็กไฟฟ้า",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "การส่งและรับคลื่นแสงอินฟราเรดหรือเลเซอร์สะท้อนกลับจากเป้าปริซึมเพื่อคำนวณระยะทางอย่างแม่นยำ",
    "fieldUsage": "ตรวจสอบและบำรุงรักษาหน้าเลนส์และปริซึมให้สะอาด ปราศจากคราบละอองฝุ่นและหยดน้ำ"
  },
  {
    "id": "g-surv-grid-line",
    "termEn": "Building Grid Lines",
    "termTh": "แนวแกนอาคาร",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "ระบบเส้นอ้างอิงตั้งฉากสองแกน (เช่น แกนตัวเลข 1, 2, 3 และแกนตัวอักษร A, B, C) ที่ใช้ระบุตำแหน่งเสาและผนังอาคาร",
    "fieldUsage": "วิศวกรสำรวจจะถ่ายทอดหมุด Grid Line ขึ้นสู่ชั้นบนด้วยกล้องดิ่งเลเซอร์ (Optical / Laser Plummet)"
  },
  {
    "id": "g-surv-batter-board",
    "termEn": "Batter Board",
    "termTh": "ไม้ผังอาคาร",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "กรอบไม้แนวนอนที่สร้างขึ้นรอบอาคารเพื่อขึงเอ็นหรือสลิงกำหนดแนวแกนเสาและระดับความสูงอ้างอิงในการขุดดินและก่อสร้าง",
    "fieldUsage": "ตอกตะปูและเขียนมาร์กสีแสดงแนวแกนชัดเจน ตรวจสอบตำแหน่งเอ็นสม่ำเสมอไม่ให้ถูกรถขุดเกี่ยวชน"
  },
  {
    "id": "g-surv-lidar-tls",
    "termEn": "Terrestrial Laser Scanner (TLS)",
    "termTh": "เครื่องสแกนเลเซอร์ภาคพื้นดิน",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "อุปกรณ์สำรวจระยะไกลที่ยิงลำแสงเลเซอร์หลายแสนจุดต่อวินาทีเพื่อสร้างกลุ่มจุดสามมิติ (Point Cloud) เก็บรายละเอียดรูปทรงอาคารครบถ้วน",
    "fieldUsage": "ติดเป้าทรงกลม (Target Spheres) หรือเป้ากระดาษอย่างน้อย 3-4 จุดในพื้นที่ซ้อนทับเพื่อใช้เชื่อมต่อสถานีสแกน (Registration)"
  },
  {
    "id": "g-surv-slam-mobile",
    "termEn": "Mobile SLAM Scanner",
    "termTh": "เครื่องสแกนเคลื่อนที่ระบบสแลม",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "เทคโนโลยีสแกนสามมิติแบบถือเดินหรือสะพายหลัง โดยใช้อัลกอริทึม SLAM คำนวณตำแหน่งตัวเองควบคู่กับการสร้างแผนที่แบบเรียลไทม์",
    "fieldUsage": "ต้องเดินวนครบรอบ (Loop Closure) เพื่อตัดค่าคลาดเคลื่อนสะสม (Drift Error)"
  },
  {
    "id": "g-surv-uav-gcp",
    "termEn": "Ground Control Point (GCP)",
    "termTh": "จุดควบคุมภาคพื้นดินสำหรับโดรน",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "หมุดเป้าหมายบนผิวดินที่ทราบค่าพิกัดความละเอียดสูงจาก GNSS RTK ใช้ในการปรับแก้และตรึงภาพถ่ายทางอากาศจากโดรนให้ลงพิกัดภูมิศาสตร์",
    "fieldUsage": "กระจายเป้า GCP ให้ครอบคลุมทั่วขอบเขตพื้นที่บินและบริเวณจุดศูนย์กลาง ไม่วางเรียงเป็นเส้นตรง"
  },
  {
    "id": "g-surv-bathymetry",
    "termEn": "Echo Sounder / Bathymetry",
    "termTh": "การสำรวจหยั่งน้ำและภูมิประเทศใต้น้ำ",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "การใช้คลื่นเสียงสะท้อนจากใต้ท้องเรือเพื่อวัดความลึกของท้องน้ำ ผสานกับพิกัด GNSS สร้างแผนที่เส้นชั้นความลึก",
    "fieldUsage": "ต้องติดตั้งเซนเซอร์ตรวจจับการโคลงของเรือ (MRU: Motion Reference Unit) และตัดทอนระดับน้ำขึ้น-น้ำลง (Tide Correction)"
  },
  {
    "id": "g-surv-tbm-guidance",
    "termEn": "TBM Laser Guidance System",
    "termTh": "ระบบเลเซอร์นำทางหัวเจาะอุโมงค์",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "ระบบควบคุมทิศทางหัวขุดเจาะอุโมงค์อัตโนมัติ โดยใช้กล้อง Total Station แบบติดผนังยิงแสงเลเซอร์ไปยังเป้าอิเล็กทรอนิกส์ท้ายหัวเจาะ",
    "fieldUsage": "คำนวณค่าเบี่ยงเบน DTA (Design Tunnel Alignment) และค่าโรล/พิทช์ เพื่อปรับไฮดรอลิกหัวขุดตามแบบ"
  },
  {
    "id": "g-surv-inclinometer",
    "termEn": "Inclinometer",
    "termTh": "เครื่องมือวัดการเอียงตัวของชั้นดิน",
    "category": "survey",
    "categoryLabel": "งานสำรวจ & Geomatics",
    "definition": "อุปกรณ์หย่อนหัวโพรบลงในท่อกรู๊ฟพิเศษใต้ดินเพื่อวัดการเคลื่อนตัวในแนวราบของชั้นดินรอบบ่อขุดหรือกำแพงกันดิน",
    "fieldUsage": "อ่านค่าโพรบ 2 ทิศทางตั้งฉากกัน (A0/A180) เพื่อตรวจสอบค่าคงที่และการขยับตัวสะสมของกำแพงดิน"
  },
  {
    "id": "g-mas-clay-brick",
    "termEn": "Clay Brick (Red Brick)",
    "termTh": "อิฐมอญ / อิฐดินเผา",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ก้อนอิฐที่ผลิตจากดินเหนียวปนทรายขึ้นรูปและเผาด้วยความร้อนสูง แข็งแรง ทนทาน และเจาะยึดแขวนของหนักได้ดี",
    "fieldUsage": "ก่อนก่อต้องแช่น้ำให้อิฐอิ่มตัวเพื่อไม่ให้อิฐแย่งน้ำจากปูนก่อจนปูนก่อแห้งกรอบและร่วน"
  },
  {
    "id": "g-mas-aac-block",
    "termEn": "Autoclaved Aerated Concrete (AAC)",
    "termTh": "อิฐมวลเบา",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "คอนกรีตบล็อกมวลเบาอบไอน้ำความดันสูง น้ำหนักเบา ป้องกันความร้อนและเสียงได้ดี ขนาดก้อนใหญ่ก่อได้รวดเร็ว",
    "fieldUsage": "ต้องใช้ปูนก่อกาวและปูนฉาบเฉพาะสำหรับอิฐมวลเบาเท่านั้น และติดตาข่ายไฟเบอร์ตามแนวรอยต่อ"
  },
  {
    "id": "g-mas-cmu-block",
    "termEn": "Concrete Masonry Unit (CMU)",
    "termTh": "คอนกรีตบล็อก / อิฐบล็อก",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "บล็อกกลวงที่ทำจากซีเมนต์ ทราย และหินเกล็ด นิยมใช้ในงานผนังรั้ว ผนังโรงงาน หรืออาคารโกดัง",
    "fieldUsage": "ต้องเสียบเหล็กหนวดกุ้งและกรอกคอนกรีตในรูกลวงพร้อมเหล็กแกนทุกระยะ 1.0 - 2.0 ม. เพื่อเพิ่มความแข็งแรง"
  },
  {
    "id": "g-mas-mortar",
    "termEn": "Masonry Mortar",
    "termTh": "ปูนก่อ",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ส่วนผสมของปูนซีเมนต์ ทรายละเอียด และน้ำ (หรือปูนก่อสำเร็จรูป) ใช้เป็นตัวประสานระหว่างก้อนอิฐ",
    "fieldUsage": "ความหนาของชั้นปูนก่อควรควบคุมให้อยู่ระหว่าง 1.0 - 1.5 ซม. สม่ำเสมอทั่วทั้งแนวนอนและแนวตั้ง"
  },
  {
    "id": "g-mas-lintel",
    "termEn": "Lintel Beam",
    "termTh": "ทับหลัง / เสาเอ็น",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "คานคอนกรีตเสริมเหล็กขนาดเล็กที่หล่อขวางเหนือช่องเปิดประตู-หน้าต่าง และเสาเอ็นขนาบข้าง เพื่อถ่ายน้ำหนักผนังด้านบน",
    "fieldUsage": "ช่องเปิดทุกบานต้องมีทับหลังและเสาเอ็น และต้องมีระยะฝังยึดเข้าผนังข้างละไม่น้อยกว่า 20 ซม."
  },
  {
    "id": "g-mas-stiffener",
    "termEn": "Stiffener Column",
    "termTh": "เสาเอ็นคอนกรีตเสริมเหล็ก",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "เสาขนาดเล็กหล่อฝังในแผงผนังก่อ เพื่อแบ่งซอยขนาดพื้นที่ผนังไม่ให้กว้างเกินไปจนแอ่นล้ม",
    "fieldUsage": "ผนังก่ออิฐมอญพื้นที่เกิน 9-10 ตร.ม. หรือยาวเกิน 3.0 ม. ต้องมีเสาเอ็นและคานทับหลังแบ่งย่อย"
  },
  {
    "id": "g-mas-dowel-tie",
    "termEn": "Wall Tie (Dowel Pin)",
    "termTh": "เหล็กหนวดกุ้ง",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "เหล็กเส้นกลม RB6 ที่เจาะเสียบฝังในเสาคอนกรีตโครงสร้างยื่นออกมารัดตรึงแผงผนังก่ออิฐ",
    "fieldUsage": "เจาะเสียบหนวดกุ้งทุกระยะความสูงประมาณ 30-40 ซม. (ทุก 3-4 แถวของอิฐ) และยาวไม่น้อยกว่า 40-50 ซม."
  },
  {
    "id": "g-mas-expansion-joint",
    "termEn": "Control / Expansion Joint",
    "termTh": "รอยต่อเพื่อการขยายตัวของผนัง",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "รอยต่อที่เว้นช่องว่างระหว่างแผงผนังก่อยาวๆ เพื่อรองรับการยืดหดตัวจากอุณหภูมิและการขยับตัวของโครงสร้าง",
    "fieldUsage": "ใส่โฟมและยิงยาแนวซิลิโคนหรือโพลียูรีเทนกันน้ำรั่วซึม นิยมเว้นทุกระยะ 6-8 เมตร"
  },
  {
    "id": "g-mas-scratch-coat",
    "termEn": "Scratch Coat",
    "termTh": "ชั้นปูนสลัดดอก / ปูนชั้นแรก",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "การสลัดหรือฉาบมอร์ตาร์เหลวบางๆ ให้เป็นผิวหยาบตะปุ่มตะป่ำบนผิวคอนกรีตหรือผนังก่อก่อนฉาบจริง เพื่อเพิ่มแรงยึดเกาะ",
    "fieldUsage": "สลัดดอกบนเสาและท้องคานคอนกรีตก่อนฉาบปูนเพื่อป้องกันปูนฉาบร่อนหลุดในอนาคต"
  },
  {
    "id": "g-mas-plaster-coat",
    "termEn": "Base Plaster Coat",
    "termTh": "ปูนฉาบรองพื้น",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ชั้นปูนฉาบหลักหนาประมาณ 1.0 - 1.5 ซม. ที่ปาดเรียบตามปุ่มระดับเพื่อสร้างระนาบผนังที่ตรงและดิ่ง",
    "fieldUsage": "ต้องจับปุ่มและทำระดับนำร่อง (Screed) ก่อนฉาบเพื่อควบคุมความหนาให้สม่ำเสมอ"
  },
  {
    "id": "g-mas-finish-coat",
    "termEn": "Skim Coat / Finish Plaster",
    "termTh": "ปูนฉาบผิวบาง",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ปูนผสมละเอียดพิเศษฉาบหนา 1-3 มม. เพื่อปิดรอยเม็ดทรายและตามด ทำให้ผิวผนังเนียนเรียบสนิทพร้อมทาสี",
    "fieldUsage": "รอให้ปูนฉาบชั้นล่างแห้งสนิทอย่างน้อย 7-14 วันก่อนลงสกิมโค้ท"
  },
  {
    "id": "g-mas-curing-plaster",
    "termEn": "Plaster Curing",
    "termTh": "การบ่มน้ำปูนฉาบ",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "การฉีดพ่นละอองน้ำให้ผนังปูนฉาบชุ่มชื้นต่อเนื่องอย่างน้อย 3-7 วัน เพื่อให้ปูนพัฒนากำลังและไม่แห้งแตกลายงา",
    "fieldUsage": "โดยเฉพาะผนังภายนอกที่โดนแดดจัดและลมพัด ต้องรดน้ำบ่มเช้า-กลางวัน-เย็น"
  },
  {
    "id": "g-mas-efflorescence",
    "termEn": "Efflorescence",
    "termTh": "คราบขี้เกลือบนผิวปูน",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "คราบผลึกสีขาวที่ปรากฏบนผิวอิฐหรือปูนฉาบ เกิดจากน้ำพาสารประกอบแคลเซียมไฮดรอกไซด์ในปูนออกมาทำปฏิกิริยากับคาร์บอนไดออกไซด์ในอากาศ",
    "fieldUsage": "เกิดจากความชื้นสะสม ป้องกันโดยการทำระบบกันซึมและใช้น้ำสะอาดปราศจากเกลือในการผสมปูน"
  },
  {
    "id": "g-mas-hairline-crack",
    "termEn": "Hairline Cracks",
    "termTh": "รอยแตกลายงา",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "รอยแตกขนาดเล็กมาก (กว้างน้อยกว่า 0.2 มม.) บนผิวปูนฉาบ เกิดจากการสูญเสียน้ำเร็วเกินไปขณะปูนเซ็ตตัวหรือทรายมีฝุ่นปนมาก",
    "fieldUsage": "แก้ไขโดยการขัดผิวและโป๊วทับด้วยอะคริลิกฟิลเลอร์หรือฉาบสกิมโค้ท"
  },
  {
    "id": "g-mas-corner-bead",
    "termEn": "Corner Bead",
    "termTh": "เซี้ยมสำเร็จรูป / คิ้วมุมผนัง",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "แถบพีวีซีหรือโลหะมุมฉากที่ติดตั้งตามมุมเสาและขอบผนังเพื่อเป็นแนวปาดปูนฉาบให้ได้มุมฉากคมตรงและแข็งแรง",
    "fieldUsage": "ช่วยลดเวลาในการจับเซี้ยมมือและป้องกันมุมผนังบิ่นแตกจากการกระแทก"
  },
  {
    "id": "g-mas-wire-mesh-joint",
    "termEn": "Wire Mesh / Fiberglass Mesh",
    "termTh": "ตะแกรงกรงไก่เสริมมุม",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ตาข่ายลวดหรือตาข่ายไฟเบอร์กลาสที่ติดตั้งทับรอยต่อระหว่างผนังก่ออิฐกับเสา/คานคอนกรีต หรือแนวฝังท่อร้อยสายไฟก่อนฉาบ",
    "fieldUsage": "ช่วยกระจายแรงดึง ป้องกันรอยร้าวตามแนวรอยต่อวัสดุต่างชนิดได้อย่างดีเยี่ยม"
  },
  {
    "id": "g-mas-plumb-bob",
    "termEn": "Plumb Line Check",
    "termTh": "การเช็คดิ่งผนัง",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "การใช้ลูกดิ่งหรือเลเซอร์วัดแนวดิ่งของผนังก่อและเซี้ยมมุมให้ได้แนวดิ่งแท้จริงตั้งแต่พื้นถึงฝ้า",
    "fieldUsage": "ความเอียงต้องไม่เกิน 3-5 มม. ต่อความสูง 3 เมตร"
  },
  {
    "id": "g-mas-dpc",
    "termEn": "Damp-Proof Course (DPC)",
    "termTh": "ชั้นแผ่นกันชื้นคานคอดิน",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ชั้นมอร์ตาร์ผสมน้ำยากันซึมหรือแผ่นพลาสติกกันชื้นที่ปูบนหลังคานคอดินก่อนเริ่มก่ออิฐแถวแรก",
    "fieldUsage": "ป้องกันความชื้นใต้ดินซึมขึ้นมาทำลายสีและปูนฉาบชายล่างผนัง (Rising Damp)"
  },
  {
    "id": "g-mas-bonding-agent",
    "termEn": "Bonding Agent",
    "termTh": "น้ำยาประสานคอนกรีต",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "น้ำยาโพลีเมอร์สังเคราะห์ที่ทาบนผิวคอนกรีตเก่าหรือผสมในมอร์ตาร์เพื่อเพิ่มแรงยึดเกาะระหว่างคอนกรีตเดิมกับปูนฉาบใหม่",
    "fieldUsage": "ทาบนเสาและท้องคานก่อนฉาบปูนเพื่อป้องกันการหลุดร่อน"
  },
  {
    "id": "g-mas-flashing",
    "termEn": "Flashing & Drip Edge",
    "termTh": "บัวหยดน้ำ / แนวปีกนกกันน้ำ",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ร่องใต้บัวคอนกรีตหรือปีกนกเพื่อตัดแรงตึงผิวของหยดน้ำฝน ไม่ให้น้ำไหลย้อนเข้าสู่ผนังอาคาร",
    "fieldUsage": "ต้องทำร่องบัวหยดน้ำขนาดกว้าง 1 ซม. ลึก 1 ซม. ใต้ขอบคิ้วและกันสาดภายนอกทุกจุด"
  },
  {
    "id": "g-mas-cavit-wall",
    "termEn": "Cavity Wall",
    "termTh": "ผนังสองชั้นเว้นช่องอากาศ",
    "category": "masonry",
    "categoryLabel": "งานก่ออิฐฉาบปูน",
    "definition": "ผนังที่ก่ออิฐขนานกันสองชั้นโดยเว้นช่องว่างอากาศตรงกลาง 5-10 ซม. เพื่อความเป็นฉนวนกันความร้อนและเสียงระดับสูง",
    "fieldUsage": "ต้องใส่เหล็กหนวดกุ้งยึดระหว่างผนังสองชั้น และทำรูระบายน้ำ (Weep Hole) ที่โคนผนังภายนอก"
  },
  {
    "id": "g-fin-ceramic-tile",
    "termEn": "Ceramic Tile",
    "termTh": "กระเบื้องเซรามิก",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "แผ่นกระเบื้องปูพื้นหรือบุผนังที่ผ่านการเผา เคลือบผิวหน้า มีลวดลายหลากหลาย อัตราการดูดซึมน้ำปานกลาง",
    "fieldUsage": "ต้องปูด้วยปูนกาวซีเมนต์เต็มแผ่น ห้ามปูแบบซาลาเปาเพราะจะเกิดโพรงใต้กระเบื้องและแตกง่าย"
  },
  {
    "id": "g-fin-homogeneous",
    "termEn": "Homogeneous / Porcelain Tile",
    "termTh": "กระเบื้องพอร์ซเลน / แกรนิตโต้",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "กระเบื้องเนื้อเดียวกันทั้งแผ่น เผาที่อุณหภูมิสูงมาก มีอัตราการดูดซึมน้ำต่ำมาก (ต่ำกว่า 0.5%) ทนทานต่อการขูดขีดสูง",
    "fieldUsage": "เนื่องจากดูดซึมน้ำต่ำมาก จึงต้องใช้ปูนกาวซีเมนต์เกรดพรีเมียมที่มีแรงยึดเกาะสูงพิเศษ"
  },
  {
    "id": "g-fin-grout",
    "termEn": "Tile Grout",
    "termTh": "กาวยาแนวกระเบื้อง",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "ซีเมนต์ผสมโพลีเมอร์และสี ใช้สำหรับอุดร่องรอยต่อระหว่างแผ่นกระเบื้องเพื่อความสวยงามและป้องกันน้ำซึม",
    "fieldUsage": "เว้นร่องยาแนวอย่างน้อย 1.5 - 2 มม. เพื่อรองรับการขยายตัวจากความร้อน ใช้ยาแนวผสมสารยับยั้งราดำในห้องน้ำ"
  },
  {
    "id": "g-fin-skirting",
    "termEn": "Skirting Board / Baseboard",
    "termTh": "บัวเชิงผนัง",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "คิ้วไม้ พีวีซี หรือกระเบื้องที่ติดตั้งตามรอยต่อระหว่างพื้นและผนังเพื่อความสวยงามและป้องกันผนังเปื้อนจากการถูพื้น",
    "fieldUsage": "ตรวจสอบแนวระนาบของพื้นและผนังก่อนติดตั้ง เพื่อไม่ให้เกิดช่องว่างระหว่างบัวกับผนัง"
  },
  {
    "id": "g-fin-vinyl-floor",
    "termEn": "SPC / Vinyl Flooring",
    "termTh": "พื้นไวนิลลายไม้ / พื้น SPC",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "วัสดุปูพื้นสังเคราะห์ลายไม้ ระบบคลิกล็อก (Stone Plastic Composite) กันน้ำ 100% ปลวกไม่กิน ติดตั้งสะดวกรวดเร็ว",
    "fieldUsage": "พื้นผิวด้านล่างต้องเรียบได้ระดับ (ความคลาดเคลื่อนไม่เกิน 2-3 มม. ต่อ 2 เมตร) ก่อนปูแผ่นโฟมรอง"
  },
  {
    "id": "g-fin-epoxy",
    "termEn": "Epoxy Flooring",
    "termTh": "พื้นอีพ็อกซี่",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "สารเคลือบพื้นไร้รอยต่อชนิดเรซิน ทนทานต่อสารเคมี กรด-ด่าง และทำความสะอาดง่าย นิยมใช้ในโรงงาน คลังสินค้า และลานจอดรถ",
    "fieldUsage": "ความชื้นของพื้นคอนกรีตก่อนลงสีอีพ็อกซี่ต้องไม่เกิน 4-5% และต้องขัดเปิดผิวด้วยเครื่องขัดเพชร"
  },
  {
    "id": "g-fin-drywall",
    "termEn": "Gypsum Board Drywall",
    "termTh": "ผนังเบายิปซั่มบอร์ด",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "ระบบผนังภายในที่ใช้แผ่นยิปซั่มยึดติดกับโครงคร่าวโลหะชุบสังกะสี (C-Stud & U-Track) ติดตั้งรวดเร็ว น้ำหนักเบา",
    "fieldUsage": "ห้องน้ำและส่วนเปียกต้องใช้แผ่นยิปซั่มทนชื้น (Moisture Resistant - สีเขียว) และยาแนวรอยต่อด้วยผ้าเทปใยแก้ว"
  },
  {
    "id": "g-fin-ceiling-grid",
    "termEn": "Suspended T-Bar Ceiling",
    "termTh": "ฝ้าเพดานทีบาร์",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "ระบบฝ้าแขวนโครงอะลูมิเนียมรูปตัวที คว่ำเป็นตารางช่อง 60x60 ซม. วางแผ่นยิปซั่มหรือแผ่นอะคูสติกซับเสียง",
    "fieldUsage": "ตรวจสอบระดับโครงฝ้าด้วยเลเซอร์วัดระดับ และยึดลวดแขวนกับโครงสร้างหลักอย่างมั่นคง"
  },
  {
    "id": "g-fin-primer",
    "termEn": "Alkali-Resistant Primer",
    "termTh": "สีรองพื้นปูนใหม่กันด่าง",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "สีทารองพื้นชั้นแรกบนผิวปูนฉาบใหม่ เพื่อป้องกันด่างในปูนทำลายฟิล์มสีจริง และเพิ่มแรงยึดเกาะของสีทับหน้า",
    "fieldUsage": "ปูนฉาบต้องแห้งสนิท (ความชื้น < 14%, ค่าความเป็นด่าง pH < 10) จึงจะเริ่มทารองพื้นได้"
  },
  {
    "id": "g-fin-topcoat",
    "termEn": "Emulsion Topcoat Paint",
    "termTh": "สีน้ำอะคริลิกทับหน้า",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "สีทาตกแต่งชั้นสุดท้าย มีทั้งชนิดด้าน กึ่งเงา และเงา ทนทานต่อสภาพอากาศและรังสี UV",
    "fieldUsage": "ทาอย่างน้อย 2 เที่ยว โดยรอให้สีเที่ยวแรกแห้งตัวสนิทประมาณ 2 ชั่วโมงก่อนทาเที่ยวที่สอง"
  },
  {
    "id": "g-fin-waterproof-paint",
    "termEn": "Waterproof Membrane Coating",
    "termTh": "ระบบกันซึมดาดฟ้าและห้องน้ำ",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "วัสดุทากันซึมชนิดโพลียูรีเทน อะคริลิก หรือซีเมนต์เบส เพื่อป้องกันน้ำรั่วซึมผ่านพื้นดาดฟ้าและห้องน้ำ",
    "fieldUsage": "ต้องทาขึ้นขอบผนังสูงอย่างน้อย 20-30 ซม. และทำการทดสอบขังน้ำ (Water Ponding Test) 24-48 ชั่วโมง"
  },
  {
    "id": "g-fin-curtain-wall",
    "termEn": "Curtain Wall",
    "termTh": "ผนังกระจกเคอร์เทนวอลล์",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "ผนังกระจกโครงอะลูมิเนียมภายนอกอาคารที่ไม่ได้รับน้ำหนักโครงสร้าง ยึดแขวนกับขอบพื้นอาคารเพื่อความโปร่งใสทันสมัย",
    "fieldUsage": "สำรวจพิกัดฉากและแนวดิ่งของ Bracket ฝังโครงสร้างอย่างละเอียดด้วย Total Station"
  },
  {
    "id": "g-fin-acp-cladding",
    "termEn": "Aluminum Composite Panel (ACP)",
    "termTh": "แผ่นอะลูมิเนียมคอมโพสิต",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "แผ่นประกบผิวอะลูมิเนียมสองด้านไส้กลางโพลีเอทิลีน ใช้ตกแต่งฟาซาดอาคารภายนอก น้ำหนักเบา ทนทาน สีสันคงทน",
    "fieldUsage": "ยาแนวรอยต่อระหว่างแผ่นด้วยซิลิโคนชนิด Non-Staining Weatherseal"
  },
  {
    "id": "g-fin-sealant",
    "termEn": "Polyurethane / Silicone Sealant",
    "termTh": "ซิลิโคนและพียูยาแนว",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "วัสดุอุดรอยต่อยืดหยุ่นสูง ป้องกันน้ำ ลม และฝุ่นละออง นิยมใช้รอบวงกบประตู หน้าต่าง และรอยต่อขยายตัว",
    "fieldUsage": "ติดกระดาษกาวขนาบร่องก่อนยิง และปาดหน้าให้เรียบสม่ำเสมอในครั้งเดียว"
  },
  {
    "id": "g-fin-door-jamb",
    "termEn": "Door Jamb / Subframe",
    "termTh": "วงกบประตูและซับวงกบ",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "กรอบโครงสร้างที่ติดตั้งรอบช่องเปิดผนังเพื่อเป็นจุดยึดบานพับและล็อกประตู",
    "fieldUsage": "ตรวจสอบดิ่ง ฉาก และระดับของวงกบด้วยเลเซอร์ก่อนยึดพุกและฉีดโฟม PU อุดช่องว่าง"
  },
  {
    "id": "g-fin-screed-floor",
    "termEn": "Floor Screed",
    "termTh": "ปูนทรายปรับระดับพื้น",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "ชั้นมอร์ตาร์ปรับระดับความลาดเอียง (Slope) ของพื้นห้องน้ำ ระเบียง หรือดาดฟ้า เพื่อให้น้ำไหลลงท่อระบายน้ำสะดวก",
    "fieldUsage": "ต้องจับระดับทำสโลปไม่น้อยกว่า 1:100 (1 ซม. ต่อ 1 ม.) ไปยังจุด Floor Drain"
  },
  {
    "id": "g-fin-self-leveling",
    "termEn": "Self-Leveling Underlayment",
    "termTh": "ปูนปรับระดับไหลตัวได้เอง",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "ปูนมอร์ตาร์สูตรพิเศษที่ผสมน้ำแล้วมีความลื่นไหลสูง สามารถปรับระนาบผิวพื้นให้เรียบเนียนได้ระดับด้วยตัวเอง",
    "fieldUsage": "นิยมใช้เตรียมผิวก่อนปูพื้นไวนิล SPC หรือพื้นไม้ลามิเนตในพื้นที่ต้องการความเรียบสูง"
  },
  {
    "id": "g-fin-handrail",
    "termEn": "Balustrade & Handrail",
    "termTh": "ราวกันตกและราวมือจับ",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "โครงสร้างนิรภัยตามขอบระเบียง บันได หรือช่องเปิดสูง ทำจากสเตนเลส เหล็ก หรือกระจกนิรภัยเทมเปอร์",
    "fieldUsage": "ตามกฎหมายควบคุมอาคาร: ราวกันตกต้องสูงไม่น้อยกว่า 90 ซม. ถึง 1.10 ม. และช่องว่างลูกกรงห้ามกว้างเกิน 10 ซม."
  },
  {
    "id": "g-fin-expansion-strip",
    "termEn": "Expansion Joint Strip",
    "termTh": "เส้นพีวีซีแบ่งแนวรอยต่อพื้น",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "เส้นทองเหลือง สเตนเลส หรือพีวีซีที่ฝังคั่นในการเทพื้นหินขัด (Terrazzo) หรือกระเบื้องแผ่นใหญ่เพื่อแบ่งพื้นที่และป้องกันการแตกร้าว",
    "fieldUsage": "ติดตั้งตามแนวที่ออกแบบไว้เพื่อความสวยงามและเป็นรอยต่อขยายตัวในตัว"
  },
  {
    "id": "g-fin-stair-nosing",
    "termEn": "Stair Nosing / Step Tread",
    "termTh": "จมูกบันไดกันลื่น",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "แถบยาง อะลูมิเนียม หรือลวดลายกันลื่นที่ติดตั้งบริเวณขอบคมหน้าบันไดเพื่อป้องกันคนลื่นหกล้มและปกป้องขอบกระเบื้องบันได",
    "fieldUsage": "ต้องติดตั้งให้แนบสนิทและระดับเสมอกับผิวกระเบื้องลูกนอน"
  },
  {
    "id": "g-fin-granite-slab",
    "termEn": "Natural Granite Slab",
    "termTh": "หินแกรนิตธรรมชาติ",
    "category": "finishing",
    "categoryLabel": "งานสถาปัตย์ & งานผิว",
    "definition": "แผ่นหินแกรนิตธรรมชาติ ตัด ขัดเงา หรือพ่นไฟ ใช้ปูพื้น เคาน์เตอร์ และบันได หรูหรา แข็งแกร่ง ทนรอยขีดข่วน",
    "fieldUsage": "ต้องทาน้ำยากันซึมเคลือบหินทั้ง 6 ด้านก่อนปู เพื่อป้องกันคราบด่างและความชื้นซึมขึ้นจากปูน"
  },
  {
    "id": "g-plb-invert-level",
    "termEn": "Invert Level (IL)",
    "termTh": "ระดับท้องท่อด้านใน",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ระดับความสูงของผิวด้านในต่ำสุดของท่อระบายน้ำ เป็นระดับอ้างอิงสำคัญที่วิศวกรสำรวจต้องควบคุมในการวางท่อระบายน้ำ",
    "fieldUsage": "ช่างสำรวจต้องส่องกล้องระดับเช็คค่า IL ทุกท่อนและที่ปากบ่อพัก Manhole เพื่อให้ได้สโลปการไหลตามธรรมชาติ"
  },
  {
    "id": "g-plb-slope-drain",
    "termEn": "Drainage Slope",
    "termTh": "ความลาดเอียงของท่อระบายน้ำ",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "อัตราส่วนความลาดเอียงของท่อเพื่อให้น้ำเสียและสิ่งปฏิกูลไหลได้ด้วยแรงโน้มถ่วงโดยไม่ตกตะกอน (Self-Cleansing Velocity)",
    "fieldUsage": "ท่อส้วมและท่อน้ำทิ้งขนาด 4 นิ้ว กำหนดสโลปมาตรฐานไม่น้อยกว่า 1:50 ถึง 1:100"
  },
  {
    "id": "g-plb-soil-pipe",
    "termEn": "Soil Pipe",
    "termTh": "ท่อโสโครก / ท่อส้วม",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ท่อลำเลียงสิ่งปฏิกูลจากโถส้วมและโถปัสสาวะไปยังถังบำบัดน้ำเสีย (ใช้ท่อ PVC สีฟ้าชั้นความหนา 8.5 หรือ 13.5)",
    "fieldUsage": "ห้ามต่อท่อน้ำทิ้งทั่วไปมารวมกับท่อโสโครกก่อนถึงถังบำบัดเพื่อป้องกันกลิ่นย้อน"
  },
  {
    "id": "g-plb-waste-pipe",
    "termEn": "Waste Pipe",
    "termTh": "ท่อน้ำทิ้ง",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ท่อระบายน้ำทิ้งจากการชำระล้าง อ่างล้างหน้า ฝักบัว และอ่างซิงค์ ไปยังบ่อดักไขมันหรือบ่อพักน้ำทิ้ง",
    "fieldUsage": "ต้องติดตั้ง P-Trap ดักกลิ่นใต้สุขภัณฑ์ทุกจุด"
  },
  {
    "id": "g-plb-vent-pipe",
    "termEn": "Vent Pipe",
    "termTh": "ท่อระบายอากาศ / ท่ออากาศ",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ท่อที่ต่อแยกจากระบบท่อระบายน้ำขึ้นสู่บรรยากาศเหนือหลังคา เพื่อปรับสมดุลความดันอากาศในเส้นท่อและป้องกันน้ำกักใน Trap ถูกดูดหาย",
    "fieldUsage": "ปลายท่ออากาศต้องยื่นพ้นหลังคาไม่น้อยกว่า 30-50 ซม. และสวมข้องอคว่ำหรือหมวกกันฝน"
  },
  {
    "id": "g-plb-p-trap",
    "termEn": "P-Trap",
    "termTh": "ท่อดักกลิ่นรูปตัวพี",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ข้องอท่อรูปตัว U หรือ P ที่มีน้ำขังอยู่ตลอดเวลา (Water Seal) ทำหน้าที่เป็นม่านน้ำกั้นไม่ให้กลิ่นเหม็นและก๊าซพิษย้อนขึ้นมาตามท่อ",
    "fieldUsage": "ความลึกของขังน้ำกักกลิ่น (Trap Seal) ต้องอยู่ระหว่าง 5.0 - 10.0 ซม."
  },
  {
    "id": "g-plb-floor-drain",
    "termEn": "Floor Drain (FD)",
    "termTh": "ตะแกรงระบายน้ำทิ้งที่พื้น",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ช่องระบายน้ำทิ้งที่ติดตั้งบนพื้นห้องน้ำ ระเบียง หรือลานซักล้าง มักมีถ้วยดักกลิ่นและดักเศษผมในตัว",
    "fieldUsage": "ต้องวางผังและปรับสโลปพื้นเทเข้าหาตำแหน่ง FD โดยตรง ป้องกันน้ำขังเป็นแอ่ง"
  },
  {
    "id": "g-plb-manhole",
    "termEn": "Drainage Manhole",
    "termTh": "บ่อพักท่อระบายน้ำ",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "บ่อคอนกรีตสำเร็จรูปหรือก่ออิฐที่ติดตั้งตามแนวท่อระบายน้ำทุกระยะ 8-12 ม. หรือที่จุดเลี้ยว เพื่อดักตะกอนและเปิดลอกท่อ",
    "fieldUsage": "ก้นบ่อต้องทำร่องน้ำไหล (Benching / Invert Channel) เพื่อไม่ให้น้ำและเศษขยะตกค้างก้นบ่อ"
  },
  {
    "id": "g-plb-catch-basin",
    "termEn": "Catch Basin",
    "termTh": "บ่อรับน้ำฝน",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "บ่อพักที่มีฝาตะแกรงเหล็กด้านบนสำหรับรับน้ำฝนจากผิวถนนหรือลานจอดรถ พร้อมช่องดักทรายก้นบ่อ",
    "fieldUsage": "ต้องสำรวจระดับปากบ่อให้รับกับระดับขอบผิวจราจรพอดี"
  },
  {
    "id": "g-plb-grease-trap",
    "termEn": "Grease Trap",
    "termTh": "ถังดักไขมัน",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "อุปกรณ์แยกและดักจับไขมันและน้ำมันจากการล้างจานครัว ก่อนปล่อยน้ำทิ้งลงสู่ท่อสาธารณะเพื่อป้องกันท่ออุดตัน",
    "fieldUsage": "ต้องตักเศษไขมันที่ลอยบนผิวน้ำไปทิ้งสัปดาห์ละ 1 ครั้ง"
  },
  {
    "id": "g-plb-septic-tank",
    "termEn": "Septic Tank (Anaerobic)",
    "termTh": "ถังบำบัดน้ำเสียสำเร็จรูป",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ถังบำบัดน้ำเสียใต้ดินทำจากไฟเบอร์กลาสหรือพลาสติก PE ภายในมีชั้นตัวกลางจุลินทรีย์บำบัดน้ำเสียแบบไม่ใช้ออกซิเจน",
    "fieldUsage": "ต้องกรอกน้ำให้เต็มถังทันทีที่หย่อนลงหลุม เพื่อป้องกันแรงดันน้ำใต้ดินดันถังลอยตัวขึ้นก่อนกลบดิน"
  },
  {
    "id": "g-plb-water-meter",
    "termEn": "Water Meter",
    "termTh": "มาตรวัดน้ำประปา",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "อุปกรณ์วัดปริมาตรการใช้น้ำประปาที่ติดตั้งหน้าอาคารริมแนวเขตที่ดิน",
    "fieldUsage": "ตรวจสอบทิศทางลูกศรการไหล และติดตั้งเช็ควาล์วป้องกันน้ำไหลย้อนกลับ"
  },
  {
    "id": "g-plb-gate-valve",
    "termEn": "Gate Valve",
    "termTh": "ประตูน้ำ / วาล์วประตูกั้นน้ำ",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "วาล์วที่ใช้ลิ้นประตูเลื่อนขึ้น-ลงเพื่อเปิดหรือปิดการไหลของน้ำเต็มที่ ไม่เหมาะกับการหรี่ปรับอัตราการไหล",
    "fieldUsage": "ติดตั้งที่ท่อเมนจ่ายน้ำหลักเพื่อตัดตอนการซ่อมแซม"
  },
  {
    "id": "g-plb-check-valve",
    "termEn": "Check Valve (Non-Return Valve)",
    "termTh": "เช็ควาล์ว / วาล์วกันน้ำย้อน",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "วาล์วที่ยอมให้น้ำไหลผ่านได้ในทิศทางเดียวโดยอัตโนมัติ และปิดกั้นทันทีเมื่อน้ำไหลย้อนกลับ",
    "fieldUsage": "ติดตั้งหลังปั๊มน้ำทุกตัวเพื่อป้องกันแรงกระแทกจากน้ำย้อนกลับ (Water Hammer)"
  },
  {
    "id": "g-plb-prv",
    "termEn": "Pressure Reducing Valve (PRV)",
    "termTh": "วาล์วลดแรงดันน้ำ",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "วาล์วควบคุมแรงดันน้ำขาออกให้คงที่ตามค่าที่กำหนด เพื่อป้องกันท่อและสุขภัณฑ์ในอาคารสูงชั้นล่างๆ แตกเสียหายจากแรงดันเกิน",
    "fieldUsage": "อาคารสูงเกิน 8 ชั้นต้องแบ่งโซนจ่ายน้ำหรือติดตั้ง PRV คุมแรงดันไม่เกิน 2-3 บาร์"
  },
  {
    "id": "g-plb-booster-pump",
    "termEn": "Booster Pump System",
    "termTh": "ระบบปั๊มเสริมแรงดัน",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ชุดปั๊มน้ำหลายตัวที่ทำงานร่วมกับถังแรงดันไดอะแฟรมและตู้ควบคุมเพื่อรักษาแรงดันน้ำในเส้นท่อให้คงที่ตลอดเวลา",
    "fieldUsage": "ติดตั้งฐานสปริงดูดซับแรงสั่นสะเทือน (Vibration Isolator) ใต้แท่นปั๊ม"
  },
  {
    "id": "g-plb-submersible-pump",
    "termEn": "Submersible Sump Pump",
    "termTh": "ปั๊มจุ่ม / ไดโว่ระบายน้ำทิ้ง",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ปั๊มน้ำชนิดแช่อยู่ใต้น้ำในบ่อพักน้ำชั้นใต้ดิน ทำหน้าที่สูบระบายน้ำทิ้งขึ้นสู่ท่อระบายน้ำสาธารณะภายนอก",
    "fieldUsage": "ต้องมีลูกลอยสวิตช์อัตโนมัติและปั๊มคู่แบบสลับการทำงาน (Duty-Standby)"
  },
  {
    "id": "g-plb-hydrostatic-test",
    "termEn": "Hydrostatic Pressure Test",
    "termTh": "การทดสอบแรงดันน้ำในท่อ",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "การอัดแรงดันน้ำเข้าไปในระบบท่อประปาที่ติดตั้งเสร็จแล้วเพื่อตรวจสอบหารอยรั่วซึมก่อนปิดฝ้าหรือกลบดิน",
    "fieldUsage": "อัดแรงดันทดสอบ 1.5 เท่าของแรงดันใช้งาน (หรือไม่น้อยกว่า 10 บาร์) นานอย่างน้อย 2-4 ชั่วโมงโดยแรงดันต้องไม่ตก"
  },
  {
    "id": "g-plb-pvc-pipe",
    "termEn": "PVC Pipe (JIS Standard)",
    "termTh": "ท่อพีวีซีแข็งสำหรับงานสุขาภิบาล",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ท่อโพลีไวนิลคลอไรด์ มอก. 17-2532: ท่อสีฟ้าสำหรับงานรับแรงดันประปา (Class 8.5, 13.5) และท่อสีเทาสำหรับงานระบายน้ำไร้แรงดัน",
    "fieldUsage": "ทาน้ำยาประสานท่อทั้งที่ผิวปลายท่อและในข้อต่อ สวมอัดให้สุดแล้วจับค้างไว้ 15-30 วินาที"
  },
  {
    "id": "g-plb-hdpe-pipe",
    "termEn": "HDPE Pipe (High-Density Polyethylene)",
    "termTh": "ท่อเอชดีพีอี / ท่อพีอีคาดฟ้า",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ท่อพลาสติกโพลีเอทิลีนความหนาแน่นสูง ยืดหยุ่นได้ดี ทนต่อแรงกดทับใต้ดินและสารเคมี นิยมใช้เป็นท่อเมนประปาฝังดิน",
    "fieldUsage": "เชื่อมต่อด้วยวิธีหลอมความร้อน Butt Fusion หรือข้อต่อสวมอัด Compression"
  },
  {
    "id": "g-plb-cleanout",
    "termEn": "Pipe Cleanout (CO)",
    "termTh": "ช่องเปิดล้างท่อ",
    "category": "plumbing",
    "categoryLabel": "งานสุขาภิบาล & ระบบท่อ",
    "definition": "ฝาเกลียวปิดสนิทที่ติดตั้งตามจุดหักเลี้ยวหรือปลายเส้นท่อน้ำทิ้ง เพื่อใช้เปิดสอดสายแยงล้างท่อเมื่อเกิดการอุดตัน",
    "fieldUsage": "ต้องติดตั้ง Cleanout ทุกระยะความยาวท่อไม่เกิน 15-20 เมตรตามแนวท่อตรง"
  },
  {
    "id": "g-elec-mdb",
    "termEn": "Main Distribution Board (MDB)",
    "termTh": "ตู้ควบคุมไฟฟ้าหลัก",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "แผงควบคุมและจ่ายไฟฟ้าประธานของอาคาร รับไฟฟ้าแรงต่ำจากหม้อแปลงและกระจายไปยังตู้ไฟย่อยตามส่วนต่างๆ",
    "fieldUsage": "ติดตั้งในห้องไฟฟ้าที่มีการระบายอากาศดี และมีระยะว่างหน้าตู้ไม่น้อยกว่า 1.0-1.2 เมตรเพื่อความปลอดภัย"
  },
  {
    "id": "g-elec-db",
    "termEn": "Distribution Board (DB / Consumer Unit)",
    "termTh": "ตู้ควบคุมไฟฟ้าย่อย / ตู้คอนซูเมอร์ยูนิต",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "ตู้แผงสวิตช์ย่อยประจำชั้นหรือประจำห้อง สำหรับควบคุมวงจรย่อยแสงสว่างและเต้ารับ",
    "fieldUsage": "ต้องติดป้ายกำกับวงจร (Circuit Directory) ระบุพื้นที่ควบคุมของเบรกเกอร์ทุกตัวอย่างชัดเจน"
  },
  {
    "id": "g-elec-mcb-mccb",
    "termEn": "Circuit Breaker (MCB / MCCB)",
    "termTh": "เซอร์กิตเบรกเกอร์ / สวิตช์ตัดตอนอัตโนมัติ",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "อุปกรณ์ตัดวงจรไฟฟ้าอัตโนมัติเมื่อเกิดกระแสไฟฟ้าเกิน (Overload) หรือไฟฟ้าลัดวงจร (Short Circuit)",
    "fieldUsage": "ขนาดพิกัดแอมป์ตัดวงจร (Trip Rating) ต้องสัมพันธ์กับขนาดกระแสทนได้ของสายไฟเพื่อป้องกันสายไฟไหม้"
  },
  {
    "id": "g-elec-rcd-rcbo",
    "termEn": "Residual Current Device (RCD / RCBO)",
    "termTh": "อุปกรณ์ตัดไฟรั่ว / เบรกเกอร์กันดูด",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "อุปกรณ์ตรวจจับกระแสไฟฟ้ารั่วลงดินและตัดวงจรอย่างรวดเร็วเพื่อป้องกันอันตรายจากไฟฟ้าดูดคน",
    "fieldUsage": "กฎหมายกำหนดให้วงจรเต้ารับห้องน้ำ ห้องครัว เต้ารับภายนอกอาคาร และเครื่องทำน้ำอุ่น ต้องติด RCD ตัดไฟรั่วขนาด ≤ 30 mA"
  },
  {
    "id": "g-elec-ground-rod",
    "termEn": "Ground Rod & Grounding System",
    "termTh": "หลักดินและระบบสายดิน",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "แท่งเหล็กหุ้มทองแดงขนาดเส้นผ่านศูนย์กลางไม่น้อยกว่า 5/8 นิ้ว ยาว 2.40 ม. ตอกลงในดินเพื่อต่อสายดินระบบไฟฟ้า",
    "fieldUsage": "ค่าความต้านทานการต่อลงดิน (Earth Resistance) ต้องวัดได้ไม่เกิน 5 โอห์ม ตามมาตรฐาน วสท. / กฟภ. / กฟน."
  },
  {
    "id": "g-elec-earth-test",
    "termEn": "Earth Resistance Test",
    "termTh": "การทดสอบความต้านทานหลักดิน",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "การใช้เครื่องมือ Earth Tester วัดค่าความต้านทานของหลักดินโดยปักหมุดทดสอบชั่วคราวห่างออกไป 5 และ 10 เมตร",
    "fieldUsage": "หากวัดได้เกิน 5 โอห์ม ต้องตอกแท่งกราวด์เพิ่มแบบขนานหรือปรับปรุงสภาพดินด้วยผงเคมีลดแรงต้านทาน"
  },
  {
    "id": "g-elec-emt-conduit",
    "termEn": "Electrical Metallic Tubing (EMT)",
    "termTh": "ท่อร้อยสายไฟโลหะชนิดบาง",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "ท่อเหล็กชุบสังกะสีผิวเรียบ สำหรับเดินสายไฟฟ้าลอยในอาคารหรือซ่อนในฝ้าเพดาน",
    "fieldUsage": "การดัดท่อต้องใช้เครื่องมือ Bending Tool โดยรัศมีดัดต้องไม่ทำให้ท่อบี้แบน"
  },
  {
    "id": "g-elec-imc-conduit",
    "termEn": "Intermediate Metal Conduit (IMC)",
    "termTh": "ท่อร้อยสายไฟโลหะชนิดหนาปานกลาง",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "ท่อเหล็กชุบสังกะสีแบบหนาต่อด้วยเกลียว ทนทานต่อแรงกระแทกและป้องกันความชื้น นิยมใช้เดินนอกอาคารและโรงงาน",
    "fieldUsage": "ปลายท่อต้องต๊าปเกลียวและสวมปลอกบุชชิ่ง (Bushing) ป้องกันสายไฟบาด"
  },
  {
    "id": "g-elec-cable-tray",
    "termEn": "Cable Tray / Cable Ladder",
    "termTh": "รางเคเบิลเทรย์และรางบันได",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "โครงรางโลหะสำหรับรองรับสายไฟฟ้ากำลังและสายสื่อสารจำนวนมากในอาคารสูงและโรงงานอุตสาหกรรม",
    "fieldUsage": "สายไฟแรงสูงและสายสัญญาณสื่อสารต้องแยกรางกันเพื่อป้องกันการรบกวนของคลื่นแม่เหล็กไฟฟ้า (EMI)"
  },
  {
    "id": "g-elec-trunking",
    "termEn": "Wireway / Cable Trunking",
    "termTh": "รางวายเวย์โลหะ",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "รางโลหะแผ่นพับทรงสี่เหลี่ยมพร้อมฝาปิด สำหรับรวบรวมสายไฟฟ้าในห้องควบคุมหรือแนวท่อรวม",
    "fieldUsage": "พื้นที่หน้าตัดรวมของสายไฟทั้งหมดต้องไม่เกิน 20% ถึง 40% ของพื้นที่หน้าตัดภายในรางตามมาตรฐาน"
  },
  {
    "id": "g-elec-busbar",
    "termEn": "Busbar & Busduct",
    "termTh": "บัสบาร์ทองแดงและบัสบาร์หุ้มฉนวน",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "แถบแท่งทองแดงนำไฟฟ้าความบริสุทธิ์สูง ใช้รวมกระแสและจ่ายไฟกำลังสูงในตู้สวิตช์บอร์ดแทนสายไฟขนาดใหญ่",
    "fieldUsage": "ต้องขันโบลต์ยึดด้วยประแจทอร์กตามค่าปอนด์ที่กำหนดและมาร์กสีเช็คการคลายตัว"
  },
  {
    "id": "g-elec-transformer",
    "termEn": "Distribution Transformer",
    "termTh": "หม้อแปลงไฟฟ้าจำหน่าย",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "อุปกรณ์แปลงแรงดันไฟฟ้าแรงสูงจากการไฟฟ้า (22 kV หรือ 24 kV) ลงเป็นแรงดันใช้งาน 400/230 โวลต์ 3 เฟส 4 สาย",
    "fieldUsage": "ต้องมีลานกั้นหม้อแปลง รางระบายน้ำมัน และระบบสายดินหม้อแปลงที่สมบูรณ์"
  },
  {
    "id": "g-elec-three-phase",
    "termEn": "Three-Phase 4-Wire System",
    "termTh": "ระบบไฟฟ้า 3 เฟส 4 สาย",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "ระบบจำหน่ายไฟฟ้าประกอบด้วยสายเฟส 3 เส้น (L1, L2, L3) และสายนิวทรัล (N) แรงดันระหว่างสายเฟส 400V และระหว่างเฟสกับนิวทรัล 230V",
    "fieldUsage": "ต้องเฉลี่ยโหลด (Load Balancing) แต่ละเฟสให้ใกล้เคียงกันเพื่อไม่ให้กระแสไหลในสายนิวทรัลสูงเกินไป"
  },
  {
    "id": "g-elec-load-schedule",
    "termEn": "Electrical Load Schedule",
    "termTh": "ตารางคำนวณโหลดไฟฟ้า",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "ตารางรายละเอียดที่แสดงการคำนวณกระแสไฟฟ้าของแต่ละวงจรย่อย ขนาดเบรกเกอร์ ขนาดสายไฟ และเฟสที่เชื่อมต่อ",
    "fieldUsage": "ใช้วางแผนการจัดสมดุลโหลดและตรวจรับงานติดตั้งแผงจ่ายไฟฟ้า"
  },
  {
    "id": "g-elec-voltage-drop",
    "termEn": "Voltage Drop",
    "termTh": "แรงดันตกในสายไฟฟ้า",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "การสูญเสียแรงดันไฟฟ้าในเส้นตัวนำเนื่องจากความต้านทานของสายและความยาวในการเดินสาย",
    "fieldUsage": "มาตรฐานกำหนดแรงดันตกจากตู้เมนถึงจุดใช้น้ำสุดท้ายต้องไม่เกิน 3% ถึง 5% ของแรงดันพิกัด"
  },
  {
    "id": "g-elec-lux-level",
    "termEn": "Illuminance / Lux Level",
    "termTh": "ระดับความส่องสว่าง",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "ปริมาณแสงสว่างที่ตกกระทบต่อหน่วยพื้นที่ วัดด้วยเครื่องลักซ์มิเตอร์ (หน่วย: Lux)",
    "fieldUsage": "ตามมาตรฐานกรมสวัสดิการและคุ้มครองแรงงาน: สำนักงานทั่วไป 300-500 Lux, ทางเดิน 100 Lux, ห้องผ่าตัด 1,000 Lux"
  },
  {
    "id": "g-elec-wire-pulling",
    "termEn": "Wire Pulling & Lubricant",
    "termTh": "การร้อยสายไฟและน้ำยารูดสาย",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "กระบวนการดึงสายไฟเข้าร้อยในท่อร้อยสาย โดยใช้น้ำยาลื่น (Wire Pulling Lubricant) ช่วยลดแรงเสียดทาน",
    "fieldUsage": "ห้ามใช้น้ำมันเครื่องหรือผงซักฟอกแทนน้ำยารูดสายเพราะจะกัดกร่อนฉนวนพีวีซี"
  },
  {
    "id": "g-elec-pull-box",
    "termEn": "Pull Box / Junction Box",
    "termTh": "กล่องดึงสายและกล่องต่อสาย",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "กล่องเหล็กที่ติดตั้งคั่นในแนวท่อร้อยสายที่มีระยะทางยาวหรือมีจุดเลี้ยวหลายจุดเพื่อความสะดวกในการดึงสายไฟ",
    "fieldUsage": "แนวท่อเลี้ยวโค้งรวมกันเกิน 360 องศา (หรือ 4 โค้งฉาก) ต้องใส่ Pull Box คั่น"
  },
  {
    "id": "g-elec-conduit-bending",
    "termEn": "Conduit Bending Offset",
    "termTh": "การดัดคอม้าท่อร้อยสาย",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "เทคนิคการดัดท่อโลหะให้หลบสิ่งกีดขวางหรือเข้ากล่องสวิตช์ให้แนบสนิทกับผนัง",
    "fieldUsage": "ต้องวัดระยะและใช้สูตรคำนวณระยะหด (Shrink) และระยะคูณ (Multiplier) ให้ตรงมุม 30° หรือ 45°"
  },
  {
    "id": "g-elec-lightning-protection",
    "termEn": "Lightning Protection System (LPS)",
    "termTh": "ระบบป้องกันฟ้าผ่า",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "ระบบเสาล่อฟ้า สายนำลงดิน (Down Conductor) และบ่อกราวด์ เพื่อดักจับและถ่ายเทประจุฟ้าผ่าลงสู่ดินอย่างปลอดภัย",
    "fieldUsage": "รัศมีการป้องกันต้องครอบคลุมอาคารตามทฤษฎี Rolling Sphere Method ตามมาตรฐาน IEC 62305"
  },
  {
    "id": "g-elec-generator",
    "termEn": "Emergency Standby Generator",
    "termTh": "เครื่องกำเนิดไฟฟ้าสำรอง",
    "category": "electrical",
    "categoryLabel": "งานระบบไฟฟ้า & สื่อสาร",
    "definition": "เครื่องยนต์ดีเซลปั่นไฟฉุกเฉินที่ทำงานอัตโนมัติผ่านสวิตช์โอนย้ายแหล่งจ่าย (ATS) เมื่อไฟฟ้าหลวงดับ",
    "fieldUsage": "ต้องจ่ายไฟให้ระบบลิฟต์ดับเพลิง ปั๊มดับเพลิง ไฟฉุกเฉิน และบันไดหนีไฟได้ภายใน 10-15 วินาที"
  },
  {
    "id": "g-rd-subbase",
    "termEn": "Soil Aggregate Subbase",
    "termTh": "ชั้นรองพื้นทางหินคลุก / ดินซีเมนต์",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ชั้นโครงสร้างทางที่อยู่ใต้ชั้นพื้นทาง ทำจากวัสดุมวลรวมคัดเลือกเพื่อช่วยกระจายน้ำหนักลงสู่ชั้นดินเดิม",
    "fieldUsage": "ต้องควบคุมความแน่นการบดอัดไม่น้อยกว่า 95-100% Modified Proctor"
  },
  {
    "id": "g-rd-crushed-base",
    "termEn": "Crushed Rock Base",
    "termTh": "ชั้นพื้นทางหินคลุก",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ชั้นโครงสร้างหลักใต้ผิวทางลาดยาง ทำจากหินบดคัดขนาดที่มีความแข็งแกร่งและค่า CBR สูง (CBR ≥ 80%)",
    "fieldUsage": "ช่างสำรวจต้องวางหมุดระดับคุมความหนาและสโลปหลังทางก่อนเริ่มพ่นยาง"
  },
  {
    "id": "g-rd-prime-coat",
    "termEn": "Prime Coat",
    "termTh": "ไพรม์โค้ต",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "การพ่นยางแอสฟัลต์ชนิดเหลว (เช่น CSS-1 หรือ MC-70) ลงบนชั้นพื้นทางหินคลุกเพื่อให้อุดแทรกซึมและประสานกับผิวหิน",
    "fieldUsage": "ต้องปล่อยให้น้ำยางแตกตัวและซึมแห้งสนิทอย่างน้อย 24 ชั่วโมงก่อนปูผิวแอสฟัลต์ทับ"
  },
  {
    "id": "g-rd-tack-coat",
    "termEn": "Tack Coat",
    "termTh": "แท็คโค้ต",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "การพ่นน้ำยางแอสฟัลต์บางๆ ลงบนผิวคอนกรีตเดิมหรือผิวลาดยางเดิม เพื่อเป็นตัวประสานเชื่อมยึดกับผิวแอสฟัลต์ชั้นใหม่",
    "fieldUsage": "พ่นในอัตราส่วนประมาณ 0.2 - 0.4 ลิตร/ตร.ม. และห้ามรถวิ่งทับก่อนปูผิวใหม่"
  },
  {
    "id": "g-rd-asphaltic-concrete",
    "termEn": "Asphaltic Concrete (AC)",
    "termTh": "แอสฟัลต์คอนกรีต / ผิวทางลาดยาง",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ส่วนผสมของหินคัดขนาด ทราย ฝุ่นหิน และยางมะตอยผสมร้อนที่อุณหภูมิ 140-160°C ปูและบดอัดแน่นเป็นผิวจราจรยืดหยุ่น",
    "fieldUsage": "ควบคุมอุณหภูมิขณะปูและบดอัดไม่ให้ต่ำกว่า 110-120°C เพื่อให้ได้ความหนาแน่นตามเกณฑ์"
  },
  {
    "id": "g-rd-rigid-pavement",
    "termEn": "Rigid Pavement",
    "termTh": "ผิวทางคอนกรีต / ผิวทางแบบแกร่ง",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ถนนผิวคอนกรีตเสริมเหล็กที่รับน้ำหนักด้วยกำลังดัดของแผ่นคอนกรีตโดยตรง ทนทานต่อแรงกดทับของรถบรรทุกหนัก",
    "fieldUsage": "รอยต่อขยายตัว (Expansion Joint) และรอยต่อตัดหด (Contraction Joint) ต้องตัดหยอดร่องยางมะตอยตามระยะ"
  },
  {
    "id": "g-rd-crown-cross-slope",
    "termEn": "Camber / Cross Slope",
    "termTh": "ความลาดเอียงหลังเต่า",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ความลาดเอียงตามแนวขวางของถนนจากกึ่งกลางลาดลงสู่สองข้าง (ปกติ 2.0% - 2.5%) เพื่อช่วยระบายน้ำฝนออกจากผิวจราจรอย่างรวดเร็ว",
    "fieldUsage": "ช่างสำรวจต้องคำนวณและส่องกล้องระดับตรวจสอบระดับ Centerline เทียบกับขอบทาง Edge of Pavement"
  },
  {
    "id": "g-rd-superelevation",
    "termEn": "Superelevation (e)",
    "termTh": "การยกโค้ง / ความลาดเอียงรับโค้ง",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "การยกระดับผิวทางด้านนอกโค้งให้สูงกว่าด้านในโค้ง เพื่อต้านทานแรงเหวี่ยงหนีศูนย์กลางของยานพาหนะที่วิ่งเข้าโค้ง",
    "fieldUsage": "คำนวณสเตชั่นเริ่มต้นและสิ้นสุดการเปลี่ยนระดับยกโค้ง (Superelevation Runoff) ให้ราบรื่นตามมาตรฐานกรมทางหลวง"
  },
  {
    "id": "g-rd-transition-curve",
    "termEn": "Spiral / Transition Curve",
    "termTh": "โค้งก้นหอย / โค้งเชื่อมเปลี่ยนผ่าน",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "โค้งที่มีรัศมีความโค้งลดลงอย่างสม่ำเสมอจากเส้นตรงเข้าสู่โค้งวงกลม เพื่อให้รถเปลี่ยนทิศทางและยกระดับโค้งได้อย่างปลอดภัย",
    "fieldUsage": "ใช้วางผังด้วยพิกัดพอยต์ต่อพอยต์จากโปรแกรมคำนวณโค้งราบ (Curve Calculator)"
  },
  {
    "id": "g-rd-sight-distance",
    "termEn": "Sight Distance",
    "termTh": "ระยะมองเห็นปลอดภัย",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ระยะทางตามแนวถนนข้างหน้าที่ผู้ขับขี่สามารถมองเห็นสิ่งกีดขวางได้อย่างชัดเจนและหยุดรถได้ทันท่วงที (Stopping Sight Distance)",
    "fieldUsage": "ต้องตรวจสอบทั้งระยะมองเห็นในแนวราบและแนวดิ่งบนโค้งยอดเนิน (Crest Vertical Curve)"
  },
  {
    "id": "g-rd-kerb-gutter",
    "termEn": "Kerb and Gutter",
    "termTh": "คันหินและรางระบายน้ำขอบทาง",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "โครงสร้างคอนกรีตหล่อสำเร็จหรือหล่อในที่ตามแนวขอบถนน ทำหน้าที่กั้นขอบทางและเป็นร่องนำน้ำไหลลงสู่บ่อรับน้ำฝน",
    "fieldUsage": "ตั้งแนวยึดด้วยสายเอ็นและตรวจระดับขอบบนคันหินทุกระยะ 10-15 เมตร"
  },
  {
    "id": "g-rd-guardrail",
    "termEn": "W-Beam Steel Guardrail",
    "termTh": "การ์ดเรล / ราวเหล็กกันอันตรายริมทาง",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "แผ่นเหล็กลอนชุบสังกะสีหนาติดตั้งบนเสาเหล็กริมทางโค้ง คันทางสูง หรือจุดเสี่ยงอันตราย เพื่อลดความรุนแรงเมื่อรถหลุดออกนอกทาง",
    "fieldUsage": "ความสูงของแนวแผ่นการ์ดเรลต้องได้ระดับ 75-80 ซม. จากผิวดิน และปลายเปิดต้องดัดโค้งฝังลงดิน (Flared End)"
  },
  {
    "id": "g-rd-road-markings",
    "termEn": "Thermoplastic Road Markings",
    "termTh": "เส้นจราจรเทอร์โมพลาสติก",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "สีตีเส้นจราจรชนิดผงหลอมร้อน ผสมลูกแก้วสะท้อนแสง (Glass Beads) ทนทานต่อการเหยียบย่ำของล้อรถ",
    "fieldUsage": "พื้นผิวถนนต้องแห้งและสะอาด ปราศจากคราบฝุ่นก่อนลงเครื่องตีเส้นที่ความร้อน 180-200°C"
  },
  {
    "id": "g-rd-rumble-strips",
    "termEn": "Rumble Strips",
    "termTh": "แถบเตือนบนผิวทาง / แถบสั่นสะเทือน",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "แถบวัสดุนูนหนา 5-10 มม. ขวางบนผิวทางเพื่อสร้างแรงสั่นสะเทือนและเสียงเตือนผู้ขับขี่ให้ลดความเร็วก่อนถึงทางแยกหรือทางโค้งอันตราย",
    "fieldUsage": "ติดตั้งเป็นชุด ชุดละ 5-7 เส้น ระยะห่างสม่ำเสมอตามเกณฑ์กรมทางหลวง"
  },
  {
    "id": "g-rd-culvert",
    "termEn": "Drainage Culvert",
    "termTh": "ท่อลอดเหลี่ยม / ท่อลอดระบายน้ำถนน",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "โครงสร้างท่อระบายน้ำข้ามใต้คันทาง อาจเป็นท่อคอนกรีตกลม (RCP) หรือท่อเหลี่ยมคอนกรีตเสริมเหล็ก (Box Culvert)",
    "fieldUsage": "สำรวจระดับท้องท่อทางเข้าและทางออกให้สอดคล้องกับร่องน้ำธรรมชาติเพื่อป้องกันน้ำท่วมขังคันทาง"
  },
  {
    "id": "g-rd-wearing-course",
    "termEn": "Wearing Course",
    "termTh": "ชั้นผิวทางชั้นบนสุด",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ชั้นบนสุดของโครงสร้างทางที่สัมผัสกับล้อยานพาหนะโดยตรง ออกแบบให้มีความฝืดสูง ไม่ลื่น และทนทานต่อการขัดสี",
    "fieldUsage": "ต้องทดสอบค่าความฝืดผิวทาง (Skid Resistance) และความขรุขระสากทาง (IRI: International Roughness Index)"
  },
  {
    "id": "g-rd-binder-course",
    "termEn": "Binder Course",
    "termTh": "ชั้นผิวทางชั้นล่าง",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ชั้นแอสฟัลต์คอนกรีตที่อยู่ระหว่างชั้นพื้นทางและชั้นผิวบนสุด เพื่อช่วยรับแรงดัดและกระจายน้ำหนักบรรทุกลงสู่โครงสร้างล่าง",
    "fieldUsage": "ใช้หินคัดขนาดใหญ่กว่าชั้น Wearing Course เพื่อความแข็งแกร่งในการรับแรงอัด"
  },
  {
    "id": "g-rd-deflection-benkelman",
    "termEn": "Benkelman Beam Deflection Test",
    "termTh": "การทดสอบการแอ่นตัวของผิวทาง",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "การใช้คานเบงเคลแมนบีมวัดค่าการแอ่นตัวคืนตัวของผิวทางเมื่อมีรถบรรทุกน้ำหนักมาตรฐานแล่นผ่าน",
    "fieldUsage": "ใช้ประเมินความสามารถในการรับน้ำหนักและวางแผนออกแบบชั้นเสริมผิวทาง (Overlay)"
  },
  {
    "id": "g-rd-contraction-joint",
    "termEn": "Contraction Joint (Dummy Joint)",
    "termTh": "รอยต่อตัดหดของถนนคอนกรีต",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "รอยต่อที่ใช้ใบตัดเพชรกรีดร่องลึก 1/4 ของความหนาพื้นคอนกรีต เพื่อบังคับให้คอนกรีตแตกร้าวตรงแนวรอยต่อเมื่อเกิดการหดตัว",
    "fieldUsage": "ต้องกรีดร่องภายในเวลา 8-12 ชั่วโมงหลังเทคอนกรีต ก่อนที่คอนกรีตจะแตกร้าวเองแบบไร้ทิศทาง"
  },
  {
    "id": "g-rd-expansion-joint",
    "termEn": "Transverse Expansion Joint",
    "termTh": "รอยต่อเพื่อการขยายตัวของถนน",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "รอยต่อที่ตัดขาดแยกแผ่นคอนกรีตตลอดความหนา คั่นด้วยแผ่นโฟมหรือแผ่นไม้สังเคราะห์หนา 1.5-2.0 ซม. พร้อมเหล็กเดือย Dowel",
    "fieldUsage": "ติดตั้งที่จุดเชื่อมต่อกับสะพาน คอสะพาน หรือบริเวณทางร่วมทางแยก"
  },
  {
    "id": "g-rd-iri-roughness",
    "termEn": "International Roughness Index (IRI)",
    "termTh": "ดัชนีความขรุขระผิวทางสากล",
    "category": "road",
    "categoryLabel": "งานทาง & ผิวจราจร",
    "definition": "ค่าดัชนีมาตรฐานสากลที่ใช้วัดความขรุขระของผิวทาง (หน่วย: ม./กม.) โดยรถตรวจวัดผิวทางติดตั้งเลเซอร์และ Accelerometer",
    "fieldUsage": "ถนนทางหลวงสร้างใหม่เกณฑ์ตรวจรับงานกำหนดค่า IRI ต้องไม่เกิน 2.0 - 2.5 ม./กม."
  },
  {
    "id": "g-con-boq",
    "termEn": "Bill of Quantities (BOQ)",
    "termTh": "ใบแสดงรายการปริมาณงานและราคา",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "เอกสารแสดงรายการวัสดุ ปริมาณ ค่าแรง และราคาต่อหน่วยทั้งหมดของงานก่อสร้าง จัดทำขึ้นจากการถอดแบบ",
    "fieldUsage": "ข้อมูลพื้นที่และปริมาตรดินจากการสำรวจจะถูกนำไปกรอกลงในหมวดงานดินและงานเตรียมพื้นที่ของ BOQ"
  },
  {
    "id": "g-con-s-curve",
    "termEn": "S-Curve (Progress Curve)",
    "termTh": "กราฟเอสเคิร์ฟ",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "กราฟแสดงความก้าวหน้าสะสมของโครงการก่อสร้างเทียบกับเวลา มีรูปร่างคล้ายตัวอักษร S เนื่องจากช่วงเริ่มต้นและสิ้นสุดงานจะดำเนินไปช้ากว่าช่วงกลาง",
    "fieldUsage": "ใช้เปรียบเทียบผลงานจริง (Actual Progress) กับแผนงาน (Planned Progress) เพื่อเบิกจ่ายงวดงานและควบคุมเวลา"
  },
  {
    "id": "g-con-shop-drawing",
    "termEn": "Shop Drawing",
    "termTh": "แบบขยายสำหรับทำงานหน้างาน",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "แบบรายละเอียดเชิงลึกที่ผู้รับเหมาจัดทำขึ้นจากแบบสถาปัตย์และโครงสร้าง เพื่อแสดงรายละเอียดการติดตั้งจริง เช่น ระยะการตัดเหล็กและแนวท่อ",
    "fieldUsage": "วิศวกรสำรวจใช้ Shop Drawing ในการกำหนดพิกัดปักหมุดหน้างานแทนแบบประกวดราคา"
  },
  {
    "id": "g-con-as-built-dwg",
    "termEn": "As-Built Drawing",
    "termTh": "แบบแสดงสภาพจริงหลังก่อสร้าง",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "แบบแปลนฉบับปรับปรุงสุดท้ายที่แสดงตำแหน่ง ขนาด และการติดตั้งโครงสร้างและงานระบบที่ก่อสร้างเสร็จสิ้นจริง",
    "fieldUsage": "นำข้อมูลรังวัดสภาพจริง (As-built Survey) มารวมลงในแบบเพื่อส่งมอบให้เจ้าของอาคารใช้บริหารจัดการอาคาร (Facility Management)"
  },
  {
    "id": "g-con-vo",
    "termEn": "Variation Order (VO)",
    "termTh": "ใบสั่งเปลี่ยนแปลงงาน / ใบสั่งเพิ่ม-ลดงาน",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "เอกสารอนุมัติการแก้ไข เปลี่ยนแปลง เพิ่มเติม หรือตัดทอนเนื้องานก่อสร้างจากแบบและสัญญาเดิม พร้อมราคาและระยะเวลาที่ปรับปรุง",
    "fieldUsage": "ต้องบันทึกภาพถ่ายและสำรวจพื้นที่หน้างานจริงเพื่อเป็นหลักฐานแนบก่อนเริ่มงานที่เปลี่ยนแปลง"
  },
  {
    "id": "g-con-rfi",
    "termEn": "Request for Information (RFI)",
    "termTh": "หนังสือขอคำชี้แจงข้อมูลแบบ",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "เอกสารทางการที่ผู้รับเหมาทำถึงผู้ออกแบบหรือที่ปรึกษาควบคุมงาน เพื่อสอบถามรายละเอียดแบบที่ขัดแย้ง ไม่ชัดเจน หรือขาดหายไป",
    "fieldUsage": "ออก RFI ทันทีที่ตรวจพบข้อขัดแย้งของระดับหรือพิกัด เพื่อป้องกันความล่าช้าในงานสนาม"
  },
  {
    "id": "g-con-itp",
    "termEn": "Inspection and Test Plan (ITP)",
    "termTh": "แผนการตรวจสอบและทดสอบคุณภาพ",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "ตารางกำหนดขั้นตอน จุดตรวจ (Hold Point / Witness Point) วิธีการทดสอบ และเกณฑ์ยอมรับคุณภาพของแต่ละหมวดงาน",
    "fieldUsage": "ทุกฝ่ายต้องเซ็นชื่อตรวจรับในใบ Request for Inspection (RFI) ผ่านแต่ละขั้นตอนก่อนจึงจะอนุญาตให้เทคอนกรีตได้"
  },
  {
    "id": "g-con-milestone",
    "termEn": "Project Milestone",
    "termTh": "จุดหมุดหมายความสำเร็จของโครงการ",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "กำหนดเวลาของเหตุการณ์สำคัญในตารางเวลาโครงการ เช่น งานเสาเข็มแล้วเสร็จ งานโครงสร้างขึ้นถึงชั้นดาดฟ้า",
    "fieldUsage": "มักผูกกับงวดการเบิกจ่ายเงินค่างวดงานก้อนใหญ่ตามสัญญา"
  },
  {
    "id": "g-con-retention",
    "termEn": "Retention Money",
    "termTh": "เงินหักประกันผลงาน",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "จำนวนเงินที่เจ้าของโครงการหักไว้จากค่างวดงานแต่ละงวด (ปกติ 5% - 10%) เพื่อเป็นหลักประกันความเสียหายหรือกรณีทิ้งงาน",
    "fieldUsage": "จะคืนให้ผู้รับเหมาหลังจากครบกำหนดระยะเวลารับประกันผลงานชำรุดบกพร่อง (DLP)"
  },
  {
    "id": "g-con-liquidated-damages",
    "termEn": "Liquidated Damages (LD)",
    "termTh": "ค่าปรับกรณีงานล่าช้า",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "ค่าเสียหายที่กำหนดไว้ล่วงหน้าในสัญญาที่ผู้รับเหมาต้องจ่ายให้เจ้าของโครงการต่อวันที่งานล่าช้าเกินกำหนดส่งมอบ",
    "fieldUsage": "งานราชการคิดค่าปรับประมาณ 0.01% - 0.1% ของมูลค่างานก่อสร้างต่อวัน"
  },
  {
    "id": "g-con-dlp",
    "termEn": "Defect Liability Period (DLP)",
    "termTh": "ระยะเวลารับประกันความชำรุดบกพร่อง",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "ช่วงเวลาหลังส่งมอบงาน (ปกติ 1-2 ปีสำหรับอาคาร, 2-5 ปีสำหรับโครงสร้าง) ที่ผู้รับเหมาต้องรับผิดชอบซ่อมแซมความชำรุดที่เกิดขึ้นฟรี",
    "fieldUsage": "ก่อนสิ้นสุด DLP คณะกรรมการตรวจรับจะร่วมเดินตรวจสอบอาคาร (Final Inspection) ก่อนคืนเงินประกันผลงาน"
  },
  {
    "id": "g-con-ntp",
    "termEn": "Notice to Proceed (NTP)",
    "termTh": "หนังสือแจ้งให้เริ่มปฏิบัติงาน",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "เอกสารทางการจากผู้ว่าจ้างที่แจ้งให้ผู้รับเหมาเริ่มเข้าพื้นที่และเริ่มต้นนับวันทำงานตามสัญญาก่อสร้าง",
    "fieldUsage": "วันเริ่มสัญญาอย่างเป็นทางการจะยึดตามวันที่ระบุในหนังสือ NTP"
  },
  {
    "id": "g-con-punch-list",
    "termEn": "Punch List / Defect List",
    "termTh": "รายการแก้ไขข้อบกพร่องก่อนส่งมอบ",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "บัญชีรายการงานที่ยังไม่เรียบร้อย งานชำรุด หรือไม่ได้มาตรฐานที่คณะกรรมการตรวจงานระบุให้ผู้รับเหมาแก้ไขก่อนส่งมอบงานงวดสุดท้าย",
    "fieldUsage": "ทำแผนตรวจเช็คเป็นห้องๆ (Room-by-room Checklist) พร้อมภาพถ่ายระบุพิกัดตำแหน่ง"
  },
  {
    "id": "g-con-progress-payment",
    "termEn": "Progress Payment / Interim Payment",
    "termTh": "การเบิกจ่ายเงินค่างวดงาน",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "การขออนุมัติเบิกจ่ายเงินตามสัดส่วนร้อยละของผลงานก่อสร้างที่ทำได้จริงในแต่ละงวดหรือแต่ละเดือน",
    "fieldUsage": "ต้องแนบรายงานผลการทดสอบวัสดุ เอกสารอนุมัติ RFI และตารางคำนวณปริมาณงานจริง"
  },
  {
    "id": "g-con-eot",
    "termEn": "Extension of Time (EOT)",
    "termTh": "การขอขยายระยะเวลาสัญญา",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "การยื่นคำร้องขอขยายเวลาก่อสร้างเนื่องจากเหตุสุดวิสัย การแก้ไขแบบของผู้ว่าจ้าง หรือสภาพอากาศแปรปรวนรุนแรง",
    "fieldUsage": "ต้องเก็บหลักฐานบันทึกสภาพอากาศรายวัน (Daily Weather Log) และผลกระทบต่อเส้นทางวิกฤต (Critical Path)"
  },
  {
    "id": "g-con-subcontractor",
    "termEn": "Subcontractor",
    "termTh": "ผู้รับเหมาช่วง",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "บุคคลหรือนิติบุคคลที่ทำสัญญารับจ้างทำงานส่วนใดส่วนหนึ่งของโครงการต่อจากผู้รับเหมาหลัก (เช่น ผู้รับเหมางานเสาเข็ม งานระบบ)",
    "fieldUsage": "ผู้รับเหมาหลักยังคงต้องรับผิดชอบในคุณภาพงานและมาตรฐานความปลอดภัยของผู้รับเหมาช่วงต่อเจ้าของงาน"
  },
  {
    "id": "g-con-turnkey",
    "termEn": "Turnkey Contract / EPC",
    "termTh": "สัญญาแบบเบ็ดเสร็จ (เทิร์นคีย์)",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "รูปแบบสัญญาที่ผู้รับเหมารับผิดชอบเบ็ดเสร็จตั้งแต่การสำรวจ ออกแบบ จัดซื้อจัดจ้าง ก่อสร้าง จนถึงทดสอบระบบพร้อมเปิดใช้งาน",
    "fieldUsage": "ผู้ว่าจ้างเพียงรับมอบกุญแจและเปิดใช้งานได้ทันที ลดภาระการประสานงานข้ามส่วน"
  },
  {
    "id": "g-con-tender",
    "termEn": "Tender Documents",
    "termTh": "เอกสารประกวดราคา",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "ชุดเอกสารที่ผู้ว่าจ้างจัดทำขึ้นเพื่อเชิญชวนให้ผู้รับเหมายื่นซองเสนอราคา ประกอบด้วยแบบ รายการข้อกำหนด (Specs) เงื่อนไขสัญญา และ BOQ เปล่า",
    "fieldUsage": "ทีมวิศวกรประมาณราคาจะถอดแบบและตรวจทานปริมาณงานเพื่อเสนอราคาที่แข่งขันได้และมีกำไร"
  },
  {
    "id": "g-con-daily-report",
    "termEn": "Daily Site Report",
    "termTh": "รายงานประจำวันหน้างาน",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "บันทึกรายละเอียดเหตุการณ์ประจำวัน เช่น จำนวนคนงาน สภาพอากาศ เครื่องจักรที่ใช้งาน งานที่ปฏิบัติ และปัญหาอุปสรรค",
    "fieldUsage": "เป็นเอกสารหลักฐานสำคัญทางกฎหมายในการเรียกร้องสิทธิ์หรือระงับข้อพิพาทสัญญา"
  },
  {
    "id": "g-con-method-statement",
    "termEn": "Method Statement (MOS)",
    "termTh": "ขั้นตอนและวิธีการทำงาน",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "เอกสารระบุขั้นตอน วิธีการทำงาน ลำดับการติดตั้ง เครื่องจักรที่ใช้ และมาตรการความปลอดภัยในแต่ละกิจกรรมก่อสร้าง",
    "fieldUsage": "ต้องส่งให้ที่ปรึกษาควบคุมงานอนุมัติก่อนเริ่มงานก่อสร้างสำคัญ เช่น งานเท Mass Concrete หรืองานยกคานหนัก"
  },
  {
    "id": "g-con-cpm-schedule",
    "termEn": "Critical Path Method (CPM)",
    "termTh": "การวางแผนงานแบบเส้นทางวิกฤต",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "เทคนิคการวางแผนตารางเวลาโครงการโดยคำนวณสายงานวิกฤต (กิจกรรมที่ไม่มีวันว่าง หากล่าช้าจะทำให้โครงการเสร็จช้าลงทันที)",
    "fieldUsage": "ผู้จัดการโครงการต้องเฝ้าติดตามกิจกรรมบนสายงานวิกฤตอย่างใกล้ชิดที่สุด"
  },
  {
    "id": "g-con-provisional-sum",
    "termEn": "Provisional Sum (PS)",
    "termTh": "เงินเผื่อจ่าย",
    "category": "contract",
    "categoryLabel": "สัญญา & การบริหารงาน",
    "definition": "วงเงินที่ระบุไว้ล่วงหน้าในสัญญาสำหรับงานส่วนที่ยังไม่สามารถระบุรายละเอียดหรือปริมาณที่แน่นอนได้ในขณะประกวดราคา",
    "fieldUsage": "จะจ่ายเงินจริงตามเนื้องานและใบเสร็จที่ได้รับความเห็นชอบจากผู้ว่าจ้างเท่านั้น"
  },
  {
    "id": "g-leg-building-act",
    "termEn": "Building Control Act B.E. 2522 (1979)",
    "termTh": "พระราชบัญญัติควบคุมอาคาร พ.ศ. 2522",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "กฎหมายแม่บทในการควบคุมความมั่นคงแข็งแรง ความปลอดภัย การป้องกันอัคคีภัย การสุขาภิบาล และการจัดระเบียบทัศนียภาพของอาคารในประเทศไทย",
    "fieldUsage": "วิศวกรผู้ควบคุมงานต้องตรวจสอบว่าการก่อสร้างได้รับใบอนุญาต อ.1 ถูกต้องและตรงตามแบบที่ได้รับอนุญาต"
  },
  {
    "id": "g-leg-min-reg-55",
    "termEn": "Ministerial Regulation No. 55 (B.E. 2542)",
    "termTh": "กฎกระทรวง ฉบับที่ 55 (พ.ศ. 2542)",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "กฎกระทรวงสำคัญที่กำหนดเรื่องระยะร่นอาคาร แนวร่นจากถนนสาธารณะ ช่องเปิด แสงสว่าง การระบายอากาศ และระบบบันไดหนีไฟ",
    "fieldUsage": "เป็นหัวใจหลักที่วิศวกรสำรวจต้องใช้อ้างอิงในการปักหมุดวางผังระยะร่นอาคาร"
  },
  {
    "id": "g-leg-setback-road",
    "termEn": "Road Setback Requirement",
    "termTh": "ระยะร่นจากแนวเขตถนนสาธารณะ",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ข้อกำหนดระยะห่างระหว่างแนวผนังอาคารหรือส่วนยื่นของอาคารถึงกึ่งกลางถนนสาธารณะหรือแนวเขตถนนตามความกว้างของถนน",
    "fieldUsage": "ถนนกว้างน้อยกว่า 6 ม. ร่นจากกึ่งกลางถนนไม่น้อยกว่า 3 ม., ถนนกว้าง 6-10 ม. ร่นจากแนวเขตถนน 3 ม."
  },
  {
    "id": "g-leg-setback-neighbor",
    "termEn": "Boundary Setback (Neighboring Land)",
    "termTh": "ระยะร่นแนวเขตที่ดินข้างเคียง",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ระยะห่างระหว่างอาคารกับแนวเขตที่ดินข้างเคียง: ผนังมีช่องเปิดสูงไม่เกิน 9 ม. ร่น 2.0 ม., สูงเกิน 9 ม. แต่ไม่เกิน 23 ม. ร่น 3.0 ม.",
    "fieldUsage": "ผนังทึบไม่มีช่องเปิดสร้างห่างไม่น้อยกว่า 0.50 ม. หรือชิดเขต 0.00 ม. ได้โดยต้องมีหนังสือยินยอมจากข้างเคียง"
  },
  {
    "id": "g-leg-consent-letter",
    "termEn": "Neighbor Consent Letter",
    "termTh": "หนังสือยินยอมชิดแนวเขตที่ดิน",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "เอกสารยินยอมเป็นลายลักษณ์อักษรจากเจ้าของที่ดินข้างเคียง ยินยอมให้สร้างอาคารผนังทึบชิดเขตที่ดิน (ระยะร่น 0.00 ม.) และผนังสูงไม่เกิน 15 ม.",
    "fieldUsage": "ต้องแนบสำเนาโฉนดและบัตรประชาชนของเจ้าของที่ดินข้างเคียงทุกคนที่มีชื่อถือกรรมสิทธิ์ร่วม"
  },
  {
    "id": "g-leg-far",
    "termEn": "Floor Area Ratio (FAR)",
    "termTh": "อัตราส่วนพื้นที่อาคารรวมต่อพื้นที่ดิน",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "สัดส่วนพื้นที่ใช้สอยรวมทุกชั้นของอาคาร หารด้วยขนาดพื้นที่แปลงที่ดิน กำหนดโดยกฎหมายผังเมืองรวมประจำท้องถิ่น",
    "fieldUsage": "FAR = พื้นที่อาคารรวม (ตร.ม.) / พื้นที่ดิน (ตร.ม.) หาก FAR = 5 แปลงดิน 1 ไร่ (1,600 ตร.ม.) จะสร้างอาคารรวมได้ไม่เกิน 8,000 ตร.ม."
  },
  {
    "id": "g-leg-osr",
    "termEn": "Open Space Ratio (OSR)",
    "termTh": "อัตราส่วนพื้นที่ว่างเปิดโล่งต่อพื้นที่อาคารรวม",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ร้อยละของพื้นที่ว่างปราศจากสิ่งปกคลุมเทียบกับพื้นที่อาคารรวมตามกฎหมายผังเมืองรวม เพื่อสิ่งแวดล้อมและการซึมน้ำของดิน",
    "fieldUsage": "OSR = (พื้นที่ว่าง / พื้นที่อาคารรวม) x 100% ต้องจัดให้มีพื้นที่ว่างตามเกณฑ์ขั้นต่ำ"
  },
  {
    "id": "g-leg-permit-a1",
    "termEn": "Building Permit (Form Or. 1)",
    "termTh": "ใบอนุญาตก่อสร้างอาคาร (แบบ อ.1)",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "หนังสืออนุญาตอย่างเป็นทางการจากเจ้าพนักงานท้องถิ่น ให้ผู้ขอดำเนินการก่อสร้างอาคารตามแบบแปลนและรายการคำนวณที่ได้รับความเห็นชอบ",
    "fieldUsage": "ต้องปิดป้ายแสดงใบอนุญาตและชื่อผู้ควบคุมงานไว้ในที่เปิดเผยบริเวณหน้าไซต์งานก่อสร้าง"
  },
  {
    "id": "g-leg-occupancy-a6",
    "termEn": "Certificate of Occupancy (Form Or. 6)",
    "termTh": "ใบรับรองการก่อสร้างอาคาร (แบบ อ.6)",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "หนังสือรับรองจากเจ้าพนักงานท้องถิ่นหลังการก่อสร้างแล้วเสร็จ อนุญาตให้เปิดใช้อาคารควบคุมการใช้หรืออาคารขนาดใหญ่",
    "fieldUsage": "ต้องผ่านการตรวจสอบสภาพจริงเทียบกับแบบที่ได้รับอนุญาตโดยเจ้าหน้าที่ท้องถิ่น"
  },
  {
    "id": "g-leg-right-of-way",
    "termEn": "Right-of-Way (ROW)",
    "termTh": "แนวเขตทางสาธารณะ",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ความกว้างทั้งหมดของที่ดินที่สงวนไว้เพื่อกิจการทางหลวงหรือถนนสาธารณะ รวมถึงผิวจราจร ไหล่ทาง ทางเท้า และร่องระบายน้ำ",
    "fieldUsage": "การวัดระยะร่นต้องยึดจากแนวเขตทางสาธารณะ (ROW Line) ไม่ใช่วัดจากขอบผิวจราจรลาดยาง"
  },
  {
    "id": "g-leg-encroachment",
    "termEn": "Boundary Encroachment",
    "termTh": "การรุกล้ำแนวเขตที่ดิน",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "การก่อสร้างส่วนใดส่วนหนึ่งของอาคาร ฐานราก ชายคา หรือท่อระบายน้ำ ยื่นล้ำเข้าไปในที่ดินของผู้อื่นหรือที่สาธารณะโดยมิชอบ",
    "fieldUsage": "ผู้ถูกรุกล้ำมีสิทธิฟ้องร้องให้รื้อถอนและเรียกค่าเสียหายตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 1337"
  },
  {
    "id": "g-leg-waterway-setback",
    "termEn": "Public Waterway Setback",
    "termTh": "ระยะร่นจากแหล่งน้ำสาธารณะ",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ระยะร่นแนวอาคารจากขอบเขตแหล่งน้ำสาธารณะ: กว้างน้อยกว่า 10 ม. ร่น 3.0 ม., กว้างตั้งแต่ 10 ม. ขึ้นไป ร่น 6.0 ม., แหล่งน้ำขนาดใหญ่ร่น 12.0 ม.",
    "fieldUsage": "วัดจากแนวระดับน้ำขึ้นสูงสุดตามปกติหรือแนวเขื่อนกันตลิ่งสาธารณะ"
  },
  {
    "id": "g-leg-civil-code-1337",
    "termEn": "Civil & Commercial Code Sec. 1337",
    "termTh": "ป.พ.พ. มาตรา 1337 (เหตุเดือดร้อนรำคาญ)",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "บทบัญญัติคุ้มครองเจ้าของอสังหาริมทรัพย์จากการกระทำที่ทำให้เกิดความเสียหาย เดือดร้อนรำคาญเกินสมควร เช่น ฝุ่น เสียง แรงสั่นสะเทือน หรือน้ำไหลนอง",
    "fieldUsage": "การตอกเสาเข็มหรือขุดดินที่ทำให้บ้านข้างเคียงแตกร้าวจะถูกฟ้องร้องระงับงานตามมาตรานี้"
  },
  {
    "id": "g-leg-easement",
    "termEn": "Easement / Servitude",
    "termTh": "ภาระจำยอม",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ภาระผูกพันเหนืออสังหาริมทรัพย์แปลงหนึ่งเพื่อประโยชน์แก่อสังหาริมทรัพย์อีกแปลงหนึ่ง เช่น ทางภาระจำยอม ทางเดินท่อน้ำประปา หรือสายไฟ",
    "fieldUsage": "ต้องตรวจสอบการจดทะเบียนภาระจำยอมหลังโฉนดที่ดินก่อนออกแบบผังโครงการ"
  },
  {
    "id": "g-leg-title-deed",
    "termEn": "Title Deed (Chanote / Nor Sor 4)",
    "termTh": "โฉนดที่ดิน (น.ส. 4 จ.)",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "หนังสือแสดงกรรมสิทธิ์ในที่ดินที่สมบูรณ์ที่สุด ออกโดยกรมที่ดิน มีระวาง รูปแผนที่ ระยะ และพิกัดหมุดหลักเขตชัดเจน",
    "fieldUsage": "เป็นเอกสารสิทธิ์ประเภทเดียวที่มีกรรมสิทธิ์บริบูรณ์ สามารถรังวัดแบ่งแยกหรือโอนได้ทันที"
  },
  {
    "id": "g-leg-land-cadastre",
    "termEn": "Cadastral Map & Sheet",
    "termTh": "แผนที่ระวางที่ดิน",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "แผนที่ระวางที่ดินระบบพิกัด UTM หรือศูนย์กำเนิดเดิมที่เก็บรักษา ณ สำนักงานที่ดิน แสดงตำแหน่งแปลงที่ดินทุกแปลงและหมุดหลักเขต",
    "fieldUsage": "ใช้ตรวจสอบประวัติการรังวัดและการครอบครองที่ดินข้างเคียง"
  },
  {
    "id": "g-leg-height-restriction",
    "termEn": "Building Height Restriction",
    "termTh": "ข้อจำกัดความสูงอาคาร",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ข้อกำหนดความสูงสูงสุดของอาคารตามความกว้างของถนน (ความสูงต้องไม่เกิน 2 เท่าของระยะห่างจากแนวอาคารถึงแนวเขตถนนฝั่งตรงข้าม)",
    "fieldUsage": "หากอาคารสูงเกินเกณฑ์ต้องร่นผนังชั้นบนเป็นขั้นบันได (Stepped Setback) ตามแนวระนาบเฉียง 1:2"
  },
  {
    "id": "g-leg-fire-safety",
    "termEn": "Fire Separation Zone",
    "termTh": "ระยะห่างเพื่อความปลอดภัยจากอัคคีภัย",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "การกำหนดผนังทนไฟ (Fire Wall) และระยะห่างของอาคารเพื่อป้องกันการลุกลามของเปลวไฟระหว่างอาคาร",
    "fieldUsage": "ผนังทนไฟต้องมีอัตราการทนไฟไม่น้อยกว่า 1-2 ชั่วโมงตามมาตรฐาน วสท."
  },
  {
    "id": "g-leg-environmental-eia",
    "termEn": "Environmental Impact Assessment (EIA)",
    "termTh": "การประเมินผลกระทบสิ่งแวดล้อม",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "รายงานการศึกษาผลกระทบต่อสิ่งแวดล้อม สังคม และสุขภาพของโครงการขนาดใหญ่ เช่น อาคารสูง อาคารขนาดใหญ่พิเศษ หรือหมู่บ้านจัดสรรขนาดใหญ่",
    "fieldUsage": "ต้องได้รับความเห็นชอบจากสำนักงานนโยบายและแผนทรัพยากรธรรมชาติและสิ่งแวดล้อม (สผ.) ก่อนจึงจะขอใบอนุญาต อ.1 ได้"
  },
  {
    "id": "g-leg-safety-act",
    "termEn": "Occupational Safety, Health and Environment Act",
    "termTh": "พ.ร.บ. ความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน พ.ศ. 2554",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "กฎหมายคุ้มครองความปลอดภัยของคนทำงานในไซต์ก่อสร้าง กำหนดให้มีเจ้าหน้าที่ความปลอดภัย (จป.) และอุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE)",
    "fieldUsage": "ทุกคนในไซต์ต้องสวมหมวกนิรภัย รองเท้าหัวเหล็ก และมีสายรัดกันตก (Safety Harness) เมื่อทำงานบนที่สูงเกิน 2.0 ม."
  },
  {
    "id": "g-leg-pro-engineer-act",
    "termEn": "Engineer Act B.E. 2542 (1999)",
    "termTh": "พระราชบัญญัติวิศวกร พ.ศ. 2542",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "กฎหมายควบคุมการประกอบวิชาชีพวิศวกรรมควบคุม สาขาวิศวกรรมโยธาและสำรวจ การออกใบอนุญาตภาคี สามัญ และวุฒิวิศวกร",
    "fieldUsage": "การลงนามรับรองแบบคำนวณโครงสร้างและควบคุมงานก่อสร้างต้องกระทำโดยวิศวกรที่มีใบอนุญาตประกอบวิชาชีพที่ยังไม่หมดอายุ"
  },
  {
    "id": "g-leg-sec-69-dispute",
    "termEn": "Land Code Section 69 (Boundary Dispute)",
    "termTh": "ประมวลกฎหมายที่ดิน มาตรา 69 ทวิ (การคัดค้านแนวเขต)",
    "category": "legal",
    "categoryLabel": "กฎหมายควบคุมอาคาร & ข้อบังคับ",
    "definition": "ขั้นตอนกฎหมายเมื่อเจ้าของที่ดินข้างเคียงไม่ยอมลงนามระวังชี้แนวเขต หรือมีข้อพิพาทรังวัดแนวเขตทับซ้อน",
    "fieldUsage": "เจ้าพนักงานที่ดินมีอำนาจไกล่เกลี่ย หากตกลงกันไม่ได้ต้องแจ้งให้คู่กรณีฟ้องร้องต่อศาลภายในกำหนด 90 วัน"
  }
];


// ---------------------------------------------------------------------------
// SITE ENGINEERING EXTENSION (SITE-01 to SITE-04)
// Extracted & synthesized from 'ฟงหวิน giveaway' & Civil Construction Standards
// ---------------------------------------------------------------------------

export interface SiteEngineeringItem {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  category: 'foundation' | 'rebar' | 'management' | 'inspection';
  categoryLabel: string;
  summary: string;
  principles: string[];
  keyFormulas?: { label: string; formula: string; explanation: string }[];
  fieldChecklist: string[];
  recommendedToolTab?: string;
  toolActionLabel?: string;
  imagePath?: string;
  imageCaption?: string;
}

export const SITE_ENGINEERING_ITEMS: SiteEngineeringItem[] = [
  {
    id: 'site-strap-beam-control',
    imagePath: '/images/site/strap-beam.jpg',
    imageCaption: 'การติดตั้งเหล็กเสริมคานรั้ง (Strap Beam) และแบบหล่อฐานรากเยื้องศูนย์ริมแนวเขตที่ดิน',
    code: 'SITE-01',
    title: 'การควบคุมงานก่อสร้างฐานรากชิดเขตที่ดินและคานรั้ง (Boundary Footing & Strap Beam)',
    titleEn: 'Boundary Footing & Strap Beam',
    category: 'foundation',
    categoryLabel: 'งานฐานรากและเสาเข็ม',
    summary: 'ขั้นตอนการควบคุมงานสำรวจและวิศวกรรมสำหรับฐานรากชิดแนวเขตที่ดิน เพื่อป้องกันไม่ให้ส่วนของฐานรากล้ำเข้าไปในที่ดินข้างเคียง และใช้คานรั้ง (Strap Beam) ถ่ายแรงโมเมนต์ดัดกลับสู่เสาต้นใน',
    principles: [
      'ฐานรากชิดเขตที่ดินต้องออกแบบเป็นฐานรากเยื้องศูนย์ (Eccentric Footing) โดยให้ขอบนอกของฐานรากเสมอกับแนวเขตที่ดินพอดี (ห้ามล้ำเด็ดขาด)',
      'การเยื้องศูนย์ e ทำให้เกิดโมเมนต์ดัด M = P1 × e ที่ต้องใช้คานรั้ง (Strap Beam) ที่มีความแข็งเกร็ง (Stiffness) สูงยึดกับฐานรากต้นในเพื่อต้านการพลิกคว่ำ (Overturning)',
      'แรงปฏิกิริยาใต้ฐานรากชิดเขตจะเพิ่มขึ้นเป็น R1 = P1 + (P1 × e) / (L - e) ช่างสำรวจต้องตรวจสอบพิกัดเสาเข็มไม่ให้หลุดหนีศูนย์เกินเกณฑ์'
    ],
    keyFormulas: [
      {
        label: 'แรงปฏิกิริยาใต้ฐานรากชิดเขต (Exterior Reaction)',
        formula: 'R_1 = P_1 + \\frac{P_1 \\times e}{L - e}',
        explanation: 'แรงกดใต้ฐานรากตัวนอกจะเพิ่มขึ้นเนื่องจากการถ่ายแรงโมเมนต์จากความเยื้องศูนย์'
      },
      {
        label: 'แรงปฏิกิริยาใต้ฐานรากต้นใน (Interior Reaction)',
        formula: 'R_2 = P_2 - \\frac{P_1 \\times e}{L - e}',
        explanation: 'ฐานรากต้นในจะรับแรงลดลงเนื่องจากถูกคานรั้งดึงรั้งไว้'
      }
    ],
    fieldChecklist: [
      'ตรวจสอบหมุดแนวเขตที่ดินร่วมกับช่างรังวัดข้างเคียงก่อนเริ่มขุดดิน',
      'เช็กตำแหน่งศูนย์กลางเสาเข็ม (As-built Pile Center) เทียบกับศูนย์กลางเสาตอม่อ',
      'วางระดับก้นหลุมฐานรากและเทคอนกรีตหยาบรองพื้น (Lean Concrete) หนา ≥ 5 ซม.',
      'หนุนลูกปูนคอนกรีตใต้เหล็กตะแกรงฐานรากหนา 7.5 ซม. ตามมาตรฐาน วสท.',
      'ควบคุมการผูกเหล็กบนของคานรั้ง (Top Rebar) ซึ่งต้องรับโมเมนต์ดัดลบขนาดใหญ่'
    ],
    recommendedToolTab: 'strap-beam',
    toolActionLabel: 'เปิดเครื่องมือคำนวณ Strap Beam'
  },
  {
    id: 'site-rebar-cut-management',
    imagePath: '/images/site/rebar-lap.jpg',
    imageCaption: 'การจัดสรรตัดเหล็กเส้นมาตรฐานยาว 10m/12m และการตรวจระยะทาบเหล็กข้ออ้อย',
    code: 'SITE-02',
    title: 'การควบคุมการตัดดัดเหล็กเส้นและลดเศษสูญเสีย (Rebar BBS & 1D Cutting Stock Optimization)',
    titleEn: 'Rebar BBS & Cut Optimizer',
    category: 'rebar',
    categoryLabel: 'งานเหล็กเสริมและโครงสร้าง',
    summary: 'มาตรฐานการทำรายการตัดและดัดเหล็กเส้น (BBS) ตามมาตรฐาน วสท. / ACI และการจัดสรรตัดเหล็กเส้นมาตรฐานยาว 10m และ 12m ให้เกิดเศษเหลือสูญเสีย (Waste) น้อยกว่า 3-5%',
    principles: [
      'ความยาวสั่งซื้อเหล็กเส้นมาตรฐาน มอก. ในไทยคือ 10.00 เมตร และ 12.00 เมตร',
      'การจัดตัดเหล็กด้วยอัลกอริทึม 1D Best-Fit Decreasing (BFD) ช่วยลดเศษเหลือหน้างานได้อย่างมีนัยสำคัญ',
      'การเผื่อรอยตัดใบเลื่อย (Kerf Loss) ประมาณ 3-5 มม. ต่อจุดตัด เพื่อให้ความยาวชิ้นงานจริงถูกต้อง'
    ],
    keyFormulas: [
      {
        label: 'น้ำหนักเหล็กเส้นตามขนาดเส้นผ่านศูนย์กลาง (มอก.)',
        formula: 'W = \\frac{d^2}{162} \\quad (\\text{กก./เมตร})',
        explanation: 'สูตรคิดเร็วหน้างานสำหรับเหล็กกลมผิวเรียบ RB และเหล็กข้ออ้อย DB (d คือขนาดเส้นผ่านศูนย์กลางเป็น มม.)'
      },
      {
        label: 'ระยะทาบเหล็กข้ออ้อยรับแรงดึง (Tension Lap Splice)',
        formula: 'L_{\\text{lap}} = 40d \\text{ ถึง } 48d',
        explanation: 'ระยะทาบตามมาตรฐาน วสท. สำหรับเหล็กข้ออ้อย SD40 / SD50 ในโซนรับแรงดึง'
      }
    ],
    fieldChecklist: [
      'ตรวจขนาดเส้นผ่านศูนย์กลางและตรา มอก. บนผิวเหล็กก่อนตัด',
      'จัดกลุ่มความยาวชิ้นงานจากยาวไปสั้นก่อนป้อนเข้าเครื่องตัดเหล็ก',
      'คัดแยกเศษเหล็กยาวเกิน 1.0 ม. ไว้สำหรับทำเหล็กเสริมมุมหรือเหล็กเดือย (Dowel Bar)',
      'ตรวจสอบรัศมีการดัดขอ (Bend Diameter) ให้เป็นไปตามเกณฑ์ วสท. ป้องกันเหล็กแตกร้าวที่มุมดัด'
    ],
    recommendedToolTab: 'rebar-optimizer',
    toolActionLabel: 'เปิดเครื่องมือ 1D Rebar Cut Optimizer'
  },
  {
    id: 'site-scurve-progress-tracking',
    imagePath: '/images/site/column-verticality.jpg',
    imageCaption: 'การวางแผนและติดตามความก้าวหน้าโครงการก่อสร้างด้วยกราฟเส้นโค้ง S-Curve',
    code: 'SITE-03',
    title: 'การวางแผนและติดตามความก้าวหน้าโครงการด้วย S-Curve (Construction Progress & S-Curve Tracking)',
    titleEn: 'S-Curve Progress Tracking',
    category: 'management',
    categoryLabel: 'การบริหารงานก่อสร้าง',
    summary: 'การควบคุมแผนงานก่อสร้างด้วยเส้นโค้ง S-Curve เปรียบเทียบแผนสะสม (Planned %) กับผลงานจริง (Actual %) เพื่อคำนวณส่วนเบี่ยงเบน การเบิกเงินงวด และการหักเงินประกันผลงาน (Retention)',
    principles: [
      'เส้นโค้ง S-Curve สะท้อนธรรมชาติของงานก่อสร้าง: ช่วงต้นระดมพลช้า ช่วงกลางเร่งความเร็วสูง และช่วงปลายเก็บงานชะลอตัว',
      'ค่า Variance = Actual % - Planned %: หากเป็นบวกแสดงว่างานเร็วกว่าแผน หากติดลบแสดงว่างานล่าช้ากว่าแผน',
      'การเบิกเงินงวดต้องหักเงินประกันผลงาน (Retention) ปกติ 5% และบวกภาษีมูลค่าเพิ่ม (VAT) 7%'
    ],
    keyFormulas: [
      {
        label: 'การคำนวณเงินงวดสุทธิหลังหักประกันและรวม VAT',
        formula: '\\text{Net Pay} = \\left( \\text{Work Value} \\times (1 - 0.05) \\right) \\times 1.07',
        explanation: 'มูลค่าผลงานจริงหักเงินประกันผลงาน 5% แล้วบวกภาษีมูลค่าเพิ่ม 7%'
      }
    ],
    fieldChecklist: [
      'อัปเดตบันทึกรายงานประจำวัน (Daily Log) ส่งมอบให้ผู้ควบคุมงานทุกสัปดาห์',
      'ตรวจวัดปริมาณงานจริงหน้างาน (Physical Progress) เทียบกับแบบก่อสร้าง',
      'ถ่ายภาพถ่ายยืนยันความก้าวหน้าพร้อมระบุวันที่และแกนกริดอาคาร',
      'จัดประชุมประสานงานเมื่อพบค่าติดลบ Variance เกิน -5% เพื่อวางแผนเร่งรัดงาน'
    ]
  },
  {
    id: 'site-building-defect-checklist',
    imagePath: '/images/site/pile-cutoff.jpg',
    imageCaption: 'การตรวจรับมอบงานอาคาร: การเช็คแนวดิ่งเสาโครงสร้าง สโลปท่อ และจุดบกพร่อง',
    code: 'SITE-04',
    title: 'เกณฑ์การตรวจรับมอบงานอาคารและเช็กลิสต์ความบกพร่อง (Building Inspection & Defect Punch List)',
    titleEn: 'Building Defect Punch List',
    category: 'inspection',
    categoryLabel: 'การตรวจสอบและส่งมอบงาน',
    summary: 'ระเบียบการตรวจรับมอบงานอาคารและคอนโดมิเนียม ครอบคลุม 4 หมวดงานสำคัญ: งานโครงสร้างและดิ่งเสา, งานสถาปัตยกรรมและกระเบื้อง, งานสุขาภิบาลและสโลปท่อ, และงานระบบไฟฟ้า',
    principles: [
      'ความคลาดเคลื่อนแนวดิ่งของเสาอาคาร (Plumb Tolerance) ต้องไม่เกิน H/500 หรือไม่เกิน ±10 มม.',
      'ระดับความลาดเอียงของท่อระบายน้ำโสโครกและน้ำทิ้ง (Pipe Slope) ต้องไม่น้อยกว่า 1:50 ถึง 1:100',
      'การทดสอบระบบกันซึม (Waterproofing Ponding Test) ต้องขังน้ำทดสอบอย่างน้อย 24-48 ชั่วโมง'
    ],
    fieldChecklist: [
      'ใช้กล้องวัดมุมหรือดิ่งเลเซอร์ตรวจสอบแนวดิ่งเสาทุกชั้น',
      'เคาะตรวจกระเบื้องพื้นและผนัง (Hollow Tile Check) ต้องไม่มีเสียงกลวง',
      'ทดสอบเปิดน้ำและตรวจการระบายน้ำของ Floor Drain ป้องกันน้ำขังเป็นแอ่ง',
      'ตรวจวัดค่าความต้านทานดินของระบบสายล่อฟ้าและระบบกราวด์ (Earth Resistance ≤ 5 โอห์ม)'
    ]
  }
];


// ---------------------------------------------------------------------------
// CONSOLIDATED LAW ENACTMENTS (LAW-01 to LAW-06)
// Grouped by Legal Domain ("ยุบรวมเป็น 6 เสาหลักกฎหมายวิศวกรรมสำรวจ")
// ---------------------------------------------------------------------------

export interface LawProvision {
  title: string;
  requirement: string;
  details: string;
  penaltyOrRisk?: string;
  clauseRef?: string;
  officialSourceUrl?: string;
}

export interface ConsolidatedLawEnactment {
  id: string;
  code: string; // 'LAW-01'..'LAW-06'
  title: string;
  enactmentName: string;
  enactmentYear: string;
  authority: string;
  summary: string;
  officialGazetteRef?: string;
  officialUrl?: string;
  provisions: LawProvision[];
  fieldSurveyorGuidance: string[];
  imagePath?: string;
  imageCaption?: string;
}

export const CONSOLIDATED_LAW_ENACTMENTS: ConsolidatedLawEnactment[] = [
  {
    id: 'law-building-control',
    imagePath: '/images/laws/building-setback.jpg',
    imageCaption: 'รูปตัดอาคารและข้อกำหนดแนวร่นอาคารจากกึ่งกลางถนนสาธารณะและแนวเขตที่ดินข้างเคียง',
    code: 'LAW-01',
    title: 'พ.ร.บ. ควบคุมอาคาร & กฎกระทรวง ฉบับที่ 55 และ 66 — แนวร่นอาคาร ถนนสาธารณะ ผนังทึบ และช่องเปิด',
    enactmentName: 'พระราชบัญญัติควบคุมอาคาร พ.ศ. 2522 และกฎกระทรวง ฉบับที่ 55 (พ.ศ. 2543), ฉบับที่ 66 (พ.ศ. 2566)',
    enactmentYear: 'พ.ศ. 2522 (แก้ไขเพิ่มเติม 2566)',
    authority: 'กรมโยธาธิการและผังเมือง / กระทรวงมหาดไทย',
    officialGazetteRef: 'ราชกิจจานุเบกษา เล่ม 140 ตอนที่ 40 ก หน้า 13',
    officialUrl: 'https://www.dpt.go.th',
    summary: 'ประมวลข้อกำหนดแนวร่นของอาคารจากทางสาธารณะทุกระดับความกว้างเขตทาง แนวร่นจากแหล่งน้ำสาธารณะ คลอง แม่น้ำ ชายฝั่งทะเล และเกณฑ์ระยะห่างช่องเปิดและผนังทึบชิดเขต 50 ซม. / 0 ซม.',
    provisions: [
      {
        title: 'ถนนสาธารณะกว้างน้อยกว่า 6.00 เมตร',
        requirement: "ร่นแนวอาคารห่างจาก 'กึ่งกลางถนนสาธารณะ' ไม่น้อยกว่า 3.00 เมตร",
        details: 'สำหรับอาคารทุกประเภทที่ก่อสร้างชิดถนนสาธารณะแคบ (เช่น ซอยแคบ) ความสูงอาคารต้องสัมพันธ์กับระยะร่นกึ่งกลาง',
        penaltyOrRisk: 'หากล้ำกึ่งกลาง 3.00 ม. เจ้าพนักงานท้องถิ่นมีอำนาจสั่งระงับและสั่งรื้อถอนอาคาร',
        clauseRef: 'กฎกระทรวง ฉบับที่ 55 ข้อ 41'
      },
      {
        title: 'ถนนสาธารณะกว้างตั้งแต่ 6.00 ม. ถึงน้อยกว่า 10.00 ม.',
        requirement: "ร่นแนวอาคารห่างจาก 'แนวเขตถนนสาธารณะ' ไม่น้อยกว่า 3.00 เมตร",
        details: 'ใช้สำหรับอาคารสูงไม่เกิน 3 ชั้น หรือสูงไม่เกิน 14 เมตร วัดจากขอบเขตกรรมสิทธิ์ถนน',
        penaltyOrRisk: 'ไม่ออกใบอนุญาตก่อสร้าง (อ.1) หรือไม่ผ่านการตรวจรับเปิดใช้อาคาร',
        clauseRef: 'กฎกระทรวง ฉบับที่ 55 ข้อ 41 (1)'
      },
      {
        title: 'ถนนสาธารณะกว้างตั้งแต่ 10.00 ม. ถึงน้อยกว่า 20.00 ม.',
        requirement: "ร่นแนวอาคารห่างจาก 'แนวเขตถนนสาธารณะ' ไม่น้อยกว่า 5.00 เมตร",
        details: 'สำหรับอาคารสูงเกิน 3 ชั้น หรือสูงเกิน 14 เมตร หรืออาคารขนาดใหญ่ที่อยู่ริมถนนสายหลัก',
        penaltyOrRisk: 'ผิดข้อกำหนดอาคารพาณิชย์/อาคารขนาดใหญ่ สั่งปรับปรุงแบบก่อสร้าง',
        clauseRef: 'กฎกระทรวง ฉบับที่ 55 ข้อ 41 (2)'
      },
      {
        title: 'ถนนสาธารณะกว้างตั้งแต่ 20.00 เมตรขึ้นไป',
        requirement: "ร่นแนวอาคารห่างจาก 'แนวเขตถนนสาธารณะ' ไม่น้อยกว่า 2.00 เมตร",
        details: 'สำหรับถนนขนาดใหญ่พิเศษ เช่น ถนนพหลโยธิน ถนนสุขุมวิท ร่นแนวกันชนขั้นต่ำ 2.00 ม.',
        penaltyOrRisk: 'ไม่สามารถขอเปิดใช้อาคารได้',
        clauseRef: 'กฎกระทรวง ฉบับที่ 55 ข้อ 41 (3)'
      },
      {
        title: 'แหล่งน้ำสาธารณะกว้างน้อยกว่า 10.00 เมตร (คลอง/คูน้ำ)',
        requirement: "ร่นแนวอาคารห่างจาก 'แนวเขตแหล่งน้ำสาธารณะ' ไม่น้อยกว่า 3.00 เมตร",
        details: 'วัดจากแนวขอบระดับน้ำขึ้นสูงสุดตามปกติ หรือแนวคันกั้นน้ำสาธารณะคอนกรีต',
        penaltyOrRisk: 'ผิดกฎหมายควบคุมอาคาร และผิด พ.ร.บ. การเดินเรือในน่านน้ำไทย',
        clauseRef: 'กฎกระทรวง ฉบับที่ 55 ข้อ 42'
      },
      {
        title: 'แหล่งน้ำสาธารณะกว้างตั้งแต่ 10.00 เมตรขึ้นไป หรือทะเล',
        requirement: "แหล่งน้ำกว้าง ≥ 10 ม. ร่นไม่น้อยกว่า 6.00 ม. / ชายฝั่งทะเล ร่นไม่น้อยกว่า 12.00 ม.",
        details: 'เพื่อความปลอดภัยจากอุทกภัย การกัดเซาะตลิ่ง และการบำรุงรักษาสายน้ำสาธารณะ',
        penaltyOrRisk: 'รื้อถอนสิ่งปลูกสร้างรุกล้ำลำน้ำ และดำเนินคดีตาม พ.ร.บ. แหล่งน้ำแห่งชาติ',
        clauseRef: 'กฎกระทรวง ฉบับที่ 55 ข้อ 42'
      },
      {
        title: 'ผนังทึบไม่มีช่องเปิดสร้างร่น 50 ซม.',
        requirement: 'อาคารสูงไม่เกิน 15.00 เมตร ผนังด้านที่ไม่มีช่องเปิด ร่นห่างแนวเขตที่ดินไม่น้อยกว่า 50 ซม.',
        details: 'ผนังทึบตลอดแนว ต้องไม่มีหน้าต่าง ประตู ช่องลมระบายอากาศ บล็อกแก้วโปร่งแสง หรือระเบียงยื่น',
        penaltyOrRisk: 'ถูกสั่งปิดช่องเปิด รื้อระเบียง หรือทุบรื้อส่วนที่ยื่นล้ำเข้ามาในระยะ 50 ซม.',
        clauseRef: 'กฎกระทรวง ฉบับที่ 66 (พ.ศ. 2566) ข้อ 50 วรรคสอง'
      },
      {
        title: 'การก่อสร้างผนังทึบชิดแนวเขตที่ดิน (ร่น 0 ซม.)',
        requirement: 'สร้างชิดแนวเขตได้ หากได้รับความยินยอมเป็นหนังสือจากเจ้าของที่ดินข้างเคียง และอาคารสูง ≤ 15.00 ม.',
        details: 'ต้องมีหนังสือยินยอมให้สร้างชิดแนวเขตแนบพร้อมแบบขออนุญาต และดาดฟ้าต้องมีผนังทึบสูงไม่น้อยกว่า 1.80 ม. ป้องกันการมองข้าม',
        penaltyOrRisk: 'หากไม่มีหนังสือยินยอม จะถูกสั่งรื้อถอนผนังส่วนที่ชิดเขตทันที',
        clauseRef: 'กฎกระทรวง ฉบับที่ 66 (พ.ศ. 2566) ข้อ 50 วรรคสาม'
      },
      {
        title: 'ผนังที่มีช่องเปิด ประตู หน้าต่าง ช่องลม หรือระเบียง',
        requirement: 'อาคารสูง ≤ 9.00 ม. ร่นไม่น้อยกว่า 2.00 ม. / อาคารสูง 9.00-23.00 ม. ร่นไม่น้อยกว่า 3.00 ม.',
        details: 'วัดจากขอบนอกสุดของผนังหรือแนวระเบียงถึงแนวเขตที่ดิน เพื่อรักษาความเป็นส่วนตัวและป้องกันการลุกลามของไฟ',
        penaltyOrRisk: 'ถูกสั่งปิดช่องเปิดเป็นผนังทึบทันที และระงับใบรับรองการใช้อาคาร',
        clauseRef: 'กฎกระทรวง ฉบับที่ 55 ข้อ 50 วรรคหนึ่ง'
      }
    ],
    fieldSurveyorGuidance: [
      'ถนน < 6.00 ม. ต้องรังวัดหาขอบทางทั้งสองฝั่งเพื่อเฉลี่ยหากึ่งกลางเขตทาง (Centerline) ห้ามวัดจากขอบผิวจราจรลาดยางด้านเดียว',
      'แนวเขตทางสาธารณะคิดจากแนวเขตกรรมสิทธิ์ที่ดิน (หมุดเขตทางหลวงหรือแนวเสาไฟฟ้า) ไม่ใช่ผิวจราจร',
      'แนวเขตแหล่งน้ำคิดจากระดับน้ำขึ้นสูงสุดตามฤดูกาลปกติ หรือแนวคันหิน/เขื่อนกั้นน้ำคอนกรีต',
      'ตรวจสอบแนวเส้นเชื่อมหมุดเขตโฉนดให้แม่นยำ หากสร้างร่น 50 ซม. รางน้ำฝน ชายคา และกันสาด ห้ามล้ำเข้าใกล้เขตที่ดินเกินระยะที่กฎหมายกำหนด',
      'กรณีสร้างชิดเขต (0 ซม.) ช่างสำรวจต้องวางผังแนวผนังด้านนอกให้อยู่ในแดนกรรมสิทธิ์ 100% ไม่ให้มีปูนล้นหรือโครงสร้างยื่นข้ามแดน'
    ]
  },
  {
    id: 'law-land-cadastral',
    imagePath: '/images/laws/cadastral-marker.jpg',
    imageCaption: 'หมุดหลักเขตที่ดิน ค.ส.ล. มาตรฐานกรมที่ดิน มีตราครุฑและเลขรหัสประจำหมุด',
    code: 'LAW-02',
    title: 'ประมวลกฎหมายที่ดิน — การรังวัดระวังแนวเขต การคัดค้านข้อพิพาท และแดนกรรมสิทธิ์',
    enactmentName: 'ประมวลกฎหมายที่ดิน พ.ศ. 2497 มาตรา 69 และมาตรา 69 ทวิ และประมวลกฎหมายแพ่งและพาณิชย์',
    enactmentYear: 'พ.ศ. 2497 (แก้ไขเพิ่มเติม)',
    authority: 'กรมที่ดิน กระทรวงมหาดไทย',
    officialGazetteRef: 'ประมวลกฎหมายที่ดิน พ.ศ. 2497 หมวด 6',
    officialUrl: 'https://www.dol.go.th',
    summary: 'ระเบียบการรังวัดสอบเขตที่ดิน การแจ้งเจ้าของที่ดินข้างเคียงมาระวังชี้แนวเขต การบันทึกคำคัดค้านแนวเขต และขั้นตอนไกล่เกลี่ยพร้อมเงื่อนไขการฟ้องศาลภายใน 90 วัน แดนกรรมสิทธิ์ และการครอบครองปรปักษ์',
    provisions: [
      {
        title: 'การส่งหมายแจ้งผู้มีสิทธิในที่ดินข้างเคียง (มาตรา 69)',
        requirement: 'เจ้าพนักงานที่ดินต้องส่งหมายแจ้งวันเวลาทำรังวัดให้ข้างเคียงทราบล่วงหน้าไม่น้อยกว่า 15 วัน',
        details: 'เพื่อให้เจ้าของที่ดินข้างเคียงหรือตัวแทนมาระวังชี้และลงชื่อรับรองแนวเขตที่ดิน',
        clauseRef: 'ประมวลกฎหมายที่ดิน มาตรา 69'
      },
      {
        title: 'กรณีข้างเคียงไม่มาระวังชี้แนวเขต',
        requirement: 'เจ้าพนักงานจะรังวัดตามหลักฐานเดิม และส่งหนังสือแจ้งให้มาลงชื่อรับรองหรือคัดค้านภายใน 30 วัน',
        details: 'หากพ้นกำหนด 30 วันนับแต่วันได้รับหนังสือและไม่ยื่นคำคัดค้าน ให้ถือว่ายอมรับแนวเขตตามที่รังวัด',
        clauseRef: 'ประมวลกฎหมายที่ดิน มาตรา 69 วรรคสาม'
      },
      {
        title: 'การยื่นคำคัดค้านแนวเขตที่ดิน (มาตรา 69 ทวิ)',
        requirement: 'หากข้างเคียงเห็นว่าแนวรังวัดรุกล้ำที่ดินของตน ให้ยื่นคำคัดค้านเป็นหนังสือต่อเจ้าพนักงานที่ดิน',
        details: 'ต้องระบุเหตุผลและหลักฐาน เช่น โฉนดที่ดินข้างเคียง รูปแผนที่เดิม หรือแนวรั้วเดิมที่ครอบครองมานาน',
        clauseRef: 'ประมวลกฎหมายที่ดิน มาตรา 69 ทวิ'
      },
      {
        title: 'กระบวนการไกล่เกลี่ยและการฟ้องศาลภายใน 90 วัน',
        requirement: 'เจ้าพนักงานนัดไกล่เกลี่ย หากตกลงไม่ได้ ให้แจ้งฝ่ายคัดค้านฟ้องศาลภายใน 90 วัน',
        details: 'หากผู้คัดค้านไม่ยื่นฟ้องต่อศาลภายในกำหนด 90 วัน ให้ถือว่าสละสิทธิการคัดค้าน และเจ้าพนักงานจะออกโฉนดตามผลรังวัด',
        clauseRef: 'ประมวลกฎหมายที่ดิน มาตรา 69 ทวิ วรรคสาม'
      },
      {
        title: 'แดนกรรมสิทธิ์และการรุกล้ำอสังหาริมทรัพย์',
        requirement: 'กรรมสิทธิ์ที่ดินครอบคลุมทั้งเหนือพื้นดินและใต้ผิวดิน ฐานราก โครงสร้าง หรือกิ่งไม้สายไฟ ห้ามรุกล้ำ',
        details: 'เจ้าของที่ดินมีสิทธิขัดขวางมิให้ผู้อื่นสอดเข้าเกี่ยวข้องกับทรัพย์สินนั้นโดยมิชอบด้วยกฎหมายตาม ป.พ.พ. มาตรา 1336',
        clauseRef: 'ป.พ.พ. มาตรา 1336'
      },
      {
        title: 'การครอบครองปรปักษ์ในที่ดินมีโฉนด',
        requirement: 'ผู้ใดครอบครองอสังหาริมทรัพย์ของผู้อื่นไว้โดยสงบและเปิดเผย ด้วยเจตนาเป็นเจ้าของติดต่อกัน 10 ปี ได้กรรมสิทธิ์',
        details: 'ช่างสำรวจต้องรังวัดเก็บแนวรั้ว ร่องน้ำ คันดิน และสภาพการครอบครองจริง (As-built Possession) ควบคู่กับแนวเส้นโฉนดเสมอ',
        clauseRef: 'ป.พ.พ. มาตรา 1382'
      }
    ],
    fieldSurveyorGuidance: [
      'ตรวจสอบหมุดหลักฐานข้างเคียงและสืบค้นรูปแปลงโฉนดที่ดินก่อนออกสนามทุกครั้ง',
      'หากพบหมุดเคลื่อนย้ายหรือสูญหาย ให้รังวัดโยงยึดจากหมุดข้างเคียงอย่างน้อย 2-3 จุด และประสานงานเจ้าของที่ดินทั้งสองฝ่ายให้รับทราบพร้อมกัน',
      'รังวัดเก็บแนวรั้ว ร่องน้ำ คันดิน และสภาพการครอบครองจริง (As-built Possession Line) ควบคู่กับแนวเส้นโฉนดเสมอ เพื่อประกอบสำนวนข้อพิพาท'
    ]
  },
  {
    id: 'law-uav-drone-aviation',
    imagePath: '/images/laws/drone-aviation.jpg',
    imageCaption: 'ข้อกำหนดเขตปลอดภัยทางอากาศห้ามบินโดรนรอบสนามบิน 9 กม. และเพดานบินไม่เกิน 90 ม.',
    code: 'LAW-03',
    title: 'กฎหมายการบินโดรนและการสำรวจถ่ายภาพทางอากาศ — กพท. (CAAT) & กสทช. (NBTC)',
    enactmentName: 'พระราชบัญญัติการเดินอากาศ พ.ศ. 2497 และประกาศกระทรวงคมนาคม เรื่อง หลักเกณฑ์การอนุญาตให้อากาศยานไร้คนขับบิน',
    enactmentYear: 'พ.ศ. 2558 & ประกาศ กพท. 2567',
    authority: 'สำนักงานการบินพลเรือนแห่งประเทศไทย (CAAT) / สำนักงาน กสทช.',
    officialGazetteRef: 'ราชกิจจานุเบกษา ประกาศกระทรวงคมนาคม พ.ศ. 2558',
    officialUrl: 'https://www.caat.or.th',
    summary: 'หลักเกณฑ์การขึ้นทะเบียนโดรนและนักบินสำรวจ ข้อบังคับเพดานบินไม่เกิน 90 เมตร เขตห้ามบินเด็ดขาด (No-Fly Zone) ประกันภัยบุคคลภายนอก 1 ล้านบาท และความปลอดภัยในการทำ Photogrammetry/LiDAR',
    provisions: [
      {
        title: 'การขึ้นทะเบียนโดรนและผู้บังคับกับ 2 หน่วยงานรัฐ (Dual Registration)',
        requirement: 'ต้องขึ้นทะเบียนเครื่องวิทยุคมนาคมกับ กสทช. ภายใน 30 วันนับแต่วันครอบครอง และขึ้นทะเบียนผู้บังคับอากาศยานกับ กพท. (CAAT OpenSky)',
        details: 'โดรนที่ติดตั้งกล้องบันทึกภาพทุกตัว ไม่จำกัดน้ำหนัก ต้องขึ้นทะเบียนทั้งสองหน่วยงานก่อนทำการบิน หากฝ่าฝืนมีโทษปรับและจำคุก',
        penaltyOrRisk: 'โทษปรับสูงสุด 100,000 บาท หรือจำคุกไม่เกิน 5 ปี ตาม พ.ร.บ. วิทยุคมนาคม และ พ.ร.บ. การเดินอากาศ',
        clauseRef: 'ประกาศ กสทช. & ประกาศกระทรวงคมนาคม'
      },
      {
        title: 'เพดานบินสูงสุดสำหรับงานสำรวจ (Maximum Flight Altitude)',
        requirement: 'ห้ามทำการบินสูงเกิน 90 เมตร (300 ฟุต) เหนือระดับพื้นดิน (AGL)',
        details: 'การบินเพื่อสำรวจจัดทำแผนที่ทางอากาศ (Photogrammetry / LiDAR Mapping) ต้องวางแผนแนวบิน (Flight Plan) ไม่ให้เกิน 90 เมตร เว้นแต่ได้รับอนุญาตเป็นลายลักษณ์อักษรจาก กพท.',
        penaltyOrRisk: 'ถูกยึดใบอนุญาตผู้บังคับ และดำเนินคดีฐานสร้างความไม่ปลอดภัยต่อการเดินอากาศ',
        clauseRef: 'ประกาศกระทรวงคมนาคม หมวด 3 ข้อ 5 (2)'
      },
      {
        title: 'เขตห้ามบินเด็ดขาด (No-Fly Zone - NFZ)',
        requirement: 'ห้ามบินภายในรัศมี 9 กิโลเมตร (5 ไมล์ทะเล) จากสนามบินหรือที่ขึ้นลงชั่วคราวของอากาศยาน',
        details: 'ห้ามทำการบินเหนือเขตพระราชฐาน สถานที่ราชการความมั่นคง โรงพยาบาล แนวสายส่งไฟฟ้าแรงสูง และสถานที่จัดกิจกรรมที่มีผู้ชุมนุมหนาแน่น',
        penaltyOrRisk: 'จำคุกไม่เกิน 1 ปี หรือปรับไม่เกิน 40,000 บาท หรือทั้งจำทั้งปรับ',
        clauseRef: 'พ.ร.บ. การเดินอากาศ พ.ศ. 2497 มาตรา 24'
      },
      {
        title: 'การทำประกันภัยบุคคลภายนอก (Third-Party Liability Insurance)',
        requirement: 'ต้องมีกรมธรรม์ประกันภัยคุ้มครองความเสียหายต่อชีวิต ร่างกาย และทรัพย์สินของบุคคลภายนอก ไม่น้อยกว่า 1,000,000 บาท ต่อครั้ง',
        details: 'เอกสารประกันภัยต้องมีผลคุ้มครองตลอดระยะเวลาการขอขึ้นทะเบียนและปฏิบัติงานบินจริงในสนาม',
        penaltyOrRisk: 'ไม่สามารถยื่นขอหรือต่ออายุใบอนุญาตขึ้นทะเบียนผู้บังคับอากาศยาน กพท. ได้',
        clauseRef: 'ประกาศกระทรวงคมนาคม ข้อ 5'
      },
      {
        title: 'เงื่อนไขความปลอดภัยและการคุ้มครองข้อมูลส่วนบุคคล (VLOS & PDPA)',
        requirement: 'ต้องทำการบินในระยะสายตา (Visual Line of Sight) ห้ามบินกลางคืน และต้องไม่ละเมิด พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
        details: 'การถ่ายภาพทางอากาศต้องระมัดระวังมิให้ติดใบหน้าบุคคลหรือพื้นที่พักอาศัยส่วนบุคคลโดยไม่จำเป็น และต้องตั้งจุดขึ้น-ลงในพื้นที่ปลอดภัย',
        penaltyOrRisk: 'ความรับผิดทางแพ่งและอาญาตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
        clauseRef: 'ประกาศ กพท. & พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล'
      }
    ],
    fieldSurveyorGuidance: [
      'ตรวจเช็คแผนที่น่านฟ้า (Aeronautical Airspace Chart) และประสานหอบังคับการบิน (ATC) หากพื้นที่บินสำรวจอยู่ในแนวเส้นทางร่อนขึ้น-ลงของสนามบิน',
      'พกพาเอกสารขึ้นทะเบียน กสทช., กพท. และกรมธรรม์ประกันภัยตัวจริงหรือไฟล์ดิจิทัลติดตัวในไซต์งานตลอดเวลา',
      'ตั้งค่า RTH (Return-to-Home) Altitude ให้สูงกว่าสิ่งกีดขวางสูงสุดในพื้นที่อย่างน้อย 15-20 เมตร แต่ต้องไม่เกินเพดาน 90 เมตร',
      'วางหมุดควบคุมภาคพื้นดิน (GCP) ในที่โล่งแจ้งและตรวจสอบสัญญาณดาวเทียม RTK/PPK ก่อนปล่อยโดรนขึ้นบินเสมอ'
    ]
  },
  {
    id: 'law-excavation-soil-filling',
    imagePath: '/images/laws/soil-excavation.jpg',
    imageCaption: 'การขุดดินความลึกเกิน 3.00 ม. ต้องมีระยะร่นลาดเอียง 1:1 หรือชีทไพล์ค้ำยันตามแบบวิศวกร',
    code: 'LAW-04',
    title: 'พ.ร.บ. การขุดดินและถมดิน — เกณฑ์ความปลอดภัยลาดดินและระยะร่นปากบ่อ',
    enactmentName: 'พระราชบัญญัติการขุดดินและถมดิน พ.ศ. 2543',
    enactmentYear: 'พ.ศ. 2543',
    authority: 'กรมโยธาธิการและผังเมือง / องค์กรปกครองส่วนท้องถิ่น (อปท.)',
    officialGazetteRef: 'ราชกิจจานุเบกษา เล่ม 117 ตอนที่ 113 ก',
    officialUrl: 'https://www.dpt.go.th',
    summary: 'ข้อกำหนดการแจ้งขุดดินลึกเกิน 3 เมตร ถมดินสูงเกิน 2 เมตร ระยะร่นปากบ่อดิน 2 เท่าของความลึก และมาตรการป้องกันดินพังทลายสไลด์ทับข้างเคียง',
    provisions: [
      {
        title: 'เกณฑ์การแจ้งขุดดินต่อเจ้าพนักงานท้องถิ่น',
        requirement: 'ขุดดินลึกเกิน 3.00 เมตร หรือพื้นที่ปากบ่อดินเกิน 10,000 ตารางเมตร ต้องแจ้งเจ้าพนักงานท้องถิ่นล่วงหน้า',
        details: 'ต้องยื่นแผนผังบริเวณ แบบรูปรายการ และรายการคำนวณที่ลงนามรับรองโดยวิศวกรวิชาชีพควบคุมสาขาวิศวกรรมโยธา',
        penaltyOrRisk: 'จำคุกไม่เกิน 1 ปี หรือปรับไม่เกิน 50,000 บาท หรือทั้งจำทั้งปรับ ตามมาตรา 35',
        clauseRef: 'พ.ร.บ. การขุดดินและถมดิน มาตรา 17'
      },
      {
        title: 'ระยะร่นปากบ่อดินจากแนวเขตที่ดินข้างเคียง (Slope Setback)',
        requirement: 'ปากบ่อขุดต้องมีระยะห่างจากแนวเขตที่ดินข้างเคียงไม่น้อยกว่า 2 เท่าของความลึกบ่อ (2H Setback)',
        details: 'ตัวอย่างเช่น ขุดลึก 4.00 เมตร ปากบ่อต้องร่นห่างจากแนวเขตที่ดินอย่างน้อย 8.00 เมตร เว้นแต่จะก่อสร้างกำแพงกันดินที่ปลอดภัย',
        penaltyOrRisk: 'ถูกสั่งระงับการขุดดิน และสั่งให้ถมดินกลับคืนสภาพเดิมทันที',
        clauseRef: 'พ.ร.บ. การขุดดินและถมดิน มาตรา 20'
      },
      {
        title: 'การขุดดินชิดแนวเขตด้วยกำแพงกันดินค้ำยัน',
        requirement: 'หากไม่สามารถร่นปากบ่อได้ตามเกณฑ์ 2 เท่า ต้องก่อสร้างกำแพงกันดิน (Sheet Pile / Diaphragm Wall) ที่ผ่านการคำนวณจากวุฒิวิศวกร',
        details: 'ต้องมีระบบค้ำยัน (Bracing / Tieback) ป้องกันการเคลื่อนตัวของดินและน้ำใต้ดินไม่ให้กระทบต่อโครงสร้างอาคารข้างเคียง',
        penaltyOrRisk: 'เกิดเหตุดินสไลด์ อาคารข้างเคียงทรุดตัว มีความรับผิดชอบค่าเสียหายทางแพ่งและอาญา',
        clauseRef: 'กฎกระทรวงว่าด้วยการขุดดิน พ.ศ. 2548'
      },
      {
        title: 'เกณฑ์การแจ้งถมดินต่อเจ้าพนักงานท้องถิ่น',
        requirement: 'ถมดินสูงกว่าพื้นที่ข้างเคียงเกิน 2.00 เมตร หรือพื้นที่เนินดินเกิน 2,000 ตารางเมตร ต้องแจ้งเจ้าพนักงานท้องถิ่น',
        details: 'ต้องจัดให้มีการระบายน้ำเพียงพอที่จะไม่ก่อให้เกิดความเดือดร้อนแก่เจ้าของที่ดินที่อยู่ข้างเคียงหรือทางน้ำสาธารณะ',
        penaltyOrRisk: 'ปรับไม่เกิน 10,000 บาท และถูกสั่งระงับการถมดินจนกว่าจะแก้ไขระบบระบายน้ำ',
        clauseRef: 'พ.ร.บ. การขุดดินและถมดิน มาตรา 26'
      },
      {
        title: 'หน้าที่การจัดระบบระบายน้ำและป้องกันดินพังทลาย',
        requirement: 'ห้ามปล่อยให้น้ำฝนหรือดินโคลนไหลเอ่อล้นเข้าท่วมที่ดินข้างเคียง หรือทางระบายน้ำสาธารณะอุดตัน',
        details: 'ต้องทำคันกั้นดิน บ่อดักตะกอน (Sediment Pond) และร่องระบายน้ำรอบพื้นที่ถม',
        penaltyOrRisk: 'ถูกสั่งปรับและชดใช้ค่าเสียหายจากการกัดเซาะดินข้างเคียง',
        clauseRef: 'พ.ร.บ. การขุดดินและถมดิน มาตรา 28'
      }
    ],
    fieldSurveyorGuidance: [
      'รังวัดระดับผิวดินเดิม (Natural Ground Level) รอบแปลงที่ดินและข้างเคียงไว้เป็นหมุดควบคุมอ้างอิง ก่อนเริ่มงานขุดหรือถม',
      'ตรวจสอบมุมลาดเอียง (Slope Batter) ของบ่อขุดอย่างต่อเนื่องระหว่างก่อสร้าง เพื่อเฝ้าระวังการสไลด์พังทลายของชั้นดิน',
      'รังวัดตรวจสอบตำแหน่งแนว Sheet Pile และจุดติดตั้ง Inclinometer ตรวจวัดการเคลื่อนตัวของดินด้านข้าง'
    ]
  },
  {
    id: 'law-waterways-marine-ingress',
    imagePath: '/images/laws/waterways-marine.jpg',
    imageCaption: 'แนวระดับน้ำสูงสุดตามธรรมชาติ (High Water Mark) และข้อกำหนดสิ่งล่วงล้ำลำน้ำ กรมเจ้าท่า',
    code: 'LAW-05',
    title: 'พ.ร.บ. การเดินเรือในน่านน้ำไทย — สิ่งล่วงล้ำลำน้ำ ทางน้ำสาธารณะ และงานสำรวจอุทกศาสตร์',
    enactmentName: 'พระราชบัญญัติการเดินเรือในน่านน้ำไทย พระพุทธศักราช 2456 มาตรา 117 และมาตรา 117 ทวิ',
    enactmentYear: 'พ.ศ. 2456 (แก้ไขเพิ่มเติม 2560)',
    authority: 'กรมเจ้าท่า (Marine Department) กระทรวงคมนาคม',
    officialGazetteRef: 'ราชกิจจานุเบกษา เล่ม 134 ตอนที่ 12 ก',
    officialUrl: 'https://www.md.go.th',
    summary: 'ข้อห้ามปลูกสร้างสิ่งล่วงล้ำลำน้ำ แม่น้ำ คลอง ทะเลสาบ ชายฝั่งทะเล โดยไม่ได้รับอนุญาต เกณฑ์การรังวัดแนวระดับน้ำสูงสุด (High Water Mark) และการขออนุญาตสะพาน/ท่าเทียบเรือ/เขื่อนกันตลิ่ง',
    provisions: [
      {
        title: 'ข้อห้ามการปลูกสร้างสิ่งล่วงล้ำลำน้ำ (มาตรา 117)',
        requirement: 'ห้ามมิให้ผู้ใดปลูกสร้างอาคาร สะพาน ท่าเทียบเรือ เขื่อน วางท่อ หรือสิ่งอื่นใดล่วงล้ำเข้าไปในแม่น้ำ ลำคลอง ทะเลสาบ หรือทะเล เว้นแต่ได้รับอนุญาตจากกรมเจ้าท่า',
        details: 'ครอบคลุมทั้งทางน้ำที่มีการเดินเรือและทางน้ำสาธารณะทั่วไป การก่อสร้างใดๆ ชิดริมตลิ่งต้องตรวจสอบแนวเขตลำน้ำให้ชัดเจน',
        penaltyOrRisk: 'จำคุกไม่เกิน 3 ปี หรือปรับคำนวณตามพื้นที่ ตร.ม. ละ 500-10,000 บาท และคำสั่งรื้อถอนทันที',
        clauseRef: 'พ.ร.บ. การเดินเรือในน่านน้ำไทย มาตรา 117'
      },
      {
        title: 'การกำหนดแนวเขตทางน้ำสาธารณะ (Ordinary High Water Mark)',
        requirement: 'แนวเขตลำน้ำสาธารณะให้คิดจากแนวระดับน้ำขึ้นสูงสุดตามฤดูกาลปกติ หรือแนวคันกั้นน้ำคอนกรีตสาธารณะ',
        details: 'ที่ดินชายตลิ่งที่น้ำท่วมถึงตามปกติถือเป็นทางน้ำสาธารณสมบัติของแผ่นดิน ช่างสำรวจต้องอ้างอิงระดับน้ำขึ้นสูงสุดของกรมอุทกศาสตร์',
        clauseRef: 'ประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 1304 & ระเบียบกรมเจ้าท่า'
      },
      {
        title: 'สิ่งล่วงล้ำลำน้ำที่ได้รับอนุญาตได้ตามเกณฑ์วิศวกรรม',
        requirement: 'ท่าเทียบเรือชุมชน สะพานข้ามคลอง หรือเขื่อนป้องกันตลิ่งพัง ต้องมีแบบวิศวกรรมชลศาสตร์รับรองว่าไม่ขัดขวางการไหลของน้ำและการสัญจรทางเรือ',
        details: 'ต้องจัดทำแผนที่แผนผังบริเวณแนบล่วงล้ำลำน้ำ แสดงพิกัด WGS84 และ UTM ระบุระยะยื่นล้ำและพื้นที่ตารางเมตรอย่างละเอียด',
        clauseRef: 'กฎกระทรวงคมนาคมว่าด้วยการอนุญาตปลูกสร้างสิ่งล่วงล้ำลำน้ำ'
      },
      {
        title: 'อำนาจสั่งรื้อถอนสิ่งปลูกสร้างล่วงล้ำลำน้ำ',
        requirement: 'ผู้ว่าการหรือเจ้าพนักงานเจ้าท่ามีอำนาจสั่งให้รื้อถอนสิ่งล่วงล้ำลำน้ำที่มิได้รับอนุญาตภายในระยะเวลาที่กำหนด',
        details: 'หากไม่รื้อถอนตามคำสั่ง กรมเจ้าท่ามีอำนาจรื้อถอนเองโดยผู้ครอบครองต้องรับผิดชอบค่าใช้จ่ายทั้งหมดพร้อมเงินเพิ่มตามกฎหมาย',
        penaltyOrRisk: 'ปรับรายวันวันละ 500 ถึง 10,000 บาท จนกว่าจะรื้อถอนแล้วเสร็จ',
        clauseRef: 'พ.ร.บ. การเดินเรือในน่านน้ำไทย มาตรา 118'
      }
    ],
    fieldSurveyorGuidance: [
      'งานสำรวจอุทกศาสตร์ (Bathymetric Survey) ต้องติดตั้งสถานีวัดระดับน้ำ (Tide Gauge) เพื่อแปลงระดับความลึกท้องน้ำ (Sounding Datum) สู่ระดับน้ำทะเลปานกลาง (MSL)',
      'รังวัดเก็บแนวสันเขื่อน หินทิ้ง และแนวระดับน้ำขึ้นสูงสุดจริงในสนามเพื่อประกอบแบบขออนุญาตสิ่งล่วงล้ำลำน้ำต่อกรมเจ้าท่า',
      'ตรวจสอบพิกัดเสาตอม่อสะพานและท่าเทียบเรือด้วย GNSS RTK เพื่อยืนยันว่าไม่เบี่ยงเบนเข้าสู่ร่องน้ำลึกสำหรับการเดินเรือ (Navigation Channel)'
    ]
  },
  {
    id: 'law-engineering-practice-safety',
    imagePath: '/images/laws/engineering-safety.jpg',
    imageCaption: 'มาตรฐานความปลอดภัยงานก่อสร้าง: การค้ำยันร่องขุดลึกเกิน 1.50 ม. และสายรัดนิรภัยทำงานที่สูง',
    code: 'LAW-06',
    title: 'พ.ร.บ. วิศวกร & กฎหมายความปลอดภัยไซต์งาน — ขอบเขตวิศวกรรมควบคุมสำรวจ/โยธา และมาตรฐาน จป.',
    enactmentName: 'พระราชบัญญัติวิศวกร พ.ศ. 2542 และ พ.ร.บ. ความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน พ.ศ. 2554',
    enactmentYear: 'พ.ศ. 2542 & พ.ศ. 2554',
    authority: 'สภาวิศวกร / กรมสวัสดิการและคุ้มครองแรงงาน',
    officialGazetteRef: 'ราชกิจจานุเบกษา เล่ม 116 ตอนที่ 120 ก',
    officialUrl: 'https://www.coe.or.th',
    summary: 'ข้อบังคับสภาวิศวกรสาขาวิศวกรรมโยธาและสำรวจ การรับรองแบบโครงข่ายควบคุมหมุดหลักฐาน กฎหมายความปลอดภัยในร่องขุดลึกเกิน 1.50 เมตร และการทำงานที่สูงเกิน 2.00 เมตร',
    provisions: [
      {
        title: 'ขอบเขตวิชาชีพวิศวกรรมควบคุม สาขาวิศวกรรมโยธาและสำรวจ',
        requirement: 'ห้ามผู้ไม่มีใบอนุญาตประกอบวิชาชีพวิศวกรรมควบคุม (กว.) ทำการวางผัง คำนวณ ควบคุมงานโครงสร้างและโครงข่ายหมุดหลักฐานชั้นหนึ่ง',
        details: 'งานสำรวจเพื่อการก่อสร้างขนาดใหญ่ เช่น รถไฟฟ้า ทางหลวง อุโมงค์ เขื่อน ต้องมีวิศวกรวิชาชีพควบคุมสาขาสำรวจหรือโยธาลงนามรับรอง',
        penaltyOrRisk: 'จำคุกไม่เกิน 3 ปี หรือปรับไม่เกิน 60,000 บาท หรือทั้งจำทั้งปรับ ตามมาตรา 71',
        clauseRef: 'พ.ร.บ. วิศวกร พ.ศ. 2542 มาตรา 45'
      },
      {
        title: 'ความปลอดภัยในงานขุดร่องลึก (Trench & Pit Safety)',
        requirement: 'ร่องขุดลึกเกิน 1.50 เมตรขึ้นไป กฎหมายบังคับต้องติดตั้งระบบค้ำยันดิน (Trench Box / Shoring) ก่อนส่งทีมงานลงปฏิบัติหน้าที่',
        details: 'ทีมช่างสำรวจห้ามลงไปส่องเป้าหรือถ่ายระดับก้นร่องขุดที่ไม่มีค้ำยันโดยเด็ดขาด เพื่อป้องกันเหตุดินถล่มทับคนงาน',
        penaltyOrRisk: 'นายจ้างมีโทษจำคุกไม่เกิน 1 ปี หรือปรับไม่เกิน 400,000 บาท หากเกิดอุบัติเหตุถึงแก่ชีวิต',
        clauseRef: 'กฎกระทรวงกำหนดมาตรฐานการบริหารและการจัดการด้านความปลอดภัยฯ ในงานก่อสร้าง พ.ศ. 2564'
      },
      {
        title: 'ความปลอดภัยในการทำงานบนที่สูง (Working at Height)',
        requirement: 'การทำงานที่มีความต่างระดับสูงเกิน 2.00 เมตรขึ้นไป ต้องมีราวกันตกสูง 90-110 ซม. หรือสวมใส่อุปกรณ์ยึดโยง Safety Harness 100% Tie-off',
        details: 'ใช้สำหรับงานตั้งกล้องส่องระดับบนนั่งร้าน ดาดฟ้า หรืองานสำรวจโครงสร้างเสาอาคารสูง',
        penaltyOrRisk: 'ระงับงานก่อสร้างทันทีและดำเนินคดีตาม พ.ร.บ. ความปลอดภัยฯ พ.ศ. 2554',
        clauseRef: 'กฎกระทรวงแรงงานความปลอดภัยในงานก่อสร้าง'
      },
      {
        title: 'มาตรฐานระยะหุ้มคอนกรีตเสริมเหล็ก (Concrete Covering วสท. 1007-34)',
        requirement: 'ฐานรากหล่อติดดิน ≥ 7.5 ซม. / คาน-เสาสัมผัสดิน ≥ 5.0 ซม. / คาน-เสาภายนอก ≥ 4.0 ซม. / ภายในอาคาร ≥ 3.0 ซม.',
        details: 'เพื่อป้องกันความชื้น ออกซิเจน และคลอไรด์แทรกซึมเข้าทำลายเหล็กเสริมจนเกิดสนิมและคอนกรีตแตกระเบิด',
        penaltyOrRisk: 'โครงสร้างสูญเสียกำลังรับน้ำหนัก สนิมขุมกัดกร่อนเหล็กเสริมจนอาคารแตกร้าวทรุดตัว',
        clauseRef: 'วสท. 1007-34 & กฎกระทรวง ฉบับที่ 6 ข้อ 19'
      }
    ],
    fieldSurveyorGuidance: [
      'วิศวกรสำรวจต้องตรวจสอบสภาพความปลอดภัยของค้ำยันปากบ่อและร่องขุด (Trench Shoring) ก่อนส่งทีมงานลงไปส่องเป้าหรืออ่านระดับ',
      'สวมใส่อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE: หมวกนิรภัย, เสื้อสะท้อนแสง, รองเท้าหัวเหล็ก) ทุกครั้งในเขตพื้นที่ก่อสร้าง',
      'ตรวจเช็คความหนาลูกปูนหนุนเหล็กตะแกรงฐานราก (Covering Block) ต้องได้ 7.5 ซม. ก่อนอนุมัติให้เทคอนกรีต'
    ]
  }
];
