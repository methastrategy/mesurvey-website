import { BookmarkPreset } from '../types/map';
import { TraverseLegInput, LevelingRowInput } from '../types/survey';

export const SURVEY_BOOKMARKS: BookmarkPreset[] = [
  {
    id: 'ku-survey-dept',
    name: 'ภาควิชาวิศวกรรมสำรวจ มหาวิทยาลัยเกษตรศาสตร์',
    description: 'อาคารชูชาติ กำภู คณะวิศวกรรมศาสตร์ มก. บางเขน (KU Survey & Geomatics Hub)',
    lat: 13.84664,
    lng: 100.56982,
    zoom: 18,
    category: 'university'
  },
  {
    id: 'rtsd-zero-point',
    name: 'หมุดหลักฐานอ้างอิง กรมแผนที่ทหาร (RTSD Main Datum)',
    description: 'กรมแผนที่ทหาร กรุงเทพมหานคร หมุดหลักฐานปฐมภูมิแห่งชาติ',
    lat: 13.75235,
    lng: 100.49392,
    zoom: 17,
    category: 'benchmark'
  },
  {
    id: 'ku-survey-camp',
    name: 'ค่ายฝึกสำรวจภาคสนาม มก. (Survey Camp Base)',
    description: 'ศูนย์ฝึกภาคปฏิบัติการสำรวจภาคสนาม คณะวิศวกรรมศาสตร์ มก.',
    lat: 14.0195,
    lng: 99.9678,
    zoom: 16,
    category: 'university'
  },
  {
    id: 'chiangmai-center',
    name: 'ศูนย์สารสนเทศภูมิศาสตร์ภาคเหนือ (เชียงใหม่)',
    description: 'จุดตรวจสอบพิกัด UTM Zone 47 ภาคเหนือ',
    lat: 18.7904,
    lng: 98.9853,
    zoom: 15,
    category: 'survey-center'
  },
  {
    id: 'khonkaen-center',
    name: 'ศูนย์สารสนเทศภูมิศาสตร์ภาคตะวันออกเฉียงเหนือ (ขอนแก่น)',
    description: 'จุดตรวจสอบพิกัดรอยต่อ UTM Zone 47/48',
    lat: 16.4397,
    lng: 102.8276,
    zoom: 15,
    category: 'survey-center'
  },
  {
    id: 'songkhla-center',
    name: 'ศูนย์สารสนเทศภูมิศาสตร์ภาคใต้ (สงขลา)',
    description: 'จุดตรวจสอบพิกัดชายฝั่งทะเลภาคใต้ UTM Zone 47',
    lat: 7.1898,
    lng: 100.5954,
    zoom: 15,
    category: 'survey-center'
  }
];

export const SAMPLE_TRAVERSE_LEGS: TraverseLegInput[] = [
  { station: 'BM-1', targetStation: 'T-1', distance: 125.450, azimuthDeg: 48.5200 },
  { station: 'T-1', targetStation: 'T-2', distance: 98.320, azimuthDeg: 135.2500 },
  { station: 'T-2', targetStation: 'T-3', distance: 114.780, azimuthDeg: 228.8400 },
  { station: 'T-3', targetStation: 'BM-1', distance: 108.660, azimuthDeg: 312.4100 }
];

export const SAMPLE_TRAVERSE_START = {
  easting: 669735.000,
  northing: 1531520.000
};

export const SAMPLE_LEVELING_ROWS: LevelingRowInput[] = [
  { id: '1', station: 'BM_KU', bs: 1.452, ifs: null, fs: null, remark: 'หมุดระดับอ้างอิงเดิม (Elev = 10.000 m)' },
  { id: '2', station: 'TP_1', bs: 1.625, ifs: null, fs: 1.120, remark: 'จุดเปลี่ยนที่ 1 (เต่าเหล็กบนพื้นแน่น)' },
  { id: '3', station: 'IS_A', bs: null, ifs: 1.845, fs: null, remark: 'จุดระดับพื้นอาคารชูชาติ' },
  { id: '4', station: 'IS_B', bs: null, ifs: 2.110, fs: null, remark: 'จุดระดับขอบถนนหน้าภาควิชา' },
  { id: '5', station: 'TP_2', bs: 1.340, ifs: null, fs: 1.485, remark: 'จุดเปลี่ยนที่ 2' },
  { id: '6', station: 'BM_KU', bs: null, ifs: null, fs: 1.815, remark: 'ส่องหน้าปิดลูปกลับหมุดเดิม' }
];

export const SAMPLE_LEVELING_START_ELEVATION = 10.000;
