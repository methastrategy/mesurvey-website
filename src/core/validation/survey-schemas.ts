import { z } from 'zod';

/**
 * Thailand Geodetic Bounding Constants
 * Lat: ~5.5°N to ~20.5°N
 * Lng: ~97.0°E to ~106.0°E
 * UTM Easting: ~150,000 to ~850,000 m
 * UTM Northing: ~550,000 to ~2,350,000 m
 */
export const THAILAND_BOUNDS = {
  minLat: 5.5,
  maxLat: 20.5,
  minLng: 97.0,
  maxLng: 106.0,
  minUtmEasting: 150000,
  maxUtmEasting: 850000,
  minUtmNorthing: 550000,
  maxUtmNorthing: 2350000
} as const;

/**
 * 1. WGS84 Geographic Coordinate Schema (Decimal Degrees)
 * Strict geodetic validation: lat in [-90, 90], lng in [-180, 180]
 */
export const wgs84CoordSchema = z.object({
  lat: z.number({ message: 'กรุณาระบุตัวเลขพิกัดละติจูดและลองจิจูดให้ครบถ้วน' })
    .refine(v => !isNaN(v) && isFinite(v), { message: 'กรุณาระบุตัวเลขพิกัดละติจูดและลองจิจูดให้ครบถ้วน' }),
  lng: z.number({ message: 'กรุณาระบุตัวเลขพิกัดละติจูดและลองจิจูดให้ครบถ้วน' })
    .refine(v => !isNaN(v) && isFinite(v), { message: 'กรุณาระบุตัวเลขพิกัดละติจูดและลองจิจูดให้ครบถ้วน' })
}).superRefine((val, ctx) => {
  // Detect inverted coordinates (Longitude entered in Latitude field for Thailand domain)
  // Thailand envelope: Lat ~5.5-20.5°N, Lng ~97.0-106.0°E. Lat > 90 cannot be a valid latitude on Earth.
  const isSwappedThailand = val.lat > 90 && val.lat <= 115 && val.lng >= -10 && val.lng <= 30;
  if (isSwappedThailand) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ตรวจพบการสลับค่าระหว่างละติจูดและลองจิจูด (ค่า Lat อยู่ในช่วง 90–115° ซึ่งน่าจะเป็น Longitude ของประเทศไทย)',
      path: ['lat']
    });
  } else if (val.lat < -90 || val.lat > 90) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ค่าละติจูดต้องอยู่ระหว่าง -90° ถึง +90° (ตรวจพบ: ${val.lat}°)`,
      path: ['lat']
    });
  }

  if (val.lng < -180 || val.lng > 180) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ค่าลองจิจูดต้องอยู่ระหว่าง -180° ถึง +180° (ตรวจพบ: ${val.lng}°)`,
      path: ['lng']
    });
  }
});

export type ValidatedWgs84Coord = z.infer<typeof wgs84CoordSchema>;

/**
 * 2. DMS Value Schema (Latitude & Longitude)
 */
export const dmsLatitudeValSchema = z.object({
  deg: z.number({ message: 'ค่าองศาต้องเป็นตัวเลข' })
    .int('ค่าองศาต้องเป็นจำนวนเต็ม')
    .min(0, 'ค่าองศาละติจูดต้องอยู่ระหว่าง 0 ถึง 90°')
    .max(90, 'ค่าองศาละติจูดต้องอยู่ระหว่าง 0 ถึง 90°'),
  min: z.number({ message: 'ค่าลิปดาต้องเป็นตัวเลข' })
    .int('ค่าลิปดาต้องเป็นจำนวนเต็ม')
    .min(0, 'ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา')
    .max(59, 'ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา'),
  sec: z.number({ message: 'ค่าพิลิปดาต้องเป็นตัวเลข' })
    .finite('ค่าพิลิปดาต้องเป็นตัวเลขจำนวนจริง')
    .min(0, 'ค่าพิลิปดา (Second) ต้องอยู่ระหว่าง 0.00 ถึง 59.99 พิลิปดา')
    .lt(60, 'ค่าพิลิปดาต้องน้อยกว่า 60.00 พิลิปดา'),
  direction: z.enum(['N', 'S'], {
    message: 'ทิศทางของละติจูดต้องเป็น N (เหนือ) หรือ S (ใต้)'
  })
}).superRefine((val, ctx) => {
  if (val.deg === 90 && (val.min > 0 || val.sec > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ที่ขั้วโลก (90°N/S) ค่าลิปดาและพิลิปดาต้องเป็น 0',
      path: ['min']
    });
  }
});

