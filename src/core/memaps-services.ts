/**
 * MeMaps Services - High Precision Mapping, Geocoding & Routing for MeSurv
 * Powered by OpenStreetMap Nominatim & OSRM Open Routing with Survey-Grade Thai Landmarks
 */

import { PlaceSearchResult, RouteResult, RouteStep, SavedPlace, TravelMode } from '../types/memaps';
import { forwardWgs84ToUtm } from './projections';
import { parseCoordinateString } from '../utils/coordinate-parser';

// Curated Thai Landmarks & Survey Reference Stations
export const THAI_PRESET_PLACES: PlaceSearchResult[] = [

  {
    id: 'ku-survey',
    name: 'ภาควิชาวิศวกรรมสำรวจ ม.เกษตรศาสตร์ (บางเขน)',
    nameEn: 'Dept of Survey Engineering, Kasetsart University',
    description: 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ บางเขน กรุงเทพฯ',
    lat: 13.8476,
    lng: 100.5696,
    category: 'university',
    address: '50 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900'
  },
  {
    id: 'rtsd-hq',
    name: 'กรมแผนที่ทหาร (Royal Thai Survey Dept)',
    nameEn: 'Royal Thai Survey Department',
    description: 'กองบัญชาการกองทัพไทย หลักหมุดปฐมภูมิรังวัดประเทศไทย',
    lat: 13.7525,
    lng: 100.4941,
    category: 'survey',
    address: 'ถนนกัลยาณไมตรี แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ'
  },
  {
    id: 'grand-palace',
    name: 'พระบรมมหาราชวัง & วัดพระแก้ว',
    nameEn: 'Grand Palace & Wat Phra Kaew',
    description: 'ศูนย์กลางประวัติศาสตร์และหลักเมืองกรุงเทพมหานคร',
    lat: 13.7500,
    lng: 100.4914,
    category: 'landmark',
    address: 'ถนนหน้าพระลาน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ'
  },
  {
    id: 'bkk-central-station',
    name: 'สถานีกลางกรุงเทพอภิวัฒน์ (บางซื่อ)',
    nameEn: 'Krung Thep Aphiwat Central Terminal',
    description: 'ศูนย์กลางระบบรางและโครงข่ายขนส่งมวลชนแห่งชาติ',
    lat: 13.8038,
    lng: 100.5404,
    category: 'station',
    address: 'ถนนกำแพงเพชร แขวงจตุจักร เขตจตุจักร กรุงเทพฯ'
  },
  {
    id: 'suvarnabhumi-airport',
    name: 'ท่าอากาศยานสุวรรณภูมิ (BKK)',
    nameEn: 'Suvarnabhumi International Airport',
    description: 'สนามบินหลักนานาชาติและหมุดควบคุมการบิน',
    lat: 13.6900,
    lng: 100.7501,
    category: 'station',
    address: 'ตำบลหนองปรือ อำเภอบางพลี จังหวัดสมุทรปราการ'
  },
  {
    id: 'victory-monument',
    name: 'อนุสาวรีย์ชัยสมรภูมิ',
    nameEn: 'Victory Monument',
    description: 'วงเวียนหลักคมนาคมและจุดตัดระบบรางใจกลางกรุงเทพฯ',
    lat: 13.7649,
    lng: 100.5383,
    category: 'landmark',
    address: 'ถนนพญาไท แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ'
  },
  {
    id: 'iconsiam',
    name: 'ไอคอนสยาม (ICONSIAM)',
    nameEn: 'ICONSIAM',
    description: 'แลนด์มาร์กริมแม่น้ำเจ้าพระยา เขตคลองสาน',
    lat: 13.7267,
    lng: 100.5108,
    category: 'landmark',
    address: '299 ถนนเจริญนคร แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ'
  },
  {
    id: 'rtsd-khao-krasang',
    name: 'หมุดหลักฐานปฐมภูมิ เขากระโจม / เขากระสัง',
    nameEn: 'RTSD Primary Geodetic Network Station',
    description: 'สถานีโครงข่ายยีโอเดซีปฐมภูมิสำหรับการรังวัดพิกัดระวางแผนที่',
    lat: 14.5320,
    lng: 100.9150,
    category: 'survey',
    address: 'สถานีหมุดหลักฐานดาวเทียมถาวร GNSS CORS กรมแผนที่ทหาร'
  },
  {
    id: 'ku-bm-01',
    name: 'หมุดหลักฐาน BM-01 (หน้าอาคาร 1 คณะวิศวกรรมศาสตร์ มก.)',
    nameEn: 'Benchmark BM-01 (Building 1, Faculty of Engineering, KU)',
    description: 'สาขาวิชาวิศวกรรมสำรวจ ภาควิชาวิศวกรรมโยธา ม.เกษตรศาสตร์ (UTM 47P 669576.521, 1531291.596)',
    lat: 13.846371,
    lng: 100.569075,
    category: 'survey',
    elevation: 1.142,
    address: 'อยู่ด้านหน้าอาคาร 1 คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)'
  },
  {
    id: 'ku-bm-02',
    name: 'หมุดหลักฐาน BM-02 (หน้าอาคาร 8 คณะวิศวกรรมศาสตร์ มก.)',
    nameEn: 'Benchmark BM-02 (Building 8, Faculty of Engineering, KU)',
    description: 'สาขาวิชาวิศวกรรมสำรวจ ภาควิชาวิศวกรรมโยธา ม.เกษตรศาสตร์ (UTM 47P 669568.034, 1531154.836)',
    lat: 13.845135,
    lng: 100.568989,
    category: 'survey',
    elevation: 0.998,
    address: 'อยู่ด้านหน้าอาคาร 8 คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)'
  },
  {
    id: 'ku-bm-03',
    name: 'หมุดหลักฐาน BM-03 (วศ.เครื่องกล ข้างป้อมยาม คณะวิศวกรรมศาสตร์ มก.)',
    nameEn: 'Benchmark BM-03 (Mechanical Eng, Faculty of Engineering, KU)',
    description: 'สาขาวิชาวิศวกรรมสำรวจ ภาควิชาวิศวกรรมโยธา ม.เกษตรศาสตร์ (UTM 47P 669572.130, 1531234.394)',
    lat: 13.845854,
    lng: 100.569031,
    category: 'survey',
    elevation: 1.065,
    address: 'อาคาร วศ.เครื่องกล ข้างป้อมยาม คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)'
  },
  // --- ร้านอาหาร (Restaurants) ---
  {
    id: 'rest-jay-fai',
    name: 'ร้านเจ๊ไฝ ประตูผี (Raan Jay Fai)',
    nameEn: 'Raan Jay Fai',
    description: 'ร้านอาหารระดับมิชลิน 1 ดาว เมนูไข่เจียวปูชื่อดัง ย่านประตูผี',
    lat: 13.7526,
    lng: 100.5047,
    category: 'restaurant',
    address: '327 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพฯ'
  },
  {
    id: 'rest-thipsamai',
    name: 'ทิพย์สมัย ผัดไทยประตูผี',
    nameEn: 'Thipsamai Pad Thai',
    description: 'ต้นตำรับผัดไทยเส้นจันท์ใส่มันกุ้ง ห่อไข่ชื่อดัง',
    lat: 13.7528,
    lng: 100.5048,
    category: 'restaurant',
    address: '313 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพฯ'
  },
  {
    id: 'rest-somboon',
    name: 'สมบูรณ์โภชนา สาขาบรรทัดทอง',
    nameEn: 'Somboon Seafood Bantadthong',
    description: 'ต้นตำรับปูผัดผงกะหรี่ชื่อดังระดับโลก ถนนบรรทัดทอง',
    lat: 13.7423,
    lng: 100.5234,
    category: 'restaurant',
    address: '895/6-21 ถนนบรรทัดทอง แขวงวังใหม่ เขตปทุมวัน กรุงเทพฯ'
  },
  {
    id: 'rest-krua-apsorn',
    name: 'ครัวอัปษร สาขาดินสอ',
    nameEn: 'Krua Apsorn Dinso',
    description: 'ร้านอาหารไทยรสชาติต้นตำรับ ไข่ฟูปู แกงส้มชะอมทอด',
    lat: 13.7562,
    lng: 100.5015,
    category: 'restaurant',
    address: '169 ถนนดินสอ แขวงบวรนิเวศ เขตพระนคร กรุงเทพฯ'
  },
  {
    id: 'rest-mont-nomsod',
    name: 'มนต์ นมสด เสาชิงช้า',
    nameEn: 'Mont Nom Sod',
    description: 'ร้านขนมปังปิ้งสังขยาและนมสดในตำนาน เสาชิงช้า',
    lat: 13.7533,
    lng: 100.5009,
    category: 'restaurant',
    address: '160/1-3 ถนนดินสอ แขวงเสาชิงช้า เขตพระนคร กรุงเทพฯ'
  },
  // --- โรงพยาบาล (Hospitals) ---
  {
    id: 'hosp-siriraj',
    name: 'โรงพยาบาลศิริราช (Siriraj Hospital)',
    nameEn: 'Siriraj Hospital',
    description: 'โรงพยาบาลหลวงแห่งแรกของไทย คณะแพทยศาสตร์ ม.มหิดล',
    lat: 13.7588,
    lng: 100.4855,
    category: 'hospital',
    address: '2 ถนนวังหลัง แขวงศิริราช เขตบางกอกน้อย กรุงเทพฯ 10700'
  },
  {
    id: 'hosp-chula',
    name: 'โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย',
    nameEn: 'King Chulalongkorn Memorial Hospital',
    description: 'โรงพยาบาลศูนย์การแพทย์ระดับตติยภูมิขั้นสูง สภากาชาดไทย',
    lat: 13.7314,
    lng: 100.5342,
    category: 'hospital',
    address: '1874 ถนนพระรามที่ 4 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330'
  },
  {
    id: 'hosp-rama',
    name: 'โรงพยาบาลรามาธิบดี',
    nameEn: 'Ramathibodi Hospital',
    description: 'คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล',
    lat: 13.7667,
    lng: 100.5283,
    category: 'hospital',
    address: '270 ถนนพระรามที่ 6 แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ'
  },
  {
    id: 'hosp-pmk',
    name: 'โรงพยาบาลพระมงกุฎเกล้า',
    nameEn: 'Phramongkutklao Hospital',
    description: 'โรงพยาบาลทหารและศูนย์การแพทย์เฉพาะทาง อนุสาวรีย์ชัยฯ',
    lat: 13.7681,
    lng: 100.5347,
    category: 'hospital',
    address: '315 ถนนราชวิถี แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ'
  },
  {
    id: 'hosp-kasemrad',
    name: 'โรงพยาบาลเกษมราษฎร์ ประชาชื่น',
    nameEn: 'Kasemrad Hospital Prachachuen',
    description: 'ศูนย์บริการการแพทย์ครบวงจร ย่านประชาชื่น-บางซื่อ',
    lat: 13.8344,
    lng: 100.5401,
    category: 'hospital',
    address: '952 ถนนประชาชื่น แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ'
  },
  // --- ห้างสรรพสินค้า (Malls) ---
  {
    id: 'mall-paragon',
    name: 'สยามพารากอน (Siam Paragon)',
    nameEn: 'Siam Paragon',
    description: 'ศูนย์การค้าระดับโลกใจกลางกรุงเทพมหานคร จุดเชื่อมต่อ BTS สยาม',
    lat: 13.7460,
    lng: 100.5348,
    category: 'mall',
    address: '991 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ'
  },
  {
    id: 'mall-centralworld',
    name: 'เซ็นทรัลเวิลด์ (CentralWorld)',
    nameEn: 'CentralWorld',
    description: 'ไลฟ์สไตล์เดสติเนชันและแลนด์มาร์กศูนย์การค้าขนาดใหญ่ ย่านราชประสงค์',
    lat: 13.7466,
    lng: 100.5393,
    category: 'mall',
    address: '4, 4/5 ถนนราชดำริ แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ'
  },
  {
    id: 'mall-central-ladprao',
    name: 'เซ็นทรัล ลาดพร้าว (Central Ladprao)',
    nameEn: 'Central Ladprao',
    description: 'ศูนย์การค้าหลักย่านห้าแยกลาดพร้าว เชื่อมต่อ BTS และ MRT',
    lat: 13.8166,
    lng: 100.5614,
    category: 'mall',
    address: '1693 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ'
  },
  {
    id: 'mall-themall-ngamwongwan',
    name: 'เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน',
    nameEn: 'The Mall Lifestore Ngamwongwan',
    description: 'ศูนย์การค้าไลฟ์สไตล์ขนาดใหญ่ ถนนงามวงศ์วาน ใกล้ ม.เกษตรฯ',
    lat: 13.8596,
    lng: 100.5422,
    category: 'mall',
    address: '30/39-50 ถนนงามวงศ์วาน ตำบลบางเขน อำเภอเมืองนนทบุรี'
  },
  // --- คาเฟ่ / กาแฟ (Cafes) ---
  {
    id: 'cafe-factory',
    name: 'Factory Coffee - พญาไท',
    nameEn: 'Factory Coffee Bangkok',
    description: 'ร้านกาแฟ Specialty Coffee และแชมป์บาริสต้าระดับประเทศ',
    lat: 13.7573,
    lng: 100.5358,
    category: 'cafe',
    address: '49 ถนนพญาไท แขวงถนนพญาไท เขตราชเทวี กรุงเทพฯ'
  },
  {
    id: 'cafe-nana',
    name: 'Nana Coffee Roasters - อารีย์',
    nameEn: 'Nana Coffee Roasters Ari',
    description: 'โรงคั่วกาแฟพรีเมียม บรรยากาศสวนร่มรื่น ย่านอารีย์',
    lat: 13.7801,
    lng: 100.5442,
    category: 'cafe',
    address: '24/2 ซอยอารีย์ 4 ฝั่งเหนือ แขวงพญาไท เขตพญาไท กรุงเทพฯ'
  },
  {
    id: 'cafe-roast',
    name: 'Roast Coffee & Eatery - ทองหล่อ',
    nameEn: 'Roast The Commons Thonglor',
    description: 'คาเฟ่และบรันช์ยอดนิยม คอมมูนิตี้มอลล์ The Commons ทองหล่อ',
    lat: 13.7348,
    lng: 100.5828,
    category: 'cafe',
    address: '335 ซอยสุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ'
  },
  {
    id: 'cafe-roots',
    name: 'Roots at Sathorn - สาทร',
    nameEn: 'Roots at Sathorn',
    description: 'ผู้บุกเบิกวงการกาแฟไทย Specialty Coffee เมนูซิกเนเจอร์ผลไม้ไทย',
    lat: 13.7208,
    lng: 100.5273,
    category: 'cafe',
    address: 'ชั้น 1 อาคาร Bhiraj Tower at Sathon ถนนสาทรใต้ กรุงเทพฯ'
  },
  // --- ปั๊มน้ำมัน / EV (Gas & EV) ---
  {
    id: 'gas-ptt-ngamwongwan',
    name: 'PTT Station & EV Station PluZ งามวงศ์วาน',
    nameEn: 'PTT Station Ngamwongwan',
    description: 'สถานีบริการน้ำมันและจุดชาร์จรถยนต์ไฟฟ้า EV ชาร์จเร็ว DC',
    lat: 13.8512,
    lng: 100.5574,
    category: 'gas',
    address: 'ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ'
  },
  {
    id: 'gas-bangchak-vibhavadi',
    name: 'บางจาก EV Charger วิภาวดีรังสิต',
    nameEn: 'Bangchak Station Vibhavadi',
    description: 'สถานีบริการน้ำมันบางจากและศูนย์ชาร์จรถยนต์ไฟฟ้า EV',
    lat: 13.8055,
    lng: 100.5592,
    category: 'gas',
    address: 'ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพฯ'
  },
  {
    id: 'gas-shell-rama9',
    name: 'Shell Recharge พระราม 9',
    nameEn: 'Shell Recharge Rama 9',
    description: 'สถานีบริการน้ำมันเชลล์ พร้อมหัวชาร์จ Shell Recharge ความเร็วสูง',
    lat: 13.7533,
    lng: 100.5688,
    category: 'gas',
    address: 'ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ'
  },
  // --- โรงแรม / ที่พัก (Hotels) ---
  {
    id: 'hotel-mandarin',
    name: 'โรงแรมแมนดาริน โอเรียนเต็ล กรุงเทพฯ',
    nameEn: 'Mandarin Oriental Bangkok',
    description: 'โรงแรมประวัติศาสตร์ระดับ 5 ดาวริมแม่น้ำเจ้าพระยา',
    lat: 13.7236,
    lng: 100.5146,
    category: 'hotel',
    address: '48 ซอยโอเรียนเต็ล อเวนิว แขวงบางรัก เขตบางรัก กรุงเทพฯ'
  },
  {
    id: 'hotel-kempinski',
    name: 'โรงแรมสยามเคมปินสกี้ กรุงเทพฯ',
    nameEn: 'Siam Kempinski Hotel Bangkok',
    description: 'โรงแรมหรูสไตล์รีสอร์ตใจกลางเมือง เชื่อมต่อสยามพารากอน',
    lat: 13.7482,
    lng: 100.5356,
    category: 'hotel',
    address: '991/9 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ'
  },
  {
    id: 'hotel-centara-grand',
    name: 'โรงแรมเซ็นทารา แกรนด์ แอท เซ็นทรัลเวิลด์',
    nameEn: 'Centara Grand at CentralWorld',
    description: 'โรงแรมหรูและศูนย์การประชุมนานาชาติ ย่านราชประสงค์',
    lat: 13.7484,
    lng: 100.5388,
    category: 'hotel',
    address: '999/99 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ'
  },
  // --- สถานี / ขนส่ง (Transit) ---
  {
    id: 'transit-dmk',
    name: 'ท่าอากาศยานดอนเมือง (DMK)',
    nameEn: 'Don Mueang International Airport',
    description: 'สนามบินหลักสายการบินโลว์คอสต์และเส้นทางบินภายในประเทศ',
    lat: 13.9126,
    lng: 100.6067,
    category: 'transit',
    address: '222 ถนนวิภาวดีรังสิต แขวงสนามบิน เขตดอนเมือง กรุงเทพฯ'
  },
  {
    id: 'transit-bts-siam',
    name: 'สถานีรถไฟฟ้า BTS สยาม',
    nameEn: 'Siam BTS Interchange Station',
    description: 'สถานีอินเตอร์เชนจ์หลักสายสีลมและสายสุขุมวิท',
    lat: 13.7456,
    lng: 100.5342,
    category: 'transit',
    address: 'ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ'
  }
];

