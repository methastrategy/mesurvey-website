import {
  DirectedRiverSegment,
  DamTelemetryStation,
  RiverGaugeStation,
  BasinFlowTourStep,
  WildfireHotspotCluster
} from '../types/disaster';

/**
 * 15 Major Thai River Basins with Strictly Directed Polylines (Upstream -> Downstream)
 * Coordinates [lat, lng] are ordered from headwaters (higher elevation) to mouth/confluence (lower elevation)
 * to drive 60 FPS particle flow kinematics in RiverFlowCanvas.
 */
export const THAILAND_RIVER_SEGMENTS: DirectedRiverSegment[] = [
  {
    id: 'river-ping',
    nameTh: 'แม่น้ำปิง',
    nameEn: 'Ping River',
    basin: 'ลุ่มน้ำปิง',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 760,
    headwaterTh: 'ดอยถ้วย ทิวเขาผีปันน้ำ อ.เชียงดาว จ.เชียงใหม่',
    mouthTh: 'บรรจบแม่น้ำน่านเป็นแม่น้ำเจ้าพระยาที่ปากน้ำโพ จ.นครสวรรค์',
    provinces: ['เชียงใหม่', 'ลำพูน', 'ตาก', 'กำแพงเพชร', 'นครสวรรค์'],
    upstreamIds: ['river-wang'],
    downstreamId: 'river-chaophraya',
    bankfullCapacityCms: 1800,
    linkedGaugeId: 'gauge-P1',
    upstreamElevationMsl: 420.0,
    downstreamElevationMsl: 23.5,
    coordinates: [
      [19.366, 98.964], // เชียงดาว
      [19.112, 98.948], // แม่แตง
      [18.788, 99.004], // สถานี P.1 สะพานนวรัฐ เชียงใหม่
      [18.567, 98.921], // ลำพูน / ป่าซาง
      [17.982, 98.685], // ฮอด / ดอยเต่า
      [17.242, 98.972], // เขื่อนภูมิพล จ.ตาก
      [16.884, 99.124], // เมืองตาก
      [16.483, 99.522], // กำแพงเพชร
      [15.982, 99.815], // ขาณุวรลักษบุรี
      [15.698, 100.142] // ปากน้ำโพ จ.นครสวรรค์ (บรรจบแม่น้ำน่าน)
    ]
  },
  {
    id: 'river-wang',
    nameTh: 'แม่น้ำวัง',
    nameEn: 'Wang River',
    basin: 'ลุ่มน้ำวัง',
    streamOrder: 4,
    waterwayType: 'tributary',
    lengthKm: 435,
    headwaterTh: 'ทิวเขาผีปันน้ำ อ.วังเหนือ จ.ลำปาง',
    mouthTh: 'ไหลลงแม่น้ำปิงที่ อ.บ้านตาก จ.ตาก',
    provinces: ['ลำปาง', 'ตาก'],
    upstreamIds: [],
    downstreamId: 'river-ping',
    bankfullCapacityCms: 850,
    linkedGaugeId: 'gauge-P1',
    upstreamElevationMsl: 380.0,
    downstreamElevationMsl: 135.0,
    coordinates: [
      [19.145, 99.622], // วังเหนือ จ.ลำปาง
      [18.724, 99.589], // แจ้ห่ม
      [18.526, 99.645], // เขื่อนกิ่วลม
      [18.288, 99.492], // เมืองลำปาง
      [17.984, 99.328], // เกาะคา / สบปราบ
      [17.615, 99.218], // เถิน
      [17.362, 99.085], // แม่พริก
      [17.125, 99.048]  // สามเงา / บ้านตาก จ.ตาก (บรรจบแม่น้ำปิง)
    ]
  },
  {
    id: 'river-yom',
    nameTh: 'แม่น้ำยม',
    nameEn: 'Yom River',
    basin: 'ลุ่มน้ำยม',
    streamOrder: 4,
    waterwayType: 'tributary',
    lengthKm: 735,
    headwaterTh: 'ดอยขุนยม ทิวเขาผีปันน้ำ อ.ปง จ.พะเยา',
    mouthTh: 'ไหลลงแม่น้ำน่านที่ อ.ชุมแสง จ.นครสวรรค์',
    provinces: ['พะเยา', 'แพร่', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร', 'นครสวรรค์'],
    upstreamIds: [],
    downstreamId: 'river-nan',
    bankfullCapacityCms: 1000,
    linkedGaugeId: 'gauge-Y17',
    upstreamElevationMsl: 310.0,
    downstreamElevationMsl: 24.0,
    coordinates: [
      [19.152, 100.285], // ปง จ.พะเยา
      [18.612, 100.168], // สอง จ.แพร่
      [18.145, 100.128], // เมืองแพร่ (Y.1C)
      [17.785, 99.968],  // วังชิ้น
      [17.315, 99.825],  // สวรรคโลก
      [17.008, 99.822],  // เมืองสุโขทัย
      [16.528, 100.162], // สามง่าม จ.พิจิตร (Y.17)
      [16.122, 100.258], // โพทะเล
      [15.885, 100.265]  // ชุมแสง จ.นครสวรรค์ (บรรจบแม่น้ำน่าน)
    ]
  },
  {
    id: 'river-nan',
    nameTh: 'แม่น้ำน่าน',
    nameEn: 'Nan River',
    basin: 'ลุ่มน้ำน่าน',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 845,
    headwaterTh: 'ดอยภูแว ทิวเขาหลวงพระบาง อ.บ่อเกลือ จ.น่าน',
    mouthTh: 'บรรจบแม่น้ำปิงเป็นแม่น้ำเจ้าพระยาที่ปากน้ำโพ จ.นครสวรรค์',
    provinces: ['น่าน', 'อุตรดิตถ์', 'พิษณุโลก', 'พิจิตร', 'นครสวรรค์'],
    upstreamIds: ['river-yom'],
    downstreamId: 'river-chaophraya',
    bankfullCapacityCms: 2200,
    linkedGaugeId: 'gauge-N67',
    upstreamElevationMsl: 360.0,
    downstreamElevationMsl: 23.5,
    coordinates: [
      [19.228, 100.782], // ท่าวังผา จ.น่าน
      [18.775, 100.778], // เมืองน่าน
      [18.312, 100.742], // เวียงสา
      [17.764, 100.562], // เขื่อนสิริกิติ์ จ.อุตรดิตถ์
      [17.618, 100.098], // เมืองอุตรดิตถ์
      [17.185, 100.182], // พิชัย / พรหมพิราม
      [16.821, 100.262], // เมืองพิษณุโลก
      [16.432, 100.348], // เมืองพิจิตร
      [16.052, 100.312], // บางมูลนาก (N.67)
      [15.885, 100.265], // ชุมแสง
      [15.698, 100.142]  // ปากน้ำโพ จ.นครสวรรค์
    ]
  },
  {
    id: 'river-sakaekrang',
    nameTh: 'แม่น้ำสะแกกรัง',
    nameEn: 'Sakae Krang River',
    basin: 'ลุ่มน้ำสะแกกรัง',
    streamOrder: 4,
    waterwayType: 'tributary',
    lengthKm: 225,
    headwaterTh: 'เขาโมโกจู อุทยานแห่งชาติแม่วงก์ จ.กำแพงเพชร',
    mouthTh: 'ไหลลงแม่น้ำเจ้าพระยาที่ อ.เมืองอุทัยธานี จ.อุทัยธานี',
    provinces: ['กำแพงเพชร', 'นครสวรรค์', 'อุทัยธานี'],
    upstreamIds: [],
    downstreamId: 'river-chaophraya',
    bankfullCapacityCms: 620,
    linkedGaugeId: 'gauge-C2',
    upstreamElevationMsl: 165.0,
    downstreamElevationMsl: 19.5,
    coordinates: [
      [15.915, 99.325], // แม่วงก์
      [15.785, 99.645], // ลาดยาว จ.นครสวรรค์
      [15.542, 99.885], // สว่างอารมณ์ / ทัพทัน
      [15.382, 100.025], // เมืองอุทัยธานี
      [15.325, 100.082]  // บรรจบแม่น้ำเจ้าพระยา อ.มโนรมย์
    ]
  },
  {
    id: 'river-chaophraya',
    nameTh: 'แม่น้ำเจ้าพระยา',
    nameEn: 'Chao Phraya River',
    basin: 'ลุ่มน้ำเจ้าพระยา',
    streamOrder: 6,
    waterwayType: 'river',
    lengthKm: 372,
    headwaterTh: 'ปากน้ำโพ จ.นครสวรรค์ (จุดบรรจบแม่น้ำปิงและแม่น้ำน่าน)',
    mouthTh: 'ไหลลงสู่อ่าวไทยที่ปากน้ำ อ.เมืองสมุทรปราการ จ.สมุทรปราการ',
    provinces: [
      'นครสวรรค์',
      'อุทัยธานี',
      'ชัยนาท',
      'สิงห์บุรี',
      'อ่างทอง',
      'พระนครศรีอยุธยา',
      'ปทุมธานี',
      'นนทบุรี',
      'กรุงเทพมหานคร',
      'สมุทรปราการ'
    ],
    upstreamIds: ['river-ping', 'river-nan', 'river-sakaekrang', 'river-pasak', 'canal-rangsit', 'canal-prem'],
    downstreamId: null,
    bankfullCapacityCms: 3500,
    linkedGaugeId: 'gauge-C2',
    upstreamElevationMsl: 23.5,
    downstreamElevationMsl: 0.5,
    coordinates: [
      [15.698, 100.142], // ปากน้ำโพ จ.นครสวรรค์ (C.2)
      [15.442, 100.132], // โกรกพระ / มโนรมย์
      [15.158, 100.188], // เขื่อนเจ้าพระยา จ.ชัยนาท (C.13)
      [14.888, 100.405], // เมืองสิงห์บุรี
      [14.588, 100.455], // เมืองอ่างทอง
      [14.352, 100.565], // พระนครศรีอยุธยา (S.5)
      [14.205, 100.508], // บางไทร (C.29A)
      [14.018, 100.532], // ปทุมธานี
      [13.842, 100.492], // นนทบุรี
      [13.752, 100.494], // กรุงเทพมหานคร (สะพานพุทธ)
      [13.595, 100.588]  // ปากน้ำสมุทรปราการ (อ่าวไทย)
    ]
  },
  {
    id: 'river-thachin',
    nameTh: 'แม่น้ำท่าจีน',
    nameEn: 'Tha Chin River',
    basin: 'ลุ่มน้ำท่าจีน',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 325,
    headwaterTh: 'แยกจากแม่น้ำเจ้าพระยาที่ปากคลองมะขามเฒ่า อ.วัดสิงห์ จ.ชัยนาท',
    mouthTh: 'ไหลลงสู่อ่าวไทยที่ อ.เมืองสมุทรสาคร จ.สมุทรสาคร',
    provinces: ['ชัยนาท', 'สุพรรณบุรี', 'นครปฐม', 'สมุทรสาคร'],
    upstreamIds: ['river-chaophraya'],
    downstreamId: null,
    bankfullCapacityCms: 750,
    linkedGaugeId: 'gauge-C13',
    upstreamElevationMsl: 17.5,
    downstreamElevationMsl: 0.5,
    coordinates: [
      [15.225, 100.075], // ปากคลองมะขามเฒ่า อ.วัดสิงห์ จ.ชัยนาท
      [14.852, 100.115], // เดิมบางนางบวช / สามชุก
      [14.474, 100.122], // เมืองสุพรรณบุรี
      [14.185, 100.168], // บางปลาม้า / สองพี่น้อง
      [14.012, 100.185], // บางเลน จ.นครปฐม
      [13.795, 100.188], // นครชัยศรี / สามพราน
      [13.528, 100.272]  // มหาชัย จ.สมุทรสาคร (อ่าวไทย)
    ]
  },
  {
    id: 'river-pasak',
    nameTh: 'แม่น้ำป่าสัก',
    nameEn: 'Pa Sak River',
    basin: 'ลุ่มน้ำป่าสัก',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 513,
    headwaterTh: 'เทือกเขาเพชรบูรณ์ตะวันออก อ.ด่านซ้าย จ.เลย',
    mouthTh: 'บรรจบแม่น้ำเจ้าพระยาที่ป้อมเพชร จ.พระนครศรีอยุธยา',
    provinces: ['เลย', 'เพชรบูรณ์', 'ลพบุรี', 'สระบุรี', 'พระนครศรีอยุธยา'],
    upstreamIds: ['canal-chainat-pasak'],
    downstreamId: 'river-chaophraya',
    bankfullCapacityCms: 900,
    linkedGaugeId: 'gauge-S5',
    upstreamElevationMsl: 185.0,
    downstreamElevationMsl: 3.8,
    coordinates: [
      [16.785, 101.215], // หล่มสัก จ.เพชรบูรณ์
      [16.418, 101.158], // เมืองเพชรบูรณ์
      [15.748, 101.072], // วิเชียรบุรี / ศรีเทพ
      [15.325, 101.045], // ชัยบาดาล
      [14.864, 101.066], // เขื่อนป่าสักชลสิทธิ์ จ.ลพบุรี
      [14.528, 100.912], // แก่งคอย / เมืองสระบุรี
      [14.552, 100.728], // เขื่อนพระราม 6 อ.ท่าเรือ
      [14.352, 100.565]  // ป้อมเพชร จ.พระนครศรีอยุธยา (บรรจบแม่น้ำเจ้าพระยา)
    ]
  },
  {
    id: 'canal-chainat-pasak',
    nameTh: 'คลองชัยนาท-ป่าสัก',
    nameEn: 'Chai Nat - Pa Sak Canal',
    basin: 'ลุ่มน้ำเจ้าพระยา-ป่าสัก',
    streamOrder: 3,
    waterwayType: 'canal',
    lengthKm: 132,
    headwaterTh: 'ปตร.มโนรมย์ แยกจากแม่น้ำเจ้าพระยาเหนือเขื่อนเจ้าพระยา จ.ชัยนาท',
    mouthTh: 'บรรจบแม่น้ำป่าสักเหนือเขื่อนพระราม 6 อ.ท่าเรือ จ.พระนครศรีอยุธยา',
    provinces: ['ชัยนาท', 'นครสวรรค์', 'ลพบุรี', 'สระบุรี', 'พระนครศรีอยุธยา'],
    upstreamIds: ['river-chaophraya'],
    downstreamId: 'river-pasak',
    bankfullCapacityCms: 280,
    linkedGaugeId: 'gauge-C13',
    upstreamElevationMsl: 16.8,
    downstreamElevationMsl: 5.5,
    coordinates: [
      [15.275, 100.155], // ปตร.มโนรมย์ จ.ชัยนาท
      [15.055, 100.425], // บ้านหมี่ จ.ลพบุรี
      [14.812, 100.625], // เมืองลพบุรี
      [14.645, 100.715], // บ้านหมอ จ.สระบุรี
      [14.555, 100.725]  // ท่าเรือ จ.พระนครศรีอยุธยา (ลงแม่น้ำป่าสัก)
    ]
  },
  {
    id: 'canal-rangsit',
    nameTh: 'คลองรังสิตประยูรศักดิ์',
    nameEn: 'Rangsit Prayurasakdi Canal',
    basin: 'ลุ่มน้ำเจ้าพระยา-บางปะกง',
    streamOrder: 3,
    waterwayType: 'canal',
    lengthKm: 56,
    headwaterTh: 'คลองระพีพัฒน์แยกใต้ อ.องครักษ์ จ.นครนายก',
    mouthTh: 'ปตร.จุฬาลงกรณ์ ไหลลงแม่น้ำเจ้าพระยา อ.เมืองปทุมธานี จ.ปทุมธานี',
    provinces: ['นครนายก', 'ปทุมธานี'],
    upstreamIds: ['river-pasak'],
    downstreamId: 'river-chaophraya',
    bankfullCapacityCms: 180,
    linkedGaugeId: 'gauge-C29A',
    upstreamElevationMsl: 4.5,
    downstreamElevationMsl: 1.2,
    coordinates: [
      [14.118, 101.002], // องครักษ์ จ.นครนายก
      [14.065, 100.845], // ธัญบุรี คลอง 10
      [14.018, 100.715], // ธัญบุรี คลอง 5
      [13.988, 100.615], // รังสิต คลอง 1
      [13.982, 100.538]  // ปตร.จุฬาลงกรณ์ ลงแม่น้ำเจ้าพระยา จ.ปทุมธานี
    ]
  },
  {
    id: 'canal-prem',
    nameTh: 'คลองเปรมประชากร',
    nameEn: 'Prem Prachakon Canal',
    basin: 'ลุ่มน้ำเจ้าพระยา',
    streamOrder: 3,
    waterwayType: 'canal',
    lengthKm: 51,
    headwaterTh: 'แยกจากแม่น้ำเจ้าพระยาที่ ต.เกาะใหญ่ อ.บางปะอิน จ.พระนครศรีอยุธยา',
    mouthTh: 'ไหลลงแม่น้ำเจ้าพระยาที่เกียกกาย เขตดุสิต กรุงเทพมหานคร',
    provinces: ['พระนครศรีอยุธยา', 'ปทุมธานี', 'กรุงเทพมหานคร'],
    upstreamIds: ['river-chaophraya'],
    downstreamId: 'river-chaophraya',
    bankfullCapacityCms: 95,
    linkedGaugeId: 'gauge-C29A',
    upstreamElevationMsl: 3.2,
    downstreamElevationMsl: 0.8,
    coordinates: [
      [14.212, 100.572], // บางปะอิน จ.พระนครศรีอยุธยา
      [14.075, 100.585], // เชียงรากน้อย จ.ปทุมธานี
      [13.962, 100.592], // หลักหก / ดอนเมือง
      [13.855, 100.562], // หลักสี่ / จตุจักร
      [13.792, 100.515]  // เกียกกาย เขตดุสิต กทม.
    ]
  },
  {
    id: 'canal-saensaep',
    nameTh: 'คลองแสนแสบ',
    nameEn: 'Saen Saep Canal',
    basin: 'ลุ่มน้ำเจ้าพระยา-บางปะกง',
    streamOrder: 3,
    waterwayType: 'canal',
    lengthKm: 72,
    headwaterTh: 'คลองมหานาค-สะพานผ่านฟ้าลีลาศ กรุงเทพมหานคร',
    mouthTh: 'ไหลลงแม่น้ำบางปะกงที่ อ.บางน้ำเปรี้ยว จ.ฉะเชิงเทรา',
    provinces: ['กรุงเทพมหานคร', 'ฉะเชิงเทรา'],
    upstreamIds: ['river-chaophraya'],
    downstreamId: 'river-bangpakong',
    bankfullCapacityCms: 140,
    linkedGaugeId: 'gauge-B1',
    upstreamElevationMsl: 2.2,
    downstreamElevationMsl: 0.6,
    coordinates: [
      [13.755, 100.506], // ผ่านฟ้า / ประตูน้ำ กทม.
      [13.762, 100.642], // บางกะปิ
      [13.812, 100.725], // มีนบุรี
      [13.845, 100.858], // หนองจอก
      [13.852, 101.085], // บางน้ำเปรี้ยว
      [13.725, 101.115]  // บรรจบแม่น้ำบางปะกง จ.ฉะเชิงเทรา
    ]
  },
  {
    id: 'river-khwaeyai',
    nameTh: 'แม่น้ำแควใหญ่',
    nameEn: 'Khwae Yai River',
    basin: 'ลุ่มน้ำแม่กลอง',
    streamOrder: 4,
    waterwayType: 'tributary',
    lengthKm: 380,
    headwaterTh: 'ทิวเขาถนนธงชัย อ.อุ้มผาง จ.ตาก',
    mouthTh: 'บรรจบแม่น้ำแควน้อยเป็นแม่น้ำแม่กลองที่ปากแพรก อ.เมืองกาญจนบุรี',
    provinces: ['ตาก', 'กาญจนบุรี'],
    upstreamIds: [],
    downstreamId: 'river-maeklong',
    bankfullCapacityCms: 1400,
    linkedGaugeId: 'gauge-K37',
    upstreamElevationMsl: 240.0,
    downstreamElevationMsl: 28.0,
    coordinates: [
      [15.325, 98.925], // อุ้มผาง / ป่าต้นน้ำตะวันตก
      [14.852, 99.062], // ศรีสวัสดิ์
      [14.408, 99.128], // เขื่อนศรีนครินทร์ จ.กาญจนบุรี
      [14.212, 99.318], // เขื่อนท่าทุ่งนา
      [14.005, 99.528]  // ปากแพรก เมืองกาญจนบุรี (K.37)
    ]
  },
  {
    id: 'river-khwaenoi',
    nameTh: 'แม่น้ำแควน้อย',
    nameEn: 'Khwae Noi River',
    basin: 'ลุ่มน้ำแม่กลอง',
    streamOrder: 4,
    waterwayType: 'tributary',
    lengthKm: 315,
    headwaterTh: 'ทิวเขาตะนาวศรี ด่านเจดีย์สามองค์ อ.สังขละบุรี จ.กาญจนบุรี',
    mouthTh: 'บรรจบแม่น้ำแควใหญ่เป็นแม่น้ำแม่กลองที่ปากแพรก อ.เมืองกาญจนบุรี',
    provinces: ['กาญจนบุรี'],
    upstreamIds: [],
    downstreamId: 'river-maeklong',
    bankfullCapacityCms: 1200,
    linkedGaugeId: 'gauge-K37',
    upstreamElevationMsl: 215.0,
    downstreamElevationMsl: 28.0,
    coordinates: [
      [15.125, 98.458], // สังขละบุรี
      [14.798, 98.597], // เขื่อนวชิราลงกรณ อ.ทองผาภูมิ
      [14.425, 98.855], // ไทรโยค
      [14.112, 99.245], // ปราสาทเมืองสิงห์
      [14.005, 99.528]  // ปากแพรก เมืองกาญจนบุรี (K.37)
    ]
  },
  {
    id: 'river-maeklong',
    nameTh: 'แม่น้ำแม่กลอง',
    nameEn: 'Mae Klong River',
    basin: 'ลุ่มน้ำแม่กลอง',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 132,
    headwaterTh: 'ปากแพรก อ.เมืองกาญจนบุรี (จุดบรรจบแม่น้ำแควใหญ่และแม่น้ำแควน้อย)',
    mouthTh: 'ไหลลงสู่อ่าวไทยที่ปากน้ำแม่กลอง อ.เมืองสมุทรสงคราม',
    provinces: ['กาญจนบุรี', 'ราชบุรี', 'สมุทรสงคราม'],
    upstreamIds: ['river-khwaeyai', 'river-khwaenoi'],
    downstreamId: null,
    bankfullCapacityCms: 2200,
    linkedGaugeId: 'gauge-K37',
    upstreamElevationMsl: 28.0,
    downstreamElevationMsl: 0.5,
    coordinates: [
      [14.005, 99.528], // เมืองกาญจนบุรี (K.37)
      [13.958, 99.635], // เขื่อนแม่กลอง อ.ท่าม่วง
      [13.812, 99.875], // บ้านโป่ง
      [13.688, 99.845], // โพธาราม
      [13.538, 99.818], // เมืองราชบุรี
      [13.428, 99.955], // อัมพวา
      [13.385, 100.002] // ปากน้ำแม่กลอง จ.สมุทรสงคราม (อ่าวไทย)
    ]
  },
  {
    id: 'river-phetchaburi',
    nameTh: 'แม่น้ำเพชรบุรี',
    nameEn: 'Phetchaburi River',
    basin: 'ลุ่มน้ำเพชรบุรี-ประจวบคีรีขันธ์',
    streamOrder: 4,
    waterwayType: 'river',
    lengthKm: 210,
    headwaterTh: 'เทือกเขาตะนาวศรี อุทยานแห่งชาติแก่งกระจาน จ.เพชรบุรี',
    mouthTh: 'ไหลลงสู่อ่าวไทยที่ปากอ่าวบ้านแหลม อ.บ้านแหลม จ.เพชรบุรี',
    provinces: ['เพชรบุรี'],
    upstreamIds: [],
    downstreamId: null,
    bankfullCapacityCms: 550,
    linkedGaugeId: 'gauge-K37',
    upstreamElevationMsl: 145.0,
    downstreamElevationMsl: 0.5,
    coordinates: [
      [12.825, 99.425], // ป่าต้นน้ำแก่งกระจาน
      [12.915, 99.628], // เขื่อนแก่งกระจาน
      [12.785, 99.815], // ท่ายาง / เขื่อนเพชร
      [13.112, 99.945], // เมืองเพชรบุรี
      [13.252, 99.985]  // บ้านแหลม จ.เพชรบุรี (อ่าวไทย)
    ]
  },
  {
    id: 'river-bangpakong',
    nameTh: 'แม่น้ำบางปะกง',
    nameEn: 'Bang Pakong River',
    basin: 'ลุ่มน้ำบางปะกง',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 230,
    headwaterTh: 'จุดบรรจบแม่น้ำพระปรงและแม่น้ำหนุมาน อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mouthTh: 'ไหลลงสู่อ่าวไทยที่ อ.บางปะกง จ.ฉะเชิงเทรา',
    provinces: ['ปราจีนบุรี', 'นครนายก', 'ฉะเชิงเทรา'],
    upstreamIds: ['canal-saensaep'],
    downstreamId: null,
    bankfullCapacityCms: 1100,
    linkedGaugeId: 'gauge-B1',
    upstreamElevationMsl: 45.0,
    downstreamElevationMsl: 0.5,
    coordinates: [
      [13.988, 101.718], // กบินทร์บุรี จ.ปราจีนบุรี (B.1)
      [14.052, 101.372], // เมืองปราจีนบุรี
      [13.918, 101.168], // บ้านสร้าง (บรรจบแม่น้ำนครนายก)
      [13.765, 101.125], // บางคล้า
      [13.688, 101.072], // เมืองฉะเชิงเทรา
      [13.485, 100.985]  // ปากอ่าวบางปะกง (อ่าวไทย)
    ]
  },
  {
    id: 'river-chi',
    nameTh: 'แม่น้ำชี',
    nameEn: 'Chi River',
    basin: 'ลุ่มน้ำชี',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 1030,
    headwaterTh: 'เทือกเขาเพชรบูรณ์ อ.หนองบัวแดง จ.ชัยภูมิ',
    mouthTh: 'ไหลลงแม่น้ำมูลที่ อ.วารินชำราบ จ.อุบลราชธานี',
    provinces: ['ชัยภูมิ', 'ขอนแก่น', 'มหาสารคาม', 'ร้อยเอ็ด', 'ยโสธร', 'ศรีสะเกษ', 'อุบลราชธานี'],
    upstreamIds: [],
    downstreamId: 'river-mun',
    bankfullCapacityCms: 1600,
    linkedGaugeId: 'gauge-M7',
    upstreamElevationMsl: 260.0,
    downstreamElevationMsl: 112.0,
    coordinates: [
      [16.125, 101.625], // เทือกเขาเพชรบูรณ์ จ.ชัยภูมิ
      [15.805, 102.032], // เมืองชัยภูมิ
      [16.245, 102.785], // ชนบท / เมืองขอนแก่น
      [16.452, 103.052], // โกสุมพิสัย / บรรจบลำน้ำพอง (เขื่อนอุบลรัตน์)
      [16.185, 103.302], // เมืองมหาสารคาม
      [16.012, 103.755], // จังหาร / เมืองร้อยเอ็ด (บรรจบลำน้ำปาว)
      [15.788, 104.145], // เมืองยโสธร
      [15.382, 104.552], // เขื่องใน
      [15.188, 104.715]  // วารินชำราบ จ.อุบลราชธานี (บรรจบแม่น้ำมูล)
    ]
  },
  {
    id: 'river-mun',
    nameTh: 'แม่น้ำมูล',
    nameEn: 'Mun River',
    basin: 'ลุ่มน้ำมูล',
    streamOrder: 6,
    waterwayType: 'river',
    lengthKm: 750,
    headwaterTh: 'ทิวเขาสันกำแพง อุทยานแห่งชาติเขาใหญ่ อ.ครบุรี จ.นครราชสีมา',
    mouthTh: 'ไหลลงแม่น้ำโขงที่แม่น้ำสองสี อ.โขงเจียม จ.อุบลราชธานี',
    provinces: ['นครราชสีมา', 'บุรีรัมย์', 'สุรินทร์', 'ร้อยเอ็ด', 'ศรีสะเกษ', 'อุบลราชธานี'],
    upstreamIds: ['river-chi'],
    downstreamId: 'river-mekong',
    bankfullCapacityCms: 2300,
    linkedGaugeId: 'gauge-M7',
    upstreamElevationMsl: 235.0,
    downstreamElevationMsl: 95.0,
    coordinates: [
      [14.525, 102.085], // ครบุรี / ปักธงชัย จ.นครราชสีมา
      [14.995, 102.245], // เฉลิมพระเกียรติ / พิมาย
      [15.235, 102.725], // ชุมพวง
      [15.318, 103.285], // สตึก จ.บุรีรัมย์
      [15.335, 103.685], // ท่าตูม จ.สุรินทร์
      [15.162, 104.325], // ราษีไศล / เมืองศรีสะเกษ
      [15.188, 104.715], // บรรจบแม่น้ำชี
      [15.224, 104.859], // สถานี M.7 สะพานเสรีประชาธิปไตย จ.อุบลราชธานี
      [15.252, 105.225], // พิบูลมังสาหาร / แก่งสะพือ
      [15.318, 105.498]  // โขงเจียม (แม่น้ำสองสี บรรจบแม่น้ำโขง)
    ]
  },
  {
    id: 'river-kok',
    nameTh: 'แม่น้ำกก',
    nameEn: 'Kok River',
    basin: 'ลุ่มน้ำโขงเหนือ',
    streamOrder: 4,
    waterwayType: 'tributary',
    lengthKm: 285,
    headwaterTh: 'ทิวเขาแดนลาว เขตแม่อาย จ.เชียงใหม่',
    mouthTh: 'ไหลลงแม่น้ำโขงที่ อ.เชียงแสน จ.เชียงราย',
    provinces: ['เชียงใหม่', 'เชียงราย'],
    upstreamIds: [],
    downstreamId: 'river-mekong',
    bankfullCapacityCms: 1150,
    linkedGaugeId: 'gauge-P1',
    upstreamElevationMsl: 460.0,
    downstreamElevationMsl: 360.0,
    coordinates: [
      [20.052, 99.325], // แม่อาย จ.เชียงใหม่
      [19.912, 99.832], // เมืองเชียงราย
      [20.045, 100.015], // เวียงชัย / ดอยหลวง
      [20.228, 100.135]  // เชียงแสน จ.เชียงราย (บรรจบแม่น้ำโขง)
    ]
  },
  {
    id: 'river-mekong',
    nameTh: 'แม่น้ำโขง (พรมแดนไทย-ลาว)',
    nameEn: 'Mekong River',
    basin: 'ลุ่มน้ำโขง',
    streamOrder: 6,
    waterwayType: 'river',
    lengthKm: 920,
    headwaterTh: 'ที่ราบสูงทิเบต ไหลเข้าสู่พรมแดนไทยที่สามเหลี่ยมทองคำ อ.เชียงแสน จ.เชียงราย',
    mouthTh: 'ไหลออกจากพรมแดนไทยที่ อ.โขงเจียม จ.อุบลราชธานี ลงสู่ทะเลจีนใต้',
    provinces: ['เชียงราย', 'เลย', 'หนองคาย', 'บึงกาฬ', 'นครพนม', 'มุกดาหาร', 'อำนาจเจริญ', 'อุบลราชธานี'],
    upstreamIds: ['river-kok', 'river-mun'],
    downstreamId: null,
    bankfullCapacityCms: 18500,
    linkedGaugeId: 'gauge-M7',
    upstreamElevationMsl: 365.0,
    downstreamElevationMsl: 92.0,
    coordinates: [
      [20.272, 100.088], // สามเหลี่ยมทองคำ อ.เชียงแสน จ.เชียงราย
      [20.262, 100.405], // เชียงของ
      [17.895, 101.665], // เชียงคาน จ.เลย
      [17.878, 102.742], // เมืองหนองคาย
      [18.362, 103.652], // เมืองบึงกาฬ
      [17.408, 104.782], // เมืองนครพนม
      [16.542, 104.725], // เมืองมุกดาหาร
      [16.035, 105.218], // เขมราฐ จ.อุบลราชธานี
      [15.318, 105.498]  // โขงเจียม จ.อุบลราชธานี
    ]
  },
  {
    id: 'river-tapi',
    nameTh: 'แม่น้ำตาปี',
    nameEn: 'Tapi River',
    basin: 'ลุ่มน้ำตาปี (ภาคใต้)',
    streamOrder: 5,
    waterwayType: 'river',
    lengthKm: 232,
    headwaterTh: 'เทือกเขาหลวง อ.พิปูน จ.นครศรีธรรมราช',
    mouthTh: 'ไหลลงสู่อ่าวบ้านดอน (อ่าวไทย) อ.เมืองสุราษฎร์ธานี',
    provinces: ['นครศรีธรรมราช', 'สุราษฎร์ธานี'],
    upstreamIds: [],
    downstreamId: null,
    bankfullCapacityCms: 950,
    linkedGaugeId: 'gauge-K37',
    upstreamElevationMsl: 140.0,
    downstreamElevationMsl: 0.5,
    coordinates: [
      [8.425, 99.615], // เทือกเขาหลวง อ.พิปูน จ.นครศรีธรรมราช
      [8.552, 99.385], // ฉวาง / เวียงสระ
      [8.758, 99.245], // เคียนซา
      [9.012, 99.218], // พุนพิน (บรรจบคลองพุมดวงจากเขื่อนรัชชประภา)
      [9.142, 99.328], // เมืองสุราษฎร์ธานี
      [9.218, 99.375]  // ปากน้ำตาปี อ่าวบ้านดอน
    ]
  }
];

/**
 * 15 Major Thai Dams (EGAT & RID) with Real Engineering Parameters
 * and GloFAS 5km River Grid Query Coordinates
 */
export const THAILAND_MAJOR_DAMS: DamTelemetryStation[] = [
  {
    id: 'dam-bhumibol',
    nameTh: 'เขื่อนภูมิพล',
    nameEn: 'Bhumibol Dam',
    river: 'แม่น้ำปิง',
    basin: 'ลุ่มน้ำปิง',
    agency: 'EGAT',
    lat: 17.2425,
    lng: 98.9722,
    queryLat: 17.20,
    queryLng: 99.00,
    maxCapacityMcm: 13462,
    normalHighWaterLevelMsl: 260.0,
    baselineStoragePct: 68.4
  },
  {
    id: 'dam-sirikit',
    nameTh: 'เขื่อนสิริกิติ์',
    nameEn: 'Sirikit Dam',
    river: 'แม่น้ำน่าน',
    basin: 'ลุ่มน้ำน่าน',
    agency: 'EGAT',
    lat: 17.7644,
    lng: 100.5625,
    queryLat: 17.70,
    queryLng: 100.50,
    maxCapacityMcm: 9510,
    normalHighWaterLevelMsl: 162.0,
    baselineStoragePct: 71.2
  },
  {
    id: 'dam-srinagarind',
    nameTh: 'เขื่อนศรีนครินทร์',
    nameEn: 'Srinagarind Dam',
    river: 'แม่น้ำแควใหญ่',
    basin: 'ลุ่มน้ำแม่กลอง',
    agency: 'EGAT',
    lat: 14.4086,
    lng: 99.1283,
    queryLat: 14.35,
    queryLng: 99.15,
    maxCapacityMcm: 17745,
    normalHighWaterLevelMsl: 180.0,
    baselineStoragePct: 81.5
  },
  {
    id: 'dam-vajiralongkorn',
    nameTh: 'เขื่อนวชิราลงกรณ',
    nameEn: 'Vajiralongkorn Dam',
    river: 'แม่น้ำแควน้อย',
    basin: 'ลุ่มน้ำแม่กลอง',
    agency: 'EGAT',
    lat: 14.7989,
    lng: 98.5972,
    queryLat: 14.75,
    queryLng: 98.65,
    maxCapacityMcm: 8860,
    normalHighWaterLevelMsl: 155.0,
    baselineStoragePct: 76.8
  },
  {
    id: 'dam-pasak',
    nameTh: 'เขื่อนป่าสักชลสิทธิ์',
    nameEn: 'Pa Sak Jolasid Dam',
    river: 'แม่น้ำป่าสัก',
    basin: 'ลุ่มน้ำป่าสัก',
    agency: 'RID',
    lat: 14.8644,
    lng: 101.0664,
    queryLat: 14.80,
    queryLng: 101.05,
    maxCapacityMcm: 960,
    normalHighWaterLevelMsl: 43.0,
    baselineStoragePct: 84.0
  },
  {
    id: 'dam-ubolratana',
    nameTh: 'เขื่อนอุบลรัตน์',
    nameEn: 'Ubol Ratana Dam',
    river: 'ลำน้ำพอง (ลุ่มน้ำชี)',
    basin: 'ลุ่มน้ำชี',
    agency: 'EGAT',
    lat: 16.7753,
    lng: 102.6186,
    queryLat: 16.75,
    queryLng: 102.65,
    maxCapacityMcm: 2431,
    normalHighWaterLevelMsl: 182.0,
    baselineStoragePct: 78.5
  },
  {
    id: 'dam-lampao',
    nameTh: 'เขื่อนลำปาว',
    nameEn: 'Lam Pao Dam',
    river: 'ลำน้ำปาว (ลุ่มน้ำชี)',
    basin: 'ลุ่มน้ำชี',
    agency: 'RID',
    lat: 16.6056,
    lng: 103.4556,
    queryLat: 16.55,
    queryLng: 103.50,
    maxCapacityMcm: 1980,
    normalHighWaterLevelMsl: 164.0,
    baselineStoragePct: 74.2
  },
  {
    id: 'dam-lamtakhong',
    nameTh: 'เขื่อนลำตะคอง',
    nameEn: 'Lam Takhong Dam',
    river: 'ลำตะคอง (ลุ่มน้ำมูล)',
    basin: 'ลุ่มน้ำมูล',
    agency: 'RID',
    lat: 14.8667,
    lng: 101.5608,
    queryLat: 14.85,
    queryLng: 101.60,
    maxCapacityMcm: 314,
    normalHighWaterLevelMsl: 277.0,
    baselineStoragePct: 62.5
  },
  {
    id: 'dam-khundan',
    nameTh: 'เขื่อนขุนด่านปราการชล',
    nameEn: 'Khun Dan Prakan Chon Dam',
    river: 'แม่น้ำนครนายก',
    basin: 'ลุ่มน้ำบางปะกง',
    agency: 'RID',
    lat: 14.3144,
    lng: 101.3214,
    queryLat: 14.25,
    queryLng: 101.30,
    maxCapacityMcm: 224,
    normalHighWaterLevelMsl: 110.0,
    baselineStoragePct: 79.0
  },
  {
    id: 'dam-kaengkrachan',
    nameTh: 'เขื่อนแก่งกระจาน',
    nameEn: 'Kaeng Krachan Dam',
    river: 'แม่น้ำเพชรบุรี',
    basin: 'ลุ่มน้ำเพชรบุรี',
    agency: 'RID',
    lat: 12.9147,
    lng: 99.6281,
    queryLat: 12.90,
    queryLng: 99.65,
    maxCapacityMcm: 710,
    normalHighWaterLevelMsl: 99.0,
    baselineStoragePct: 73.4
  },
  {
    id: 'dam-rajjaprabha',
    nameTh: 'เขื่อนรัชชประภา (เชี่ยวหลาน)',
    nameEn: 'Rajjaprabha Dam',
    river: 'คลองแสง-พุมดวง (ตาปี)',
    basin: 'ลุ่มน้ำตาปี',
    agency: 'EGAT',
    lat: 8.9722,
    lng: 98.8056,
    queryLat: 8.95,
    queryLng: 98.85,
    maxCapacityMcm: 5639,
    normalHighWaterLevelMsl: 95.0,
    baselineStoragePct: 77.1
  },
  {
    id: 'dam-banglang',
    nameTh: 'เขื่อนบางลาง',
    nameEn: 'Bang Lang Dam',
    river: 'แม่น้ำปัตตานี',
    basin: 'ลุ่มน้ำปัตตานี',
    agency: 'EGAT',
    lat: 6.1558,
    lng: 101.2694,
    queryLat: 6.20,
    queryLng: 101.25,
    maxCapacityMcm: 1454,
    normalHighWaterLevelMsl: 115.0,
    baselineStoragePct: 69.8
  },
  {
    id: 'dam-maengat',
    nameTh: 'เขื่อนแม่งัดสมบูรณ์ชล',
    nameEn: 'Mae Ngat Somboon Chon Dam',
    river: 'ลำน้ำแม่งัด (ลุ่มน้ำปิง)',
    basin: 'ลุ่มน้ำปิง',
    agency: 'RID',
    lat: 19.1619,
    lng: 99.0414,
    queryLat: 19.15,
    queryLng: 99.00,
    maxCapacityMcm: 265,
    normalHighWaterLevelMsl: 396.0,
    baselineStoragePct: 82.0
  },
  {
    id: 'dam-kiewlom',
    nameTh: 'เขื่อนกิ่วลม',
    nameEn: 'Kiew Lom Dam',
    river: 'แม่น้ำวัง',
    basin: 'ลุ่มน้ำวัง',
    agency: 'RID',
    lat: 18.5264,
    lng: 99.6453,
    queryLat: 18.50,
    queryLng: 99.60,
    maxCapacityMcm: 106,
    normalHighWaterLevelMsl: 286.0,
    baselineStoragePct: 75.0
  },
  {
    id: 'dam-khwaenoibamrungdaen',
    nameTh: 'เขื่อนแควน้อยบำรุงแดน',
    nameEn: 'Khwae Noi Bamrung Daen Dam',
    river: 'ลำน้ำแควน้อย (ลุ่มน้ำน่าน)',
    basin: 'ลุ่มน้ำน่าน',
    agency: 'RID',
    lat: 17.1886,
    lng: 100.4222,
    queryLat: 17.15,
    queryLng: 100.40,
    maxCapacityMcm: 939,
    normalHighWaterLevelMsl: 130.0,
    baselineStoragePct: 80.2
  }
];

/**
 * 10 Key National River Gauge Stations (RID / ONWR Index Stations)
 * Includes Bankfull Elevation (m.MSL), Zero Gauge (m.MSL), and Bankfull Discharge Capacity (m³/s).
 */
export const THAILAND_RIVER_GAUGES: RiverGaugeStation[] = [
  {
    id: 'gauge-P1',
    code: 'P.1',
    nameTh: 'สถานี P.1 สะพานนวรัฐ (เชียงใหม่)',
    river: 'แม่น้ำปิง',
    province: 'เชียงใหม่',
    lat: 18.7883,
    lng: 99.0044,
    queryLat: 18.78,
    queryLng: 99.00,
    bankfullElevationMsl: 304.20,
    zeroGaugeMsl: 300.50,
    bankfullCapacityCms: 530
  },
  {
    id: 'gauge-Y17',
    code: 'Y.17',
    nameTh: 'สถานี Y.17 อ.สามง่าม (พิจิตร)',
    river: 'แม่น้ำยม',
    province: 'พิจิตร',
    lat: 16.5281,
    lng: 100.1622,
    queryLat: 16.52,
    queryLng: 100.16,
    bankfullElevationMsl: 38.58,
    zeroGaugeMsl: 32.00,
    bankfullCapacityCms: 680
  },
  {
    id: 'gauge-N67',
    code: 'N.67',
    nameTh: 'สถานี N.67 อ.บางมูลนาก (พิจิตร)',
    river: 'แม่น้ำน่าน',
    province: 'พิจิตร',
    lat: 16.0522,
    lng: 100.3125,
    queryLat: 16.05,
    queryLng: 100.31,
    bankfullElevationMsl: 27.66,
    zeroGaugeMsl: 16.50,
    bankfullCapacityCms: 1580
  },
  {
    id: 'gauge-C2',
    code: 'C.2',
    nameTh: 'สถานี C.2 ค่ายจิรประวัติ (นครสวรรค์)',
    river: 'แม่น้ำเจ้าพระยา',
    province: 'นครสวรรค์',
    lat: 15.6981,
    lng: 100.1422,
    queryLat: 15.69,
    queryLng: 100.14,
    bankfullElevationMsl: 26.20,
    zeroGaugeMsl: 15.00,
    bankfullCapacityCms: 3590
  },
  {
    id: 'gauge-C13',
    code: 'C.13',
    nameTh: 'สถานี C.13 ท้ายเขื่อนเจ้าพระยา (ชัยนาท)',
    river: 'แม่น้ำเจ้าพระยา',
    province: 'ชัยนาท',
    lat: 15.1583,
    lng: 100.1881,
    queryLat: 15.16,
    queryLng: 100.19,
    bankfullElevationMsl: 16.34,
    zeroGaugeMsl: 5.00,
    bankfullCapacityCms: 2840
  },
  {
    id: 'gauge-S5',
    code: 'S.5',
    nameTh: 'สถานี S.5 สะพานปรีดี-ธำรง (อยุธยา)',
    river: 'แม่น้ำป่าสัก-เจ้าพระยา',
    province: 'พระนครศรีอยุธยา',
    lat: 14.3522,
    lng: 100.5653,
    queryLat: 14.35,
    queryLng: 100.56,
    bankfullElevationMsl: 4.70,
    zeroGaugeMsl: 0.00,
    bankfullCapacityCms: 1120
  },
  {
    id: 'gauge-C29A',
    code: 'C.29A',
    nameTh: 'สถานี C.29A ศูนย์ศิลปาชีพบางไทร (อยุธยา)',
    river: 'แม่น้ำเจ้าพระยา',
    province: 'พระนครศรีอยุธยา',
    lat: 14.2053,
    lng: 100.5081,
    queryLat: 14.20,
    queryLng: 100.51,
    bankfullElevationMsl: 4.18,
    zeroGaugeMsl: 0.00,
    bankfullCapacityCms: 3500
  },
  {
    id: 'gauge-M7',
    code: 'M.7',
    nameTh: 'สถานี M.7 สะพานเสรีประชาธิปไตย (อุบลราชธานี)',
    river: 'แม่น้ำมูล',
    province: 'อุบลราชธานี',
    lat: 15.2244,
    lng: 104.8592,
    queryLat: 15.22,
    queryLng: 104.86,
    bankfullElevationMsl: 112.00,
    zeroGaugeMsl: 105.00,
    bankfullCapacityCms: 2300
  },
  {
    id: 'gauge-K37',
    code: 'K.37',
    nameTh: 'สถานี K.37 ต้นแม่น้ำแม่กลอง (กาญจนบุรี)',
    river: 'แม่น้ำแม่กลอง',
    province: 'กาญจนบุรี',
    lat: 14.0052,
    lng: 99.5281,
    queryLat: 14.00,
    queryLng: 99.53,
    bankfullElevationMsl: 31.50,
    zeroGaugeMsl: 22.00,
    bankfullCapacityCms: 2100
  },
  {
    id: 'gauge-B1',
    code: 'B.1',
    nameTh: 'สถานี B.1 อ.กบินทร์บุรี (ปราจีนบุรี)',
    river: 'แม่น้ำปราจีนบุรี-บางปะกง',
    province: 'ปราจีนบุรี',
    lat: 13.9881,
    lng: 101.7183,
    queryLat: 13.99,
    queryLng: 101.72,
    bankfullElevationMsl: 8.97,
    zeroGaugeMsl: 0.00,
    bankfullCapacityCms: 760
  }
];

/**
 * Basin Flow Tour Choreography Presets
 * Animates camera (flyTo) from Upstream Dams -> Confluence -> Floodplain -> Estuary
 */
export const BASIN_FLOW_TOURS: Record<
  string,
  {
    id: string;
    nameTh: string;
    descriptionTh: string;
    steps: BasinFlowTourStep[];
  }
> = {
  chaophraya: {
    id: 'chaophraya',
    nameTh: 'ลุ่มน้ำปิง-น่าน-เจ้าพระยา (เขื่อนภูมิพล ➔ อ่าวไทย)',
    descriptionTh: 'จำลองการเดินทางของมวลน้ำเหนือจากเขื่อนภูมิพล/สิริกิติ์ ผ่านปากน้ำโพ เขื่อนเจ้าพระยา สู่อยุธยาและกรุงเทพฯ',
    steps: [
      {
        stepOrder: 1,
        titleTh: 'ต้นทางควบคุมน้ำเหนือ: เขื่อนภูมิพล (จ.ตาก)',
        stationCode: 'EGAT-BB',
        lat: 17.2425,
        lng: 98.9722,
        zoom: 10,
        lagTimeHoursFromOrigin: 0,
        engineeringNoteTh: 'ความจุเก็บกักสูงสุด 13,462 ล้าน ลบ.ม. ควบคุมมวลน้ำแม่น้ำปิงก่อนไหลลงสู่กำแพงเพชรและนครสวรรค์'
      },
      {
        stepOrder: 2,
        titleTh: 'จุดรวมแม่น้ำ 4 สาย: ปากน้ำโพ สถานี C.2 (จ.นครสวรรค์)',
        stationCode: 'C.2',
        lat: 15.6981,
        lng: 100.1422,
        zoom: 11,
        lagTimeHoursFromOrigin: 48,
        engineeringNoteTh: 'สถานีวัดน้ำดัชนีหลักของประเทศ ความจุลำน้ำวิกฤต 3,590 m³/s (ระดับตลิ่ง +26.20 ม.รทก.)'
      },
      {
        stepOrder: 3,
        titleTh: 'ประตูควบคุมหลักภาคกลาง: เขื่อนเจ้าพระยา สถานี C.13 (จ.ชัยนาท)',
        stationCode: 'C.13',
        lat: 15.1583,
        lng: 100.1881,
        zoom: 11,
        lagTimeHoursFromOrigin: 72,
        engineeringNoteTh: 'ผันน้ำเข้าระบบชลประทานฝั่งตะวันตก (ท่าจีน) และฝั่งตะวันออก (ชัยนาท-ป่าสัก) ควบคุมการระบายท้ายเขื่อนไม่เกิน 2,840 m³/s'
      },
      {
        stepOrder: 4,
        titleTh: 'จุดบรรจบแม่น้ำป่าสัก: เกาะเมืองอยุธยา สถานี S.5',
        stationCode: 'S.5',
        lat: 14.3522,
        lng: 100.5653,
        zoom: 12,
        lagTimeHoursFromOrigin: 108,
        engineeringNoteTh: 'มวลน้ำจากเขื่อนป่าสักชลสิทธิ์ไหลมาบรรจบแม่น้ำเจ้าพระยาที่ป้อมเพชร ระดับตลิ่งวิกฤต +4.70 ม.รทก.'
      },
      {
        stepOrder: 5,
        titleTh: 'ด่านหน้าก่อนเข้า กทม.: สถานีวัดน้ำบางไทร C.29A',
        stationCode: 'C.29A',
        lat: 14.2053,
        lng: 100.5081,
        zoom: 11,
        lagTimeHoursFromOrigin: 120,
        engineeringNoteTh: 'จุดเฝ้าระวังสุดท้ายก่อนมวลน้ำเข้าสู่ปทุมธานี-นนทบุรี-กรุงเทพฯ ความจุลำน้ำ 3,500 m³/s ผสานอิทธิพลน้ำทะเลหนุน'
      },
      {
        stepOrder: 6,
        titleTh: 'ปลายน้ำออกสู่อ่าวไทย: ปากน้ำเจ้าพระยา (จ.สมุทรปราการ)',
        stationCode: 'ESTUARY',
        lat: 13.5950,
        lng: 100.5880,
        zoom: 11,
        lagTimeHoursFromOrigin: 144,
        engineeringNoteTh: 'จุดระบายมวลน้ำลงสู่อ่าวไทย ต้องบริหารจังหวะเปิด-ปิดประตูระบายน้ำคลองลัดโพธิ์ให้สอดคล้องกับระดับน้ำขึ้น-น้ำลง (MSL)'
      }
    ]
  },
  chimun: {
    id: 'chimun',
    nameTh: 'ลุ่มน้ำชี-มูล-โขง (เขื่อนอุบลรัตน์ ➔ อุบลฯ M.7 ➔ โขงเจียม)',
    descriptionTh: 'เส้นทางระบายน้ำภาคตะวันออกเฉียงเหนือ จากลุ่มน้ำชีและมูลมาบรรจบกันที่อุบลราชธานีก่อนไหลลงสู่แม่น้ำโขง',
    steps: [
      {
        stepOrder: 1,
        titleTh: 'ต้นน้ำลำน้ำพอง-ชี: เขื่อนอุบลรัตน์ (จ.ขอนแก่น)',
        stationCode: 'EGAT-UR',
        lat: 16.7753,
        lng: 102.6186,
        zoom: 10,
        lagTimeHoursFromOrigin: 0,
        engineeringNoteTh: 'ความจุเก็บกัก 2,431 ล้าน ลบ.ม. หน่วงมวลน้ำก่อนไหลลงสู่แม่น้ำชีผ่านขอนแก่น-มหาสารคาม-ร้อยเอ็ด'
      },
      {
        stepOrder: 2,
        titleTh: 'สมทบลำน้ำปาว: เขื่อนลำปาว (จ.กาฬสินธุ์)',
        stationCode: 'RID-LP',
        lat: 16.6056,
        lng: 103.4556,
        zoom: 10,
        lagTimeHoursFromOrigin: 36,
        engineeringNoteTh: 'ความจุเก็บกัก 1,980 ล้าน ลบ.ม. ไหลลงมาสมทบแม่น้ำชีที่ อ.จังหาร จ.ร้อยเอ็ด มุ่งหน้าสู่ จ.ยโสธร'
      },
      {
        stepOrder: 3,
        titleTh: 'คอขวดลุ่มน้ำอีสาน: สถานี M.7 สะพานเสรีประชาธิปไตย (จ.อุบลราชธานี)',
        stationCode: 'M.7',
        lat: 15.2244,
        lng: 104.8592,
        zoom: 12,
        lagTimeHoursFromOrigin: 120,
        engineeringNoteTh: 'รับมวลน้ำรวมจากทั้งแม่น้ำชีและแม่น้ำมูล ระดับตลิ่งวิกฤต +112.00 ม.รทก. (ความจุลำน้ำ 2,300 m³/s)'
      },
      {
        stepOrder: 4,
        titleTh: 'จุดระบายออกแม่น้ำโขง: ปากแม่น้ำมูล อ.โขงเจียม',
        stationCode: 'MEKONG',
        lat: 15.3180,
        lng: 105.4980,
        zoom: 11,
        lagTimeHoursFromOrigin: 144,
        engineeringNoteTh: 'หากระดับน้ำโขงสูงหนุน (Backwater Effect) จะทำให้การระบายน้ำจากสถานี M.7 ลงสู่โขงเจียมชะลอตัว'
      }
    ]
  },
  maeklong: {
    id: 'maeklong',
    nameTh: 'ลุ่มน้ำแควใหญ่-แควน้อย-แม่กลอง (กาญจนบุรี ➔ สมุทรสงคราม)',
    descriptionTh: 'เส้นทางน้ำฝั่งตะวันตกจากเขื่อนศรีนครินทร์และเขื่อนวชิราลงกรณ บรรจบที่เมืองกาญจนบุรี (K.37) สู่อ่าวไทย',
    steps: [
      {
        stepOrder: 1,
        titleTh: 'เขื่อนความจุสูงสุดของไทย: เขื่อนศรีนครินทร์ (แควใหญ่)',
        stationCode: 'EGAT-SN',
        lat: 14.4086,
        lng: 99.1283,
        zoom: 10,
        lagTimeHoursFromOrigin: 0,
        engineeringNoteTh: 'ความจุเก็บกัก 17,745 ล้าน ลบ.ม. ระดับเก็บกักปกติ +180.00 ม.รทก.'
      },
      {
        stepOrder: 2,
        titleTh: 'ต้นน้ำแควน้อย: เขื่อนวชิราลงกรณ (อ.ทองผาภูมิ)',
        stationCode: 'EGAT-VK',
        lat: 14.7989,
        lng: 98.5972,
        zoom: 10,
        lagTimeHoursFromOrigin: 12,
        engineeringNoteTh: 'ความจุเก็บกัก 8,860 ล้าน ลบ.ม. รับน้ำฝนหน้าเขาตะนาวศรีด้านตะวันตก'
      },
      {
        stepOrder: 3,
        titleTh: 'จุดบรรจบสองแคว: สถานี K.37 เมืองกาญจนบุรี',
        stationCode: 'K.37',
        lat: 14.0052,
        lng: 99.5281,
        zoom: 12,
        lagTimeHoursFromOrigin: 36,
        engineeringNoteTh: 'จุดรวมแควใหญ่และแควน้อยเป็นแม่น้ำแม่กลอง ระดับตลิ่ง +31.50 ม.รทก. ความจุ 2,100 m³/s'
      }
    ]
  }
};

/**
 * Regional Hydrometeorological & Air Quality Monitoring Nodes (for L4 Wind/Storm & L5 Smoke/PM2.5)
 */
export const HYDROMET_MONITOR_NODES: {
  id: string;
  nameTh: string;
  region: string;
  lat: number;
  lng: number;
}[] = [
  { id: 'met-cnx', nameTh: 'สถานีอุตุนิยมวิทยาเชียงใหม่ (ภาคเหนือตอนบน)', region: 'North', lat: 18.7883, lng: 98.9853 },
  { id: 'met-nsn', nameTh: 'สถานีอุทกวิทยานครสวรรค์ (ปากน้ำโพ)', region: 'Central-North', lat: 15.6981, lng: 100.1422 },
  { id: 'met-kkc', nameTh: 'สถานีอุตุนิยมวิทยาขอนแก่น (อีสานตอนบน)', region: 'Northeast-Upper', lat: 16.4419, lng: 102.8360 },
  { id: 'met-ubp', nameTh: 'สถานีอุทกวิทยาอุบลราชธานี (ลุ่มน้ำมูล-ชี)', region: 'Northeast-Lower', lat: 15.2244, lng: 104.8592 },
  { id: 'met-bkk', nameTh: 'สถานีตรวจอากาศบางเขน มก. (กรุงเทพฯ)', region: 'Bangkok', lat: 13.8466, lng: 100.5698 },
  { id: 'met-kcb', nameTh: 'สถานีอุทกวิทยากาญจนบุรี (ลุ่มน้ำแม่กลอง)', region: 'West', lat: 14.0052, lng: 99.5281 },
  { id: 'met-ryg', nameTh: 'สถานีอุตุนิยมวิทยาระยอง-อ่าวไทยตะวันออก', region: 'East', lat: 12.6814, lng: 101.2816 },
  { id: 'met-urt', nameTh: 'สถานีอุทกวิทยาสุราษฎร์ธานี (ลุ่มน้ำตาปี)', region: 'South-Upper', lat: 9.1420, lng: 99.3280 },
  { id: 'met-hdy', nameTh: 'สถานีอุทกวิทยาหาดใหญ่-คลองอู่ตะเภา (ภาคใต้)', region: 'South-Lower', lat: 7.0086, lng: 100.4747 }
];

/**
 * Active Forest Fire Surveillance Sectors (for L5 Wildfire & Downwind Smoke Dispersion Cone)
 */
export const WILDFIRE_SURVEILLANCE_CLUSTERS: WildfireHotspotCluster[] = [
  {
    id: 'fire-chiangdao',
    nameTh: 'เขตรักษาพันธุ์สัตว์ป่าเชียงดาว (จุดเฝ้าระวังไฟป่าภาคเหนือ)',
    province: 'เชียงใหม่',
    lat: 19.398,
    lng: 98.892,
    frpMw: 42.5,
    confidence: 'high'
  },
  {
    id: 'fire-salawin',
    nameTh: 'ป่าสาละวิน-แม่สะเรียง (จุดเฝ้าระวังหมอกควันข้ามแดน)',
    province: 'แม่ฮ่องสอน',
    lat: 18.165,
    lng: 97.935,
    frpMw: 58.0,
    confidence: 'high'
  },
  {
    id: 'fire-huai-kha-khaeng',
    nameTh: 'แนวกันไฟป่าตะวันตก ห้วยขาแข้ง-แม่วงก์',
    province: 'อุทัยธานี / ตาก',
    lat: 15.625,
    lng: 99.215,
    frpMw: 29.4,
    confidence: 'nominal'
  },
  {
    id: 'fire-phu-kradueng',
    nameTh: 'แนวเฝ้าระวังไฟป่าภูกระดึง-ภูเขียว',
    province: 'เลย / ชัยภูมิ',
    lat: 16.885,
    lng: 101.765,
    frpMw: 31.0,
    confidence: 'nominal'
  }
];