export const dmsLongitudeValSchema = z.object({
  deg: z.number({ message: 'ค่าองศาต้องเป็นตัวเลข' })
    .int('ค่าองศาต้องเป็นจำนวนเต็ม')
    .min(0, 'ค่าองศาลองจิจูดต้องอยู่ระหว่าง 0 ถึง 180°')
    .max(180, 'ค่าองศาลองจิจูดต้องอยู่ระหว่าง 0 ถึง 180°'),
  min: z.number({ message: 'ค่าลิปดาต้องเป็นตัวเลข' })
    .int('ค่าลิปดาต้องเป็นจำนวนเต็ม')
    .min(0, 'ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา')
    .max(59, 'ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา'),
  sec: z.number({ message: 'ค่าพิลิปดาต้องเป็นตัวเลข' })
    .finite('ค่าพิลิปดาต้องเป็นตัวเลขจำนวนจริง')
    .min(0, 'ค่าพิลิปดา (Second) ต้องอยู่ระหว่าง 0.00 ถึง 59.99 พิลิปดา')
    .lt(60, 'ค่าพิลิปดาต้องน้อยกว่า 60.00 พิลิปดา'),
  direction: z.enum(['E', 'W'], {
    message: 'ทิศทางของลองจิจูดต้องเป็น E (ตะวันออก) หรือ W (ตะวันตก)'
  })
}).superRefine((val, ctx) => {
  if (val.deg === 180 && (val.min > 0 || val.sec > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ที่เส้นเมริเดียน 180°E/W ค่าลิปดาและพิลิปดาต้องเป็น 0',
      path: ['min']
    });
  }
});

export const latLonDmsSchema = z.object({
  lat: dmsLatitudeValSchema,
  lng: dmsLongitudeValSchema
});

export type ValidatedLatLonDms = z.infer<typeof latLonDmsSchema>;

/**
 * 3. UTM Coordinates Schema (Thailand Zones 47N / 48N)
 */
export const utmCoordSchema = z.object({
  zone: z.union([z.literal(47), z.literal(48)], {
    message: 'UTM Zone ในประเทศไทยต้องเป็น Zone 47 หรือ 48'
  }),
  hemisphere: z.enum(['N', 'S']).default('N'),
  easting: z.number({ message: 'กรุณาระบุตัวเลขค่าพิกัด UTM Easting และ Northing ให้ครบถ้วน' })
    .refine(v => !isNaN(v) && isFinite(v), { message: 'กรุณาระบุตัวเลขค่าพิกัด UTM Easting และ Northing ให้ครบถ้วน' }),
  northing: z.number({ message: 'กรุณาระบุตัวเลขค่าพิกัด UTM Easting และ Northing ให้ครบถ้วน' })
    .refine(v => !isNaN(v) && isFinite(v), { message: 'กรุณาระบุตัวเลขค่าพิกัด UTM Easting และ Northing ให้ครบถ้วน' }),
  epsg: z.string().optional()
}).superRefine((val, ctx) => {
  if (val.easting < 100000 || val.easting > 900000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ค่าพิกัด UTM Easting (E) ควรอยู่ระหว่าง 100,000 ถึง 900,000 ม. (ตรวจพบ: ${val.easting.toLocaleString()} ม.) กรุณาตรวจสอบว่าสลับแกนระหว่างค่า N (Northing) และ E (Easting) จากกล้องประมวลผลรวม (Total Station) หรือเครื่องรับสัญญาณ GNSS หรือไม่`,
      path: ['easting']
    });
  }
  if (val.northing < 0 || val.northing > 10000000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ค่าพิกัด UTM Northing (N) ในซีกโลกเหนือต้องอยู่ระหว่าง 0 ถึง 10,000,000 ม. (ตรวจพบ: ${val.northing.toLocaleString()} ม.) กรุณาตรวจสอบข้อมูลรังวัด`,
      path: ['northing']
    });
  }
  if (val.zone !== 47 && val.zone !== 48) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `UTM Zone ในประเทศไทยต้องเป็น Zone 47 หรือ 48 (ตรวจพบ: ${val.zone})`,
      path: ['zone']
    });
  }
});

export type ValidatedUtmCoord = z.infer<typeof utmCoordSchema>;

/**
 * 4. Indian 1975 Coordinate Schema
 */
