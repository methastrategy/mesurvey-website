# MESURV: Survey & Geomatics Engineering Web Platform

ระบบเว็บแอปพลิเคชันเพื่อการศึกษาและปฏิบัติงานด้านวิศวกรรมสำรวจและสารสนเทศภูมิศาสตร์ (Survey & Geomatics Engineering Web Platform)  
**พัฒนาโดย:** นายเมธา ตรีประพันธ์กิจ (6610554196)  
**สถาบัน:** ภาควิชาวิศวกรรมสำรวจและสารสนเทศภูมิศาสตร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ (Kasetsart University)

---

## 📌 คุณสมบัติเด่นของระบบ (Key Features)

### 1. คลังความรู้ & คู่มือปฏิบัติการสำรวจภาคสนาม (Field Geomatics Manual)
- **Total Station & Theodolite:** ขั้นตอนการตั้งกล้องเล็งหมุด (Centering & Leveling), การ Orientation ด้วย Backsight Azimuth, และวิธี Resection (Free Station)
- **GNSS & Satellite Geodesy:** การรังวัดดาวเทียมแบบ RTK Base-Rover, การเชื่อมต่อโครงข่าย CORS-NTRIP (DOL-CORS / RTSD-CORS), และการประเมินค่าความแม่นยำ (DOP & Ambiguity Fix)
- **Differential Leveling:** การรังวัดระดับเชิงอนุพันธ์, การทดสอบความขนานแกนเล็ง Two-Peg Test, และการประเมินเกณฑ์ความคลาดเคลื่อนปิดรอบตามมาตรฐานกรมแผนที่ทหาร (ชั้น 1, ชั้น 2, ชั้น 3, งานก่อสร้าง)
- **UAV Photogrammetry:** การวางแผนการบินโดรน, การคำนวณ Ground Sampling Distance (GSD), การกระจายหมุด GCPs & Checkpoints
- **3D SLAM LiDAR & Scan-to-BIM QA/QC:** กระบวนการสแกนเก็บข้อมูลพอยต์คลาวด์ 3 มิติ, การเชื่อมต่อภาพสแกน (Registration), และการตรวจวัดมิติ As-Built เทียบกับโมเดล BIM (โครงงานวิจัยปี 4)

