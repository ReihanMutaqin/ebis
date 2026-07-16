# EBIS Web (Filter EBIS) ⚡

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/radix%20ui-161618.svg?style=for-the-badge&logo=radix-ui&logoColor=white)

**EBIS Web (Filter EBIS)** is a powerful internal data processing and filtering application. Designed as the primary gateway for raw EBIS data, it enables users to upload raw exports, apply advanced multi-layered filters, interact with data via an AI Assistant, and export the refined dataset to be consumed by the **EBIS Task Tracker**.

## ✨ Key Features

### 📁 Advanced Data Processing
- **Smart File Parsing**: Easily upload and parse large raw data files from the main EBIS system.
- **Dynamic Filtering Engine**: Filter hundreds of rows instantly by WITEL, STO, Order Date, Status, and Custom Search queries.
- **Data Table View**: Clean, paginated, and responsive data table to preview the results.

### 🤖 AI Chat Assistant
- **Context-Aware AI**: Chat directly with your data. The built-in AI reads the filtered data summary and can answer questions about frequencies, top STOs, and specific status bottlenecks.
- **Multi-Provider Support**: Switch AI providers directly from the Settings menu.
- **Speech Integration**: Supports voice input for hands-free querying.

### 📤 Seamless Ecosystem Integration
- **One-Click Export**: Click "Export to Task Tracker" to generate a standardized JSON file (`ebis_export_xxx.json`). This file bridges the gap and can be directly imported into the EBIS Task Tracker application for field technicians.

### 🎨 Modern UI/UX
- **Shadcn UI Components**: Built on top of Radix UI for accessible, unstyled, and highly customizable components.
- **Dark & Light Mode**: Native theme switching support for better accessibility and user preference.

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI)
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v20+) and npm installed on your machine.

### Installation

1. Clone the repository and navigate to the `ebis-web` directory:
   ```bash
   cd ebis-web
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Running the App Locally

Start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📦 Build for Production

To create a production-ready build:
```bash
npm run build
```
The optimized files will be generated in the `dist` folder.

---
*Developed by Reihan x Dheo*
