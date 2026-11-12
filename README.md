# OUTLAW 2T PIPE ENGINEERING

เว็บแอปสำหรับออกแบบและตรวจสอบท่อไอเสียเครื่องยนต์ 2 จังหวะ โดยเริ่มจากแบบจำลอง wave timing อันดับแรก และวางโครงสร้างไว้สำหรับเพิ่ม Engineering Solver ในรุ่นถัดไป

## สถานะ

- ระยะปัจจุบัน: Prototype / Calculation architecture
- ใช้งานออนไลน์: เตรียมพร้อมสำหรับ GitHub Pages
- สูตรปัจจุบัน: Uniform gas temperature, constant acoustic speed และจุดสะท้อนสมมติที่กึ่งกลาง baffle cone
- ยังไม่ใช่ผลคำนวณที่ผ่านการรับรองสำหรับการผลิต

## โครงสร้าง

```text
site/                         เว็บไซต์ที่นำขึ้นใช้งาน
  index.html                  โครงสร้างหน้าเว็บ
  assets/app.css              Design system และ responsive layout
  src/calculation-core.js     สูตรและ validation แบบไม่ผูกกับ UI
  src/app.js                  การแสดงผลและ interaction
tests/                        ชุดทดสอบ Calculation Core
docs/                         เอกสารสถาปัตยกรรมและแผนพัฒนา
.github/workflows/            GitHub Actions
OUTLAW_2T_PIPE_V01_UI_MockUp.html  Mockup ต้นฉบับสำหรับอ้างอิง
```

## ทดสอบ

ต้องมี Node.js 20 ขึ้นไป:

```bash
npm test
```

หน้าเว็บเป็น Static ES Modules จึงไม่ต้อง Build ก่อน deploy สำหรับการพัฒนาในเครื่องให้เปิดผ่าน Local HTTP server แทนการเปิดด้วย `file://`

## Deploy

Workflow `deploy-pages.yml` จะตรวจสูตรก่อน แล้วจึงเผยแพร่โฟลเดอร์ `site/` ไปยัง GitHub Pages เมื่อมีการ push เข้า branch `main`

## หลักการสำคัญ

Calculation Core ต้องไม่อ้างอิง DOM เพื่อให้สามารถทดสอบสูตร ใช้กับ Server API หรือย้ายเข้าสู่ระบบ Standalone ในอนาคตได้โดยไม่เขียนสูตรใหม่