let cachedPresets: PlaceSearchResult[] | null = null;

/**
 * Load preset places dynamically from static GeoJSON if available, with in-memory fallback.
 */
export async function getPresetPlaces(): Promise<PlaceSearchResult[]> {
  if (cachedPresets) return cachedPresets;
  if (typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/data/presets.geojson');
      if (res.ok) {
        const geojson = await res.json();
        if (geojson && Array.isArray(geojson.features)) {
          const loaded: PlaceSearchResult[] = geojson.features.map((f: any) => ({
            id: f.properties?.id || `preset-${Math.random()}`,
            name: f.properties?.name || 'หมุดอ้างอิง',
            nameEn: f.properties?.nameEn,
            description: f.properties?.description || '',
            lat: f.geometry?.coordinates[1],
            lng: f.geometry?.coordinates[0],
            category: f.properties?.category || 'landmark',
            address: f.properties?.address || ''
          }));
          if (loaded.length > 0) {
            cachedPresets = loaded;
            return loaded;
          }
        }
      }
    } catch {
      // In offline/test environments, gracefully fall back to embedded presets
    }
  }
  cachedPresets = THAI_PRESET_PLACES;
  return cachedPresets;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const FOSSGIS_BASE = 'https://routing.openstreetmap.de';
const OSRM_BASE = 'https://router.project-osrm.org';
const SAVED_PLACES_KEY = 'mesurv_memaps_saved_places';

