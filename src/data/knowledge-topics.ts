import { KnowledgeTopic } from '../types/survey';

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'total-station-orientation',
    title: 'กล้องประมวลผลรวม: การตั้งสถานี ส่องหลัง และเดินวงรอบ (Total Station Traverse & Setup)',
    titleEn: 'Total Station Centering, Backsight Orientation, Closed/Link Traverse & Benchmark Staking',
    category: 'total-station',
    categoryName: 'Total Station & Theodolite',
    summary: 'คู่มือปฏิบัติการภาคสนามแบบละเอียด: การตั้งดิ่งและปรับระดับ (Centering & Leveling), การกำหนดทิศทางอ้างอิงด้วยพิกัดหรือมุมภาคของทิศ (Backsight Setup), ขั้นตอนการเดินวงรอบปิดและเปิด (Closed/Link Traverse), การวัด 2 หน้ากล้อง (Direct/Reverse), การสร้างหมุดอ้างอิงใหม่ (TBM) และการส่งออกข้อมูลเข้าสู่การปรับแก้วงรอบ',
    badge: 'เครื่องมือหลักงานสนาม',
    iconName: 'Compass',
    courseRelation: 'มาตรฐานวิศวกรรมสำรวจ (Geomatics Field Standards & Traverse Adjustment)',
    equipmentRequired: [
      'กล้องประมวลผลรวม (Total Station) พร้อมกล่องกันกระแทก',
      'ขาตั้งกล้องอลูมิเนียมหรือไม้ (Tripod) ชนิดหัวเรียบ สกรู 5/8 นิ้ว',
      'ชุดเป้าปริซึมเดี่ยว (Single Prism) พร้อมเสาโพล (Prism Pole 2.15m) และขาทรงตัว (Bipod)',
      'ชุดเป้าปริซึมหลังพร้อมฐานกล้อง (Tribrach & Optical Plummet Carrier) สำหรับตั้งบนหมุดหลัง',
      'ตลับเมตรเหล็กกล้า (Steel Tape) หรือเครื่องวัดระยะความสูงกล้อง',
      'เทอร์โมมิเตอร์และบารอมิเตอร์วัดอุณหภูมิและความกดอากาศ (คำนวณค่า ppm)'
    ],
    workingPrinciple: [
      'Total Station ผสาน Electronic Theodolite (จานองศาเลขอ่านมุมราบ/มุมดิ่งแบบดิจิทัล Absolute Optical Encoder) และ EDM (Electronic Distance Meter วัดระยะทางด้วยแสงเลเซอร์/อินฟราเรด) บนแกนเดียวกัน',
      'ระบบ 3 แกนทางเรขาคณิต: แกนดิ่ง (Vertical Axis), แกนราบ (Horizontal/Trunnion Axis), และแกนเล็ง (Line of Collimation) ซึ่งตามทฤษฎีต้องตั้งฉากกัน 90 องศาอย่างสมบูรณ์',
      'ระบบชดเชยการเอียงสองแกน (Dual-Axis Tilt Compensator): ตรวจจับการเอียงของแกนดิ่งในแนวแกนเล็งและแนวแกนราบเพื่อหักล้างค่าความเอียงแบบเรียลไทม์',
      'การวัดมุม 2 หน้ากล้อง (Face Left: FL / Face Right: FR): หักล้างความคลาดเคลื่อนจากแกนเล็งไม่ฉากกับแกนราบ (Collimation Error) และความคลาดเคลื่อนมุมดิ่ง (Vertical Index Error) โดย (FL + FR ± 180°)/2',
      'การแก้ค่าบรรยากาศ (Atmospheric Correction ppm): คลื่นแสงเดินทางช้าลงในอากาศหนาแน่น คำนวณจากอุณหภูมิและความดันบรรยากาศเพื่อยืด/หดสเกลระยะ EDM ให้ถูกต้อง'
    ],
    fieldProcedures: [
      {
        title: 'ขั้นตอนที่ 1: การกางขาตั้งกล้องและการตั้งดิ่งลงหมุด (Centering)',
        details: 'กางขากล้อง 3 ขาให้ห่างเท่าๆ กัน หัวขากล้องขนานพื้นระดับอก ปักปลายขากล้อง 1 ขาให้แน่น ขันสกรูยึดตัวกล้องเข้ากับหัวขากล้อง เปิดสวิตช์เลเซอร์ดิ่ง (Laser Plummet) ส่องมองจุดเลเซอร์ที่พื้น ใช้มือจับขากล้องอีก 2 ขาขยับจนจุดเลเซอร์ทับกึ่งกลางหมุดสำรวจ แล้วเหยียบขากล้องทั้ง 2 ให้แน่นลงดิน'
      },
      {
        title: 'ขั้นตอนที่ 2: การปรับระดับลูกน้ำฟองกลมและฟองยาวอิเล็กทรอนิกส์ (Leveling)',
        details: 'ปรับลูกน้ำฟองกลมโดยการปลดล็อคและเลื่อนยืด-หดขากล้อง 2 ขา เมื่อฟองกลมเข้ากลางแล้ว เข้าหน้าจอ Graphic Tilt Sensor หมุนตัวกล้องให้ฟองยาวขนานกับแนวสกรูควงเท้า 2 ตัว หมุนสกรูเข้าพร้อมกันหรือออกพร้อมกันให้ฟองเข้ากึ่งกลาง จากนั้นหมุนตัวกล้องไป 90° ปรับสกรูตัวที่ 3 ตัวเดียวให้ฟองเข้ากลาง ตรวจสอบการหมุนกล้องรอบตัว 360° ฟองต้องคงที่ ค่า Tilt X, Y ไม่เกิน ±5"',
        criticalCaution: 'หลังจากปรับระดับเสร็จ จุดเลเซอร์ดิ่งอาจเลื่อนออกจากหมุดเล็กน้อย ให้คลายสกรูยึดใต้ฐานกล้อง (Center Screw) แล้วเลื่อนตัวกล้องบนแป้นหัวขาตั้ง (ห้ามหมุนกล้อง) ให้จุดเลเซอร์ทับหมุดพอดี แล้วขันแน่นซ้ำ'
      },
      {
        title: 'ขั้นตอนที่ 3: การวัดความสูงกล้อง (Instrument Height: ih)',
        details: 'ใช้ตลับเมตรวัดระยะจากยอดหมุดสำรวจขึ้นมาถึงเครื่องหมายกึ่งกลางแกนราบ (Center Mark) ข้างตัวกล้อง อ่านค่าให้ละเอียดถึง 1 มิลลิเมตร (เช่น 1.545 m) และบันทึกลงสมุดสนามทันที'
      },
      {
        title: 'ขั้นตอนที่ 4: การตั้งสถานีและส่องหลัง (Occupied Station & Backsight Orientation)',
        details: 'เข้าเมนูพิกัด [Coordinate] เลือก [Occ.Orientation] ป้อนพิกัดหมุดตั้งกล้อง (N, E, Z) และความสูงกล้อง ih จากนั้นเลือกกำหนดหมุดหลังด้วยพิกัด [BS Coord] หรือมุมทิศ [BS Azimuth] เล็งสายใยกล้องผ่ากึ่งกลางเป้าปริซึมหมุดหลัง กด [MEAS] หรือ [SET] เพื่อล็อคทิศทางอ้างอิง ตรวจสอบระยะราบ (dHD) เทียบกับระยะพิกัดจริง ค่าต้องตรงกันในระดับมิลลิเมตร'
      },
      {
        title: 'ขั้นตอนที่ 5: การรังวัดวงรอบปิดและเปิด (Traverse Observation FL/FR)',
        details: 'เล็งส่องหมุดหน้า (Foresight: FS) ที่หน้าซ้าย (FL) กดวัดมุมและระยะทาง (HA, VA, SD, HD) บันทึกค่า จากนั้นพลิกกล้องสลับหน้าไปหน้าขวา (FR) ส่องเป้าเดิมซ้ำ ตรวจสอบมุมราบ FR ต้องต่างจาก FL 180° ± ไม่เกิน 10-20" บันทึกค่าเฉลี่ย'
      },
      {
        title: 'ขั้นตอนที่ 6: การถ่ายสร้างหมุดหลักฐานอ้างอิงใหม่ (Reference Benchmark / TBM Staking)',
        details: 'เมื่อต้องการฝังหมุดสำรองหรือหมุด TBM ใหม่ ให้ส่องเป้าปริซึมที่ตั้งบนหมุดใหม่ วัดระยะและมุม 2 หน้ากล้องซ้ำ 3-5 รอบ เพื่อเฉลี่ยพิกัด (N, E, Z) และบันทึกรายละเอียดคำอธิบายหมุด (Description)'
      }
    ],
    deviceWorkflow: [
      {
        stepNumber: 1,
        stageName: 'เปิดเครื่องและป้อนค่าแก้บรรยากาศ (PPM Setting)',
        targetHardware: 'Topcon / Sokkia / Leica / Trimble Total Station',
        buttonKey: '[PWR] -> [MENU] -> [CONFIG] -> [EDM / PPM]',
        actionLabel: 'กดปุ่มเปิดเครื่อง แล้วเข้าเมนู EDM เพื่อตั้งค่าปริซึมและบรรยากาศ',
        screenTitle: 'EDM SETTING & CORRECTIONS',
        screenLines: [
          'PRISM CONSTANT : -30 mm (Standard)',
          'ATMOS CORRECT  : AUTO / MANUAL',
          'TEMPERATURE    : +32.5 °C',
          'PRESSURE       : 1012.0 hPa',
          'CALCULATED PPM : +14.2 ppm',
          '[ENTER]        : SAVE & CONTINUE'
        ],
        explanation: 'ค่าคงที่ปริซึม (Prism Constant) ต้องตั้งให้ตรงกับเป้าที่ใช้ (เช่น -30 mm สำหรับเป้ากลมมาตรฐาน หรือ 0 mm สำหรับเป้าแผ่น 360) หากตั้งผิด ระยะจะเพี้ยน 3 เซนติเมตรทันทีทุกจุดที่วัด',
        qaCheck: 'ตรวจดูสัญลักษณ์ PPM บนหน้าจอหลักว่าแสดงค่าคำนวณแล้ว'
      },
      {
        stepNumber: 2,
        stageName: 'ตั้งพิกัดจุดตั้งกล้อง (Occupied Station Input)',
        targetHardware: 'Topcon / Sokkia (GTS/OS Series) หรือเทียบเท่า',
        buttonKey: '[MENU] -> [1. COORDINATE] -> [F1: OCC.ORIENTATION]',
        actionLabel: 'เลือกเมนูพิกัด และเลือกตั้งจุดตั้งกล้อง',
        screenTitle: 'OCCUPIED POINT SETUP (STN)',
        screenLines: [
          'PT#   : BM-01 (Known Base)',
          'N     : 1530482.350 m',
          'E     :  672195.420 m',
          'Z     :    24.150 m',
          'ih    :     1.542 m (Inst. Height)',
          '[REC] / [OK] -> NEXT: BACKSIGHT'
        ],
        explanation: 'ป้อนชื่อหมุด, ค่าพิกัดเหนือ (N), ค่าพิกัดตะวันออก (E), ค่าระดับ (Z) และความสูงกล้อง (ih) ที่วัดด้วยตลับเมตร',
        qaCheck: 'ตรวจสอบทศนิยมพิกัดให้ครบ 3 ตำแหน่ง ห้ามสลับช่อง N และ E'
      },
      {
        stepNumber: 3,
        stageName: 'เล็งและส่องหมุดหลังเพื่อกำหนดทิศ (Backsight Setup)',
        targetHardware: 'Total Station Keypad',
        buttonKey: '[F2: BS NEZ] หรือ [F3: BS AZ] -> [MEAS]',
        actionLabel: 'ป้อนพิกัดหมุดหลัง หรือป้อนมุม Azimuth เล็งสายใยตรงเป้า แล้วกดวัด',
        screenTitle: 'BACKSIGHT ORIENTATION CHECK',
        screenLines: [
          'BS PT#: BM-02 (Reference Pin)',
          'N     : 1530598.110 m',
          'E     :  672240.380 m',
          'th    :     1.600 m (Prism Height)',
          'HA    :  21° 04\' 15" (Calculated Az)',
          '--- MEASURED RESIDUALS ---',
          'dHD   : +0.002 m (Check Distance!)',
          'dZ    : -0.001 m',
          '[YES] : CONFIRM AZIMUTH ZERO-SET'
        ],
        explanation: 'กล้องจะคำนวณมุมทิศ Azimuth และระยะทางตามพิกัดให้โดยอัตโนมัติ เมื่อส่องวัดไปยังเป้าปริซึมหมุดหลัง กล้องจะแสดงผลต่างระยะราบ dHD ซึ่งใช้ยืนยันว่าหมุดควบคุมทั้ง 2 ไม่เคลื่อนตัว',
        qaCheck: 'ค่า dHD ต้องไม่เกิน ±0.005 m หากเกิน ให้หยุดและตรวจสอบการตั้งดิ่งทั้งสองจุด',
        downstreamUsage: 'ล็อคระบบพิกัดและมุมราบของตัวกล้องเข้ากับกริดแผนที่ของโครงการ'
      },
      {
        stepNumber: 4,
        stageName: 'การส่องวัดหมุดหน้าวงรอบ (Foresight Traverse & Data Rec)',
        targetHardware: 'Total Station Keypad',
        buttonKey: '[COORD] -> [OBSERVATION] -> [MEAS] -> [REC]',
        actionLabel: 'เล็งเป้าหมุดวงรอบถัดไป กดวัดพิกัดและบันทึก',
        screenTitle: 'TRAVERSE OBSERVATION (FS)',
        screenLines: [
          'PT#   : TP-01 (Next Traverse Station)',
          'th    :     1.600 m',
          'HR    :  78° 32\' 44"',
          'SD    :   145.892 m',
          'HD    :   145.810 m',
          'N     : 1530512.440 m',
          'E     :  672338.712 m',
          'Z     :    23.890 m',
          '[AUTO] / [REC] -> STORED IN MEMORY'
        ],
        explanation: 'บันทึกทั้งข้อมูลมุมดิบ (HA, VA, SD) และพิกัดคำนวณ (N, E, Z) ควรทำซ้ำทั้งสองหน้ากล้อง (FL และ FR) บนหมุดโครงข่ายหลัก',
        qaCheck: 'เช็คฟองน้ำเสาโพลของคนถือปริซึมให้ตรงกลางนิ่งสนิทขณะกดปุ่ม [MEAS]'
      }
    ],
    downstreamWorkflow: {
      outputDataFormat: 'ไฟล์ดิบ RAW/SDR33, Leica GSI, Topcon GTS-7, หรือพิกัด CSV (PT, N, E, Z, Code)',
      outputDescription: 'ข้อมูลตารางผลการวัดมุมราบ, มุมดิ่ง, ระยะเอียง (SD), และระยะราบ (HD) ของแต่ละสถานีวงรอบ',
      nextStepTitle: 'การปรับแก้วงรอบด้วยวิธีบาวดิทช์ (Bowditch Traverse Adjustment)',
      nextStepProcedure: 'นำค่าพิกัดดิบและผลการวัดระยะ-มุมเข้าสู่โมดูลคำนวณวงรอบของ MESURV เพื่อคำนวณผลรวมมุมปิด (Angular Misclosure), ผลต่างพิกัดปิด (Linear Misclosure), อัตราส่วนความละเอียด (1:N) และพิกัดปรับแก้ขั้นสุดท้าย',
      recommendedToolTab: 'traverse',
      toolActionLabel: 'เปิดเครื่องมือคำนวณวงรอบ (Bowditch Traverse)'
    },
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนจากการตั้งดิ่ง (Centering Error): ในแนวเส้นทางสั้น (< 50m) การตั้งดิ่งเพี้ยน 2 มม. ส่งผลให้มุมคลาดเคลื่อนหลายสิบฟิลิปดา ต้องตรวจจุดเลเซอร์ดิ่งซ้ำเสมอ',
      'ความคลาดเคลื่อนแกนเล็ง (Collimation Error): แก้ไขด้วยการวัด 2 หน้ากล้อง (Face Left / Face Right) แล้วหาค่าเฉลี่ย',
      'การแกว่งไหวของเสาเป้าปริซึม (Prism Pole Tilt): ต้องติดตั้งขาทรงตัว Bipod เสมอเมื่อรังวัดหมุดควบคุมหลักฐาน ห้ามใช้มือถือเปล่า',
      'ความคลาดเคลื่อนจากอุณหภูมิและดรรชนีหักเหแสง (Refraction): หลีกเลี่ยงแนวเล็งที่เฉียดผ่านหลังคาสังกะสี ผนังคอนกรีต หรือผิวยางมะตอยร้อนจัดในระยะ 1 เมตร'
    ],
    formulas: [
      {
        label: 'การลดทอนระยะเอียงเป็นระยะราบและระยะดิ่ง (Plane Distance Reduction)',
        formula: 'HD = SD * sin(ZA),   VD = SD * cos(ZA)',
        explanation: 'SD = Slope Distance จาก EDM, ZA = Zenith Angle (มุมดิ่งนับจากแนวยอดฟ้า 0°)'
      },
      {
        label: 'การคำนวณผลต่างระดับ (Elevation Difference dH)',
        formula: 'dH = SD * cos(ZA) + ih - th',
        explanation: 'ih = ความสูงกล้องเหนือหมุด, th = ความสูงเป้าปริซึมเหนือหมุด'
      },
      {
        label: 'การคำนวณพิกัดราบเบื้องต้น (Coordinate Forward Calculation)',
        formula: 'N_next = N_stn + HD * cos(Az),   E_next = E_stn + HD * sin(Az)',
        explanation: 'คำนวณค่าพิกัดสถานีถัดไปจากมุมภาคของทิศ (Azimuth) และระยะราบ (HD)'
      }
    ]
  },
  {
    id: 'total-station-resection',
    title: 'วิธีฟรีสเตชันและรีเซกชัน (Resection / Free Stationing)',
    titleEn: 'Total Station Free Stationing, Multi-Point Resection & Residual Quality Check',
    category: 'total-station',
    categoryName: 'Total Station & Theodolite',
    summary: 'ขั้นตอนการตั้งกล้องในจุดที่ไม่ทราบพิกัด (Free Station) แล้วส่องวัดมุมและระยะไปยังหมุดควบคุมที่ทราบพิกัด 2-5 หมุด เพื่อคำนวณหาพิกัดจุดตั้งกล้องและมุมทิศทางอ้างอิงด้วยวิธีกำลังสองน้อยที่สุด (Least Squares) พร้อมเกณฑ์ตรวจสอบค่าคลาดเคลื่อนตกค้าง (Residuals QA/QC)',
    badge: 'เทคนิคการตั้งกล้องขั้นสูง',
    iconName: 'Compass',
    courseRelation: 'การปรับแก้การรังวัด (Survey Adjustment & Least Squares Resection)',
    equipmentRequired: [
      'กล้องประมวลผลรวม (Total Station) ที่มีฟังก์ชันคำนวณ Resection / Free Station ในตัว',
      'ขาตั้งกล้องมั่นคง (Heavy-duty Tripod)',
      'ชุดเป้าปริซึม 2-3 ชุด ติดตั้งบนหมุดควบคุมที่ทราบพิกัดแน่นอน (Known Control Points)',
      'ตารางพิกัดหมุดควบคุมโครงการ (Control Point Coordinate Table)'
    ],
    workingPrinciple: [
      'Resection (Free Station) คือวิธีหาพิกัด (X, Y, Z) และการวางตัวของจานองศา (Orientation Unknown: θ) ของจุดตั้งกล้อง โดยตั้งกล้อง ณ จุดใดก็ได้ที่มองเห็นหมุดควบคุมตั้งแต่ 2 หมุดขึ้นไป',
      'หากวัดเฉพาะมุม (Angular Resection / Three-Point Problem): ต้องใช้หมุดควบคุมอย่างน้อย 3 หมุด และต้องระวังไม่อยู่บนวงกลมวิกฤต (Danger Circle / Circumcircle)',
      'หากวัดทั้งมุมและระยะทาง (Distance & Angle Resection): ใช้หมุดควบคุมเพียง 2 หมุดก็สามารถคำนวณพิกัด 3D ได้ แต่ในทางวิศวกรรมควรรังวัด 3-4 หมุดขึ้นไปเพื่อให้มีจำนวนสมการเกิน (Redundancy)',
      'การปรับแก้ Least Squares ภายในเครื่องจะคำนวณหาค่าพิกัดที่ดีที่สุด และรายงานค่าความคลาดเคลื่อนตกค้าง (Residuals: dN, dE, dZ) ของแต่ละหมุดควบคุมที่ใช้คำนวณ'
    ],
    fieldProcedures: [
      {
        title: 'ขั้นตอนที่ 1: การเลือกจุดตั้งกล้องฟรีสเตชัน (Station Location Selection)',
        details: 'เลือกตำแหน่งตั้งกล้องที่พื้นผิวมั่นคง ไม่ยวบยาบ และสามารถมองเห็นหมุดควบคุมโครงการได้อย่างน้อย 2-4 จุดอย่างชัดเจน มุมตัดระหว่างแนวเล็งไปยังหมุดควบคุมควรอยู่ระหว่าง 30° ถึง 150° (หลีกเลี่ยงมุมแคบเกินไปหรือแนวตรงกัน 180°)'
      },
      {
        title: 'ขั้นตอนที่ 2: การตั้งระดับกล้อง (Leveling Only)',
        details: 'สำหรับ Free Station ไม่จำเป็นต้องมีหมุดใต้ตัวกล้อง (ไม่ต้อง Centering ลงหมุด) เพียงแค่กางขากล้องให้มั่นคง และปรับระดับลูกน้ำฟองกลมและฟองยาวอิเล็กทรอนิกส์ให้เข้ากึ่งกลางสมบูรณ์'
      },
      {
        title: 'ขั้นตอนที่ 3: การเรียกใช้คำสั่ง Resection ในตัวกล้อง',
        details: 'เข้าเมนู [MENU] -> [RESECTION] เลือกโหมดการวัด (NEZ หรือ 2D/3D) ป้อนชื่อจุดตั้งกล้องสมมุติ (เช่น FS-01) และความสูงกล้อง ih'
      },
      {
        title: 'ขั้นตอนที่ 4: การส่องวัดหมุดควบคุมที่ 1, 2, และ 3 ตามลำดับ',
        details: 'ป้อนพิกัดหมุดควบคุมที่ 1 เล็งสายใยตรงกึ่งกลางเป้าปริซึม กด [MEAS] -> กล้องจะให้ป้อนพิกัดหมุดควบคุมที่ 2 เล็งเป้าแล้วกด [MEAS] -> ทำซ้ำกับหมุดควบคุมที่ 3 แล้วกดปุ่ม [CALC]'
      },
      {
        title: 'ขั้นตอนที่ 5: การตรวจสอบค่าความคลาดเคลื่อนตกค้าง (Residual Inspection)',
        details: 'ตรวจสอบหน้าจอแสดงค่า Residuals: dN, dE, dZ ของแต่ละหมุด ค่าพิกัดส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation) ต้องอยู่ภายในเกณฑ์ที่โครงการกำหนด (เช่น dN, dE ≤ 3-5 มม.) หากผ่านเกณฑ์ ให้กด [SET] หรือ [ACCEPT] เพื่อบันทึกพิกัดและทิศทางอ้างอิงของสถานี'
      }
    ],
    deviceWorkflow: [
      {
        stepNumber: 1,
        stageName: 'เปิดฟังก์ชัน Free Station / Resection',
        targetHardware: 'Topcon / Sokkia / Leica FlexLine',
        buttonKey: '[MENU] -> [PROGRAMS] -> [RESECTION / FREE STN]',
        actionLabel: 'เลือกโปรแกรม Resection บนหน้าจอกล้อง',
        screenTitle: 'RESECTION - METHOD SELECTION',
        screenLines: [
          'METHOD : 3D (E, N, Z + DIST & ANG)',
          'STN ID : STN-TEMP-01',
          'ih     : 1.550 m',
          'NO. OF TARGETS : 3 (Recommended)',
          '[F1: START] -> SIGHT TARGET 1'
        ],
        explanation: 'เลือกคำนวณแบบ 3D เพื่อให้ได้ทั้งพิกัดราบและระดับความสูงพร้อมกัน',
        qaCheck: 'ตรวจดูว่าแบตเตอรี่กล้องมีมากกว่า 50% ก่อนเริ่มคำนวณ'
      },
      {
        stepNumber: 2,
        stageName: 'ส่องวัดหมุดควบคุมจุดที่ 1 และ 2',
        targetHardware: 'Total Station Keypad',
        buttonKey: '[INPUT PT#] -> [AIM TARGET] -> [F1: DIST] -> [F4: SET]',
        actionLabel: 'ป้อนพิกัดหรือดึงจากหน่วยความจำ เล็งเป้า แล้วกดยิงระยะ',
        screenTitle: 'RESECTION - TARGET 01/03',
        screenLines: [
          'TARGET 01: CP-A (Known Point)',
          'N : 1530490.112 m, E : 672100.450 m',
          'th: 1.500 m',
          'HR: 45° 12\' 30", SD: 85.340 m',
          '[F1: DIST] -> [F4: YES] -> NEXT TARGET'
        ],
        explanation: 'เมื่อยิงระยะหมุดที่ 1 สำเร็จ ให้หมุนกล้องไปส่องหมุดควบคุม CP-B จุดที่ 2 แล้วทำซ้ำขั้นตอนเดียวกัน',
        qaCheck: 'สังเกตค่าสะท้อนสัญญาณ EDM ต้องแรงเต็มพิกัด'
      },
      {
        stepNumber: 3,
        stageName: 'ประมวลผล Least Squares และตรวจสอบ Residuals',
        targetHardware: 'Total Station Screen',
        buttonKey: '[F1: CALC] -> ตรวจสอบผลลัพธ์',
        actionLabel: 'กดคำนวณผลลัพธ์และตรวจสอบค่าความคลาดเคลื่อน',
        screenTitle: 'RESECTION RESULTS & RESIDUALS',
        screenLines: [
          'CALCULATED STN: STN-TEMP-01',
          'N: 1530420.552 m  (SD: ±0.002 m)',
          'E:  672180.114 m  (SD: ±0.002 m)',
          'Z:    25.120 m    (SD: ±0.004 m)',
          '--- TARGET RESIDUALS (dE, dN) ---',
          'CP-A : dE = +0.001 m, dN = -0.002 m',
          'CP-B : dE = -0.002 m, dN = +0.001 m',
          'CP-C : dE = +0.001 m, dN = +0.001 m',
          '[F4: SET] : ADOPT COORDINATES'
        ],
        explanation: 'กล้องจะแสดงพิกัดที่คำนวณได้พร้อมค่า Standard Deviation และ Residuals รายหมุด หากค่า Residual ต่ำกว่าเกณฑ์ แสดงว่าพิกัดถูกต้องสมบูรณ์',
        qaCheck: 'หากหมุดใดมี dN หรือ dE เกิน ±0.005 m ให้กดลบหมุดนั้นออกจากการคำนวณ หรือตรวจเช็คว่าเล็งเป้าผิดจุดหรือไม่',
        downstreamUsage: 'เมื่อกด [SET] กล้องจะจำลองว่าตั้งอยู่บนพิกัดนี้ทันที และพร้อมเริ่มงานรังวัดเก็บรายละเอียด (Detail Survey) หรือวางตำแหน่ง (Stake-out)'
      }
    ],
    downstreamWorkflow: {
      outputDataFormat: 'บันทึกพิกัดสถานีพร้อมรายงานค่า Residuals ลงหน่วยความจำกล้อง',
      outputDescription: 'พิกัดจุดตั้งกล้องจริงพร้อมมุมทิศทางอ้างอิงที่ปรับแก้แล้ว',
      nextStepTitle: 'การรังวัดเก็บรายละเอียดหรือวางผังอาคาร (Topo Survey & Stakeout)',
      nextStepProcedure: 'สามารถสลับไปที่โหมด [STAKEOUT] เพื่อนำทางปักหมุดเสาเข็ม หรือโหมด [TOPOGRAPHY] เพื่อรังวัดเก็บตำแหน่งภูมิประเทศรอบข้างได้ทันที',
      recommendedToolTab: 'converter',
      toolActionLabel: 'เปิดเครื่องมือตรวจสอบแปลงพิกัด (Coordinate Tool)'
    },
    errorSourcesAndMitigation: [
      'รูปทรงเรขาคณิตของหมุดควบคุมไม่ดี (Poor Geometry): หมุดควบคุมเรียงเป็นเส้นตรง หรือมุมตัดระหว่างหมุดแคบกว่า 30° ส่งผลให้สมการเกิด Singular ต้องเลือกหมุดที่กระจายตัวรอบทิศทาง',
      'ปรากฏการณ์วงกลมวิกฤต (Danger Circle): เกิดในกรณี Resection วัดเฉพาะมุม ถ้าจุดตั้งกล้องตกอยู่บนวงกลมที่ลากผ่านหมุดควบคุมทั้งสาม จะไม่สามารถหาคำตอบที่แท้จริงได้ (Mitigation: ยิงวัดระยะทางด้วยเสมอ)',
      'การป้อนพิกัดหมุดควบคุมผิดจุด: สลับค่า N/E หรือจำชื่อหมุดสลับกัน จะสังเกตเห็นค่า Residual พุ่งสูงขึ้นเป็นเมตร'
    ],
    formulas: [
      {
        label: 'สมการระยะทางระหว่างจุดตั้งกล้อง (x0, y0) กับหมุดควบคุม (xi, yi)',
        formula: 'Di = sqrt( (xi - x0)^2 + (yi - y0)^2 )',
        explanation: 'ระยะทางทางทฤษฎีจากจุดตั้งกล้องไปยังหมุดควบคุมแต่ละจุด'
      },
      {
        label: 'การหาค่าความคลาดเคลื่อนตกค้าง (Residual Vector v)',
        formula: 'v = A * delta_x - L,   min(v^T * P * v)',
        explanation: 'A = ดีไซน์เมทริกซ์, delta_x = ค่าปรับแก้พิกัดจุดตั้งกล้อง, L = เวกเตอร์ผลต่างการรังวัด, P = เมทริกซ์น้ำหนัก'
      }
    ]
  },
  {
    id: 'differential-leveling-procedure',
    title: 'กล้องระดับ: Two-Peg Test และการทำระดับอนุพันธ์ (Differential Leveling SOP)',
    titleEn: 'Automatic & Digital Leveling, Two-Peg Collimation Check, BS/IFS/FS Loop & Page Check',
    category: 'differential-leveling',
    categoryName: 'Differential Leveling',
    summary: 'คู่มือการทำระดับความแม่นยำสูง: การทดสอบความขนานของแกนเล็งกับแนวระดับ (Two-Peg Collimation Test), ขั้นตอนการเดินระดับวงรอบปิด (Closed Level Loop), กฎการรักษาระยะส่องหน้าและส่องหลังให้เท่ากัน (Balancing Sights), การคำนวณแบบ Height of Instrument (HI) และ Rise & Fall, การตรวจผลรวมหน้ากระดาษ (Page Check) และเกณฑ์ความคลาดเคลื่อนยอมรับได้ตามมาตรฐาน RTSD',
    badge: 'ความแม่นยำทางดิ่งระดับมิลลิเมตร',
    iconName: 'Ruler',
    courseRelation: 'การทำระดับวิศวกรรมและมาตรฐานกรมแผนที่ทหาร (Engineering Leveling & RTSD Specs)',
    equipmentRequired: [
      'กล้องระดับอัตโนมัติ (Automatic Level) หรือกล้องระดับดิจิทัล (Digital Level พร้อมบาร์โค้ด)',
      'ขาตั้งกล้องระดับอลูมิเนียมหัวแบน (Leveling Tripod)',
      'ไม้ระดับอลูมิเนียมชัก 4-5 เมตร หรือไม้ระดับอินวาร์ (Invar Staff สำหรับงานความละเอียดสูง)',
      'ลูกน้ำฟองกลมติดไม้ระดับ (Staff Bubble) เพื่อบังคับให้ไม้ระดับตั้งตรงดิ่ง',
      'เต่าเหล็กรองรับไม้ระดับ (Turning Plate / Turtle) น้ำหนักไม่น้อยกว่า 3-5 กก.',
      'สมุดบันทึกระดับสนาม (Field Level Book)'
    ],
    workingPrinciple: [
      'กล้องระดับอัตโนมัติ (Automatic Level) ใช้ชุดลูกตุ้มชดเชยแสง (Optical/Magnetic Compensator) แขวนปริซึมสะท้อนแสงด้วยเส้นลวด เพื่อดึงแนวเล็งให้ขนานกับแนวระนาบระดับสัมบูรณ์ (Equipotential Gravity Surface) แม้ตัวกล้องจะเอียงเล็กน้อย',
      'กล้องระดับดิจิทัล (Digital Level) ใช้เซนเซอร์ Linear Photo Diode Array (CCD) สแกนอ่านแถบรหัสแท่ง (Barcode) บนไม้ระดับอินวาร์ ประมวลผลภาพดิจิทัลเพื่อคำนวณค่าความสูงและระยะทางโดยอัตโนมัติ ขจัด Human Error ในการอ่านสายตา',
      'กฎการรักษาระยะส่องหน้าและส่องหลังให้สมดุล (Balancing Sight Distances): ระยะจากกล้องไปยัง Backsight (D_bs) และ Foresight (D_fs) ในแต่ละสถานีต้องเท่ากัน เพื่อหักล้างผลกระทบจากความโค้งของโลก (Earth Curvature) การหักเหของแสงในอากาศ (Atmospheric Refraction) และความคลาดเคลื่อนแกนเล็ง (Collimation Error) อย่างสมบูรณ์',
      'ลำดับการส่องอ่าน: ส่องหลัง (Backsight: BS) เพื่อหาความสูงแนวเล็งของกล้อง (HI), ส่องกลาง (Intermediate Sight: IFS) เพื่อเก็บค่าระดับจุดย่อย, ส่องหน้า (Foresight: FS) เพื่อส่งต่อระดับไปยังจุดเปลี่ยนหมุด (Turning Point: TP)'
    ],
    fieldProcedures: [
      {
        title: 'ขั้นตอนที่ 1: การทดสอบความถูกต้องของแกนเล็ง (Two-Peg Collimation Test)',
        details: 'ปักหมุดสองจุด A และ B ห่างกันประมาณ 40-50 เมตร ตั้งกล้องกึ่งกลาง (จุด C ห่างจาก A และ B ด้านละ 20-25 ม.) ส่องอ่านไม้ระดับทั้งสองข้าง ผลต่างระดับที่ได้คือค่าจริง (True delta H = a1 - b1) เนื่องจากระยะส่องเท่ากัน จากนั้นย้ายกล้องไปตั้งใกล้จุด A (ห่างประมาณ 2-3 ม.) ส่องอ่านไม้ระดับที่ A ได้ a2 และส่องอ่านที่ B ได้ b2 คำนวณค่าคลาดเคลื่อนแกนเล็ง c-value หากเกิน ±2 มม. ต่อระยะ 40 ม. ต้องเปิดฝาครอบท้ายกล้องและใช้เข็มปรับหมุนสกรูสายใย'
      },
      {
        title: 'ขั้นตอนที่ 2: การตั้งกล้องและปรับระดับลูกน้ำฟองกลม (Setup & Circular Bubble)',
        details: 'ปักขากล้องให้แน่นหนา หมุนสกรูควงเท้า 3 ตัวให้ลูกน้ำฟองกลมเข้าสู่กึ่งกลางวงกลมสีดำ หมุนกล้องทดสอบรอบทิศ ฟองกลมต้องคงอยู่กึ่งกลาง เคาะขากล้องเบาๆ เพื่อตรวจดูว่าระบบ Compensator ทำงานเป็นอิสระไม่ติดขัด'
      },
      {
        title: 'ขั้นตอนที่ 3: การวางเต่าเหล็กที่จุดเปลี่ยนหมุด (Turning Point: TP)',
        details: 'ทุกจุดที่มีการส่งต่อระดับและย้ายกล้อง (จุด TP) ต้องวางไม้ระดับลงบนปุ่มนูนของเต่าเหล็กหล่อที่กระทืบยึดแน่นกับผิวดิน ห้ามวางไม้ระดับบนผิวดินนิ่ม ก้อนหินหลวม หรือขอบหญ้าเด็ดขาด และห้ามขยับเต่าเหล็กจนกว่าจะส่อง BS ของสถานีถัดไปเสร็จสิ้น'
      },
      {
        title: 'ขั้นตอนที่ 4: การอ่านไม้ระดับและการส่ายไม้ (Staff Reading & Waving)',
        details: 'คนถือไม้ระดับต้องตั้งไม้ให้ฟองกลมตรงกลาง หากไม่มีฟองกลม ให้คนถือไม้ค่อยๆ ส่ายไม้ระดับ (Waving) โค้งเข้าหากล้องและโค้งออกจากกล้องช้าๆ ผู้ส่องกล้องจะบันทึกค่าที่ต่ำที่สุด (Lowest Value) ที่สายใยกลางทับผ่านไม้ระดับ'
      },
      {
        title: 'ขั้นตอนที่ 5: การคำนวณและตรวจสอบผลรวมหน้ากระดาษ (Arithmetic Page Check)',
        details: 'เมื่อจดบันทึกเต็มหน้าสมุดระดับ ต้องคำนวณ Arithmetic Check ทันที: ผลรวม BS - ผลรวม FS = ผลรวม Rise - ผลรวม Fall = ค่าระดับสุดท้าย - ค่าระดับเริ่มต้น หากผลลัพธ์ไม่ตรงกัน แสดงว่ามีการคำนวณเลขในแถวผิด'
      }
    ],
    deviceWorkflow: [
      {
        stepNumber: 1,
        stageName: 'การปรับโฟกัสสายใยและกำจัด Parallax',
        targetHardware: 'Optical Level / Digital Level Eyepiece',
        buttonKey: '[หมุนวงแหวนมองเลนส์ใกล้ตา] -> [หมุนปุ่มปรับโฟกัสเลนส์หน้า]',
        actionLabel: 'เล็งกล้องไปยังท้องฟ้าหรือกระดาษขาว หมุนปรับสายใยให้ดำคมชัด',
        screenTitle: 'RETICLE FOCUS & PARALLAX CHECK',
        screenLines: [
          'STEP 1: SIGHT UNIFORM BRIGHT BACKGROUND',
          'STEP 2: ROTATE EYEPIECE UNTIL CROSSHAIRS SHARP',
          'STEP 3: AIM STAFF & TURN FOCUSING KNOB',
          'STEP 4: BOB HEAD SLIGHTLY UP AND DOWN',
          'QA CHECK: CROSSHAIR MUST NOT MOVE ON STAFF'
        ],
        explanation: 'หากขยับศีรษะขึ้น-ลงแล้วสายใยเลื่อนตำแหน่งบนไม้ระดับ แสดงว่าเกิด Parallax ซึ่งจะทำให้อ่านค่าระดับผิดพลาดอย่างมาก ต้องหมุนโฟกัสจนภาพไม้ระดับและสายใยอยู่นิ่งบนระนาบเดียวกัน',
        qaCheck: 'สายใยแนวนอนและเส้นสายใย Stadia บน/ล่าง ต้องคมชัดลึก'
      },
      {
        stepNumber: 2,
        stageName: 'การอ่านส่องหลังและคำนวณ HI (Backsight Observation)',
        targetHardware: 'Field Book / Digital Level Screen',
        buttonKey: '[MEAS] (สำหรับ Digital Level) หรือ จดอ่านสายใยกลาง 3 เส้น',
        actionLabel: 'ส่องอ่านไม้ระดับที่หมุด BM เริ่มต้น แล้วคำนวณค่าความสูงกล้อง HI',
        screenTitle: 'STATION 01: BACKSIGHT (BM-01)',
        screenLines: [
          'POINT ID  : BM-01 (Known Benchmark)',
          'BENCHMARK : RL = 12.540 m (Starting Elevation)',
          'STAFF RDG : BS =  1.428 m (Crosshair Center)',
          'CALCULATE : HI = RL + BS',
          'RESULT HI : 12.540 + 1.428 = 13.968 m',
          'STADIA RDG: Top = 1.553, Btm = 1.303 -> Dist = 25.0 m'
        ],
        explanation: 'อ่านสายใยกลาง (Center Crosshair) และอ่านสายใยบน-ล่างเพื่อตรวจสอบ: ระยะทาง = (บน - ล่าง) x 100 เมตร',
        qaCheck: 'สายใยกลางต้องเท่ากับ (สายใยบน + สายใยล่าง)/2 ภายใน ±1 มม.'
      },
      {
        stepNumber: 3,
        stageName: 'การส่องหน้าส่งต่อระดับ (Foresight to Turning Point)',
        targetHardware: 'Field Book / Digital Level Screen',
        buttonKey: '[AIM TP-01] -> [MEAS] -> [CALCULATE ELEVATION]',
        actionLabel: 'ส่องอ่านไม้ระดับที่ตั้งบนเต่าเหล็กจุด TP แล้วลบออกจาก HI',
        screenTitle: 'STATION 01 -> TP-01 (FORESIGHT)',
        screenLines: [
          'POINT ID  : TP-01 (Turning Point 1)',
          'CURRENT HI: 13.968 m',
          'STAFF RDG : FS = 0.895 m',
          'CALCULATE : RL_TP1 = HI - FS',
          'RESULT RL : 13.968 - 0.895 = 13.073 m',
          'RISE/FALL : RISE = +0.533 m (BS - FS)',
          'FS DIST   : Dist = 24.8 m (BALANCED WITH BS!)'
        ],
        explanation: 'คำนวณค่าระดับของจุดเปลี่ยน TP-01 โดย HI - FS และบันทึกค่าระยะทางเพื่อยืนยันว่าระยะ BS (25.0m) และ FS (24.8m) สมดุลกัน',
        qaCheck: 'ผลต่างระยะส่อง BS และ FS ในแต่ละสถานีต้องไม่เกิน 3-5 เมตร'
      }
    ],
    downstreamWorkflow: {
      outputDataFormat: 'ตารางสมุดบันทึกระดับ (Field Leveling Sheet) หรือไฟล์ CSV (Station, BS, IFS, FS, HI, Elevation, Remark)',
      outputDescription: 'ตารางบันทึกค่าสายใย ค่าระดับความสูงของทุกจุด และผลการคำนวณค่าความคลาดเคลื่อนปิดรอบ',
      nextStepTitle: 'การประมวลผลและกระจายค่าแก้ระดับ (Leveling Loop Reduction)',
      nextStepProcedure: 'ป้อนตารางข้อมูลระดับเข้าสู่โมดูลคำนวณระดับของ MESURV เพื่อตรวจเช็คผลรวมหน้ากระดาษ ตรวจสอบค่าคลาดเคลื่อนปิดรอบเทียบกับมาตรฐาน RTSD ชั้น 1, 2, 3 และกระจายค่าแก้ให้แต่ละหมุด',
      recommendedToolTab: 'leveling',
      toolActionLabel: 'เปิดเครื่องมือคำนวณระดับ (Leveling Tool)'
    },
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนแกนเล็งไม่ขนานแนวระดับ (Collimation Error): บรรเทาโดยการรักษาระยะส่องหน้าและส่องหลังให้เท่ากันเสมอ (Balancing Sights)',
      'การทรุดตัวของเต่าเหล็กหรือขากล้อง (Settlement Error): เดินระดับไป-กลับ (Forward and Backward run) และใช้เต่าเหล็กหล่อหนักปักบนพื้นแน่น',
      'การสั่นระริกของไอร้อน (Heat Shimmer & Refraction): หลีกเลี่ยงการอ่านค่าไม้ระดับที่อยู่ต่ำกว่า 0.50 เมตรจากผิวดินหรือถนนลาดยางร้อนจัด',
      'ความคลาดเคลื่อนความเอียงของไม้ระดับ: ติดตั้งลูกน้ำฟองกลมที่ไม้ระดับและตรวจสอบการคาลิเบรตฟองกลมสม่ำเสมอ'
    ],
    formulas: [
      {
        label: 'การคำนวณความคลาดเคลื่อนแกนเล็งในการทดสอบ Two-Peg Test (c-value)',
        formula: 'c = [ (a1 - b1) - (a2 - b2) ] / [ (D_A1 - D_B1) - (D_A2 - D_B2) ]',
        explanation: 'หากค่า c มีขนาดมากกว่า ±0.05 mm/m แสดงว่าแกนเล็งเอียง ต้องปรับหมุนสกรูสายใย'
      },
      {
        label: 'การคำนวณแบบความสูงกล้อง (Height of Instrument Method)',
        formula: 'HI = RL + BS,   RL_next = HI - (FS หรือ IFS)',
        explanation: 'HI = ความสูงระนาบแนวเล็งของกล้อง, RL = Reduced Level (ระดับความสูงเหนือ รทก.)'
      },
      {
        label: 'การคำนวณแบบผลต่างขึ้น-ลง (Rise and Fall Method)',
        formula: 'Diff = Previous_reading - Current_reading  (บวก = Rise, ลบ = Fall)',
        explanation: 'RL_next = RL_previous + Rise (หรือ - Fall)'
      },
      {
        label: 'เกณฑ์ความคลาดเคลื่อนปิดรอบยอมรับได้ตามระยะทาง (RTSD Specifications)',
        formula: 'c_allowable = ± k * sqrt(K)  [มิลลิเมตร]',
        explanation: 'K = ระยะทางไป-กลับรวม (กิโลเมตร), k = 4 (ชั้น 1), 8 (ชั้น 2), 12 (ชั้น 3), 24 (งานวิศวกรรมก่อสร้างทั่วไป)'
      },
      {
        label: 'การตรวจสอบผลรวมหน้ากระดาษ (Arithmetic Page Check)',
        formula: 'Sum(BS) - Sum(FS) = Sum(Rise) - Sum(Fall) = RL_end - RL_start',
        explanation: 'สมการสามส่วนต้องมีค่าเท่ากันทุกประการ หากไม่เท่าแสดงว่ามีการบวกลบเลขผิดในตาราง'
      }
    ]
  },
  {
    id: 'gnss-rtk-cors',
    title: 'การรังวัดสัญญาณดาวเทียม GNSS RTK และโครงข่าย CORS (DOL-CORS / NTRIP)',
    titleEn: 'Multi-Constellation GNSS RTK, Network CORS-NTRIP, Site Calibration & Stake-out',
    category: 'gnss-geodesy',
    categoryName: 'GNSS & Geodesy',
    summary: 'คู่มือภาคสนามครบวงจร: การเชื่อมต่อระบบโครงข่าย CORS กรมที่ดิน (DOL-CORS) ผ่าน NTRIP Protocol, การตั้งค่าคอนโทรลเลอร์ (Controller Setup), เกณฑ์ตรวจสอบคุณภาพค่าพิกัด (Fix vs Float, HRMS, VRMS, PDOP), การแปลงระดับความสูงวงรีเป็นระดับ รทก. ด้วยแบบจำลองจีออยด์ TGM2017, ขั้นตอนการปรับแก้พิกัดท้องที่ (Site Calibration) และการนำทางปักหมุด (Stake-out)',
    badge: 'ระบบพิกัดสากลแบบเรียลไทม์',
    iconName: 'Radio',
    courseRelation: 'การรังวัดดาวเทียมและยีโอเดซี (Satellite Geodesy & GNSS CORS)',
    equipmentRequired: [
      'เครื่องรับสัญญาณดาวเทียม GNSS Receiver ชนิด Multi-Frequency / Multi-Constellation (รองรับ GPS, GLONASS, Galileo, BeiDou)',
      'คอนโทรลเลอร์ภาคสนาม (Survey Controller / Data Collector) ติดตั้งซอฟต์แวร์ เช่น SurvX, LandStar, หรือ Captivate',
      'เสาโพลคาร์บอนไฟเบอร์ 2.00 เมตร พร้อมลูกน้ำฟองกลมและขาหยั่งสองขา (Bipod)',
      'ซิมการ์ด 4G/5G หรือ Wi-Fi Hotspot สำหรับเชื่อมต่ออินเทอร์เน็ตเข้าโครงข่าย NTRIP',
      'บัญชีผู้ใช้งานระบบ DOL-CORS (กรมที่ดิน) หรือ RTSD-CORS (กรมแผนที่ทหาร)'
    ],
    workingPrinciple: [
      'ระบบ GNSS หลายกลุ่มดาวเทียม: รับสัญญาณคลื่นความถี่พร้อมกันจาก GPS (L1/L2/L5), GLONASS (G1/G2/G3), Galileo (E1/E5a/E5b), BeiDou (B1I/B2I/B3I/B1C/B2a) เพิ่มจำนวนดาวเทียมที่มองเห็นได้มากกว่า 30-40 ดวง',
      'Real-Time Kinematic (RTK): รังวัดเฟสของคลื่นส่ง (Carrier Phase) ส่งค่าแก้ผ่านวิทยุ UHF หรืออินเทอร์เน็ต สามารถแก้ความคลุมเครือรอบคลื่น (Integer Ambiguity Resolution) ได้ภายในเวลาไม่กี่วินาที',
      'โครงข่ายสถานีอ้างอิงถาวร (Network CORS / Virtual Reference Station - VRS): เชื่อมโยงสถานีฐานถาวรทั่วประเทศ คำนวณแบบจำลองชั้นบรรยากาศไอโอโนสเฟียร์และโทรโพสเฟียร์ ส่งค่าแก้เสมือนเฉพาะจุดให้เครื่อง Rover ทำให้ความแม่นยำสม่ำเสมอทั่วบริเวณ',
      'การแปลงความสูงวงรี (Ellipsoidal Height: h) เป็นความสูงระดับน้ำทะเลปานกลาง (Orthometric Height: H): ใช้สมการ H = h - N โดยค่า N (Geoid Undulation) ได้จากแบบจำลองจีออยด์ความละเอียดสูงของประเทศไทย (TGM2017)'
    ],
    fieldProcedures: [
      {
        title: 'ขั้นตอนที่ 1: การสำรวจพื้นที่และมุมมองท้องฟ้า (Sky Visibility & Mask Angle)',
        details: 'เลือกพื้นที่เปิดโล่ง ไม่มีสิ่งปลูกสร้างหรือต้นไม้ใหญ่บดบังมุมมองท้องฟ้าเหนือมุมเงย 10-15 องศา (Elevation Mask) อยู่ห่างจากสายส่งไฟฟ้าแรงสูงและกำแพงอาคารกระจกสะท้อนคลื่น'
      },
      {
        title: 'ขั้นตอนที่ 2: การสร้างโครงการและเลือกระบบพิกัด (Job & Coordinate System)',
        details: 'เปิดคอนโทรลเลอร์ สร้างงานใหม่ เลือกระบบพิกัด WGS84 UTM Zone 47N หรือ 48N เลือกแบบจำลอง Geoid Model เป็น TGM2017.ggf เพื่อให้ได้ค่าระดับความสูง รทก. โดยอัตโนมัติ'
      },
      {
        title: 'ขั้นตอนที่ 3: การเชื่อมต่อโมเด็มและ NTRIP Caster',
        details: 'เชื่อมต่อบลูทูธระหว่างคอนโทรลเลอร์กับเครื่องรับ GNSS เข้าเมนู Rover Data Link เลือกแบบ Phone/Internal Cellular ป้อน Caster IP, Port (เช่น 2101), Username, Password และดาวน์โหลด Source Table เลือก Mountpoint (เช่น VRS_RTCM32 หรือ AUTO_VRS)'
      },
      {
        title: 'ขั้นตอนที่ 4: การตรวจสอบสถานะ Fix และคุณภาพสัญญาณ (QA/QC Check)',
        details: 'รอจนกระทั่งสถานะเปลี่ยนเป็น "FIXED" สีเขียว ตรวจสอบค่าเรขาคณิตของดาวเทียม PDOP < 2.0, จำนวนดาวเทียมที่ใช้ประมวลผล ≥ 20 ดวง, ค่าความคลาดเคลื่อนทางราบ HRMS ≤ 15 มม., และค่าความคลาดเคลื่อนทางดิ่ง VRMS ≤ 25 มม.'
      },
      {
        title: 'ขั้นตอนที่ 5: การรังวัดตรวจสอบหมุดควบคุมเดิม (Check-in On Known Benchmark)',
        details: 'ก่อนเริ่มงานทุกวัน ต้องนำเสาโพลไปวางบนหมุดควบคุมที่ทราบพิกัดแน่นอน (Check Point) รังวัดแบบเฉลี่ย 30-60 วินาที ตรวจสอบผลต่างพิกัด dN, dE ต้องไม่เกิน 2 เซนติเมตร เพื่อยืนยันว่าระบบ CORS และ Geoid โมเดลทำงานถูกต้องสมบูรณ์'
      },
      {
        title: 'ขั้นตอนที่ 6: การปรับแก้พิกัดท้องที่ (Site Calibration / Localization)',
        details: 'ในกรณีงานก่อสร้างที่ใช้ระบบพิกัดเฉพาะโครงการ ให้รังวัดหมุดควบคุมโครงการอย่างน้อย 3-4 จุดรอบพื้นที่ แล้วสั่งรันคำนวณ Site Calibration ในคอนโทรลเลอร์เพื่อหาค่าพารามิเตอร์ 7 Parameters ปรับหมุนและยืดสเกลพิกัดเข้ากับกริดโครงการ'
      }
    ],
    deviceWorkflow: [
      {
        stepNumber: 1,
        stageName: 'การเชื่อมต่อระบบโครงข่าย CORS กรมที่ดิน',
        targetHardware: 'Field Controller (SurvX / LandStar / Captivate)',
        buttonKey: '[DEVICE] -> [ROVER] -> [DATA LINK: NETWORK] -> [NTRIP]',
        actionLabel: 'เลือกโหมด Rover แบบ Network NTRIP แล้วกดเชื่อมต่อ Caster',
        screenTitle: 'NTRIP CASTER CONFIGURATION',
        screenLines: [
          'SERVER IP   : 103.22.180.xxx (DOL-CORS Caster)',
          'PORT        : 2101',
          'MOUNTPOINT  : VRS_RTCM32 (Multi-System)',
          'USER / PASS : ********** (Authorized)',
          'SEND NMEA   : ENABLED (GGA 1Hz to Server)',
          'STATUS      : CONNECTED & RECEIVING DATA (1.2 kb/s)'
        ],
        explanation: 'ต้องเปิดคำสั่ง Send NMEA เพื่อให้คอนโทรลเลอร์ส่งพิกัดคร่าวๆ ไปยัง Caster เพื่อให้เซิร์ฟเวอร์ CORS สร้างสถานีเสมือน (VRS) ณ จุดที่เครื่องรับกำลังยืนอยู่',
        qaCheck: 'สังเกตไฟสัญญาณ Data Rx บนหัวกล้อง GNSS กะพริบเป็นจังหวะสม่ำเสมอ'
      },
      {
        stepNumber: 2,
        stageName: 'การตรวจสอบสถานะและเกณฑ์คุณภาพพิกัด (Fix & HRMS)',
        targetHardware: 'Controller Survey Screen',
        buttonKey: '[SURVEY] -> [POINT MEASUREMENT]',
        actionLabel: 'ดูแถบสถานะด้านบนของหน้าจอรังวัด',
        screenTitle: 'GNSS ROVER REAL-TIME TELEMETRY',
        screenLines: [
          'STATUS : FIXED (Carrier Phase Solved)',
          'SATS   : 34 Tracking / 28 Used in Engine',
          'PDOP   : 1.35  (Excellent Geometry)',
          'HRMS   : 0.008 m  (Horizontal Precision: 8 mm)',
          'VRMS   : 0.014 m  (Vertical Precision: 14 mm)',
          'AGE    : 1.0 sec  (Correction Latency)',
          'ANT.HT : 2.000 m  (Carbon Pole Height)'
        ],
        explanation: 'ห้ามบันทึกจุดพิกัดในขณะที่สถานะขึ้นเป็น "FLOAT" หรือ "AUTONOMOUS/SINGLE" โดยเด็ดขาด เพราะค่าพิกัดอาจคลาดเคลื่อนตั้งแต่หลายสิบเซนติเมตรจนถึงหลายเมตร',
        qaCheck: 'ค่า HRMS ต้อง ≤ 0.015 m, VRMS ต้อง ≤ 0.025 m, และ Age of Correction ต้องไม่เกิน 2-3 วินาที'
      },
      {
        stepNumber: 3,
        stageName: 'การรังวัดเก็บจุดและการวางตำแหน่ง (Measure & Stake-out)',
        targetHardware: 'Controller Survey Screen',
        buttonKey: '[MEASURE] (หรือกดปุ่มบนเสาโพล) / [STAKEOUT]',
        actionLabel: 'บันทึกจุดด้วยการเฉลี่ยค่า หรือเลือกฟังก์ชันนำทางปักหมุด',
        screenTitle: 'STAKEOUT POINT NAVIGATION',
        screenLines: [
          'TARGET PT: P-102 (Boundary Corner)',
          'DESIGN N : 1530650.000 m, E: 672400.000 m',
          '--- NAVIGATION VECTOR ---',
          'MOVE NORTH : 1.450 m',
          'MOVE EAST  : 0.220 m',
          'FILL / CUT : CUT -0.150 m',
          'STATUS     : IN TOLERANCE (dHD = 0.008 m) -> DIG PIN!'
        ],
        explanation: 'หน้าจอจะแสดงเข็มทิศและระยะทางที่ต้องก้าวเดินไปยังหมุด เมื่อเข้าใกล้เป้าหมาย วงกลมเป้าจะขยายใหญ่ขึ้นเพื่อให้นำปลายเสาโพลแตะลงกึ่งกลางจุดได้อย่างแม่นยำ',
        qaCheck: 'ตรวจดูฟองกลมบนเสาโพลคาร์บอนให้ตรงกลางสนิทก่อนสั่งตอกหมุดจริง'
      }
    ],
    downstreamWorkflow: {
      outputDataFormat: 'ไฟล์ CSV/Excel (PointID, Northing, Easting, Orthometric_Height, Code, HRMS, VRMS, Satellites, FixStatus)',
      outputDescription: 'ตารางพิกัด 3 มิติในระบบ UTM WGS84 พร้อมค่าระดับความสูง รทก. และบันทึกค่าความคลาดเคลื่อนของทุกจุด',
      nextStepTitle: 'การนำเข้าพิกัดสู่ CAD หรือการแปลงระบบพิกัด',
      nextStepProcedure: 'นำไฟล์ CSV เข้าสู่โปรแกรม AutoCAD, Civil 3D หรือโมดูล Coordinate Converter ของ MESURV เพื่อแปลงพิกัดระหว่าง WGS84 และ Indian 1975 ตามที่หน่วยงานราชการกำหนด',
      recommendedToolTab: 'converter',
      toolActionLabel: 'เปิดเครื่องมือแปลงพิกัด (Coordinate Tool)'
    },
    errorSourcesAndMitigation: [
      'สัญญาณสะท้อนหลายทิศทาง (Multipath): เกิดจากคลื่นดาวเทียมสะท้อนผิวน้ำ หลังคาสังกะสี กำแพงกระจก แก้ไขโดยใช้เสาอากาศชนิด Helix หรือเคลื่อนย้ายออกจากแนวกำแพง',
      'การรบกวนของชั้นบรรยากาศไอโอโนสเฟียร์ช่วงพายุสุริยะ (Ionospheric Scintillation): สังเกตค่า Age of correction พุ่งสูงและหลุด Fix บ่อยครั้ง ควรหยุดการรังวัดชั่วคราว',
      'ความสูงเสาโพลผิดพลาด: ผู้ช่วยสำรวจปรับยืดเสาโพลเป็น 2.15 ม. แต่ไม่ได้แก้ในคอนโทรลเลอร์ ส่งผลให้ค่าระดับเพี้ยน 15 ซม. ทุกจุด ต้องตรวจสอบความสูงเสาทุกครั้งก่อนเริ่มงาน',
      'การเอนเอียงของเสาโพล: แนะนำให้เปิดใช้งานเซนเซอร์ชดเชยการเอียง IMU Tilt Compensation (ซึ่งรองรับการเอียงเสาได้ถึง 30-60° โดยยังคงความแม่นยำ 2 ซม.)'
    ],
    formulas: [
      {
        label: 'ความสัมพันธ์ระหว่างระดับความสูงน้ำทะเลปานกลางกับความสูงวงรี',
        formula: 'H = h - N',
        explanation: 'H = Orthometric Height (ระดับความสูง รทก.), h = Ellipsoidal Height จาก GNSS, N = Geoid Undulation จากโมเดล TGM2017'
      },
      {
        label: 'ดัชนีเรขาคณิตของตำแหน่งดาวเทียม (Position Dilution of Precision: PDOP)',
        formula: 'PDOP = sqrt( sigma_x^2 + sigma_y^2 + sigma_z^2 ) / sigma_range',
        explanation: 'ค่า PDOP ยิ่งต่ำ แสดงว่าดาวเทียมกระจายตัวดี (เกณฑ์คุณภาพสูง: PDOP < 2.0)'
      }
    ]
  },
  {
    id: 'gnss-static-geodesy',
    title: 'การรังวัดดาวเทียมแบบสถิตความแม่นยำสูง (Static GNSS Geodesy)',
    titleEn: 'High-Precision Geodetic Static Surveying, RINEX 3.0, Baseline Vectors & Network Adjustment',
    category: 'gnss-geodesy',
    categoryName: 'GNSS & Geodesy',
    summary: 'คู่มือการสร้างโครงข่ายหมุดควบคุมหลักฐานระดับมิลลิเมตร (Geodetic Control Network): การวางแผนเซสชันการรังวัด (Observation Session Planning), การตั้งดิ่งและวัดความสูงเสาอากาศ 3 ทิศทาง, การบันทึกไฟล์ข้อมูลดิบ RINEX, สูตรคำนวณระยะเวลาแช่สัญญาณขั้นต่ำ, และการประมวลผลเวกเตอร์ฐานร่วมกับข้อมูลวงโคจรแม่นยำ (Precise Ephemeris SP3) และการปรับแก้โครงข่าย Least Squares',
    badge: 'งานโครงข่ายระดับมิลลิเมตร',
    iconName: 'Radio',
    courseRelation: 'การปรับแก้โครงข่ายยีโอเดซี (Geodetic Network Adjustment & Least Squares)',
    equipmentRequired: [
      'เครื่องรับสัญญาณ Geodetic GNSS Receiver ชนิดความถี่คู่/หลายความถี่ (Dual/Multi-Frequency)',
      'ฐานกล้องและอุปกรณ์ตั้งดิ่งสายตา (Tribrach with Optical Plummet) ที่ผ่านการคาลิเบรตฟองยาว',
      'ขาตั้งกล้องไม้เนื้อแข็งชนิดหนัก (Heavy-Duty Wooden Tripod) ป้องกันการขยายตัวจากความร้อน',
      'ตลับเมตรวัดความสูงเสาอากาศชนิดพิเศษพร้อมแถบระบุความสูง Slant/Vertical',
      'สมุดบันทึกประวัติสถานีรังวัดดาวเทียม (GNSS Station Logsheet)'
    ],
    workingPrinciple: [
      'Static GNSS คือวิธีรังวัดที่มีความแม่นยำสูงสุดในงานวิศวกรรมสำรวจ (ความละเอียดระดับ 1-3 มิลลิเมตร) โดยการตั้งเครื่องรับสัญญาณนิ่งอยู่บนหมุดควบคุม 2 สถานีขึ้นไปพร้อมกันเป็นเวลานาน (30 นาที ถึงหลายชั่วโมง)',
      'บันทึกข้อมูลคลื่นส่งดิบ (Raw Carrier Phase Data & Pseudorange) ลงในหน่วยความจำโดยไม่มีการส่งค่าแก้แบบเรียลไทม์ เพื่อนำมาประมวลผลย้อนหลัง (Post-Processing)',
      'การประมวลผลผลต่างสองชั้น (Double-Differencing): หักล้างความคลาดเคลื่อนของนาฬิกาดาวเทียม (Satellite Clock Error) และนาฬิกาเครื่องรับ (Receiver Clock Error) ได้อย่างสมบูรณ์',
      'การใช้ข้อมูลวงโคจรแม่นยำ (IGS Precise Ephemeris .sp3): ดาวน์โหลดตำแหน่งวงโคจรจริงของดาวเทียมที่มีความคลาดเคลื่อนต่ำกว่า 2 เซนติเมตร แทนข้อมูล Broadcast จากดาวเทียม',
      'การปรับแก้โครงข่ายแบบ Minimal และ Fully Constrained: ปรับแก้เวกเตอร์ฐานทั้งหมดพร้อมกันด้วย Least Squares เพื่อกระจายความคลาดเคลื่อนและคำนวณวงรีความคลาดเคลื่อน 95% (Error Ellipse)'
    ],
    fieldProcedures: [
      {
        title: 'ขั้นตอนที่ 1: การวางแผนโครงข่ายและเซสชัน (Network Design & Session Schedule)',
        details: 'ออกแบบโครงข่ายหมุดควบคุมให้เป็นรูปสามเหลี่ยมที่ปิดรอบสมบูรณ์ กำหนดให้มีเครื่องรับสัญญาณรังวัดพร้อมกันอย่างน้อย 3 เครื่องในแต่ละเซสชัน เพื่อให้เกิดเวกเตอร์ฐานอิสระ (Independent Baselines) และมีหมุดควบคุมเดิมร่วมอยู่ในเซสชันอย่างน้อย 2 จุด'
      },
      {
        title: 'ขั้นตอนที่ 2: การตั้งดิ่ง Tribrach และวัดความสูงเสาอากาศ (Antenna Measurement)',
        details: 'ขันยึด Tribrach บนหัวขาตั้ง ปรับระดับฟองยาวและส่องดิ่งสายตาลงตรงกึ่งกลางหมุดอย่างประณีต ขันยึดเสาอากาศ GNSS วัดความสูงเสาอากาศ 3 ตำแหน่งรอบตัวเสาอากาศ (ทำมุมห่างกัน 120°) บันทึกว่าวัดเป็นความสูงตรง (True Vertical) หรือความสูงเอียง (Slant to ARP/BRP) ค่าเฉลี่ยทั้งสามด้านต้องต่างกันไม่เกิน 1 มิลลิเมตร'
      },
      {
        title: 'ขั้นตอนที่ 3: การตั้งค่าพารามิเตอร์การบันทึกข้อมูล (Receiver Logging Parameters)',
        details: 'เปิดเครื่องรับ ตั้ง Sampling Rate (Sampling Interval) เช่น 5 วินาที หรือ 15 วินาที, ตั้ง Elevation Mask Cutoff ไว้ที่ 10° หรือ 15°, ป้อนรหัสหมุด 4 ตัวอักษร (เช่น KU01) และความสูงเสาอากาศลงในเครื่องรับ'
      },
      {
        title: 'ขั้นตอนที่ 4: การแช่รังวัดตามเกณฑ์ระยะเวลา (Session Duration Execution)',
        details: 'เริ่มเซสชันพร้อมกันตามเวลากำหนด คำนวณระยะเวลาขั้นต่ำ: 30 นาที + (1 ถึง 2 นาที x ระยะทางเวกเตอร์ฐานเป็นกิโลเมตร) เช่น เส้นฐานยาว 15 กม. ต้องรังวัดไม่น้อยกว่า 45-60 นาที บันทึกสภาพอากาศ เมฆ ลม ลงใน Logsheet'
      },
      {
        title: 'ขั้นตอนที่ 5: การตรวจสอบคุณภาพข้อมูล RINEX และการประมวลผล',
        details: 'ดาวน์โหลดไฟล์ดิบ แปลงเป็นไฟล์มาตรฐาน RINEX 3.0x ตรวจสอบความสมบูรณ์ของข้อมูล (> 95%), ตรวจสอบ Cycle Slips และนำเข้าซอฟต์แวร์ประมวลผล (เช่น TBC, Leica Infinity หรือ Bernese)'
      }
    ],
    deviceWorkflow: [
      {
        stepNumber: 1,
        stageName: 'การตั้งค่าบันทึกไฟล์สถิตในเครื่องรับ',
        targetHardware: 'Geodetic GNSS Receiver WebUI / App',
        buttonKey: '[STATIC CONFIG] -> [LOGGING INTERVAL: 5s] -> [MASK: 15°]',
        actionLabel: 'ตั้งค่าพารามิเตอร์การบันทึกข้อมูลดิบ',
        screenTitle: 'STATIC SESSION SETUP',
        screenLines: [
          'SITE ID       : MR-01 (Primary Geodetic Pin)',
          'LOG INTERVAL  : 5 Seconds',
          'ELEVATION MASK: 15 Degrees',
          'CONSTELLATIONS: GPS + GLO + GAL + BDS',
          'FILE FORMAT   : RAW (.T02 / .M00 / RINEX 3.04)',
          'ANTENNA TYPE  : CHC_C220GR_NONE (Auto Calibrated)',
          'MEASURE HEIGHT: SLANT TO NOTCH = 1.485 m'
        ],
        explanation: 'ประเภทเสาอากาศ (Antenna Type) มีความสำคัญสูงสุด เนื่องจากซอฟต์แวร์ต้องดึงไฟล์ Antenna Calibration Model (.atx) มาหักล้างระยะเยื้องศูนย์กลางเฟส (Phase Center Offset: PCO/PCV)',
        qaCheck: 'ตรวจดูพื้นที่จัดเก็บข้อมูลใน Internal Memory ว่าเพียงพอสำหรับบันทึกไฟล์'
      },
      {
        stepNumber: 2,
        stageName: 'การตรวจสอบสถานะการรับสัญญาณระหว่างเซสชัน',
        targetHardware: 'Receiver Front Panel LEDs / Bluetooth App',
        buttonKey: '[STATUS] -> [SATELLITES & SNR]',
        actionLabel: 'ตรวจดูความต่อเนื่องของสัญญาณและไฟบันทึกข้อมูล',
        screenTitle: 'ACTIVE STATIC OBSERVATION MONITOR',
        screenLines: [
          'RECORDING TIME : 01 hr 15 min 20 sec',
          'SATELLITES IN VIEW: 32 (GPS: 9, GLO: 7, GAL: 6, BDS: 10)',
          'AVERAGE SNR   : 44.5 dB-Hz (Strong Signal)',
          'CYCLE SLIPS   : 0 Detected',
          'BATTERY LEVEL : 82% (Remaining: 6.5 hrs)',
          'STATUS        : OK - MAINTAIN STATIONARY'
        ],
        explanation: 'ระหว่างรังวัด ห้ามเดินชนขากล้อง ห้ามจอดรถหรือวางวัตถุบดบังเสาอากาศโดยเด็ดขาด',
        qaCheck: 'ไฟบันทึกข้อมูล (Log LED) ต้องกะพริบทุกๆ 5 วินาทีตามอัตราการบันทึก'
      }
    ],
    downstreamWorkflow: {
      outputDataFormat: 'ไฟล์ข้อมูลสังเกตการณ์ดิบ RINEX Observation (.rnx / .yyO) และไฟล์นำทาง (.yyN)',
      outputDescription: 'ชุดข้อมูลคลื่นส่งแบบดิบที่พร้อมนำเข้าซอฟต์แวร์ประมวลผลเส้นฐานร่วมกับสถานี CORS และไฟล์ SP3',
      nextStepTitle: 'การประมวลผลเส้นฐานและการปรับแก้โครงข่าย (Baseline & Network Adjustment)',
      nextStepProcedure: 'ส่งไฟล์เข้าประมวลผลร่วมกับสถานี CORS อ้างอิง รันการปรับแก้ Least Squares เพื่อให้ได้พิกัดหมุดควบคุมที่มีความแม่นยำสูงระดับมิลลิเมตร นำไปใช้เป็นหมุดอ้างอิงของโครงการต่อไป',
      recommendedToolTab: 'converter',
      toolActionLabel: 'เปิดเครื่องมือแปลงระบบพิกัด (Coordinate Tool)'
    },
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนศูนย์กลางเฟสของเสาอากาศ (Antenna Phase Center Variation: PCV): ใช้เสาอากาศที่มีการสอบเทียบมาตรฐาน IGS (.atx model) และหันเครื่องหมายลูกศรชี้ทิศเหนือของเสาอากาศไปทางทิศเหนือจริงเสมอ',
      'ความคลาดเคลื่อนการวัดความสูงเสาอากาศ: วัดความสูง 3 จุดรอบเสาอากาศ บันทึกภาพถ่ายตลับเมตร และคำนวณแปลงความสูงเอียงเป็นความสูงตรง (Vertical Height) ตามโครงสร้างเรขาคณิตของเสาอากาศ',
      'วงโคจรดาวเทียมคลาดเคลื่อน: รออย่างน้อย 1-2 สัปดาห์เพื่อดาวน์โหลดไฟล์ IGS Final Orbit (.sp3) ซึ่งมีความถูกต้องสูงกว่า Broadcast Ephemeris หลายเท่า'
    ],
    formulas: [
      {
        label: 'สูตรประเมินเวลาการรังวัดขั้นต่ำตามความยาวเส้นฐาน (Empirical Duration Formula)',
        formula: 'Duration (min) = 30 + (1 to 2) * Baseline_Length (km)',
        explanation: 'เช่น เส้นฐานยาว 20 กม. ควรรังวัดไม่น้อยกว่า 30 + (1.5 * 20) = 60 นาที'
      },
      {
        label: 'การแปลงความสูงเอียงเสาอากาศเป็นความสูงตรง (Slant to Vertical Reduction)',
        formula: 'H_vert = sqrt( H_slant^2 - R_antenna^2 ) - dH_offset',
        explanation: 'R_antenna = รัศมีของจานเสาอากาศจากแกนกลางถึงขอบวัด, dH_offset = ระยะดิ่งจากขอบวัดถึง Phase Center'
      }
    ]
  },
  {
    id: 'uav-drone-photogrammetry',
    title: 'การสำรวจรังวัดด้วยโดรน UAV โฟโตแกรมเมตรี (UAV Photogrammetry & SfM)',
    titleEn: 'Drone Aerial Survey, Flight Mission Planning, GSD Calculation, GCP Target Strategy & SfM',
    category: 'drone-photogrammetry',
    categoryName: 'Drone & Photogrammetry',
    summary: 'คู่มือการบินถ่ายภาพทางอากาศเพื่องานแผนที่วิศวกรรม: การคำนวณ Ground Sampling Distance (GSD), การวางแผนเส้นทางบิน Grid & Double Grid, เกณฑ์การซ้อนทับของภาพ (Forward & Side Overlap), การวางและกระจายหมุดควบคุมภาคพื้นดิน (GCPs & Checkpoints), กระบวนการประมวลผล Structure from Motion (SfM) และการตรวจสอบความถูกต้องทางตำแหน่ง (RMSE QA/QC)',
    badge: 'การสำรวจทางอากาศความละเอียดสูง',
    iconName: 'Camera',
    courseRelation: 'การสำรวจด้วยภาพถ่ายและรีโมตเซนซิง (Photogrammetry & Remote Sensing)',
    equipmentRequired: [
      'อากาศยานไร้คนขับ (UAV Drone) พร้อมกล้อง Mechanical Shutter ความละเอียดสูง (เช่น DJI Mavic 3 Enterprise หรือ Phantom 4 RTK)',
      'ชุดเป้าควบคุมภาพถ่ายภาคพื้นดิน (GCP Targets) แผ่นตารางหมากรุกขาว-ดำ ขนาด 40x40 ซม. ขึ้นไป',
      'เครื่องรับสัญญาณ GNSS RTK สำหรับรังวัดพิกัดจุดกึ่งกลางเป้า GCP',
      'คอนโทรลเลอร์ควบคุมการบินพร้อมแอปพลิเคชันวางแผนเส้นทางบิน (DJI Pilot 2 / UgCS / Mission Planner)',
      'คอมพิวเตอร์ประมวลผลกราฟิกสูงสำหรับรันซอฟต์แวร์ SfM (DJI Terra, Agisoft Metashape, หรือ Pix4D)'
    ],
    workingPrinciple: [
      'Structure from Motion (SfM): อัลกอริทึมคอมพิวเตอร์วิทัศน์ที่ตรวจจับจุดเอกลักษณ์ (Feature Points / Keypoints) ที่ปรากฏร่วมกันในภาพถ่ายหลายๆ มุมมอง แล้วคำนวณหาตำแหน่งและทิศทางของกล้อง (Camera Exterior Orientation) พร้อมสร้างแบบจำลองกลุ่มหมอกจุด 3 มิติ (Sparse & Dense Point Cloud)',
      'Ground Sampling Distance (GSD): ขนาดของพื้นที่จริงบนพื้นดินที่แทนด้วย 1 พิกเซลในภาพถ่าย ยิ่งบินต่ำ ค่า GSD ยิ่งละเอียด (เช่น GSD 2 ซม./พิกเซล)',
      'การซ้อนทับของภาพถ่าย (Overlap): ภาพถ่ายต้องมีความซ้อนทับตามแนวบิน (Forward Overlap) ≥ 75-80% และระหว่างแนวบิน (Side Overlap) ≥ 65-70% เพื่อให้จุดเอกลักษณ์เดียวกันปรากฏอยู่ในภาพอย่างน้อย 5-9 ภาพขึ้นไป',
      'หมุดควบคุมภาคพื้นดิน (GCPs): ทำหน้าที่ตรึงแบบจำลองภาพถ่าย 3 มิติเข้ากับระบบพิกัดกริดแผนที่จริง และกำจัดความบิดเบี้ยวของโมเดล (Bowling Effect / Scale Errors)',
      'หมุดตรวจสอบความถูกต้อง (Checkpoints): หมุดที่รังวัดพิกัดจริงด้วย GNSS แต่ไม่ได้นำเข้าปรับแก้โมเดล เพื่อใช้ทดสอบและประเมินค่า RMSE ทางราบและทางดิ่งอย่างเป็นอิสระ'
    ],
    fieldProcedures: [
      {
        title: 'ขั้นตอนที่ 1: การกำหนดค่าความละเอียด GSD และคำนวณความสูงบิน (Flight Altitude)',
        details: 'คำนวณความสูงการบินจากสเปกกล้องและค่า GSD ที่ต้องการตามข้อกำหนดของงาน เช่น แผนที่มาตราส่วน 1:1,000 กำหนดให้ GSD ≤ 3 ซม./พิกเซล เมื่อใช้กล้อง Focal length 24 มม. เซนเซอร์ Micro 4/3 จะคำนวณความสูงบินได้ประมาณ 80-100 เมตร'
      },
      {
        title: 'ขั้นตอนที่ 2: การวางและรังวัดหมุดควบคุม GCPs & Checkpoints',
        details: 'ติดตั้งเป้าตารางหมากรุกกระจายให้ทั่วพื้นที่ โดยเน้นบริเวณขอบเขตแปลง มุมแปลง และกึ่งกลางพื้นที่ อย่างน้อย 5-8 จุดสำหรับพื้นที่ 50-100 ไร่ และแบ่งเป้า 20-30% ไว้เป็น Checkpoints ใช้เครื่อง GNSS RTK รังวัดพิกัดตรงจุดตัดกึ่งกลางเป้าอย่างประณีต'
      },
      {
        title: 'ขั้นตอนที่ 3: การตั้งค่าพารามิเตอร์การบินในแอปพลิเคชัน',
        details: 'เปิดแอป DJI Pilot 2 สร้างภารกิจแบบ Mapping / Area Route กำหนด Forward Overlap = 80%, Side Overlap = 70%, เลือกความเร็วบินที่เหมาะสม ตั้งค่าชัตเตอร์เร็ว (Shutter Speed ≥ 1/1000s) ปิด Auto-Focus ล็อคโฟกัสที่ระยะอนันต์'
      },
      {
        title: 'ขั้นตอนที่ 4: การตรวจสอบความปลอดภัยก่อนบิน (Pre-Flight Safety Check)',
        details: 'ตรวจสอบสภาพอากาศ ความเร็วลม (< 8 m/s) ระดับดาวเทียม GNSS ของโดรน (> 18 ดวง) ตรวจสอบความสูงสิ่งกีดขวาง (ต้นไม้ เสาไฟฟ้า) และตั้งค่า Go-Home Altitude ให้สูงพ้นสิ่งกีดขวางสูงสุดในพื้นที่'
      },
      {
        title: 'ขั้นตอนที่ 5: การประมวลผลและจัดทำรายงานความถูกต้อง (Quality Report Review)',
        details: 'นำภาพถ่ายและพิกัด GCP เข้าซอฟต์แวร์ SfM ทำการ Step 1: Align Photos, Step 2: Import GCPs & Optimize Cameras, Step 3: Build Dense Cloud, DEM & Orthomosaic ตรวจสอบรายงาน Quality Report: Reprojection Error ต้อง < 1 pixel และค่า RMSE Checkpoints ต้องผ่านเกณฑ์'
      }
    ],
    deviceWorkflow: [
      {
        stepNumber: 1,
        stageName: 'การวางแผนเส้นทางบินในคอนโทรลเลอร์',
        targetHardware: 'DJI Pilot 2 / UgCS Screen',
        buttonKey: '[MISSION FLIGHT] -> [AREA ROUTE] -> [DRAW POLYGON]',
        actionLabel: 'วาดขอบเขตพื้นที่สำรวจบนแผนที่ และกำหนดพารามิเตอร์การบิน',
        screenTitle: 'FLIGHT MISSION PARAMETERS',
        screenLines: [
          'FLIGHT ALTITUDE : 95.0 m AGL',
          'TARGET GSD      : 2.3 cm/pixel',
          'OVERLAP (FRONT) : 80%',
          'OVERLAP (SIDE)  : 70%',
          'FLIGHT SPEED    : 6.5 m/s',
          'CAMERA SHUTTER  : 1/1250s, ISO 100',
          'ESTIMATED PHOTOS: 342 Images (2 Batteries)',
          '[F1: READY] -> UPLOAD MISSION TO DRONE'
        ],
        explanation: 'การตั้งค่า Overlap 80/70 เป็นมาตรฐานทองคำสำหรับงานวิศวกรรม หากพื้นที่เป็นป่าไม้หนาแน่นควรเพิ่มเป็น 85/80',
        qaCheck: 'ตรวจดูว่าแนวบินมีพื้นที่ครอบคลุมเลยขอบเขตแปลงออกไปอย่างน้อย 1-2 แนวบิน (Buffer Zone)'
      },
      {
        stepNumber: 2,
        stageName: 'การประมวลผลและการตรึงพิกัด GCP ในซอฟต์แวร์ SfM',
        targetHardware: 'Photogrammetry Processing Workstation',
        buttonKey: '[ALIGN PHOTOS] -> [IMPORT GCPs] -> [MARK TARGETS] -> [OPTIMIZE]',
        actionLabel: 'นำภาพและพิกัดเป้าเข้าสู่โปรแกรม ตรวจสอบการจับคู่จุด',
        screenTitle: 'SfM BUNDLE ADJUSTMENT & QA/QC',
        screenLines: [
          'PHOTOS ALIGNED : 342 / 342 (100% Success)',
          'TIE POINTS     : 142,500 Features',
          'REPROJ ERROR   : 0.65 pixel  (< 1.0 px: PASS)',
          '--- CHECKPOINT ACCURACY (RMSE) ---',
          'RMSE X (EAST)  : 0.021 m',
          'RMSE Y (NORTH) : 0.018 m',
          'RMSE Z (ELEV)  : 0.035 m',
          'TOTAL RMSE XY  : 0.028 m  (< 1.5x GSD: PASS)',
          '[EXPORT] -> TRUE ORTHOMOSAIC & 3D POINT CLOUD'
        ],
        explanation: 'ค่าความคลาดเคลื่อนที่หมุด Checkpoints สะท้อนถึงความถูกต้องจริงของแผนที่ หาก RMSE XY ต่ำกว่า 1.5 เท่าของ GSD ถือว่าผ่านเกณฑ์มาตรฐานสากล ASPRS',
        qaCheck: 'ตรวจดูว่าไม่มีหมุด GCP ใดถูกมาร์กผิดตำแหน่งในภาพถ่าย'
      }
    ],
    downstreamWorkflow: {
      outputDataFormat: 'ภาพออร์โธโฟโตแบบมีพิกัดภูมิศาสตร์ (GeoTIFF Orthomosaic), แบบจำลองระดับเชิงเลข (DEM/DSM), และพอยต์คลาวด์ LAS/LAZ',
      outputDescription: 'ไฟล์แผนที่ภาพถ่ายความละเอียดสูงและโมเดลความสูงภูมิประเทศ 3 มิติ',
      nextStepTitle: 'การสร้างเส้นชั้นความสูงและการเขียนแบบผัง (CAD & GIS Mapping)',
      nextStepProcedure: 'นำเข้าภาพ GeoTIFF และ DEM เข้าสู่โปรแกรม Civil 3D เพื่อสร้างผิวภูมิประเทศ (Surface), ลากเส้นชั้นความสูง (Contour Lines), คำนวณปริมาตรดินตัด-ดินถม (Cut & Fill Volume) หรือเปิดตรวจสอบบน WebMap ของ MESURV',
      recommendedToolTab: 'map',
      toolActionLabel: 'เปิดเครื่องมือแผนที่ดาวเทียม (WebMap Tool)'
    },
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนจาก Electronic Rolling Shutter: โดรนราคาถูกที่ใช้ชัตเตอร์อิเล็กทรอนิกส์จะเกิดภาพบิดเบี้ยวเมื่อบินเร็ว ควรเลือกใช้โดรนที่มี Mechanical Global Shutter',
      'การกระจายตัวของเป้า GCP ไม่สม่ำเสมอ: การวางเป้าเฉพาะตรงกลางจะทำให้ขอบแผนที่โก่งตัวขึ้นรูปกระทะ (Bowling Effect) ต้องวางเป้าล้อมรอบขอบแปลงเสมอ',
      'ภาพเบลอจากการเคลื่อนไหว (Motion Blur): ตั้งค่าความเร็วชัตเตอร์ไม่ต่ำกว่า 1/800s หรือ 1/1000s เสมอ',
      'เงาและแสงสะท้อนจ้า: หลีกเลี่ยงการบินเวลาเที่ยงแดดจัดจัดที่คอนทราสต์แสงจ้าเกินไป ควรบินช่วงเช้า 9:00-11:00 หรือบ่าย 14:00-16:00'
    ],
    formulas: [
      {
        label: 'การคำนวณ Ground Sampling Distance (GSD)',
        formula: 'GSD = ( H * Sw ) / ( F * Iw )',
        explanation: 'H = ความสูงบินเหนือพื้นดิน (m), Sw = ความกว้างเซนเซอร์ (mm), F = ความยาวโฟกัสเลนส์ (mm), Iw = ความกว้างภาพ (pixels)'
      },
      {
        label: 'การคำนวณความคลาดเคลื่อนกำลังสองเฉลี่ย (Root Mean Square Error: RMSE)',
        formula: 'RMSE = sqrt( sum( (Coord_model - Coord_surveyed)^2 ) / N )',
        explanation: 'ดัชนีชี้วัดความถูกต้องของโมเดลเทียบกับพิกัดจริงที่วัดด้วย GNSS'
      }
    ]
  },
  {
    id: 'lidar-scan-to-bim-qaqc',
    title: 'การสำรวจสแกน 3 มิติและโมบายล์ SLAM (3D Terrestrial & SLAM LiDAR)',
    titleEn: 'Terrestrial & Mobile SLAM LiDAR, Point Cloud Registration & Scan-to-BIM QA/QC',
    category: 'lidar-scan-bim',
    categoryName: 'LiDAR & Scan-to-BIM',
    summary: 'คู่มือเทคโนโลยีสแกนเลเซอร์ 3 มิติ: เครื่องสแกนตั้งขากล้อง (TLS) และเครื่องมือถือเดินสแกน (Mobile Handheld SLAM), การต่อเชื่อมภาพสแกนหลายสถานี (Registration), การตรึงพิกัดโครงข่ายด้วยเป้า Checkerboard, กฎการเดินปิดลูปเพื่อขจัด Drift ของ IMU และกระบวนการตรวจสอบความคลาดเคลื่อน As-Built เทียบกับโมเดล BIM (Scan-to-BIM Deviation Heatmap)',
    badge: 'เทคโนโลยี 3D สแกนระดับวิศวกรรม',
    iconName: 'Boxes',
    courseRelation: 'โครงงานวิศวกรรมสำรวจขั้นสูงและเทคโนโลยี BIM (Advanced Geomatics & Scan-to-BIM)',
    equipmentRequired: [
      'เครื่องเลเซอร์สแกนเนอร์ภาคพื้นดิน (Terrestrial Laser Scanner: TLS เช่น Leica RTC360, Faro Focus) หรือ Mobile SLAM (NavVis VLX, GeoSLAM ZEB)',
      'ชุดเป้าทรงกลมอ้างอิง (Spheres) และเป้าแบนตารางหมากรุก (Checkerboard Targets)',
      'กล้องประมวลผลรวม (Total Station) สำหรับยิงวัดพิกัดกริดของเป้า Checkerboard',
      'คอมพิวเตอร์ประมวลผลกราฟิกสูงสำหรับลงทะเบียนพอยต์คลาวด์ (Cyclone REGISTER 360, SCENE, หรือ CloudCompare)',
      'ไฟล์โมเดลการออกแบบอาคาร BIM ในรูปแบบ IFC หรือ Autodesk Revit (.rvt)'
    ],
    workingPrinciple: [
      'Terrestrial Laser Scanner (TLS): ยิงลำแสงเลเซอร์นับล้านจุดต่อวินาทีด้วยหลักการ Time-of-Flight หรือ Phase-Shift บันทึกพิกัด 3 มิติ (X, Y, Z, Intensity, RGB Color) ด้วยความละเอียดระดับมิลลิเมตร',
      'Mobile SLAM (Simultaneous Localization and Mapping): ผสานเซนเซอร์เลเซอร์ LiDAR เข้ากับชุดวัดความเฉื่อย (IMU) คำนวณตำแหน่งและทิศทางการก้าวเดินไปพร้อมกับการสร้างแผนผัง 3 มิติแบบเรียลไทม์ เหมาะสำหรับพื้นที่ภายในอาคาร ทางเดินแคบ และอุโมงค์',
      'การเชื่อมต่อภาพสแกน (Point Cloud Registration): เชื่อมผสานกลุ่มหมอกจุดหลายๆ สถานีเข้าด้วยกันโดยอาศัยเป้าอ้างอิง (Target-Based) หรืออาศัยความซ้อนทับของระนาบเรขาคณิต (Cloud-to-Cloud / ICP Algorithm)',
      'การตรึงพิกัดโครงข่าย (Georeferencing): ตรึงกลุ่มพอยต์คลาวด์ทั้งหมดเข้าสู่ระบบพิกัดจริงของโครงการด้วยพิกัดของเป้า Checkerboard ที่รังวัดด้วย Total Station',
      'Scan-to-BIM QA/QC: นำกลุ่มพอยต์คลาวด์สภาพจริงหลังก่อสร้าง (As-Built Point Cloud) มาเปรียบเทียบกับโมเดล BIM ทางทฤษฎี คำนวณระยะห่างตั้งฉาก (Cloud-to-Mesh Distance) และแสดงผลเป็นแผนภาพสี (Heatmap) เพื่อชี้จุดที่ก่อสร้างเบี่ยงเบนเกินเกณฑ์'
    ],
    fieldProcedures: [
      {
        title: 'ขั้นตอนที่ 1: การวางแผนจุดตั้งสแกนและการซ้อนทับ (Station Layout & Overlap)',
        details: 'กำหนดตำแหน่งตั้งสแกนให้มีพื้นที่ทับซ้อนกันอย่างน้อย 30-40% ระหว่างสถานีที่ติดกัน เพื่อให้อัลกอริทึม ICP จับคู่ระนาบผนังได้อย่างมั่นคง และจัดวางตำแหน่งเพื่อขจัดมุมอับสายตา (Occlusion / Shadow Areas)'
      },
      {
        title: 'ขั้นตอนที่ 2: การติดตั้งเป้าตรึงพิกัด (Checkerboard Target Placement)',
        details: 'ติดเป้า Checkerboard บนผนังและเสาคอนกรีตที่มั่นคง กระจายตัวในระดับความสูงและทิศทางที่ต่างกัน อย่างน้อย 4-6 เป้าต่อพื้นที่ ใช้กล้อง Total Station ยิงรังวัดค่าพิกัด (X, Y, Z) ของกึ่งกลางเป้าอย่างแม่นยำ'
      },
      {
        title: 'ขั้นตอนที่ 3: กฎการเดินสแกนด้วย Mobile SLAM (Loop Closure Strategy)',
        details: 'สำหรับเครื่องเดินสแกนแบบมือถือ ต้องเริ่มต้นเดินจากจุดที่มีเอกลักษณ์เรขาคณิตชัดเจน เดินเป็นวงรอบปิด (Closed Loop) วนกลับมายังจุดเริ่มต้นเดิมเสมอ เพื่อให้ระบบทำการปรับแก้หักล้างการสะสมค่าความคลาดเคลื่อนจากการดริฟท์ของ IMU (Drift Correction)',
        criticalCaution: 'ห้ามเดินเร็วเกินไป หรือเดินผ่านทางเดินยาวที่มีผนังเรียบไร้เหลี่ยมเสา (Featureless Corridor) โดยไม่ติดเป้าทรงกลมช่วยอ้างอิง'
      },
      {
        title: 'ขั้นตอนที่ 4: การลงทะเบียนและตรวจสอบความเชื่อมโยง (Registration QA/QC)',
        details: 'นำเข้าข้อมูลสู่โปรแกรมลงทะเบียน ตรวจสอบค่าความคลาดเคลื่อนในการจับคู่ (Target / Cloud Overlap Error ต้อง < 3-5 มม.) และค่าความทับซ้อน (Overlap Percentage > 50%)'
      },
      {
        title: 'ขั้นตอนที่ 5: การตรวจสอบความเบี่ยงเบนเทียบกับ BIM (Scan-to-BIM QA/QC)',
        details: 'นำเข้าโมเดล BIM (IFC) ซ้อนทับกับพอยต์คลาวด์ที่ปรับแต่งแล้ว สั่งรันคำนวณ Cloud-to-Mesh (C2M) Distance ตั้งเกณฑ์ความคลาดเคลื่อนยอมรับได้ (เช่น เสาอาคาร ±10 มม., พื้นคอนกรีต ±15 มม.) สร้างรายงานกราฟิก Deviation Heatmap'
      }
    ],
    deviceWorkflow: [
      {
        stepNumber: 1,
        stageName: 'การสั่งเริ่มสแกนและการถ่ายภาพพาโนรามา HDR',
        targetHardware: 'Terrestrial Scanner Panel / Mobile Controller',
        buttonKey: '[POWER ON] -> [SELECT PROFILE: HIGH DENSITY] -> [START SCAN]',
        actionLabel: 'เลือกโปรไฟล์ความละเอียด และสั่งเริ่มการสแกนและถ่ายภาพสี',
        screenTitle: '3D LASER SCANNER OPERATION',
        screenLines: [
          'PROFILE     : 6mm @ 10m (High Resolution)',
          'COLOR CAPTURE: HDR 360 Panorama (5 Exposures)',
          'ESTIMATED TIME: 1 min 45 sec',
          'POINTS COLLECTED: ~45 Million Points',
          'COMPENSATOR : DUAL-AXIS ACTIVE (Tilt: 0.001°)',
          'STATUS      : ROTATING & EMITTING LASER'
        ],
        explanation: 'ระหว่างที่กล้องหมุนสแกน ผู้ปฏิบัติงานต้องหลบออกจากแนวเล็งเพื่อไม่ให้ติดเป็นเงาคนบังข้อมูลในพอยต์คลาวด์',
        qaCheck: 'ตรวจดูว่าไม่มีฝุ่นหรือรอยนิ้วมือบนกระจกปริซึมของหัวสแกนเนอร์'
      },
      {
        stepNumber: 2,
        stageName: 'การวิเคราะห์ความเบี่ยงเบน Scan-to-BIM Deviation Heatmap',
        targetHardware: 'BIM QA/QC Software (CloudCompare / Verity)',
        buttonKey: '[LOAD POINT CLOUD] -> [LOAD BIM IFC] -> [RUN C2M INSPECT]',
        actionLabel: 'คำนวณระยะห่างระหว่างจุดพอยต์คลาวด์กับระนาบโมเดล BIM',
        screenTitle: 'SCAN-TO-BIM DEVIATION REPORT',
        screenLines: [
          'TOTAL POINTS ANALYZED : 18,450,200',
          'TOLERANCE THRESHOLD   : ± 10.0 mm',
          'POINTS IN TOLERANCE   : 94.2% (GREEN)',
          'POSITIVE DEVIATION    : +18.4 mm (Max Bulge on Wall W-04)',
          'NEGATIVE DEVIATION    : -22.1 mm (Column C-12 Sag)',
          'OVERALL C2M RMSE      : 6.2 mm',
          '[EXPORT PDF] -> AS-BUILT COMPLIANCE CERTIFICATE'
        ],
        explanation: 'พื้นที่สีเขียวแสดงว่าก่อสร้างตรงตามแบบ, พื้นที่สีแดงแสดงว่าโครงสร้างโป่งออกเกินแบบ, พื้นที่สีน้ำเงินแสดงว่าโครงสร้างยุบตัวเข้าไปเกินแบบ',
        qaCheck: 'จุดที่แสดงสีแดงหรือน้ำเงินเข้ม ต้องทำการตรวจสอบซ้ำว่าเป็นความคลาดเคลื่อนจริงหรือเป็นสิ่งกีดขวางหน้างาน (เช่น นั่งร้าน)'
      }
    ],
    downstreamWorkflow: {
      outputDataFormat: 'ไฟล์พอยต์คลาวด์มาตรฐาน E57, LAS, RCP (Autodesk Recap) และรายงานความเบี่ยงเบน PDF',
      outputDescription: 'แบบจำลอง 3 มิติสภาพจริงของอาคารพร้อมพิกัดอ้างอิง และรายงานการควบคุมคุณภาพการก่อสร้าง',
      nextStepTitle: 'การสร้างแบบ As-Built BIM Model หรือการส่งมอบงาน',
      nextStepProcedure: 'ส่งออกไฟล์ RCP เข้าสู่ Autodesk Revit เพื่อดราฟต์แก้ไขโมเดล As-Built ให้ตรงกับสภาพความเป็นจริง หรือแนบรายงานความเบี่ยงเบนเป็นเอกสารตรวจรับงานงวดสุดท้าย',
      recommendedToolTab: 'converter',
      toolActionLabel: 'เปิดเครื่องมือแปลงพิกัด (Coordinate Tool)'
    },
    errorSourcesAndMitigation: [
      'พื้นผิวกระจกเงา กระเบื้องมันวาว และผิวน้ำ (Specular Reflection): แสงเลเซอร์จะสะท้อนกระเจิง ก่อให้เกิดจุดพอยต์คลาวด์หลอกลอยอยู่นอกตัวอาคาร (Ghost Points) ต้องกรองตัดทิ้งในขั้นตอน Data Cleaning',
      'การดริฟท์สะสมของเซนเซอร์ IMU ใน Mobile SLAM: ป้องกันโดยการเดินปิดลูปกลับมาจุดเดิม และไม่เดินแกว่งตัวเครื่องเร็วเกินไป',
      'การสั่นสะเทือนของฐานตั้งกล้องสแกน: หลีกเลี่ยงการตั้งกล้องบนนั่งร้านเหล็กที่ยวบ หรือพื้นสะพานที่มีรถวิ่งผ่านตลอดเวลา'
    ],
    formulas: [
      {
        label: 'การคำนวณระยะห่างพอยต์คลาวด์กับระนาบ BIM (Cloud-to-Mesh Distance)',
        formula: 'Distance = abs( P_point . N_plane - D_plane )',
        explanation: 'วัดระยะทางตั้งฉากที่สั้นที่สุดจากจุดพอยต์คลาวด์ P ไปยังระนาบขององค์ประกอบในโมเดล BIM'
      },
      {
        label: 'ค่าความคลาดเคลื่อนเชิงมิติรวมของโครงสร้าง (C2M RMSE)',
        formula: 'RMSE_C2M = sqrt( sum( (Distance_i)^2 ) / N )',
        explanation: 'ดัชนีชี้วัดความแม่นยำของการก่อสร้างจริงเทียบกับแบบจำลองการออกแบบ'
      }
    ]
  }
];
