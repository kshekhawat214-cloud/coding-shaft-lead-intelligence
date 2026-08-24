# ⚡ Coding Shaft — AI Lead Intelligence & CRM Engine

A modern, production-grade B2B prospecting platform and sales operating system designed to discover, research, score, and convert high-value local business prospects.

---

## ✨ Features

- **📍 Multi-Source Business Discovery**: Real-time geo-discovery powered by OpenStreetMap Overpass with zero-cost architecture.
- **🧠 Granular Reputation & Menu Intelligence**: Deep analysis of famous dishes, signature services, customer consensus, and operational friction.
- **⚡ Technical Website Auditing**: Live detection of SSL status, viewport responsiveness, online booking engines, and WhatsApp widgets.
- **🎯 Algorithmic Lead Scoring (0–100)**: Deterministic lead scoring categorizing prospects into **HOT (75+)**, **HIGH (55–74)**, and **STANDARD**.
- **📊 2-Way Google Sheets Sync**: Dual-tab auto-sync separating *📞 Contact Ready Leads* (with 1-click WhatsApp links) and *🌐 Web Prospects*.
- **🔍 Dynamic Multi-Filter CRM**: Filter seamlessly by City, Country, Business Category, and Lead Priority.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file:
```env
DATABASE_URL="your-supabase-connection-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── docs/                 # Complete architecture and data models
├── prisma/               # Prisma database schema & migrations
├── src/
│   ├── app/              # Next.js App Router & API Route Handlers
│   ├── components/       # Sleek Glassmorphic React components
│   ├── domain/           # Reputation, phone normalizer & business rules
│   ├── infrastructure/   # Discovery providers & website auditors
│   ├── lib/              # Database clients & API response utilities
│   └── services/         # Orchestration & lead scoring engines
└── tailwind.config.ts    # Custom emerald/dark theme design system
```

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](./docs) folder:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Technical architecture & component boundaries
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — Database schema & relationships
- [`docs/LEAD_SCORING.md`](./docs/LEAD_SCORING.md) — 0–100 scoring methodology
- [`docs/PRODUCT_REQUIREMENTS.md`](./docs/PRODUCT_REQUIREMENTS.md) — Scope & functional specifications
- [`docs/AGENT_SYSTEM.md`](./docs/AGENT_SYSTEM.md) — AI intelligence skills & workflow design
