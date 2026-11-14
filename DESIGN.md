# DESIGN.md — MESURV: Lifelong Geomatics Terminal & Field Operational Cockpit
> **Design System Status**: **PRODUCTION MASTER SPEC v5.0** (Champion Fusion: Fieldbook × Obsidian Telemetry)  
> **Platform Role**: Lifelong Engineering Knowledge Engine & Autonomous Field Troubleshooting Terminal (คลังคู่มือปฏิบัติการ วิศวกรรมสำรวจ และระบบแก้ปัญหาวิกฤตหน้างานตลอดชีพ)  
> **Domain**: Survey Engineering & Geoinformatics, Kasetsart University · RTSD Geodetic Standards · DOPA/DOL Cadastral Regulations · Building Control Act 2566 · Reality Capture (3D SLAM / TLS / UAV) · Infrastructure Construction

---

## 1. วิสัยทัศน์และการสังเคราะห์ DNA (Core Vision & Domain Philosophy)

**MESURV** ได้รับการออกแบบและพัฒนาขึ้นเพื่อเป็น **"สถานีปฏิบัติการประจำตัวของวิศวกรสำรวจตลอดชีพ"** ที่ตอบสนองทั้งการเรียน การทำงานหน้างานสนามจริง และการแก้ไขปัญหาเฉพาะหน้า โดยยึดหลักปรัชญาการออกแบบ 4 ประการ:

1. **Dual-Environment Contrast Architecture (ความสามารถในการปรับตัวข้าม 2 สภาพแวดล้อมสุดขั้ว)**:
   - **กลางแจ้งแสงแดดจัด (Outdoor Direct Sunlight)**: ใช้งานโหมด `FIELDBOOK` (`data-theme="fieldbook"`) พื้นผิวสี Warm Sand `#f3f1eb` เลียนแบบสมุดจดรังวัดสนาม ตัดแสงสะท้อนตา 100% พร้อมตัวอักษรสีเขียวป่าลึก `#14241b` ที่คมชัดระดับ High Contrast
   - **ห้องแล็บประมวลผล / งานกลางคืน (Indoor Post-Processing & Night Ops)**: ใช้งานโหมด `TERMINAL` (`data-theme="terminal"`) พื้นผิว Obsidian `#050505` มืดสนิท ประหยัดพลังงานจอ OLED พร้อมไฟสถานะ Telemetry สีเขียวฟอสฟอร์ `#34d399` และสีเหลือง Total Station `#fcd535`
   - การสลับธีมต้องเกิดผลทันทีแบบ Zero-FOUC (Flash of Unstyled Content) ภายใน `< 16ms`
2. **Solid Architectural Surfaces (ความเรียบคมระดับเครื่องมือวัด)**:
   - ห้ามใช้กระจกฝ้า (`backdrop-filter: blur`) หรือการไล่เฉดสีแฟชั่นที่รบกวนสายตา
   - การ์ดทุกใบและคอนโซลทุกแผงเป็นพื้นผิวทึบ มีเส้นขอบเชิงโครงสร้าง `1px solid var(--border)` ชัดเจน