export const indian1975CoordSchema = z.object({
  zone: z.union([z.literal(47), z.literal(48)], {
    message: 'UTM Zone ของหมุด Indian 1975 ในไทยต้องเป็น 47 หรือ 48'
  }),
  easting: z.number({ message: 'กรุณาระบุตัวเลขค่าพิกัด Indian 1975 Easting และ Northing ให้ครบถ้วน' })
    .refine(v => !isNaN(v) && isFinite(v), { message: 'กรุณาระบุตัวเลขค่าพิกัด Indian 1975 Easting และ Northing ให้ครบถ้วน' }),
  northing: z.number({ message: 'กรุณาระบุตัวเลขค่าพิกัด Indian 1975 Easting และ Northing ให้ครบถ้วน' })
    .refine(v => !isNaN(v) && isFinite(v), { message: 'กรุณาระบุตัวเลขค่าพิกัด Indian 1975 Easting และ Northing ให้ครบถ้วน' }),
  epsg: z.string().optional()
}).superRefine((val, ctx) => {
  if (val.easting < 100000 || val.easting > 900000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ค่าพิกัด Indian 1975 Easting (E) ควรอยู่ระหว่าง 100,000 ถึง 900,000 ม. (ตรวจพบ: ${val.easting.toLocaleString()} ม.) กรุณาตรวจสอบว่าสลับแกนระหว่างค่า N (Northing) และ E (Easting) หรือไม่`,
      path: ['easting']
    });
  }
  if (val.northing < 0 || val.northing > 10000000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ค่าพิกัด Indian 1975 Northing (N) ต้องอยู่ระหว่าง 0 ถึง 10,000,000 ม. (ตรวจพบ: ${val.northing.toLocaleString()} ม.)`,
      path: ['northing']
    });
  }
});

export type ValidatedIndian1975Coord = z.infer<typeof indian1975CoordSchema>;

/**
 * 5. Traverse Leg Schema
 */
