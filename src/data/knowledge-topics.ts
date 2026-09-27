import { KnowledgeTopic } from '../types/survey';

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'total-station-orientation',
    title: 'การตั้งกล้องและกำหนดทิศทางวงรอบ (Total Station Orientation & Resection)',
    titleEn: 'Total Station Setup, Azimuth Orientation & Resection',
    category: 'total-station',
    categoryName: 'Total Station & Theodolite',
    summary: 'หลักการตั้งแกนดิ่ง เล็งแนวศูนย์กลางหมุด (Centering & Leveling) และการกำหนดพิกัดจุดตั้งกล้องด้วยวิธี Backsight Azimuth และ Resection (Free Station)',
    badge: 'เครื่องมือพื้นฐาน',
    iconName: 'Compass',
    courseRelation: '01218211 Surveying for Mapping / 01218214 Engineering Surveying',
    workingPrinciple: [
      'Total Station รวมกล้องวัดมุมอิเล็กทรอนิกส์ (Electronic Theodolite) และเครื่องวัดระยะทางด้วยแสงเลเซอร์/อินฟราเรด (EDM: Electronic Distance Meter) เข้าด้วยกันในเครื่องเดียว',
      'ระบบแกนหลัก 3 แกน: แกนดิ่ง (Vertical Axis), แกนราบ (Horizontal/Trunnion Axis), และแกนเล็ง (Line of Collimation/Sight)',
      'การวัดมุมราบและมุมดิ่งใช้จานองศาแบบดิจิทัล (Absolute Optical Encoder) พร้อมตัวตรวจจับการเอียงแบบสองแกน (Dual-axis Tilt Sensor)',
      'วิธี Resection (Free Station) ใช้การส่องวัดไปยังหมุดควบคุมที่ทราบค่าพิกัดอย่างน้อย 2-3 หมุด เพื่อคำนวณย้อนหาตำแหน่งพิกัดและทิศทางของจุดตั้งกล้องแบบ Least Squares'
    ],
    fieldProcedures: [
      {
        title: '1. การกางขาตั้งกล้องและติดตั้งตัวเครื่อง',
        details: 'กางขาตั้งให้ฐานราบขนานพื้นที่สุด ปักขากล้องให้แน่นลงดิน ขันสกรูยึดตัวเครื่องกับหัวขาตั้งกล้องให้แน่นพอดี'
      },
      {
        title: '2. การตั้งดิ่งลงหมุด (Centering)',
        details: 'เปิดเลเซอร์ดิ่ง (Laser Plummet) หรือส่องกล้องดิ่งสายตา เลื่อนขากล้องและปรับสกรูปรับระดับให้จุดเลเซอร์ตรงกึ่งกลางหมุดสำรวจ'
      },
      {
        title: '3. การปรับระดับลูกน้ำ (Leveling)',
        details: 'หมุนฟองกลมให้อยู่กึ่งกลางโดยเลื่อนยืดหดขากล้อง จากนั้นใช้ฟองยาวอิเล็กทรอนิกส์ (Electronic Plate Bubble) ปรับด้วยสกรู 3 ตัว (Footscrews) ตามหลักการหมุนเข้าพร้อมกันหรือออกพร้อมกัน',
        criticalCaution: 'ต้องตรวจสอบว่าเมื่อหมุนตัวกล้องไป 90 และ 180 องศา ฟองต้องยังคงอยู่กึ่งกลาง ±5 ฟิลิปดา'
      },
      {
        title: '4. การ Orientation กำหนดทิศทางอ้างอิง',
        details: 'ส่องไปยังหมุด Backsight (BS) ใส่ค่าพิกัดหรือมุม Azimuth ที่คำนวณได้ กด Set 0 หรือ Set Azimuth จากนั้นส่องวัดระยะเช็คความถูกต้องก่อนเริ่มรังวัด'
      }
    ],
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนจากการตั้งดิ่ง (Centering Error): ลดได้โดยใช้ขากล้องที่มั่นคงและส่องตรวจสอบเลเซอร์หลังปรับระดับเสร็จสิ้น',
      'ความคลาดเคลื่อนแกนเล็ง (Collimation Error): บรรเทาได้โดยการวัดทั้งหน้าซ้าย (Face Left) และหน้าขวา (Face Right) แล้วเฉลี่ยค่า',
      'การหักเหของแสงในบรรยากาศและอุณหภูมิ (Atmospheric Correction): ต้องป้อนค่าความดันบรรยากาศ (mmHg/hPa) และอุณหภูมิ (°C) เข้าเครื่องเพื่อคำนวณค่าแก้ ppm'
    ],
    formulas: [
      {
        label: 'การคำนวณระยะราบ (Horizontal Distance)',
        formula: 'HD = SD * sin(ZA)',
        explanation: 'SD คือระยะเอียง (Slope Distance), ZA คือมุมดิ่งยอดฟ้า (Zenith Angle)'
      },
      {
        label: 'การคำนวณผลต่างระดับ (Elevation Difference)',
        formula: 'dH = SD * cos(ZA) + ih - th',
        explanation: 'ih คือความสูงกล้อง (Instrument Height), th คือความสูงเป้าปริซึม (Target Height)'
      }
    ]
  },
  {
    id: 'gnss-rtk-cors',
    title: 'การรังวัดดาวเทียม GNSS แบบ RTK และระบบโครงข่าย CORS-NTRIP',
    titleEn: 'GNSS Satellite Surveying, RTK Base-Rover & Network CORS',
    category: 'gnss-geodesy',
    categoryName: 'GNSS & Geodesy',
    summary: 'เทคนิคการรังวัดสัญญาณดาวเทียมหลายกลุ่มดาว (Multi-constellation) การส่งค่าแก้ Real-Time Kinematic และการเชื่อมต่อสถานี CORS ของกรมที่ดิน/กรมแผนที่ทหาร',
    badge: 'ระบบพิกัดสากล',
    iconName: 'Radio',
    courseRelation: '01218313 Satellite Surveying',
    workingPrinciple: [
      'เครื่องรับสัญญาณ GNSS รับคลื่นสัญญาณความถี่วิทยุจากกลุ่มดาวเทียม GPS (สหรัฐฯ), GLONASS (รัสเซีย), Galileo (ยุโรป) และ BeiDou (จีน)',
      'การรังวัดแบบ Real-Time Kinematic (RTK) ใช้สถานีแม่ข่าย (Base Station) ส่งค่าแก้คลื่นส่ง (Carrier Phase Corrections) ผ่านสัญญาณวิทยุ UHF หรืออินเทอร์เน็ต (NTRIP Protocol) ไปยังสถานีรังวัดเคลื่อนที่ (Rover)',
      'ระบบ Network CORS (เช่น Dol-CORS ของกรมที่ดิน และ RTSD-CORS) ใช้เครือข่ายสถานีอ้างอิงถาวรทั่วประเทศสร้างแบบจำลองค่าแก้เสมือน (VRS: Virtual Reference Station) ทำให้ความถูกต้องระดับเซนติเมตร'
    ],
    fieldProcedures: [
      {
        title: '1. การเลือกทำเลตั้งเสาอากาศรับสัญญาณ',
        details: 'เลือกพื้นที่เปิดโล่ง ไม่มีสิ่งกีดขวางมุมมองท้องฟ้าเหนือมุมเงย 10-15 องศา (Mask Angle) หลีกเลี่ยงเสาส่งไฟฟ้าแรงสูงและกำแพงกระจกสะท้อนคลื่น'
      },
      {
        title: '2. การเชื่อมต่อสัญญาณอินเทอร์เน็ตและ NTRIP',
        details: 'ใส่ SIM Card หรือต่อ Wi-Fi Hotspot ป้อนที่อยู่ Caster IP, Port, Mountpoint, Username/Password ของระบบ CORS'
      },
      {
        title: '3. รอสถานะการแก้ความคลุมเครือ (Ambiguity Status)',
        details: 'สังเกตสถานะจนกระทั่งเปลี่ยนจาก "Single" -> "Float" -> "Fixed" และตรวจเช็คค่าความแม่นยำทางราบ (HRMS < 2 cm) และทางดิ่ง (VRMS < 3 cm)',
        criticalCaution: 'ห้ามบันทึกค่าพิกัดขณะสถานะยังเป็น Float หรือ Single โดยเด็ดขาด'
      },
      {
        title: '4. การเช็คค่าพิกัดกับหมุดควบคุมเดิม (Check-in Control Point)',
        details: 'ก่อนและหลังเสร็จงาน ต้องนำ Rover ไปรังวัดหมุดควบคุมที่ทราบค่าพิกัดแน่นอน (Check Shot) เพื่อยืนยันว่าไม่มีความคลาดเคลื่อนจากสัญญาณเพี้ยน'
      }
    ],
    errorSourcesAndMitigation: [
      'ความคลาดเคลื่อนจากสิ่งกีดขวางและการสะท้อนหลายทิศทาง (Multipath): หลีกเลี่ยงวัตถุสะท้อนโลหะ/ผิวน้ำ ใช้เสาอากาศแบบ Choke Ring',
      'ค่าการกระจายเชิงเรขาคณิตของดาวเทียม (DOP: Dilution of Precision): ตรวจสอบให้ค่า PDOP < 2.5 และจำนวนดาวเทียม (Satellites in view) > 18 ดวง',
      'ความคลาดเคลื่อนบรรยากาศชั้นบรรยากาศไอโอโนสเฟียร์และโทรโพสเฟียร์: ระบบ Multi-frequency (L1, L2, L5) และสถานี CORS ช่วยหักล้างค่าความล่าช้าได้เกือบสมบูรณ์'
    ],
    formulas: [
      {
        label: 'การแปลงพิกัดวงรีเป็นความสูงทางออร์โทเมทริก',
        formula: 'H = h - N',
        explanation: 'H คือระดับความสูงจริงเหนือทะเลปานกลาง (Orthometric Height), h คือความสูงวงรี (Ellipsoidal Height จาก GNSS), N คือ Geoid Undulation จากแบบจำลอง TGM2017'
      }
    ]
  },
  {
    id: 'differential-leveling-procedure',
    title: 'การทำระดับเชิงอนุพันธ์และแบบตรวจสอบความคลาดเคลื่อน (Differential Leveling & Checks)',
    titleEn: 'Differential Leveling, 3-Wire Stadia & Loop Arithmetic Verification',
    category: 'differential-leveling',
    categoryName: 'Differential Leveling',
    summary: 'ขั้นตอนการรังวัดระดับปิดรอบ (Closed Loop) การทดสอบ Collimation Test (Two-Peg Test) และเกณฑ์ความคลาดเคลื่อนชั้นงานตามมาตรฐานกรมแผนที่ทหาร',
    badge: 'ความแม่นยำสูง',
    iconName: 'Ruler',
    courseRelation: '01218211 Surveying for Mapping / Term Project ระดับ',
    workingPrinciple: [
      'การทำระดับอาศัยแนวเล็งระดับราบ (Horizontal Line of Collimation) จากกล้องระดับอัตโนมัติ (Automatic Level) หรือกล้องระดับดิจิทัล (Digital Level) ส่องอ่านค่าไม้ระดับ (Level Staff)',
      'การอ่านไม้ระดับประกอบด้วย Backsight (BS: ส่องหลังไปยังจุดที่ทราบระดับ), Intermediate Foresight (IFS: ส่องกลางเก็บรายละเอียด), และ Foresight (FS: ส่องหน้าเพื่อย้ายจุดเปลี่ยนหมุด TP)',
      'วิธีคำนวณหลัก 2 วิธี: วิธียกกล้อง (Height of Instrument: HI = RL + BS, RL_new = HI - FS) และวิธีขึ้นลง (Rise and Fall Method)'
    ],
    fieldProcedures: [
      {
        title: '1. การตรวจสอบความขนานของแกนเล็ง (Two-Peg Test)',
        details: 'ทำก่อนนำกล้องออกสนามเสมอ โดยปักหมุดสองจุดห่างกัน 30-50 ม. ตั้งกล้องกึ่งกลางและตั้งกล้องชิดจุดหนึ่ง เพื่อหาค่าความคลาดเคลื่อน Collimation Error (c-value < 0.003 ม./100 ม.)'
      },
      {
        title: '2. กฎการรักษาระยะส่องหน้าและส่องหลังให้สมดุล (Balancing BS and FS Distances)',
        details: 'ในแต่ละสถานีตั้งกล้อง ต้องรักษาระยะส่อง BS และ FS ให้เท่ากันหรือใกล้เคียงกันที่สุด (ผลรวมต่างไม่เกิน 5-10 เมตรตลอดสายงาน)',
        criticalCaution: 'การรักษาระยะส่องเท่ากันจะช่วยหักล้างค่าคลาดเคลื่อนจากความโค้งของโลกและการหักเหของแสง (Curvature & Refraction) ได้อย่างสมบูรณ์'
      },
      {
        title: '3. การใช้หลักฐานรองรับไม้ระดับ (Turning Plate / Turtle)',
        details: 'จุดเปลี่ยน (Turning Point: TP) ทุกจุดต้องวางไม้ระดับบนเต่าเหล็กหล่อที่มั่นคงบนพื้น ห้ามวางบนกิ่งไม้หรือผิวดินนิ่ม'
      },
      {
        title: '4. การเช็คผลบวกทางคณิตศาสตร์ (Arithmetic Page Check)',
        details: 'ทุกหน้าสมุดจดระดับ ต้องคำนวณยืนยัน: ผลรวม BS - ผลรวม FS = ค่าระดับจุดสุดท้าย - ค่าระดับจุดแรก = ผลรวม Rise - ผลรวม Fall'
      }
    ],
    errorSourcesAndMitigation: [
      'ไม้ระดับเอียง: ใช้ลูกน้ำฟองกลมติดไม้ระดับ และฝึกส่ายไม้ระดับ (Waving the staff) เพื่ออ่านจุดต่ำสุด',
      'ดินทรุดใต้ขากล้อง: หลีกเลี่ยงการเหยียบใกล้ขากล้อง และเลือกพื้นดินแน่น',
      'ความร้อนระยิบระยับ (Heat Shimmer): หลีกเลี่ยงการส่องต่ำกว่า 0.5 เมตรจากพื้นถนนคอนกรีตที่มีไอร้อน'
    ],
    formulas: [
      {
        label: 'เกณฑ์ความคลาดเคลื่อนคลาดเคลื่อนปิดรอบ (Allowable Closure Error)',
        formula: 'C = k * sqrt(K)',
        explanation: 'K คือระยะทางไป-กลับรวมเป็นกิโลเมตร, k = 4 มม. (ชั้น 1), 8 มม. (ชั้น 2), 12 มม. (ชั้น 3), 24 มม. (งานก่อสร้างทั่วไป)'
      }
    ]
  },
  {
    id: 'uav-drone-photogrammetry',
    title: 'การสำรวจรังวัดด้วยอากาศยานไร้คนขับและโฟโตแกรมเมตรี (UAV Photogrammetry & GCP Planning)',
    titleEn: 'UAV Drone Mapping, GCP Distribution & Orthophoto Generation',
    category: 'drone-photogrammetry',
    categoryName: 'Drone & Photogrammetry',
    summary: 'การวางแผนเส้นทางบินถ่ายภาพทางอากาศ ความละเอียดจุดภาพภาคพื้นดิน (GSD) การวางหมุดควบคุมภาคพื้นดิน (GCP & Checkpoint) และการประมวลผล Structure from Motion (SfM)',
    badge: 'เทคโนโลยีสมัยใหม่',
    iconName: 'Camera',
    courseRelation: '01218321 Photogrammetry I / 01218322 Remote Sensing I',
    workingPrinciple: [
      'โดรนบินถ่ายภาพถ่ายทางอากาศแบบซ้อนทับต่อเนื่องตามแนวบิน (Flight Grid Path)',
      'การซ้อนทับภาพ: ซ้อนทับตามแนวบิน (Forward Overlap) ≥ 75-80% และซ้อนทับระหว่างแนวบิน (Side Overlap) ≥ 65-70% เพื่อให้จุดเอกลักษณ์ (Tie Points) ปรากฏในหลายๆ ภาพ',
      'อัลกอริทึม Structure from Motion (SfM) และ Multi-View Stereo (MVS) คำนวณแบบจำลองคลาวด์พอยต์ 3 มิติ (Dense Point Cloud), แบบจำลองระดับสูงเชิงเลข (DEM/DSM) และภาพออร์โธโฟโต (True Orthomosaic)'
    ],
    fieldProcedures: [
      {
        title: '1. การคำนวณและตั้งค่าความสูงการบินตามค่า GSD',
        details: 'คำนวณ Ground Sampling Distance (GSD) ให้สอดคล้องกับมาตราส่วนแผนที่ เช่น งานแผนที่ 1:1,000 ต้องการ GSD ≤ 2-3 cm/pixel'
      },
      {
        title: '2. การวางและรังวัดหมุดควบคุมภาพถ่าย (GCPs & Checkpoints)',
        details: 'พ่นเครื่องหมายเป้าขาว-ดำ (GCP Target) ขนาด 40x40 ซม. กระจายตามขอบพื้นที่ มุมแปลง และกึ่งกลาง อย่างน้อย 5-8 จุด และแยกหมุด Checkpoint 20-30% ไว้วัดความถูกต้องอิสระ',
        criticalCaution: 'รังวัดพิกัด GCP ด้วย GNSS RTK หรือ Total Station เพื่อความแม่นยำสูงสุดในระดับมิลลิเมตร'
      },
      {
        title: '3. การตรวจสอบสภาพอากาศและดวงอาทิตย์',
        details: 'หลีกเลี่ยงการบินเวลาฝนตก ลมกระโชกแรง (> 8 m/s) หรือช่วงเที่ยงที่เงาสะท้อนน้ำจ้า ควรบินช่วงแสงสม่ำเสมอ'
      }
    ],
    errorSourcesAndMitigation: [
      'การยืดหดของพิกเซลบริเวณขอบเลนส์ (Lens Distortion): ประมวลผลแบบ Self-Calibration หรือ Calibrate กล้องล่วงหน้า',
      'Rolling Shutter Distortion: ควรใช้โดรนที่มีเซนเซอร์แบบ Mechanical Shutter (เช่น Phantom 4 RTK, Mavic 3 Enterprise)',
      'จุดอ้างอิง GCP ขยับ: ตอกหมุดคอนกรีตแน่นหนา และถ่ายภาพยืนยันตำแหน่งเป้า'
    ],
    formulas: [
      {
        label: 'การคำนวณค่า GSD (Ground Sampling Distance)',
        formula: 'GSD = (H * Sw) / (F * Iw)',
        explanation: 'H = ความสูงบินเหนือพื้น (m), Sw = ความกว้างเซนเซอร์กล้อง (mm), F = ความยาวโฟกัส (mm), Iw = ความกว้างภาพพิกเซล (px)'
      }
    ]
  },
  {
    id: 'lidar-scan-to-bim-qaqc',
    title: 'การสำรวจสแกน 3 มิติด้วย LiDAR และการตรวจสอบคุณภาพ Scan-to-BIM (LiDAR & BIM QA/QC)',
    titleEn: '3D Terrestrial & SLAM LiDAR, Scan-to-BIM QA/QC Workflow',
    category: 'lidar-scan-bim',
    categoryName: 'LiDAR & Scan-to-BIM',
    summary: 'สถาปัตยกรรมกระบวนการสแกนเก็บข้อมูลพอยต์คลาวด์ 3 มิติ การประกบเชื่อมต่อกลุ่มก้อนข้อมูล (Registration) และการตรวจเช็คความถูกต้องเชิงเรขาคณิตตามแบบโมเดล BIM',
    badge: 'วิจัยปี 4 / วิศวกรรมขั้นสูง',
    iconName: 'Boxes',
    courseRelation: 'Project ปี 4 / 01218495 โครงงานวิศวกรรมสำรวจ',
    workingPrinciple: [
      'เครื่องสแกน 3D Terrestrial Laser Scanner (TLS) ยิงลำแสงเลเซอร์นับล้านจุดต่อวินาทีด้วยหลักการ Time-of-Flight (ToF) หรือ Phase-Shift เพื่อสร้างกลุ่มพิกัด 3 มิติ (Point Cloud: X, Y, Z, Intensity, RGB)',
      'เทคโนโลยี Handheld SLAM LiDAR (Simultaneous Localization and Mapping) คำนวณตำแหน่งตัวเครื่องไปพร้อมกับการทำแผนที่แบบเรียลไทม์ เหมาะกับพื้นที่ภายในอาคารและทางเดินแคบ',
      'การเชื่อมต่อภาพสแกน (Point Cloud Registration) อาศัยเป้าอ้างอิงทรงกลม (Spherical Targets), เป้าตารางหมากรุก (Checkerboard), หรืออัลกอริทึม Cloud-to-Cloud / ICP (Iterative Closest Point)',
      'กระบวนการ Scan-to-BIM QA/QC เปรียบเทียบความแตกต่างเชิงมิติระหว่างพอยต์คลาวด์จากสภาพจริง (As-Built) กับโมเดลอาคาร BIM (As-Designed) ในรูปแบบ Heatmap Deviation'
    ],
    fieldProcedures: [
      {
        title: '1. การวางแผนตำแหน่งจุดตั้งเครื่องสแกน (Scan Station Planning)',
        details: 'กำหนดจุดตั้งสแกนให้มีพื้นที่ซ้อนทับกันอย่างน้อย 30-40% เพื่อให้อัลกอริทึม ICP หาจุดประกบได้สมบูรณ์ และป้องกันจุดบอด (Shadow areas)'
      },
      {
        title: '2. การวางเป้าอ้างอิงเชื่อมต่อพิกัดโครงข่าย (Georeferencing Targets)',
        details: 'ติดตั้งเป้า Checkerboard บนผนังหรือเสาอาคาร และใช้ Total Station ยิงรังวัดพิกัดของเป้าเพื่อตรึงพอยต์คลาวด์ลงในระบบพิกัดจริงของโครงการ'
      },
      {
        title: '3. การสแกนเก็บข้อมูลและความละเอียด (Resolution Setup)',
        details: 'เลือกโหมดความละเอียดสูง (Point spacing 3-6 mm ที่ระยะ 10 เมตร) สำหรับโครงสร้างหลัก และเปิดกล้องถ่ายภาพ HDR เพื่อเก็บสีจริง'
      },
      {
        title: '4. การประมวลผลตรวจสอบค่าความคลาดเคลื่อน (QA/QC Verification)',
        details: 'ตรวจสอบค่า Mean Error ของการเชื่อมสแกน (Registration Error < 3-5 mm) และประเมินค่าความคลาดเคลื่อนเชิงสถิติ (RMSE)'
      }
    ],
    errorSourcesAndMitigation: [
      'พื้นผิวกระจกเงาและน้ำ (Specular Reflection): เลเซอร์ทะลุผ่านหรือสะท้อนกระเจิง ต้องตัดทิ้งในขั้นตอน Noise Filtering',
      'ความสั่นสะเทือนของขากล้องขณะสแกน: หลีกเลี่ยงการเดินใกล้เครื่องสแกนบนพื้นสะพานหรือนั่งร้าน',
      'การดริฟท์ของเซนเซอร์ SLAM (Trajectory Drift): ต้องเดินวนกลับมาปิดลูป (Loop Closure) ที่จุดเริ่มต้นเดิมเสมอ'
    ],
    formulas: [
      {
        label: 'ค่าความคลาดเคลื่อนกำลังสองเฉลี่ย (Root Mean Square Error: RMSE)',
        formula: 'RMSE = sqrt( sum( (Z_scan - Z_bim)^2 ) / N )',
        explanation: 'วัดความคลาดเคลื่อนเชิงตำแหน่งเฉลี่ยระหว่างจุดสแกนจริงกับระนาบโมเดล BIM'
      }
    ]
  }
];