3. **Tabular Numeric Discipline (ความเที่ยงตรงของตัวเลขและหน่วยวัด)**:
   - ค่าพิกัดทุกตำแหน่ง ($E, N, U$), มุมราบ-มุมดิ่ง ($DDD^\circ MM'SS"$), ค่าระดับ ($RL$), และอัตราส่วนความคลาดเคลื่อน ($1:N$) ต้องแสดงผลด้วยฟอนต์ `Geist Mono` พร้อมบังคับใช้ `font-variant-numeric: tabular-nums` ป้องกันตัวเลขสั่นไหวขณะรีเฟรชข้อมูล
4. **Offline-First & Remote Survival (ความพร้อมปฏิบัติการในจุดไร้สัญญาณ)**:
   - ระบบ PWA ทำงานได้สมบูรณ์แบบ 100% แม้อยู่ในหุบเขา เกาะห่างไกล อุโมงค์รถไฟฟ้าใต้ดิน หรือพื้นที่อับสัญญาณมือถือ

---

## 2. โทเค็นสีและระบบตัวแปรมาตรฐาน (Dual-Theme Token Specification)

### Theme A — `data-theme="fieldbook"` (สมุดจดรังวัดกลางแจ้ง / ค่าเริ่มต้น)
| โทเค็น (CSS Variable) | ค่าสี (Hex / RGBA) | หน้าที่และตำแหน่งการใช้งาน |
| :--- | :--- | :--- |
| `--bg` | `#f3f1eb` | พื้นผิวกระดาษสมุดรังวัด (Warm Sand Topographic Canvas) |
| `--surface` | `#ffffff` | พื้นผิวการ์ดหลัก คอนโซล และตารางคำนวณ |
| `--surface-2` | `#eceae4` | ช่องกรอกข้อมูล (Input Well), แถบสรุปผลลัพธ์, พื้นหลังโค้ด |
| `--border` | `rgba(20, 36, 27, 0.14)` | เส้นขอบเชิงโครงสร้าง 1px |
| `--border-strong` | `rgba(20, 36, 27, 0.45)` | เส้นขอบขณะ Active, Focus, หรือชี้ไฮไลต์ |
| `--text-1` | `#14241b` | หมึกหลักสีเขียวป่าลึก สำหรับหัวข้อและตัวเลขพิกัด |
| `--text-2` | `#43544a` | หมึกรอง สำหรับคำอธิบายเนื้อหา และขั้นตอนการทำงาน |
| `--text-3` | `#57665c` | หมึกกำกับหน่วย, รหัสมาตรฐาน (WCAG 2.1 AA $\ge 5.0:1$) |
| `--accent` | `#15803d` | เขียวมรกตวิศวะเกษตร (Primary CTA, แถบสถานะหลัก) |
| `--accent-2` | `#b45309` | สีทองเหลืองอุปกรณ์สำรวจ (Survey Brass / หมุด RTSD) |
| `--status-fix` | `#16a34a` | สถานะ GNSS RTK Fixed / ผ่านเกณฑ์มาตรฐาน |
| `--status-float` | `#d97706` | สถานะ GNSS RTK Float / ค่าเตือนเฝ้าระวัง |
| `--status-error` | `#dc2626` | สถานะหลุดเกณฑ์ความคลาดเคลื่อน / ผิดข้อกำหนดกฎหมาย |
| `--card-radius` | `10px` | รัศมีขอบการ์ดสัมผัสนุ่มนวลแบบสมุดสนาม |
| `--btn-radius` | `6px` | รัศมีปุ่มกดเครื่องมือวัด |

### Theme B — `data-theme="terminal"` (เทอร์มินัลออบซิเดียน / ประมวลผลขั้นสูง)
| โทเค็น (CSS Variable) | ค่าสี (Hex / RGBA) | หน้าที่และตำแหน่งการใช้งาน |
| :--- | :--- | :--- |
| `--bg` | `#050505` | พื้นหลังดำสนิทแบบ True Pitch-Black Obsidian |
| `--surface` | `#111111` | พื้นผิวโมดูลและแผงคอนโซลควบคุมหลัก |
| `--surface-2` | `#0a0a0a` | บ่อแสดงผลข้อมูลดิบ (Telemetry Well) และ Terminal Prompt |
| `--border` | `#262626` | เส้นโครงสร้างเทคนิคคมชัดระดับฮาร์ดแวร์ |
| `--border-strong` | `#3d3d3d` | เส้นขอบโมดูลที่กำลังรันประมวลผล |
| `--text-1` | `#ffffff` | ข้อความสีขาวสว่าง ชัดเจนสูงสุดในที่มืด |
| `--text-2` | `#a3a3a3` | ข้อความสูตรคำนวณและคำอธิบายทั่วไป |
| `--text-3` | `#8a8a8a` | ดัชนีสถานีและค่าคงที่ (WCAG 2.1 AA $\ge 5.6:1$) |
| `--accent` | `#34d399` | เขียวฟอสฟอร์เรดาร์ สำหรับปุ่มกดหลักและแท็บนำทาง |
| `--accent-2` | `#fcd535` | เหลืองสว่างสะท้อนแสงสไตล์กล้อง Total Station Leica/Topcon |
| `--status-fix` | `#10b981` | สัญญาณพิกัดแม่นยำสูงระดับมิลลิเมตร |
| `--status-float` | `#f59e0b` | สัญญาณลอยตัว รอการคำนวณ Ambiguity Resolution |
| `--status-error` | `#ef4444` | สัญญาณหลุดวงโคจร / Residual เกินเกณฑ์ |
| `--card-radius` | `2px` | ขอบเหลี่ยมคมสไตล์เครื่องจักรและคอนโซลวิศวกรรม |
| `--btn-radius` | `2px` | ปุ่มกดแนวเทคนิคอลสไตล์ Industrial Instrument |

---

## 3. สถาปัตยกรรมข้อมูล 4 โหมดการทำงาน (4 Core Modalities)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               MESURV COCKPIT ARCHITECTURE                              │
├───────────────────┬───────────────────┬────────────────────────┬───────────────────────┤
│  1. KNOWLEDGE HUB │ 2. CALCULATOR HUB │ 3. TROUBLESHOOT MATRIX │  4. WEBGIS & TELEMETRY│
│  (คลังระเบียบวิจัย)│ (เครื่องมือคำนวณ) │ (กู้วิกฤตฉุกเฉินสนาม)  │  (แผนที่และเซนเซอร์)  │
├───────────────────┼───────────────────┼────────────────────────┼───────────────────────┤
│ • SOP-01..09      │ • Traverse (วงรอบ)│ • RTK Fix Failure      │ • MapLibre 3D Globe   │
│ • Equipment Manual│ • Leveling (ระดับ)│ • Collimation Error    │ • Leaflet 2D Cadastral│
│ • Building Laws   │ • Least Squares   │ • Boundary Dispute     │ • RTSD Benchmark Grid │
│ • 260+ Dictionary │ • Curve Staking   │ • Slump Test Loss      │ • Real-time GPS HUD   │
│ • As-built / Take │ • Rebar / Weight  │ • High Misclosure      │ • Disaster Telemetry  │
└───────────────────┴───────────────────┴────────────────────────┴───────────────────────┘
```

### 3.1 Knowledge Hub & Legal Framework (คลังความรู้ กฎหมาย และศัพท์ช่าง)
* **Omni-Search Bar (`Ctrl + K`)**: ช่องค้นหาอัจฉริยะแบบ Fuzzy Search สามารถพิมพ์ค้นหาได้ทั้งรหัส SOP, ชื่ออุปกรณ์, พระราชบัญญัติควบคุมอาคาร, และคำศัพท์ช่างภาษาไทย-อังกฤษ
* **Law & Cadastral Setback Engine (`LAW-REGULATION`)**:
  - ตารางข้อกำหนดระยะร่นอาคารตาม พรบ. ควบคุมอาคาร 2566 แยกตามความสูงอาคารและประเภทถนนสาธารณะ
  - เกณฑ์การรังวัดชิดแนวเขตที่ดิน และการแก้ไขปัญหาฐานรากหรือแนวเขตทับซ้อน
* **Bilingual Technical Dictionary (`DICT-TECH`)**:
  - รวบรวมศัพท์เทคนิควิศวกรรมสำรวจ โยธา และโครงสร้างมากกว่า 260 คำ พร้อมคำอธิบายบริบทการใช้งานในชีวิตจริง

### 3.2 Calculator Cockpit (สถานีคำนวณวิศวกรรมสนาม)
* **Geodetic Core**:
  - `TraverseCalculator`: คำนวณวงรอบด้วยวิธี Compass Rule (Bowditch) และ Transit Rule พร้อมวิเคราะห์ $1:N$
  - `LevelingCalculator`: ปรับแก้ค่าระดับแบบ Differential Leveling และตรวจสอบ Two-Peg Test
  - `NetworkAdjustment`: Least Squares Adjustment สำหรับโครงข่าย GNSS และโครงข่ายวงรอบ
  - `CoordinateConverter`: แปลงพิกัดกลับไปมาระหว่าง WGS84 Geographic (Lat/Lon) $\leftrightarrow$ UTM Grid Zone 47N/48N $\leftrightarrow$ Indian 1975
* **Site & Infrastructure Extensions (ส่วนขยายวิศวกรรมโยธาและสนาม)**:
  - `CALC-CURVE`: คำนวณองค์ประกอบโค้งราบ (Circular Curve) และโค้งดิ่ง (Vertical Curve) พร้อมสร้างตารางเปิดมุมเล็งเบี่ยงเบน (Deflection Angles) และระยะคอร์ดสำหรับตั้งกล้องปักหมุด
  - `CALC-REBAR`: คำนวณน้ำหนักเหล็กเส้นตามสูตร $W = d^2/162$, ประมาณการระยะทาบเหล็กตามมาตรฐาน วสท./ACI, และสรุป Bar-Cut List
  - `CALC-EARTHWORK`: คำนวณปริมาตรงานดินขุด-ดินถมด้วยวิธี Average End-Area และ Prismoidal Formula

### 3.3 Field Troubleshooting Matrix (ระบบกู้วิกฤตเฉพาะหน้าภาคสนาม)
* ระบบช่วยเหลือแบบ Symptom $\rightarrow$ Diagnostic $\rightarrow$ Resolution Matrix:
  - **เคส 1 (GNSS ไม่ยอม Fix)**: วิเคราะห์ Multipath, PDOP $> 3.0$, การรบกวนของคลื่นวิทยุ UHF, และการย้ายสถานี Base
  - **เคส 2 (ค่าระดับเดินปิดไม่ลง)**: ตรวจสอบความยาวช่วงสายตา หน้า-หลัง (Sight Distance Balance), ดินทรุดตัวใต้หมุดเปลี่ยนระดับ, การอ่านสายใยผิด
  - **เคส 3 (หมุดหลักฐานคลาดเคลื่อน/สูญหาย)**: ขั้นตอนการตั้งสถานีเทียม (Resection / Free Station) และการโยงยึดโครงข่ายวงรอบฉุกเฉิน
  - **เคส 4 (ข้อพิพาทแนวเขตเพื่อนบ้าน)**: มาตรการตรวจสอบหลักเขตที่ดินเดิมและการทำรังวัดร่วมตามระเบียบกรมที่ดิน

### 3.4 WebGIS & Tactical Map (แผงแผนที่ยุทธการและข้อมูลโทรมาตร)
* ผสานสองเอนจินแผนที่ในระบบเดียว:
  - **MapLibre GL 3D**: สำหรับมุมมองภูมิประเทศ 3 มิติ เส้นชั้นความสูง (Contour) และแบบจำลองระดับสูงเชิงเลข (DEM)
  - **Leaflet Tactical 2D**: สำหรับการซ้อนทับข้อมูลหมุดควบคุม RTSD, แปลงที่ดินรูปแปลงโฉนด, และโครงข่ายระบายน้ำ
* **Bottom Telemetry Strip**: แถบค่าพิกัดสดและค่าพิกัดสถานีแม่ข่าย CORS KU-Bangkhen พร้อมค่า Geoid Separation ($N$) จากแบบจำลอง TGM2017

---

## 4. ข้อกำหนดการตอบสนองและสรีรศาสตร์หน้างาน (Ergonomics & Touch Targets)

1. **Glove & Thumb Operation Standard (การใช้งานด้วยถุงมือหรือนิ้วหัวแม่มือ)**:
   - ปุ่มกดทุกปุ่ม, ตัวเลือก Dropdown, และจุดปักหมุดแผนที่ ต้องมีพื้นที่แตะสัมผัส **ไม่ต่ำกว่า 44 × 44 px** (และ 48 × 48 px สำหรับปุ่มคำนวณหลัก) เพื่อให้วิศวกรที่สวมถุงมือเซฟตี้สามารถกดได้แม่นยำ
2. **Form Input Auto-Advancement & Numeric Keypad**:
   - ช่องกรอกข้อมูลพิกัดและค่าระดับกำหนด `inputMode="decimal"` หรือ `inputMode="numeric"` เพื่อเรียกแป้นพิมพ์ตัวเลขทันทีบนสมาร์ตโฟนและแท็บเล็ตสนาม
   - มีระบบจำค่าเดิม (LocalStorage Persistence) ป้องกันข้อมูลสนามหายเมื่อหน้าจอดับหรือแบตเตอรี่หมดชั่วคราว
3. **Print & Field Certification Export (`@media print`)**:
   - รองรับการกดพิมพ์ออกเป็นกระดาษขนาด A4 สำหรับแนบส่งผู้ควบคุมงานหรืออาจารย์ที่ปรึกษาได้ทันที
   - กำหนดให้ซ่อน Navigation Bar, แถบแผนที่ และสลับชุดสีเป็นพื้นขาวหมึกดำ 100% พร้อมตารางสรุปผลการรังวัดที่มีช่องลงลายมือชื่อผู้รังวัดและผู้ตรวจรับ

---

## 5. กฎเหล็กที่ห้ามละเมิดเด็ดขาด (Strict System Invariants)

- **ห้ามใส่ Sidebar ด้านซ้ายแบบ Fixed**: เพื่อสงวนพื้นที่แนวนอน 100% ให้แก่ตารางวงรอบขนาดใหญ่ ตารางค่าระดับ และแผงแผนที่ WebGIS
- **ห้ามใช้ Glassmorphism หรือภาพพื้นหลังฟรุ้งฟริ้ง**: เครื่องมือวิศวกรรมต้องทึบ คม อ่านง่ายในแดดจัด
- **ห้ามใช้เฉดสีสีม่วง/นีออนแบบเกม**: ให้อิงสีเขียวมรกตเกษตรและสีส้ม/เหลือง Total Station เท่านั้น
- **ห้ามใช้ Emoji ในหัวข้อทางการ**: ให้ใช้ไอคอนเส้นเวกเตอร์ Lucide Icons (ความหนาเส้น 1.75–2px) หรือรหัสสเปก (`SOP-01`, `CALC-01`, `LAW-01`)
- **ห้ามทำการแปลงหน่วยแบบสูญเสียเลขนัยสำคัญ**: การคำนวณพิกัดต้องเก็บทศนิยมอย่างน้อย 4 ตำแหน่งในทางราบ (0.1 mm) และ 4 ตำแหน่งในทางดิ่งเสมอ