export const traverseLegSchema = z.object({
  station: z.string({ message: 'ต้องระบุชื่อสถานีตั้งกล้อง' })
    .trim()
    .min(1, 'ชื่อสถานีตั้งกล้องต้องไม่เว้นว่าง')
    .max(50, 'ชื่อสถานียาวเกินไป (สูงสุด 50 ตัวอักษร)'),
  targetStation: z.string({ message: 'ต้องระบุชื่อสถานีเป้าหมาย' })
    .trim()
    .min(1, 'ชื่อสถานีเป้าหมายต้องไม่เว้นว่าง')
    .max(50, 'ชื่อสถานีเป้าหมายยาวเกินไป (สูงสุด 50 ตัวอักษร)'),
  distance: z.custom<number>(),
  azimuthDeg: z.custom<number>()
}).superRefine((val, ctx) => {
  const legLabel = val.station && val.targetStation 
    ? `สถานี ${val.station} → ${val.targetStation}` 
    : 'เส้นทางรังวัด';

  const d = Number(val.distance);
  if (typeof val.distance !== 'number' || isNaN(d) || !isFinite(d) || d <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ระยะทางไม่ถูกต้องที่ ${legLabel}: ระยะราบต้องมากกว่า 0.000 ม. (ตรวจพบ: ${val.distance}) กรุณาตรวจสอบข้อมูลเทปวัดระยะหรือค่า EDM จากหน้างาน`,
      path: ['distance']
    });
  }

  const az = Number(val.azimuthDeg);
  if (typeof val.azimuthDeg !== 'number' || isNaN(az) || !isFinite(az) || az < 0 || az > 360) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `มุมภาคทิศ (Azimuth) ไม่ถูกต้องที่ ${legLabel}: ต้องอยู่ในช่วง 0° ถึง 360° (ตรวจพบ: ${val.azimuthDeg}°) กรุณาตรวจสอบมุมราบที่รังวัดได้`,
      path: ['azimuthDeg']
    });
  }

  if (val.station && val.targetStation && val.station.toLowerCase() === val.targetStation.toLowerCase()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `สถานีตั้งกล้อง (${val.station}) และสถานีเป้าหมายต้องไม่เป็นสถานีเดียวกัน`,
      path: ['targetStation']
    });
  }
});

export type ValidatedTraverseLeg = z.infer<typeof traverseLegSchema>;

/**
 * Traverse Setup Schema
 */
export const traverseSetupSchema = z.object({
  startCoord: z.object({
    easting: z.number({ message: 'พิกัดสถานีเริ่มต้นไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของสถานีเริ่มต้น' }),
    northing: z.number({ message: 'พิกัดสถานีเริ่มต้นไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของสถานีเริ่มต้น' })
  }).superRefine((val, ctx) => {
    if (isNaN(val.easting) || isNaN(val.northing) || !isFinite(val.easting) || !isFinite(val.northing)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'พิกัดสถานีเริ่มต้นไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของสถานีเริ่มต้น',
        path: ['easting']
      });
    }
  }),
  endCoord: z.object({
    easting: z.number({ message: 'พิกัดหมุดปิดวงรอบปลายทางไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของหมุดปลายทาง' }),
    northing: z.number({ message: 'พิกัดหมุดปิดวงรอบปลายทางไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของหมุดปลายทาง' })
  }).superRefine((val, ctx) => {
    if (isNaN(val.easting) || isNaN(val.northing) || !isFinite(val.easting) || !isFinite(val.northing)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'พิกัดหมุดปิดวงรอบปลายทางไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของหมุดปลายทาง',
        path: ['easting']
      });
    }
  }),
  isClosedLoop: z.boolean().default(true),
  legs: z.array(traverseLegSchema).min(1, 'ตารางวงรอบว่างเปล่า: กรุณาระบุข้อมูลเส้นวงรอบอย่างน้อย 1 เส้นทาง')
}).superRefine((val, ctx) => {
  const totalDist = val.legs.reduce((sum, leg) => sum + (isNaN(leg.distance) ? 0 : leg.distance), 0);
  if (totalDist <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ความยาวรอบรูปรวมเท่ากับ 0.000 ม. ไม่สามารถคำนวณสัดส่วนการปรับแก้ได้',
      path: ['legs']
    });
  }

  // 1. Station continuity: each subsequent leg must begin where the previous leg ended
  for (let i = 1; i < val.legs.length; i++) {
    const prevTarget = val.legs[i - 1].targetStation?.trim().toLowerCase();
    const currStation = val.legs[i].station?.trim().toLowerCase();
    if (prevTarget && currStation && prevTarget !== currStation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `เส้นทางวงรอบไม่ต่อเนื่อง: สถานีเริ่มต้นของเส้นที่ ${i + 1} (${val.legs[i].station}) ไม่ตรงกับสถานีเป้าหมายก่อนหน้า (${val.legs[i - 1].targetStation})`,
        path: ['legs', i, 'station']
      });
    }
  }

  // 2. Closed Loop topology check: if closed loop with 3 or more stations, final target must equal first station
  if (val.isClosedLoop && val.legs.length >= 3) {
    const firstStation = val.legs[0].station?.trim().toLowerCase();
    const lastTarget = val.legs[val.legs.length - 1].targetStation?.trim().toLowerCase();
    if (firstStation && lastTarget && firstStation !== lastTarget) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `วงรอบปิด (Closed Loop) ต้องบรรจบกลับมายังสถานีเริ่มต้น: สถานีเป้าหมายสุดท้าย (${val.legs[val.legs.length - 1].targetStation}) ไม่ตรงกับสถานีเริ่มต้น (${val.legs[0].station})`,
        path: ['legs', val.legs.length - 1, 'targetStation']
      });
    }
  }
});

export type ValidatedTraverseSetup = z.infer<typeof traverseSetupSchema>;

/**
 * 6. Differential Leveling Schemas
 * Note: Staff readings (BS, IFS, FS) can be negative in survey geodesy for inverted staff
 * (e.g. measuring bridge soffit, tunnel ceiling, or overhead structural benchmarks).
 */
export const levelingRowSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  station: z.string({ message: 'ต้องระบุชื่อสถานีระดับ' })
    .trim()
    .min(1, 'ชื่อสถานีระดับต้องไม่เว้นว่าง'),
  bs: z.number({ message: 'ค่า BS ต้องเป็นตัวเลข' })
    .finite()
    .nullable()
    .optional()
    .default(null),
  ifs: z.number({ message: 'ค่า IFS ต้องเป็นตัวเลข' })
    .finite()
    .nullable()
    .optional()
    .default(null),
  fs: z.number({ message: 'ค่า FS ต้องเป็นตัวเลข' })
    .finite()
    .nullable()
    .optional()
    .default(null),
  remark: z.string().optional()
}).superRefine((val, ctx) => {
  const hasBs = val.bs !== null && val.bs !== undefined && !isNaN(val.bs);
  const hasIfs = val.ifs !== null && val.ifs !== undefined && !isNaN(val.ifs);
  const hasFs = val.fs !== null && val.fs !== undefined && !isNaN(val.fs);

  if (!hasBs && !hasIfs && !hasFs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `สถานี "${val.station}" ต้องมีค่าอ่านไม้ระดับอย่างน้อย 1 ค่า (BS, IFS หรือ FS)`,
      path: ['bs']
    });
  }

  if (hasIfs && hasFs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `สถานี "${val.station}" ไม่สามารถมีทั้งค่า IFS และ FS พร้อมกันในแถวเดียวกันได้ (FS ใช้สำหรับจุดเปลี่ยนหมุด TP ส่วน IFS ใช้สำหรับจุดภูมิประเทศย่อย)`,
      path: ['ifs']
    });
  }

  if (hasBs && hasIfs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `สถานี "${val.station}" ไม่สามารถมีทั้งค่า BS และ IFS พร้อมกันในแถวเดียวกันได้ (ค่าส่องหลัง BS ควบคู่ได้เฉพาะ FS สำหรับจุดเปลี่ยนหมุด TP เท่านั้น)`,
      path: ['ifs']
    });
  }
});

export type ValidatedLevelingRow = z.infer<typeof levelingRowSchema>;

export const levelingSetupSchema = z.object({
  startElevation: z.number({ message: 'ค่าระดับหมุดเริ่มต้น (Start Benchmark RL) ไม่ถูกต้อง: กรุณาระบุค่าตัวเลข เช่น 100.000 ม.รทก.' })
    .refine(v => !isNaN(v) && isFinite(v), { message: 'ค่าระดับหมุดเริ่มต้น (Start Benchmark RL) ไม่ถูกต้อง: กรุณาระบุค่าตัวเลข เช่น 100.000 ม.รทก.' }),
  knownEndElevation: z.number().finite().optional(),
  totalDistanceKm: z.number().finite().default(1.0),
  rows: z.array(z.any()).min(1, 'สมุดจดงานระดับว่างเปล่า: กรุณาเพิ่มแถวรังวัดอย่างน้อย 1 สถานี')
}).superRefine((val, ctx) => {
  if (val.rows.length > 0) {
    const firstRow = val.rows[0];
    if (firstRow.bs === null || firstRow.bs === undefined || isNaN(firstRow.bs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `สถานีเริ่มต้น (${firstRow.station || 'BM'}) ขาดค่าอ่านไม้ระดับส่องหลัง (Backsight - BS): จำเป็นต้องมี BS เพื่อเปิดแนวความสูงกล้อง (HI) เริ่มต้น`,
        path: ['rows', 0, 'bs']
      });
      return;
    }
  }

  for (let i = 0; i < val.rows.length; i++) {
    const rRes = levelingRowSchema.safeParse(val.rows[i]);
    if (!rRes.success) {
      for (const issue of rRes.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ['rows', i, ...(issue.path || [])]
        });
      }
    }
  }
});

export type ValidatedLevelingSetup = z.infer<typeof levelingSetupSchema>;

/**
 * 7. Thai Land Area Schema
 */
export const thaiLandAreaSchema = z.object({
  rai: z.number({ message: 'ค่าไร่ต้องเป็นตัวเลข' })
    .int('ค่าไร่ต้องเป็นจำนวนเต็ม')
    .min(0, 'ค่าไร่ต้องไม่ติดลบ'),
  ngan: z.number({ message: 'ค่างานต้องเป็นตัวเลข' })
    .int('ค่างานต้องเป็นจำนวนเต็ม')
    .min(0, 'ค่างานต้องอยู่ระหว่าง 0 ถึง 3')
    .max(3, 'ค่างานต้องอยู่ระหว่าง 0 ถึง 3 (4 งาน = 1 ไร่)'),
  wah: z.number({ message: 'ค่าตารางวาต้องเป็นตัวเลข' })
    .finite('ค่าตารางวาต้องเป็นตัวเลขจำนวนจริง')
    .min(0, 'ค่าตารางวาต้องอยู่ระหว่าง 0 ถึง 99.99')
    .lt(100, 'ค่าตารางวาต้องน้อยกว่า 100 ตารางวา (100 ตร.ว. = 1 งาน)'),
  sqMeters: z.number({ message: 'ค่าตารางเมตรต้องเป็นตัวเลข' })
    .finite('ค่าตารางเมตรต้องเป็นตัวเลขจำนวนจริง')
    .min(0, 'ค่าพื้นที่ตารางเมตรต้องไม่ติดลบ')
});

export type ValidatedThaiLandArea = z.infer<typeof thaiLandAreaSchema>;

export const sqMetersInputSchema = z.number({ message: 'กรุณากรอกค่าพื้นที่ตารางเมตรเป็นตัวเลข' })
  .finite('ค่าพื้นที่ต้องเป็นตัวเลขจำนวนจริง')
  .min(0, 'พื้นที่ต้องมากกว่าหรือเท่ากับ 0 ตารางเมตร')
  .max(1000000000, 'พื้นที่เกินขอบเขตระบบคำนวณ (สูงสุด 1,000 ล้าน ตร.ม.)');