### 2. เครื่องมือคำนวณงานสำรวจ (Survey Engineering Computation Suite)
- **แปลงค่าพิกัดสากลและประเทศไทย (Coordinate Transformation):**
  - WGS84 Geographic (Decimal Degrees และ DMS: DD° MM' SS.ss")
  - WGS84 UTM Projection (Zone 47N และ Zone 48N)
  - Indian 1975 UTM (ตามพารามิเตอร์ 7 ตัวของกรมแผนที่ทหาร RTSD: $\Delta X = +204\text{ m}, \Delta Y = +837\text{ m}, \Delta Z = +294\text{ m}$)
  - รองรับการคัดลอกค่าพิกัด และการส่งพิกัดไปปักหมุดบนแผนที่ WebGIS ได้ในคลิกเดียว
- **การปรับแก้วงรอบวิธีเข็มทิศ (Bowditch / Compass Rule Traverse Adjustment):**
  - รองรับทั้งวงรอบปิดกลับจุดเดิม (Closed Loop) และวงรอบเปิดเชื่อมโยง (Connecting Link)
  - ตรวจสอบความคลาดเคลื่อนเชิงเส้น (Linear Misclosure) และอัตราส่วนความละเอียด (Precision Ratio 1:N)
  - แสดงตารางปรับแก้ค่า $dE, dN$ พิกัดสถานีทุกจุด และจำลองผังรูปปิดวงรอบแบบ SVG Vector
  - ส่งออกผลลัพธ์เป็นไฟล์ CSV ได้ทันที
- **สมุดจดและคำนวณงานระดับ (Differential Leveling Notebook):**
  - รองรับการคำนวณทั้งวิธี HI (Height of Instrument) และ Rise & Fall
  - ระบบตรวจสอบผลรวมหน้ากระดาษอัตโนมัติ (Arithmetic Page Check: $\Sigma BS - \Sigma FS = \text{Last RL} - \text{First RL}$)
  - ประเมินผลความคลาดเคลื่อนปิดรอบเทียบกับเกณฑ์ความคลาดเคลื่อน $C = k \sqrt{K}\text{ mm}$ ตามมาตรฐานกรมแผนที่ทหาร
- **แปลงหน่วยที่ดินไทย (Cadastral Land Area Converter):**
  - แปลงระหว่าง ตารางเมตร ($m^2$), เฮกตาร์ (Hectare), เอเคอร์ (Acre) กับหน่วยโฉนดที่ดินไทย (**ไร่ - งาน - ตารางวา**)
  - ระบบประมาณการมูลค่าที่ดินรวมจากราคาประเมินต่อตารางวา

### 3. ระบบแผนที่ดิจิทัลเชิงตอบสนอง (Interactive WebGIS Map)
- **ชั้นข้อมูลแผนที่ฐาน (Multi-Basemaps):**
  - ภาพถ่ายดาวเทียมความละเอียดสูง (High-Resolution Satellite / Aerial Orthophoto)
  - แผนที่ถนน OpenStreetMap (Standard OSM)
  - แผนที่เส้นชั้นความสูงและภูมิประเทศ (OpenTopoMap)
  - แผนที่สีเข้มคมชัดสูง (CartoDB Dark Matter)
- **Telemetry HUD:** แสดงค่าพิกัดสดตามตำแหน่งเคอร์เซอร์เมาส์ ทั้ง WGS84 (DD, DMS) และ UTM Zone 47N/48N Easting/Northing แบบเรียลไทม์
- **เครื่องมือรังวัดบนแผนที่:**
  - เครื่องมือวัดระยะทางตามแนวเส้นทาง (Polyline Distance Tool)
  - เครื่องมือวัดพื้นที่รูปปิด (Polygon Area Tool) พร้อมแสดงผลทั้ง $m^2$ และ ไร่-งาน-ตารางวา
  - เครื่องมือปักหมุดสำรวจ (Waypoint Pin) พร้อมบันทึกค่าพิกัด
- **Spatial Data Import:** รองรับการลากวางไฟล์ GeoJSON หรือ KML เพื่อแสดงผลแปลงที่ดินบนแผนที่ได้ทันที
- **จุดอ้างอิงรังวัดด่วน (Quick-Jump Bookmarks):** มหาวิทยาลัยเกษตรศาสตร์, กรมแผนที่ทหาร, ค่ายสำรวจ มก., และศูนย์สารสนเทศภูมิศาสตร์ภูมิภาค

---

## 🛠️ สถาปัตยกรรมทางเทคนิค (Technical Architecture)

- **Frontend Framework:** React 19 + TypeScript + Vite
- **Styling & UI/UX:** Tailwind CSS + Lucide React Icons
- **GIS Mapping Engine:** Leaflet Engine with Hardware-Accelerated Canvas
- **Geodesy Math & Projections:** Proj4js (Bursa-Wolf 7-parameter geodetic transformations)
- **Architecture Pattern:** Clean Domain-Driven Design (แยกชั้นคำนวณคณิตศาสตร์ `src/core/` ออกจาก UI เพื่อความสะดวกในการต่อยอดเชื่อมต่อ REST API, Supabase หรือ PostGIS ในอนาคต)

---

## 🚀 การติดตั้งและรันในเครื่อง (Local Development)

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd mesurv-platform

# 2. ติดตั้ง Dependencies
npm install

# 3. รัน Development Server
npm run dev
```

เปิดเบราว์เซอร์ที่: `http://localhost:3000`

---

## ☁️ การเชื่อมต่อ GitHub และ Deploy ขึ้น Vercel

### ขั้นตอนการนำขึ้น GitHub:
```bash
# กำหนด Git และ Commit
git init
git add .
git commit -m "feat: complete MESURV geomatics platform v1.0"

# เชื่อมต่อกับ GitHub Repo ของคุณ (สร้าง repo ใหม่ชื่อ mesurv-platform บน GitHub)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/mesurv-platform.git
git branch -M main
git push -u origin main
```

### ขั้นตอนการเชื่อมต่อ Vercel:
1. เข้าไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. คลิก **"Add New..."** -> **"Project"**
3. เลือก Repository `mesurv-platform` จาก GitHub ของคุณ
4. Vercel จะตรวจจับการตั้งค่า `vite.config.ts` และ `vercel.json` โดยอัตโนมัติ (Framework: Vite)
5. คลิก **"Deploy"** ระบบจะ Build และให้ URL ใช้งานจริงออนไลน์ได้ทันที (รองรับ HTTPS และโดเมนส่วนตัว)