export interface GeocodeOptions {
  allowRemote?: boolean;
}

export interface Geocoder {
  search(
    query: string,
    signal?: AbortSignal,
    options?: GeocodeOptions
  ): Promise<PlaceSearchResult[]>;
  reverse(
    lat: number,
    lng: number,
    signal?: AbortSignal
  ): Promise<{ name: string; address: string }>;
}

export interface Router {
  route(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode?: TravelMode,
    signal?: AbortSignal
  ): Promise<RouteResult>;
}

/**
 * OpenStreetMap Nominatim Geocoder Implementation
 * Combines parsed geodetic coordinates, local presets, and OSM Nominatim.
 * Remote queries are submit-only to prevent continuous typing spam.
 */
export class NominatimGeocoder implements Geocoder {
  async search(
    query: string,
    signal?: AbortSignal,
    options: GeocodeOptions = { allowRemote: true }
  ): Promise<PlaceSearchResult[]> {
    const trimmed = query.trim();
    const presets = await getPresetPlaces();
    if (!trimmed) {
      return presets;
    }

    const results: PlaceSearchResult[] = [];

    // 1. Try parsing coordinate input directly (DD, DMS, UTM)
    const parsedCoord = parseCoordinateString(trimmed);
    if (parsedCoord) {
      results.push({
        id: `coord-search-${Date.now()}`,
        name: parsedCoord.label,
        description: `${parsedCoord.format} (${parsedCoord.datum}) ${
          parsedCoord.warning ? '⚠️ ' + parsedCoord.warning : ''
        }`.trim(),
        lat: parsedCoord.coord.lat,
        lng: parsedCoord.coord.lng,
        category: 'survey',
        address: `WGS84: ${parsedCoord.coord.lat.toFixed(6)}, ${parsedCoord.coord.lng.toFixed(6)}`
      });
    }

    // 2. Filter local presets with category synonym support
    const qLower = trimmed.toLowerCase();
    const categoryQueryMap: Record<string, string[]> = {
      restaurant: ['ร้านอาหาร', 'อาหาร', 'restaurant', 'food', 'กิน', 'ของกิน'],
      hospital: ['โรงพยาบาล', 'รพ.', 'hospital', 'สถานพยาบาล', 'หมอ', 'คลินิก'],
      mall: ['ห้าง', 'ห้างสรรพสินค้า', 'ศูนย์การค้า', 'mall', 'shopping'],
      cafe: ['คาเฟ่', 'กาแฟ', 'cafe', 'coffee'],
      gas: ['ปั๊มน้ำมัน', 'ปั้ม', 'ev', 'gas', 'fuel', 'สถานีบริการน้ำมัน'],
      transit: ['สถานี', 'ขนส่ง', 'รถไฟฟ้า', 'bts', 'mrt', 'สนามบิน', 'transit', 'station', 'ท่าอากาศยาน'],
      hotel: ['โรงแรม', 'ที่พัก', 'hotel', 'resort', 'inn'],
      survey: ['หมุดรังวัด', 'รังวัด', 'survey', 'rtsd', 'หมุดหลักฐาน'],
      university: ['มหาวิทยาลัย', 'มหาลัย', 'university', 'ม.เกษตร', 'จุฬา']
    };

    const matchedCategoryKeys = Object.entries(categoryQueryMap)
      .filter(([catKey, synonyms]) => catKey === qLower || synonyms.some(syn => qLower.includes(syn) || syn.includes(qLower)))
      .map(([catKey]) => catKey);

    const localMatches = presets.filter(
      p =>
        p.name.toLowerCase().includes(qLower) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(qLower)) ||
        p.description.toLowerCase().includes(qLower) ||
        (p.address && p.address.toLowerCase().includes(qLower)) ||
        p.category === qLower ||
        matchedCategoryKeys.includes(p.category) ||
        (p.category === 'station' && matchedCategoryKeys.includes('transit'))
    );
    results.push(...localMatches);

