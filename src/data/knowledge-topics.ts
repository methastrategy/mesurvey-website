import { KnowledgeTopic } from '../types/survey';

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'total-station-orientation',
    title: 'กล้องวัดมุมอิเล็กทรอนิกส์และโททัลสเตชัน (Total Station & Theodolite)',
    titleEn: 'Total Station Setup, Azimuth Orientation, Resection & EDM Principles',
    category: 'total-station',
    categoryName: 'Total Station & Theodolite',
    summary: 'หลักการทำงานของแกนกล้อง 3 แกน, การตั้งดิ่งและปรับระดับ (Centering & Leveling), การกำหนดทิศทางอ้างอิงด้วย Backsight Azimuth, วิธี Resection (Free Station), การวัดระยะทางด้วยแสง (EDM) และการแก้ค่าบรรยากาศ (ppm)',
    badge: 'เครื่องมือพื้นฐานงานสนาม',
    iconName: 'Compass',
    courseRelation: 'มาตรฐานวิศวกรรมสำรวจ (Geomatics Standards)',
    workingPrinciple: [
      'Total Station ผสานกล้องวัดมุมอิเล็กทรอนิกส์ (Electronic Theodolite) และเครื่องวัดระยะทางด้วยแสงเลเซอร์/อินฟราเรด (EDM: Electronic Distance Meter) บนแกนร่วม',
      'ระบบแกนหลัก 3 แกนทางเรขาคณิต: แกนดิ่ง (Vertical Axis), แกนราบ (Horizontal/Trunnion Axis), และแกนเล็ง (Line of Collimation/Sight) ซึ่งทั้งสามแกนต้องตั้งฉากกันอย่างสมบูรณ์',
      'การวัดมุมราบและมุมดิ่งใช้จานองศาแบบดิจิทัล (Absolute Optical Encoder) พร้อมเซนเซอร์ชดเชยการเอียงแบบสองแกน (Dual-axis Tilt Compensator)',
      'การวัดระยะทาง EDM อาศัยหลักการ Phase-Shift Modulation (ความถี่คลื่นปรับตามระยะ) หรือ Time-of-Flight (วัดเวลาการเดินทางของคลื่นแสงเลเซอร์สะท้อนกลับจากปริซึม)',
      'วิธี Resection (Free Station): คำนวณหาค่าพิกัดและทิศทางของจุดตั้งกล้องที่ไม่ทราบพิกัด โดยการส่องวัดมุมและระยะไปยังหมุดควบคุมที่ทราบพิกัดอย่างน้อย 2-3 หมุด ด้วยวิธี Least Squares'
    ],
    fieldProcedures: [
      {
        title: '1. การกางขาตั้งกล้องและการตั้งดิ่งลงหมุด (Centering)',
        details: 'กางขาตั้งกล้องให้หัวขากล้องขนานพื้นดินมากที่สุด ปักปลายขากล้องให้แน่น ขันสกรูยึดตัวกล้องเข้ากับหัวขาตั้ง เปิดแสงเลเซอร์ดิ่ง (Laser Plummet) แล้วปรับขากล้องให้จุดเลเซอร์ตรงกึ่งกลางหมุดสำรวจ'
      },
      {
        title: '2. การปรับระดับลูกน้ำฟองยาวและอิเล็กทรอนิกส์ (Leveling)',
        details: 'ปรับฟองกลมด้วยการเลื่อนยืดหดขากล้อง จากนั้นหมุนตัวกล้องให้ฟองยาวขนานกับแนวสกรูเท้า 2 ตัว หมุนเข้าพร้อมกันหรือออกพร้อมกัน แล้วหมุนกล้องไป 90 องศาเพื่อปรับสกรูตัวที่ 3 ให้ฟองยาวอยู่กึ่งกลาง',
        criticalCaution: 'เมื่อหมุนตัวกล้องไป 90°, 180° และ 270° ฟองอิเล็กทรอนิกส์ต้องคงอยู่กึ่งกลางค่าเอียงไม่เกิน ±5 ฟิลิปดา'
      },
      {
        title: '3. การป้อนค่าแก้บรรยากาศ (Atmospheric Correction: ppm)',
        details: 'วัดค่าอุณหภูมิ (°C) และความดันบรรยากาศ (hPa หรือ mmHg) หน้างาน แล้วป้อนเข้าตัวกล้องเพื่อคำนวณค่าชดเชยการเปลี่ยนแปลงความเร็วของคลื่นแสงเลเซอร์ในอากาศ'
      },
      {
        title: '4. การกำหนดทิศทางอ้างอิง (Backsight Orientation)',
        details: 'เล็งกล้องไปยังเป้าหมุดหลัง (Backsight: BS) ป้อนค่าพิกัดหรือมุม Azimuth ที่คำนวณได้ล่วงหน้า กด Set Azimuth / Set 0 แล้วส่องวัดเช็คระยะทางราบ (HD) เทียบกับระยะพิกัดจริงเพื่อยืนยันความถูกต้องก่อนเริ่มรังวัด'
      },
      {
        title: '5. การวัดมุมสองหน้ากล้อง (Face Left & Face Right Reversal)',
        details: 'ในงานควบคุมความละเอียดสูง ต้องวัดทั้งหน้าซ้าย (Direct) และหน้าขวา (Reverse) เสมอ เพื่อหักล้างความคลาดเคลื่อนจากแกนเล็งไม่ตั้งฉากกับแกนราบ (Collimation Error) และความคลาดเคลื่อนจุดดัชนีจานองศาดิ่ง (Index Error)'
      }
    ],
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนแกนเล็ง (Collimation Error): บรรเทาโดยการวัดเฉลี่ยทั้งสองหน้ากล้อง (FL + FR) / 2',
      'ความคลาดเคลื่อนจากการตั้งดิ่ง (Centering Error): มีผลกระทบต่อระยะสั้นสูงมาก ต้องตรวจสอบจุดเลเซอร์ดิ่งซ้ำหลังปรับระดับกล้องเสร็จ',
      'การแกว่งไหวของเสาเป้าปริซึม (Prism Pole Tilt): ใช้ขาค้ำสองขา (Bipod) ล็อคเสาปริซึมให้ฟองกลมตรงจุดเสมอ'
    ],
    formulas: [
      {
        label: 'การคำนวณระยะราบและระยะดิ่ง (Plane Reductions)',
        formula: 'HD = SD * sin(ZA),   VD = SD * cos(ZA)',
        explanation: 'SD = ระยะเอียง (Slope Distance), ZA = มุมดิ่งยอดฟ้า (Zenith Angle วัดจากแนวดิ่ง 0 องศา)'
      },
      {
        label: 'การคำนวณผลต่างระดับ (Elevation Difference)',
        formula: 'dH = SD * cos(ZA) + ih - th',
        explanation: 'ih = ความสูงกล้อง (Instrument Height), th = ความสูงเป้าปริซึม (Target Height)'
      }
    ]
  },
  {
    id: 'differential-leveling-procedure',
    title: 'กล้องระดับและการทำระดับเชิงอนุพันธ์ (Differential Leveling & Two-Peg Test)',
    titleEn: 'Automatic & Digital Leveling, Two-Peg Collimation Check & Loop Closure',
    category: 'differential-leveling',
    categoryName: 'Differential Leveling',
    summary: 'หลักการสร้างแนวเล็งระดับราบ (Horizontal Line of Sight), การทดสอบความขนานแกนเล็ง (Two-Peg Test), กฎการรักษาระยะส่องหน้า-ส่องหลังให้สมดุล (Balancing Sights), และการตรวจสอบผลรวมหน้ากระดาษ (Page Check)',
    badge: 'ความแม่นยำทางดิ่งสูง',
    iconName: 'Ruler',
    courseRelation: 'มาตรฐานการทำระดับแห่งชาติ (RTSD Leveling Specifications)',
    workingPrinciple: [
      'กล้องระดับอัตโนมัติ (Automatic Level) มีระบบชดเชยแสง (Optical/Magnetic Compensator) แขวนตัวเรือนปริซึมด้วยเส้นลวด เพื่อดึงแนวเล็งให้ขนานกับระนาบระนาบอ้างอิงสัมบูรณ์ (Equipotential Gravitational Surface)',
      'กล้องระดับดิจิทัล (Digital Level) ใช้เซนเซอร์ Linear CCD สแกนอ่านแถบรหัสแท่ง (Barcode Staff) ประมวลผลภาพด้วยสัญญาณดิจิทัล ลดความผิดพลาดจากการอ่านสายตาของผู้บันทึกได้อย่างสมบูรณ์',
      'การอ่านไม้ระดับ: ส่องหลัง (Backsight: BS) เพื่อหาความสูงกล้อง HI, ส่องกลาง (Intermediate Sight: IFS) เก็บรายละเอียด, และส่องหน้า (Foresight: FS) เพื่อย้ายจุดเปลี่ยนหมุด (Turning Point: TP)',
      'กฎการรักษาระยะส่องหน้าและส่องหลังให้เท่ากัน (Balancing Sights): ระยะส่อง BS และ FS ในแต่ละสถานีต้องเท่ากัน เพื่อหักล้างความคลาดเคลื่อนจากความโค้งของโลกและการหักเหของแสงในบรรยากาศ (Earth Curvature & Atmospheric Refraction)'
    ],
    fieldProcedures: [
      {
        title: '1. การทดสอบความขนานของแกนเล็งกับแนวระดับ (Two-Peg Collimation Test)',
        details: 'ปักหมุดสองจุด A และ B ห่างกันประมาณ 30-50 เมตร ตั้งกล้องกึ่งกลางอ่านค่าระดับไม้ทั้งสองจุดเพื่อหาผลต่างระดับจริง (True delta H) จากนั้นย้ายกล้องไปตั้งใกล้จุด A ส่องอ่านซ้ำเพื่อคำนวณค่าคลาดเคลื่อน Collimation Error (c-value)'
      },
      {
        title: '2. การวางและประคองไม้ระดับ (Staff Handling & Waving)',
        details: 'ใช้ลูกน้ำฟองกลมยึดติดไม้ระดับให้อยู่ในแนวดิ่ง หรือในกรณีใช้ไม้ระดับธรรมดา ให้คนถือไม้ระดับส่ายไม้ระดับช้าๆ (Waving the staff) เข้าหากล้องและออกจากกล้อง โดยผู้ส่องกล้องจะบันทึกค่าที่ต่ำที่สุดที่ปรากฏบนสายใยกลาง'
      },
      {
        title: '3. การใช้เต่าเหล็กรองรับจุดเปลี่ยน (Turning Plate / Turtle)',
        details: 'ทุกจุดเปลี่ยนหมุด (Turning Point: TP) ต้องวางไม้ระดับลงบนเต่าเหล็กหล่อที่ปักแน่นบนพื้นดิน ห้ามวางบนกิ่งไม้หรือผิวดินนิ่มที่อาจทรุดตัวระหว่างสลับกล้อง'
      },
      {
        title: '4. การตรวจสอบผลรวมหน้ากระดาษ (Arithmetic Page Check)',
        details: 'ทุกครั้งที่จดจบหน้าสมุดระดับ ต้องคำนวณยืนยัน: (ผลรวม BS) - (ผลรวม FS) = (ค่าระดับจุดสุดท้าย) - (ค่าระดับจุดแรก) = (ผลรวม Rise) - (ผลรวม Fall)'
      }
    ],
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนจากแกนเล็งไม่ขนานแนวระดับ: รักษาระยะส่อง BS และ FS ให้สมดุลกันในทุกสถานีตั้งกล้อง',
      'ความคลาดเคลื่อนจากการหักเหของแสงและไอร้อน (Heat Shimmer): หลีกเลี่ยงการอ่านค่าไม้ระดับที่ต่ำกว่า 0.5 เมตรจากผิวดินหรือถนนคอนกรีตร้อน',
      'การทรุดตัวของขากล้อง: หลีกเลี่ยงการเหยียบพื้นดินใกล้ขากล้อง และเลือกพื้นที่ตั้งกล้องที่มั่นคง'
    ],
    formulas: [
      {
        label: 'เกณฑ์ความคลาดเคลื่อนปิดรอบตามระยะทาง (RTSD Closure Limit)',
        formula: 'C = k * sqrt(K)  [mm]',
        explanation: 'K = ระยะทางไป-กลับรวม (km), k = 4 (ชั้น 1), 8 (ชั้น 2), 12 (ชั้น 3), 24 (งานก่อสร้างทั่วไป)'
      },
      {
        label: 'การตรวจสอบผลรวมหน้ากระดาษ (Page Arithmetic Check)',
        formula: 'Sum(BS) - Sum(FS) = End_RL - Start_RL',
        explanation: 'ยืนยันว่าไม่มีความผิดพลาดในการคำนวณบวกลบเลขในแต่ละแถวของสมุดจด'
      }
    ]
  },
  {
    id: 'gnss-rtk-cors',
    title: 'การรังวัดสัญญาณดาวเทียม GNSS แบบ RTK และโครงข่าย CORS',
    titleEn: 'GNSS Satellite Surveying, RTK Base-Rover & Network CORS-NTRIP',
    category: 'gnss-geodesy',
    categoryName: 'GNSS & Geodesy',
    summary: 'การรับสัญญาณดาวเทียมหลายกลุ่มดาว (GPS, GLONASS, Galileo, BeiDou), การส่งค่าแก้คลื่นส่งแบบ Real-Time Kinematic, ระบบโครงข่าย CORS-NTRIP (DOL-CORS / RTSD-CORS), และเกณฑ์สถานะ Ambiguity Fixed vs Float',
    badge: 'ระบบพิกัดสากลแบบเรียลไทม์',
    iconName: 'Radio',
    courseRelation: 'การรังวัดดาวเทียมจีพีเอส (Satellite Geodesy)',
    workingPrinciple: [
      'เครื่องรับสัญญาณ GNSS รังวัดคลื่นสัญญาณความถี่วิทยุจากกลุ่มดาวเทียมนำทางสากล: GPS (L1/L2/L5), GLONASS (G1/G2), Galileo (E1/E5), BeiDou (B1/B2/B3)',
      'การรังวัดแบบ Real-Time Kinematic (RTK): ใช้สถานีแม่ข่าย (Base Station) ที่ทราบพิกัดแน่นอน ส่งข้อมูลค่าแก้คลื่นส่ง (Carrier Phase Corrections) ผ่านวิทยุ UHF หรืออินเทอร์เน็ต (NTRIP Protocol) ไปยังเครื่องรับเคลื่อนที่ (Rover)',
      'ระบบ Network CORS (เช่น DOL-CORS ของกรมที่ดิน): เชื่อมโยงสถานีอ้างอิงถาวรทั่วประเทศ สร้างแบบจำลองชั้นบรรยากาศและค่าแก้เสมือน (VRS: Virtual Reference Station) ทำให้ Rover ทำงานได้ในรัศมีกว้างโดยไม่ต้องตั้ง Base ของตัวเอง',
      'การแก้ความคลุมเครือรอบคลื่น (Carrier Phase Ambiguity Resolution): ประมวลผลแบบ Double-Differencing เพื่อให้ได้สถานะ "Fixed" ซึ่งให้ความถูกต้องทางราบระดับ 1-2 เซนติเมตร'
    ],
    fieldProcedures: [
      {
        title: '1. การเลือกตำแหน่งและการตั้งมุมมองท้องฟ้า (Elevation Mask)',
        details: 'เลือกพื้นที่เปิดโล่ง ไม่มีสิ่งกีดขวางมุมมองท้องฟ้าเหนือมุมเงย 10-15 องศา (Mask Angle) หลีกเลี่ยงเสาส่งไฟฟ้าแรงสูงและกำแพงกระจกสะท้อนคลื่น'
      },
      {
        title: '2. การเชื่อมต่อโครงข่าย NTRIP Caster',
        details: 'ใส่ SIM Card หรือต่อ Wi-Fi Hotspot ในคอนโทรลเลอร์ ป้อนค่า Caster IP, Port, Mountpoint (เช่น VRS-RTCM32), Username และ Password ของระบบ CORS'
      },
      {
        title: '3. การตรวจสอบสถานะการแก้ความคลุมเครือ (Fixed Solution Verification)',
        details: 'สังเกตสถานะการประมวลผลจนกระทั่งขึ้น "Fixed" ตรวจสอบค่าความคลาดเคลื่อนทางราบ (HRMS < 0.02 m) และทางดิ่ง (VRMS < 0.03 m) พร้อมเช็คค่าเรขาคณิตของดาวเทียม (PDOP < 2.5)',
        criticalCaution: 'ห้ามบันทึกจุดพิกัดในขณะที่สถานะขึ้นเป็น "Float" หรือ "Single" โดยเด็ดขาด เนื่องจากความถูกต้องอาจคลาดเคลื่อนหลักเดซิเมตรถึงเมตร'
      },
      {
        title: '4. การรังวัดตรวจสอบหมุดควบคุมเดิม (Check-in Control Point)',
        details: 'ก่อนเริ่มงานและหลังเสร็จงานรังวัดทุกครั้ง ต้องนำ Rover ไปรังวัดตรวจสอบหมุดควบคุมหลักฐานที่ทราบค่าพิกัดแน่นอน (Known Benchmark) เพื่อพิสูจน์ว่าระบบไม่เกิดความคลาดเคลื่อนแฝง'
      }
    ],
    errorSourcesAndMitigation: [
      'การสะท้อนหลายทิศทาง (Multipath Error): เกิดจากคลื่นสะท้อนผิวน้ำ อาคารกระจก หรือโครงสร้างโลหะ แก้ไขโดยใช้เสาอากาศแบบ Choke Ring หรือขยับออกจากสิ่งกีดขวาง',
      'ความคลาดเคลื่อนจากชั้นบรรยากาศไอโอโนสเฟียร์และโทรโพสเฟียร์: ระบบ Multi-Frequency และโครงข่าย CORS ช่วยหักล้างค่าความล่าช้าของคลื่นได้เกือบหมด',
      'การบังมุมท้องฟ้า (Canopy obstruction): ในป่าทึบหรือตึกสูง (Urban Canyon) ควรปรับเปลี่ยนไปใช้กล้อง Total Station เสริม'
    ],
    formulas: [
      {
        label: 'การแปลงความสูงวงรีเป็นระดับความสูงจริงเหนือทะเลปานกลาง',
        formula: 'H = h - N',
        explanation: 'H = Orthometric Height (ระดับความสูง รทก.), h = Ellipsoidal Height (ความสูงวงรีจาก GNSS), N = Geoid Undulation จากแบบจำลอง TGM2017'
      }
    ]
  },
  {
    id: 'gnss-static-geodesy',
    title: 'การรังวัดสัญญาณดาวเทียมแบบสถิตความแม่นยำสูง (Static GNSS Geodesy)',
    titleEn: 'Static GNSS Geodetic Surveying, Baseline Vectors & Network Adjustment',
    category: 'gnss-geodesy',
    categoryName: 'GNSS & Geodesy',
    summary: 'การรังวัดโครงข่ายหมุดควบคุมหลักฐานปฐมภูมิ-ทุติยภูมิ (Primary/Secondary Geodetic Controls), การรังวัดแช่นิ่งแบบสองความถี่ (Dual-Frequency), การบันทึกไฟล์ RINEX, และการประมวลผลเวกเตอร์ฐาน (Baseline Post-Processing)',
    badge: 'งานโครงข่ายระดับมิลลิเมตร',
    iconName: 'Radio',
    courseRelation: 'การปรับแก้โครงข่ายยีโอเดซี (Geodetic Network Adjustment)',
    workingPrinciple: [
      'การรังวัดแบบสถิต (Static GNSS): ตั้งเครื่องรับสัญญาณ GNSS นิ่งอยู่บนหมุดควบคุม 2 สถานีขึ้นไปพร้อมกัน รังวัดบันทึกข้อมูลคลื่นส่งแบบดิบ (Raw Carrier Phase Data) ต่อเนื่องเป็นเวลานาน (ตั้งแต่ 1 ถึงหลายชั่วโมง)',
      'การประมวลผลเวกเตอร์ฐาน (Baseline Processing): นำไฟล์ข้อมูลดิบ (RINEX: Receiver Independent Exchange Format) จากแต่ละสถานีมารังวัดแบบ Post-Processing ร่วมกับข้อมูลวงโคจรดาวเทียมแบบแม่นยำ (Precise Ephemeris: SP3)',
      'การปรับแก้โครงข่าย (Network Adjustment): นำเวกเตอร์ฐาน (dX, dY, dZ) ที่คำนวณได้ทั้งหมดมาปรับแก้พร้อมกันแบบ Minimally Constrained และ Fully Constrained Network Adjustment ด้วยวิธีกำลังสองน้อยที่สุด (Least Squares Adjustment)'
    ],
    fieldProcedures: [
      {
        title: '1. การวางแผนโครงข่ายและเซสชันการรังวัด (Observation Session Planning)',
        details: 'วางแผนสามเหลี่ยมโครงข่ายหมุดควบคุม ออกแบบกำหนดเวลาเซสชัน (Session Schedule) ให้มีเครื่องรับสัญญาณรังวัดพร้อมกันอย่างน้อย 3 เครื่องขึ้นไปเพื่อให้เกิดเวกเตอร์ฐานที่เป็นอิสระต่อกัน (Independent Baselines)'
      },
      {
        title: '2. การตั้งเสาอากาศและวัดความสูงเสาอากาศ (Antenna Height Measurement)',
        details: 'ตั้งดิ่งเสาอากาศด้วยกล้องดิ่งสายตาหรือเลเซอร์ดิ่งอย่างประณีต วัดความสูงเสาอากาศทั้งก่อนและหลังเสร็จสิ้นเซสชัน บันทึกประเภทการวัดความสูง: ความสูงตรง (True Vertical) หรือความสูงเอียง (Slant Height ไปยังจุดเครื่องหมายบนขอบเสาอากาศ)'
      },
      {
        title: '3. การกำหนดอัตราการบันทึกข้อมูล (Logging Rate)',
        details: 'ตั้งค่า Sampling Interval เป็น 1 วินาที, 5 วินาที หรือ 15 วินาที ตามความยาวของเวกเตอร์ฐาน และตั้งค่ามุมเงยการรับสัญญาณ (Elevation Mask) ไว้ที่ 10-15 องศา'
      },
      {
        title: '4. การตรวจสอบคุณภาพข้อมูล RINEX',
        details: 'หลังเสร็จสิ้นการรังวัด ตรวจสอบความต่อเนื่องของสัญญาณ (No Cycle Slips) ค่าความสมบูรณ์ของข้อมูล (> 95%) และอัตราส่วนสัญญาณต่อสัญญาณรบกวน (Signal-to-Noise Ratio: SNR)'
      }
    ],
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนศูนย์กลางเฟสของเสาอากาศ (Antenna Phase Center Offset/Variation: PCO/PCV): ต้องใช้ไฟล์โมเดลการคาลิเบรตเสาอากาศมาตรฐาน (.atx) ในซอฟต์แวร์ประมวลผล',
      'ความคลาดเคลื่อนความสูงเสาอากาศ: วัดความสูง 3 ทิศทางรอบเสาอากาศแล้วเฉลี่ยค่า พร้อมถ่ายภาพยืนยันการอ่านตลับเมตร',
      'วงโคจรดาวเทียมแบบ Broadcast: ดาวน์โหลดไฟล์ Precise Ephemeris (IGS Final / Rapid) มาประมวลผลแทน'
    ],
    formulas: [
      {
        label: 'ระยะเวลาขั้นต่ำในการรังวัดแบบสถิต (Observation Duration Rule of Thumb)',
        formula: 'Duration = 30 min + (1 to 2 min * Baseline_km)',
        explanation: 'สำหรับหมุดควบคุมระยะฐาน 10 km ควรรังวัดไม่น้อยกว่า 45-60 นาที เพื่อให้คลื่นความถี่แก้ Ambiguity ได้แน่นอน'
      }
    ]
  },
  {
    id: 'uav-drone-photogrammetry',
    title: 'การสำรวจรังวัดด้วยอากาศยานไร้คนขับ (UAV Drone Photogrammetry)',
    titleEn: 'UAV Photogrammetry, Flight Planning, GSD, GCP Target Strategy & SfM',
    category: 'drone-photogrammetry',
    categoryName: 'Drone & Photogrammetry',
    summary: 'การวางแผนเส้นทางบินถ่ายภาพทางอากาศ, การคำนวณ Ground Sampling Distance (GSD), การวางหมุดควบคุมภาคพื้นดิน (GCPs & Checkpoints), อัลกอริทึม Structure from Motion (SfM), และการสร้าง Orthomosaic / DEM',
    badge: 'การสำรวจทางอากาศสมัยใหม่',
    iconName: 'Camera',
    courseRelation: 'การสำรวจด้วยภาพถ่ายและรีโมตเซนซิง (Photogrammetry & Remote Sensing)',
    workingPrinciple: [
      'อากาศยานไร้คนขับ (UAV) บินถ่ายภาพถ่ายทางอากาศแบบมีพิกัดภูมิศาสตร์ (Geotagged Aerial Photos) ตามแนวตารางบิน (Flight Grid) ที่วางแผนล่วงหน้า',
      'เกณฑ์การซ้อนทับของภาพ: ภาพถ่ายต้องมีการซ้อนทับตามแนวบิน (Forward Overlap) ≥ 75-80% และซ้อนทับระหว่างแนวบิน (Side Overlap) ≥ 65-70% เพื่อให้อัลกอริทึมตรวจจับจุดเอกลักษณ์ (Tie Points) ในหลายมุมมอง',
      'อัลกอริทึม Structure from Motion (SfM): คำนวณความสัมพันธ์เชิงเรขาคณิตของกล้อง (Camera Pose & Bundle Block Adjustment) สร้างแบบจำลองคลาวด์พอยต์ 3 มิติ (Dense Point Cloud), แบบจำลองระดับสูงเชิงเลข (DEM/DSM) และภาพออร์โธโฟโต (True Orthomosaic)',
      'หมุดควบคุมภาพถ่ายภาคพื้นดิน (GCP: Ground Control Points): ปักเป้าสัญลักษณ์บนพื้นดิน รังวัดพิกัดด้วย GNSS RTK เพื่อตรึงแบบจำลองภาพถ่ายให้อยู่ในระบบพิกัดจริงของประเทศ และใช้ Checkpoints เพื่อทดสอบความถูกต้องอย่างเป็นอิสระ'
    ],
    fieldProcedures: [
      {
        title: '1. การคำนวณความสูงการบินตามค่าความละเอียด GSD ที่ต้องการ',
        details: 'คำนวณความสูงการบิน (Flight Altitude) จากสเปกของเซนเซอร์กล้อง (Sensor Dimensions, Focal Length) เพื่อให้ได้ค่า GSD ตามมาตรฐานงานแผนที่ เช่น งานแผนที่มาตราส่วน 1:1,000 กำหนดให้ GSD ≤ 2.5 ซม./พิกเซล'
      },
      {
        title: '2. การวางและกระจายหมุด GCPs & Checkpoints',
        details: 'พ่นหรือติดตั้งเป้าตารางหมากรุกขาว-ดำ ขนาดอย่างน้อย 40x40 ซม. กระจายตามขอบนอกแปลง มุมแปลง และกึ่งกลางพื้นที่อย่างน้อย 5-8 จุด และแบ่ง 20-30% ไว้เป็น Checkpoints เพื่อประเมินค่า RMSE อิสระ'
      },
      {
        title: '3. การตรวจสอบสภาพอากาศและการตั้งค่ากล้อง',
        details: 'เลือกเวลาบินช่วงแสงสม่ำเสมอ หลีกเลี่ยงช่วงเวลาเที่ยงที่แดดจัดจนเกิดเงามืดคมชัดหรือแสงสะท้อนจ้า (Glare) ตั้งค่า Shutter Speed สูง (1/800s ขึ้นไป) เพื่อป้องกันภาพเบลอจากการเคลื่อนที่ (Motion Blur)'
      },
      {
        title: '4. การประมวลผลและการจัดทำรายงานความถูกต้อง (Quality Report Verification)',
        details: 'ประมวลผลผ่านซอฟต์แวร์โฟโตแกรมเมตรี ตรวจสอบค่าการคาลิเบรตกล้อง (Internal Parameters), การจับคู่จุดเชื่อมโยง (Reprojection Error < 1 พิกเซล), และค่าความคลาดเคลื่อนที่หมุด Checkpoints (RMSE X, Y, Z)'
      }
    ],
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนจากชัตเตอร์อิเล็กทรอนิกส์ (Rolling Shutter Distortion): ควรเลือกใช้โดรนที่มีกล้องเซนเซอร์แบบ Mechanical Shutter (เช่น Phantom 4 RTK, Mavic 3 Enterprise)',
      'การเคลื่อนไหวของเป้า GCP: ตอกหมุดคอนกรีตหรือปักเหล็กยึดเป้าให้แน่นหนากับพื้นดิน ป้องกันลมหรือคนเตะเคลื่อนที่',
      'ความสูงของต้นไม้และสิ่งปลูกสร้าง: ปรับแนวบินให้สูงพ้นสิ่งกีดขวาง และเลือกโหมดบินแบบปรับระดับตามภูมิประเทศ (Terrain Following)'
    ],
    formulas: [
      {
        label: 'การคำนวณ Ground Sampling Distance (GSD)',
        formula: 'GSD = (H * Sw) / (F * Iw)',
        explanation: 'H = ความสูงบินเหนือพื้นดิน (m), Sw = ความกว้างเซนเซอร์ (mm), F = ความยาวโฟกัสเลนส์ (mm), Iw = ความกว้างของภาพ (pixels)'
      },
      {
        label: 'การคำนวณความถูกต้องตำแหน่ง (RMSE)',
        formula: 'RMSE = sqrt( sum( (Coord_model - Coord_survey)^2 ) / N )',
        explanation: 'ประเมินค่าความคลาดเคลื่อนกำลังสองเฉลี่ยทางราบ (RMSE_XY) และทางดิ่ง (RMSE_Z)'
      }
    ]
  },
  {
    id: 'lidar-scan-to-bim-qaqc',
    title: 'การสำรวจสแกน 3 มิติและเทคโนโลยี SLAM LiDAR (3D Scanning & Scan-to-BIM)',
    titleEn: 'Terrestrial & Mobile SLAM LiDAR, Point Cloud Registration & BIM QA/QC',
    category: 'lidar-scan-bim',
    categoryName: 'LiDAR & Scan-to-BIM',
    summary: 'เครื่องสแกนเลเซอร์ 3 มิติภาคพื้นดิน (TLS) และระบบมือถือเดินสแกน (Handheld SLAM LiDAR), การต่อเชื่อมภาพสแกน (Registration), การตรึงพิกัดโครงข่าย (Georeferencing), และการตรวจสอบความถูกต้องเปรียบเทียบโมเดล BIM (Scan-to-BIM QA/QC)',
    badge: 'เทคโนโลยี 3D ขั้นสูง',
    iconName: 'Boxes',
    courseRelation: 'โครงงานวิศวกรรมสำรวจขั้นสูง (Advanced Geomatics Engineering Project)',
    workingPrinciple: [
      'เครื่องสแกนเลเซอร์ 3 มิติ (Terrestrial Laser Scanner: TLS) ยิงลำแสงเลเซอร์นับแสนถึงนับล้านจุดต่อวินาทีด้วยหลักการ Time-of-Flight (ToF) หรือ Phase-Shift เพื่อสร้างกลุ่มพิกัดจุด 3 มิติหนาแน่น (Dense Point Cloud: X, Y, Z, Intensity, RGB)',
      'เทคโนโลยี Handheld / Mobile SLAM (Simultaneous Localization and Mapping): ผสานเซนเซอร์เลเซอร์ LiDAR เข้ากับเซนเซอร์วัดการเฉื่อย (IMU) คำนวณตำแหน่งและเส้นทางการเดินของตัวเครื่องไปพร้อมกับการสร้างแบบจำลอง 3 มิติแบบเรียลไทม์ เหมาะสำหรับพื้นที่ภายในอาคารและทางเดินแคบ',
      'การเชื่อมต่อกลุ่มก้อนพอยต์คลาวด์ (Point Cloud Registration): เชื่อมภาพสแกนหลายสถานีเข้าด้วยกันโดยอาศัยเป้าอ้างอิงทรงกลม (Spheres), เป้าตารางหมากรุก (Checkerboard Targets), หรืออัลกอริทึมทางเรขาคณิต Cloud-to-Cloud / ICP (Iterative Closest Point)',
      'กระบวนการ Scan-to-BIM QA/QC: นำข้อมูลพอยต์คลาวด์สภาพจริงหลังการก่อสร้าง (As-Built Point Cloud) มาประกบซ้อนทับกับโมเดลแบบจำลองสารสนเทศอาคาร (BIM As-Designed) เพื่อคำนวณและแสดงผลค่าความคลาดเคลื่อนในรูปแบบแผนภาพความเบี่ยงเบน (Deviation Heatmap)'
    ],
    fieldProcedures: [
      {
        title: '1. การวางแผนตำแหน่งจุดตั้งสแกน (Station Layout & Overlap)',
        details: 'กำหนดจุดตั้งเครื่องสแกนให้มีพื้นที่ซ้อนทับกันอย่างน้อย 30-40% เพื่อให้อัลกอริทึม ICP จับคู่ระนาบผนังและพื้นผิวได้อย่างสมบูรณ์ และจัดวางตำแหน่งเพื่อขจัดจุดบอด (Shadow Areas)'
      },
      {
        title: '2. การติดตั้งเป้าตรึงพิกัดโครงข่าย (Georeferencing Control Network)',
        details: 'ติดเป้า Checkerboard บนโครงสร้างเสาหรือผนังที่มั่นคง ใช้กล้อง Total Station ยิงรังวัดค่าพิกัดของจุดกึ่งกลางเป้าในระบบพิกัดจริง เพื่อนำมาใช้ตรึงกลุ่มก้อนพอยต์คลาวด์ทั้งหมดเข้ากับพิกัดกริดของโครงการ'
      },
      {
        title: '3. การเดินสแกนด้วย SLAM และการปิดลูป (SLAM Trajectory Loop Closure)',
        details: 'ในการใช้เครื่องสแกนแบบมือถือเดิน (Mobile SLAM) ต้องวางแผนเส้นทางการเดินให้วนกลับมายังจุดเริ่มต้นเดิม (Closed Loop) เพื่อให้ระบบทำการปรับแก้หักล้างการสะสมค่าความคลาดเคลื่อนจากการดริฟท์ของ IMU (Drift Correction)',
        criticalCaution: 'หลีกเลี่ยงการเดินสวิงเครื่องเร็วเกินไป หรือเดินผ่านทางเดินยาวที่มีผนังเรียบไร้จุดเอกลักษณ์ทางเรขาคณิต (Featureless Corridors)'
      },
      {
        title: '4. การประมวลผลและการตรวจสอบความเบี่ยงเบน (Scan-to-BIM QA/QC)',
        details: 'นำเข้าข้อมูลเข้าสู่โปรแกรมตรวจสอบมิติ (เช่น CloudCompare หรือ BIM QA/QC tools) คำนวณระยะห่างระหว่างจุดพอยต์คลาวด์กับพื้นผิวของแบบจำลอง BIM (Cloud-to-Mesh Distance) และประเมินค่าเกณฑ์ความคลาดเคลื่อนตามมาตรฐานสากล'
      }
    ],
    errorSourcesAndMitigation: [
      'พื้นผิวกระจกเงาและผิวน้ำ (Specular Reflection): แสงเลเซอร์ทะลุกระจกหรือสะท้อนกระเจิง ก่อให้เกิดจุดพอยต์คลาวด์ลอยหลอก (Ghost Points) ต้องกรองตัดทิ้งในขั้นตอน Data Cleaning',
      'การสั่นไหวของฐานตั้งสแกน: หลีกเลี่ยงการตั้งกล้องสแกนบนนั่งร้านเหล็กที่ยวบ หรือพื้นสะพานที่มีการสัญจรของรถยนต์',
      'ความผิดพลาดในการระบุชื่อเป้าเชื่อมโยง: บันทึกรหัสเป้าและตำแหน่งในแผนที่ร่างสนามอย่างชัดเจน'
    ],
    formulas: [
      {
        label: 'การคำนวณค่าความเบี่ยงเบนเฉลี่ยพอยต์คลาวด์เทียบกับ BIM (Cloud-to-Mesh Deviation)',
        formula: 'Deviation = abs( P_scan . N_plane - D_plane )',
        explanation: 'วัดระยะทางตั้งฉากจากจุดพอยต์คลาวด์แต่ละจุดไปยังระนาบขององค์ประกอบโครงสร้างในโมเดล BIM'
      },
      {
        label: 'ค่าความถูกต้องเชิงมิติของโครงสร้าง (C2M Distance RMSE)',
        formula: 'RMSE = sqrt( sum( (Distance_i)^2 ) / N )',
        explanation: 'ดัชนีชี้วัดความคลาดเคลื่อนรวมของงานก่อสร้างจริงเทียบกับแบบจำลอง BIM'
      }
    ]
  }
];
