# Architecture

## เป้าหมายระยะแรก

สร้าง Online Web Application ที่ทดลองสูตรและ UI ได้รวดเร็ว โดยแยกความรับผิดชอบเป็นสามชั้น

```text
Browser UI
   ↓
Calculation Core
   ↓
Project API / Database (ระยะถัดไป)
```

## ขอบเขตเวอร์ชัน 0.1

- รับค่ารอบเป้าหมาย องศาเปิดพอร์ต อุณหภูมิแก๊ส และ geometry ที่ผู้ใช้กำหนด
- คำนวณ acoustic speed และ wave round-trip timing
- วาด longitudinal section
- แสดง validation โดยไม่ทิ้งผลลัพธ์เก่าค้างบนหน้าจอ
- Export design JSON ที่มี schema version

## ขอบเขตที่ยังไม่รวม

- การคำนวณ geometry จากข้อมูลเครื่องยนต์
- ระบบสมาชิกและฐานข้อมูลออนไลน์
- การคำนวณ gas dynamics แบบ nonlinear
- การยืนยันกำลังเครื่องยนต์
- DXF, cone development และ manufacturing allowance

## หลักเกณฑ์ข้อมูล

- หน่วยภายในใช้ `mm`, `°C`, `° ATDC`, `rpm` และ SI สำหรับสูตรฟิสิกส์
- ทุกไฟล์โครงการต้องระบุ `schemaVersion` และ `calculationVersion`
- ผลลัพธ์ต้องแยกจากข้อมูลนำเข้า เพื่อให้คำนวณใหม่ได้เมื่อสูตรเปลี่ยน
- สูตรที่ใช้ผลิตต้องมี test fixture และ revision ที่ตรวจสอบย้อนกลับได้