    // 3. If remote is disabled (live typing mode), return local + parsed coordinates
    if (options.allowRemote === false) {
      return results.slice(0, 10);
    }

    // 4. Fetch from OSM Nominatim (Submit-only, bounded to Thailand)
    try {
      const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&countrycodes=th&limit=7&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'th,en',
          'User-Agent': 'MeSurv-Platform/1.0 (https://mesurv.org)'
        },
        signal
      });

      if (res.ok) {
        const data = await res.json();
        const onlineResults: PlaceSearchResult[] = (data || []).map((item: any, idx: number) => {
          let category: PlaceSearchResult['category'] = 'address';
          const type = item.type || item.class || '';
          if (type.includes('restaurant') || type.includes('fast_food') || type.includes('food_court')) {
            category = 'restaurant';
          } else if (type.includes('cafe')) {
            category = 'cafe';
          } else if (type.includes('mall') || type.includes('department_store') || type.includes('supermarket')) {
            category = 'mall';
          } else if (type.includes('hotel') || type.includes('guest_house') || type.includes('hostel')) {
            category = 'hotel';
          } else if (type.includes('fuel') || type.includes('charging_station')) {
            category = 'gas';
          } else if (type.includes('university') || type.includes('school') || type.includes('college')) {
            category = 'university';
          } else if (type.includes('hospital') || type.includes('clinic')) {
            category = 'hospital';
          } else if (type.includes('station') || type.includes('aerodrome') || type.includes('halt') || type.includes('bus_stop')) {
            category = 'transit';
          } else if (type.includes('monument') || type.includes('place_of_worship') || type.includes('attraction') || type.includes('tourism')) {
            category = 'landmark';
          }

          const name = item.name || item.display_name.split(',')[0] || trimmed;
          return {
            id: `osm-${item.place_id || idx}`,
            name,
            description: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            category,
            address: item.display_name
          };
        });

        // Merge and deduplicate by proximity (within 50 meters)
        for (const online of onlineResults) {
          const isDuplicate = results.some(
            existing =>
              Math.abs(existing.lat - online.lat) < 0.0005 &&
              Math.abs(existing.lng - online.lng) < 0.0005
          );
          if (!isDuplicate) {
            results.push(online);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.warn('MeMaps: Nominatim search failed, fallback to local presets', err);
    }

    return results.slice(0, 10);
  }

  async reverse(
    lat: number,
    lng: number,
    signal?: AbortSignal
  ): Promise<{ name: string; address: string }> {
    try {
      const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'th,en',
          'User-Agent': 'MeSurv-Platform/1.0 (https://mesurv.org)'
        },
        signal
      });

      if (res.ok) {
        const data = await res.json();
        return {
          name: data.name || data.display_name?.split(',')[0] || `พิกัด ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          address: data.display_name || ''
        };
      }
    } catch (err) {
      console.warn('MeMaps: Reverse geocode error', err);
    }

    return {
      name: `พิกัด ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      address: `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
  }
}

/**
 * Translate OSRM maneuvers into friendly Thai navigation instructions
 */
function formatStepInstruction(step: any): string {
  const type = step.maneuver?.type || 'continue';
  const modifier = step.maneuver?.modifier || '';
  const road = step.name ? ` เข้าสู่ ${step.name}` : '';

  switch (type) {
    case 'depart':
      return `เริ่มต้นการเดินทาง มุ่งหน้า${modifier ? `ไปทาง${translateModifier(modifier)}` : ''}${road}`;
    case 'arrive':
      return 'ถึงจุดหมายปลายทาง';
    case 'turn':
      return `เลี้ยว${translateModifier(modifier)}${road}`;
    case 'roundabout':
      return `เข้าสู่วงเวียน${step.maneuver?.exit ? ` ทางออกที่ ${step.maneuver.exit}` : ''}${road}`;
    case 'merge':
      return `เบี่ยงรวมเลน${road}`;
    case 'on ramp':
      return `ขึ้นทางลาด/ทางด่วน${road}`;
    case 'off ramp':
      return `ลงทางลาด/ทางออก${road}`;
    case 'fork':
      return `แยก${translateModifier(modifier)}${road}`;
    case 'end of road':
      return `สุดทาง ให้เลี้ยว${translateModifier(modifier)}${road}`;
    case 'continue':
    case 'new name':
    default:
      if (modifier && modifier !== 'straight') {
        return `ชิด${translateModifier(modifier)}${road}`;
      }
      return `ตรงต่อไปตาม${step.name || 'เส้นทาง'}`;
  }
}

function translateModifier(modifier: string): string {
  switch (modifier) {
    case 'left':
      return 'ซ้าย';
    case 'right':
      return 'ขวา';
    case 'slight left':
      return 'ซ้ายเล็กน้อย';
    case 'slight right':
      return 'ขวาเล็กน้อย';
    case 'sharp left':
      return 'ซ้ายหักศอก';
    case 'sharp right':
      return 'ขวาหักศอก';
    case 'straight':
      return 'ตรง';
    case 'uturn':
      return 'กลับรถ';
    default:
      return modifier;
  }
}

/**
 * FOSSGIS Open Source Routing Machine Engine
 * Specialized daemons: routed-car, routed-bike, routed-foot (CORS open)
 * with graceful fallback to OSRM Public.
 */
export class FossgisRouter implements Router {
  async route(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: TravelMode = 'driving',
    signal?: AbortSignal
  ): Promise<RouteResult> {
    const serviceName =
      mode === 'cycling' ? 'routed-bike' : mode === 'walking' ? 'routed-foot' : 'routed-car';
    const fossgisUrl = `${FOSSGIS_BASE}/${serviceName}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    const osrmProfile =
      mode === 'cycling' ? 'bike' : mode === 'walking' ? 'foot' : 'driving';
    const osrmFallbackUrl = `${OSRM_BASE}/route/v1/${osrmProfile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    let data: any = null;

    try {
      const res = await fetch(fossgisUrl, { signal });
      if (res.ok) {
        data = await res.json();
      }
    } catch (fossgisErr: any) {
      if (fossgisErr?.name === 'AbortError') throw fossgisErr;
      // Fallback to project-osrm
      console.warn('FOSSGIS route request failed, attempting fallback to project-osrm', fossgisErr);
    }

    if (!data || data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      const fallbackRes = await fetch(osrmFallbackUrl, { signal });
      if (fallbackRes.status === 429) {
        throw new Error('ระบบคำนวณเส้นทางมีผู้ใช้งานหนาแน่นชั่วคราว (HTTP 429) กรุณารอสักครู่แล้วลองใหม่');
      }
      if (!fallbackRes.ok) {
        throw new Error(`การเชื่อมต่อเซิร์ฟเวอร์เส้นทางล้มเหลว (HTTP ${fallbackRes.status}) กรุณาลองใหม่อีกครั้ง`);
      }
      data = await fallbackRes.json();
    }

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(data.message || 'ไม่พบเส้นทางที่สามารถเชื่อมต่อได้');
    }

    const primaryRoute = data.routes[0];
    const leg = primaryRoute.legs?.[0];

    const coordinates: [number, number][] = primaryRoute.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    const steps: RouteStep[] = (leg?.steps || []).map((step: any) => ({
      instruction: formatStepInstruction(step),
      distanceMeters: Math.round(step.distance || 0),
      durationSeconds: Math.round(step.duration || 0),
      roadName: step.name || 'ทางไม่มีชื่อ',
      modifier: step.maneuver?.modifier,
      type: step.maneuver?.type
    }));

    const distanceMeters = Math.round(primaryRoute.distance || 0);
    const durationSeconds = Math.round(primaryRoute.duration || 0);

    const mainRoad = steps.find(s => s.roadName && s.roadName !== 'ทางไม่มีชื่อ')?.roadName;
    const distanceFormatted =
      distanceMeters >= 1000
        ? `${(distanceMeters / 1000).toFixed(1)} กม.`
        : `${distanceMeters} ม.`;
    const minutes = Math.max(1, Math.round(durationSeconds / 60));
    const timeFormatted =
      minutes >= 60
        ? `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`
        : `${minutes} นาที`;

    const summary = mainRoad
      ? `ผ่าน ${mainRoad} (${distanceFormatted}, ~${timeFormatted})`
      : `${distanceFormatted}, ~${timeFormatted}`;

    return {
      distanceMeters,
      durationSeconds,
      coordinates,
      steps,
      mode,
      summary
    };
  }
}

// Default Service Instances
export const defaultGeocoder: Geocoder = new NominatimGeocoder();
export const defaultRouter: Router = new FossgisRouter();

/**
 * Search places by query string (combines Thai presets, parsed coordinates & OSM Nominatim)
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  options?: GeocodeOptions
): Promise<PlaceSearchResult[]> {
  return defaultGeocoder.search(query, signal, options);
}

/**
 * Reverse geocode a latitude/longitude coordinate to a human address
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<{ name: string; address: string }> {
  return defaultGeocoder.reverse(lat, lng, signal);
}

/**
 * Fetch Turn-by-Turn routing directions via FOSSGIS with OSRM fallback
 */
export async function fetchRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TravelMode = 'driving',
  signal?: AbortSignal
): Promise<RouteResult> {
  return defaultRouter.route(origin, destination, mode, signal);
}


/**
 * Storage helpers for Saved Places
 */
export function getSavedPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(SAVED_PLACES_KEY);
    if (!raw) {
      // Initialize with preset favorite
      const initial: SavedPlace[] = [
        {
          id: 'fav-ku-survey',
          name: 'ภาควิชาวิศวกรรมสำรวจ มก.',
          lat: 13.8476,
          lng: 100.5696,
          utmE: 669670.12,
          utmN: 1531640.45,
          zone: 47,
          category: 'survey',
          note: 'ฐานการเรียนรู้รังวัดและปฏิบัติการ GNSS ประจำ มก.',
          createdAt: new Date().toISOString(),
          color: '#22c55e'
        }
      ];
      localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load saved places', e);
    return [];
  }
}

export function savePlace(place: Omit<SavedPlace, 'id' | 'createdAt'>): SavedPlace {
  const places = getSavedPlaces();
  
  // Calculate UTM automatically if missing
  let utmE = place.utmE;
  let utmN = place.utmN;
  let zone = place.zone;
  if (!utmE || !utmN || !zone) {
    try {
      const utm = forwardWgs84ToUtm(place.lat, place.lng);
      utmE = utm.easting;
      utmN = utm.northing;
      zone = utm.zone;
    } catch {
      // Fallback
      zone = 47;
    }
  }

  const newPlace: SavedPlace = {
    ...place,
    id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    utmE,
    utmN,
    zone,
    schemaVersion: 1,
    source: place.source || 'user',
    createdAt: new Date().toISOString()
  };

  const updated = [newPlace, ...places];
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
  return newPlace;
}

export function deleteSavedPlace(id: string): void {
  const places = getSavedPlaces().filter(p => p.id !== id);
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
}

/**
 * Resolves appropriate Thai / Map emoji based on category or place name keywords
 */
export function getCategoryEmoji(category?: string, name?: string): string {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (c === 'restaurant' || n.includes('ร้าน') || n.includes('อาหาร') || n.includes('กิน') || n.includes('โภชนา') || n.includes('ครัว') || n.includes('ส้มตำ') || n.includes('ก๋วยเตี๋ยว') || n.includes('เจ๊')) {
    return '🍽️';
  }
  if (c === 'hospital' || n.includes('โรงพยาบาล') || n.includes('รพ.') || n.includes('คลินิก') || n.includes('การแพทย์') || n.includes('สถานพยาบาล')) {
    return '🏥';
  }
  if (c === 'mall' || n.includes('ห้าง') || n.includes('เซ็นทรัล') || n.includes('สยาม') || n.includes('เดอะมอลล์') || n.includes('พารากอน') || n.includes('ศูนย์การค้า')) {
    return '🛍️';
  }
  if (c === 'cafe' || n.includes('คาเฟ่') || n.includes('กาแฟ') || n.includes('coffee') || n.includes('cafe')) {
    return '☕';
  }
  if (c === 'gas' || n.includes('ปั๊ม') || n.includes('ptt') || n.includes('shell') || n.includes('ev') || n.includes('บางจาก') || n.includes('fuel')) {
    return '⛽';
  }
  if (c === 'transit' || c === 'station' || n.includes('สถานี') || n.includes('bts') || n.includes('mrt') || n.includes('สนามบิน') || n.includes('ท่าอากาศยาน')) {
    return '🚆';
  }
  if (c === 'hotel' || n.includes('โรงแรม') || n.includes('รีสอร์ท') || n.includes('hotel') || n.includes('resort')) {
    return '🏨';
  }
  if (c === 'university' || n.includes('มหาวิทยาลัย') || n.includes('มหาลัย') || n.includes('โรงเรียน') || n.includes('วิทยาลัย')) {
    return '🎓';
  }
  if (c === 'survey' || n.includes('หมุด') || n.includes('รังวัด') || n.includes('rtsd')) {
    return '📍';
  }
  return '📍';
}

/**
 * Returns consistent accent color for category pins
 */
export function getCategoryColor(category?: string): string {
  switch (category) {
    case 'restaurant': return '#f97316';
    case 'hospital': return '#ef4444';
    case 'mall': return '#ec4899';
    case 'cafe': return '#d97706';
    case 'gas': return '#10b981';
    case 'transit':
    case 'station': return '#8b5cf6';
    case 'hotel': return '#6366f1';
    case 'survey': return '#059669';
    case 'university': return '#2563eb';
    default: return '#ea4335';
  }
}

