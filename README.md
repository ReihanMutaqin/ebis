# EBIS Web (Filter EBIS) ⚡

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/radix%20ui-161618.svg?style=for-the-badge&logo=radix-ui&logoColor=white)

**EBIS Web (Filter EBIS)** adalah aplikasi internal canggih untuk pemrosesan dan penyaringan data. Dirancang sebagai pintu gerbang utama untuk mengolah data mentah EBIS, aplikasi ini memungkinkan pengguna untuk mengunggah file *export* mentah, menerapkan filter berlapis secara dinamis, berinteraksi dengan data menggunakan Asisten AI, dan mengekspor hasil akhirnya untuk digunakan oleh aplikasi **EBIS Task Tracker**.

## ✨ Fitur Utama

### 📁 Pemrosesan Data Canggih
- **Smart File Parsing**: Unggah dan ekstrak file data mentah berukuran besar dari sistem EBIS utama dengan sangat mudah.
- **Dynamic Filtering Engine**: Saring ratusan baris data secara instan berdasarkan WITEL, STO, Tanggal Order, Status, hingga pencarian kata kunci kustom.
- **Tampilan Tabel Data**: Tabel data yang bersih, responsif, dan dilengkapi *pagination* untuk melihat pratinjau hasil filter.

### 🤖 Asisten AI Terintegrasi
- **Chat Dengan Data Anda**: Asisten AI bawaan yang mampu membaca ringkasan data yang telah difilter. AI ini dapat menjawab berbagai pertanyaan terkait data, mencari tahu STO dengan tugas terbanyak, hingga mengidentifikasi status-status yang menjadi *bottleneck*.
- **Pilihan Provider AI**: Ganti dan pilih *provider* AI (seperti Groq, OpenAI, dll) langsung dari menu Pengaturan (*Settings*).
- **Fitur Suara (Speech Input)**: Dukungan perintah suara untuk bertanya kepada AI tanpa perlu mengetik.

### 📤 Integrasi Ekosistem
- **One-Click Export**: Cukup dengan satu tombol "Export to Task Tracker", aplikasi akan langsung membuat file JSON terstandarisasi (`ebis_export_xxx.json`). File ini berfungsi sebagai jembatan yang dapat diimpor langsung ke dalam aplikasi **EBIS Task Tracker** untuk para teknisi lapangan.

### 🎨 Desain UI/UX Modern
- **Komponen Shadcn UI**: Dibangun di atas fondasi Radix UI untuk menghasilkan komponen web yang aksesibel, ringan, dan sangat mudah dikustomisasi.
- **Mode Gelap (Dark Mode)**: Mendukung perpindahan antara mode terang dan gelap secara *native* demi kenyamanan mata pengguna.

## 🛠️ Teknologi yang Digunakan

- **Framework**: React 19 + Vite
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI)
- **Form & Validasi**: React Hook Form + Zod
- **Ikon**: Lucide React
- **Pemrosesan Tanggal**: date-fns

## 🚀 Panduan Instalasi

### Persyaratan
Pastikan Anda sudah menginstal Node.js (minimal versi 20) dan npm di komputer Anda.

### Langkah-langkah

1. *Clone* repositori ini dan masuk ke folder `ebis-web`:
   ```bash
   git clone https://github.com/username-anda/ebis-web.git
   cd ebis-web
   ```

2. Instal semua dependensi:
   ```bash
   npm install
   ```

### Menjalankan Aplikasi Secara Lokal

Jalankan server pengembangan Vite:
```bash
npm run dev
```

Aplikasi akan bisa diakses melalui `http://localhost:5173`.

## 📦 Build untuk Produksi

Untuk membuat *build* aplikasi yang siap diluncurkan ke tahap produksi (*production-ready*):
```bash
npm run build
```
File hasil optimasi akan di-generate dan diletakkan di dalam folder `dist`.

---
*Dikembangkan oleh Reihan x Dheo*
