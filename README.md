# 🐔 BANSHIDHAR POULTRY (बंशीधर पोल्ट्री)
### Complete Production-Quality Mobile-First Poultry Dealer Management Ecosystem

---

## 📖 Overview (परिचय)

**BANSHIDHAR POULTRY** is a specialized, production-ready Poultry Dealership Management Ecosystem designed for poultry dealers, feed distributors, and rural farmers. 

This is **NOT** a standard e-commerce site. It provides full enterprise operational workflows:
- **Public Business Website**: Informational catalogue with live poultry rates, weight calculator, and farmer registration (catalogue display-only; no public checkout).
- **Installable Farmer PWA App**: Digital passbook (बकाया / एडवांस), live feed/chick ordering with snapshot-locked pricing, flock age tracking, voice messaging, and PDF statement downloads.
- **Installable Admin PWA App**: Executive dashboard, automated farmer credential generation, double-sided ledger accounting, chick batch management, bird lifting weighment settlements, and audit logs.
- **AI Poultry Health Doctor (कुक्कुट मित्र)**: Intelligent multi-provider failover (**AgentRouter → Google Gemini → Groq → Local RAG**) supporting text and photo vision analysis in Hindi, Hinglish, and English.
- **Realtime Communication**: WhatsApp-style 1-on-1 audio voice note recording, photo/video media exchange, and live typing indicators.

---

## 🏗️ Architecture & Core Rules (सिस्टम की मुख्य विशेषताएं)

```
BANSHIDHAR POULTRY
├── 🌐 Public Website (http://localhost:5173/)
├── 👨‍🌾 Farmer PWA Portal (http://localhost:5173/farmer)
├── 🛠️ Admin Dealership Console (http://localhost:5173/admin)
├── 📊 Double-Sided Ledger (Debit = Purchases, Credit = Payments / Bird Sales)
├── ⚖️ Bird Sale Settlement (Actual KG × Live Rate - Deductions = Net Credit)
├── 🤖 AI Failover Engine (AgentRouter → Gemini → Groq → Local RAG + Vision)
├── 🎙️ Realtime Socket.IO Audio & Chat
└── 📄 PDF Statement Generator (A4 Printable Ledger Passbook)
```

### 1. Double-Sided Ledger Accounting (बकाया और एडवांस हिसाब)
- **Debit (+)**: Feed Purchases, Chick Supplies, Debit Adjustments.
- **Credit (-)**: Cash/Bank Payments Received, Advance Deposits, Bird Sale Lifting Credits, Discounts.
- **Net Balance** = `Total Debit - Total Credit`
  - If `Net Balance > 0` ➔ **आपका बकाया (Due / Market Receivable)**
  - If `Net Balance < 0` ➔ **आपका एडवांस (Advance Deposit)**
  - If `Net Balance = 0` ➔ **हिसाब चुकता (Settled)**

### 2. Snapshot Price Integrity (मूल्य अखंडता)
When an order is created, product prices are locked into the order snapshot. Future price modifications in the admin catalog will **never** alter historical order totals or passbook debits.

### 3. Intelligent AI Health Doctor (3-Tier Failover + Vision)
- **Priority 1**: **AgentRouter** (`claude-3-5-sonnet-20241022` / `gpt-4o`)
- **Priority 2**: **Google Gemini** (`gemini-1.5-flash` / `gemini-1.5-pro`)
- **Priority 3**: **Groq** (`llama-3.3-70b-versatile` / `llama-3.2-11b-vision-preview`)
- **Fallback**: **Intelligent Local Poultry RAG Knowledge Base**
- **Circuit Breaker**: If any provider experiences 429 rate limit, timeout, or server error, it automatically enters a 60-second cooldown and routes seamlessly to the next provider.

---

## 🔑 Default Login Credentials (डिफ़ॉल्ट लॉगिन विवरण)

| Portal | Role | Username / Farmer ID | Password | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Portal** | Dealership Admin | `admin` | `admin123` | [http://localhost:5173/admin/login](http://localhost:5173/admin/login) |
| **Farmer Portal** | Registered Farmer | `BP-1001` | `farmer123` | [http://localhost:5173/farmer/login](http://localhost:5173/farmer/login) |

---

## ⚙️ Prerequisites (आवश्यक सॉफ्टवेयर)

Ensure you have the following installed on your machine:
1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: v9.0.0 or higher
3. **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.

---

## 🚀 Step-by-Step Installation Guide (एक-एक स्टेप गाइड)

Follow these steps to run the complete ecosystem locally:

### Step 1: Open the Project Directory
Open your terminal and navigate to the project directory:
```bash
cd /Users/nishantkumar/Desktop/project/Banshidhar_poultary
```

---

### Step 2: Configure Environment Variables (`.env`)
Create or verify the `server/.env` file:
```bash
cp .env.example server/.env
```

Review and update your `server/.env` configuration:
```env
# Server Port & URLs
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/banshidhar_poultry

# JWT Authentication
JWT_SECRET=super_secret_jwt_key_banshidhar_poultry_production_ready_2026
JWT_EXPIRES_IN=7d

# Media Uploads (Optional Cloudinary - local disk storage fallback is enabled)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Brevo (Sendinblue) Email Provider for Password Reset
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@banshidharpoultry.com
BREVO_SENDER_NAME=Banshidhar Poultry

# AI Poultry Health Assistant Providers (Intelligent Failover)
AGENTROUTER_API_KEY=
AGENTROUTER_BASE_URL=https://api.agentrouter.com/v1
AGENTROUTER_MODEL=claude-3-5-sonnet-20241022

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

> **Note**: Even if external API keys (`AGENTROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`) are left blank during development, the system **automatically falls back to the built-in Local Poultry RAG Engine**, ensuring all AI features work seamlessly offline!

---

### Step 3: Install Dependencies
Install all root, backend, and frontend packages with npm workspaces:
```bash
npm install
```

---

### Step 4: Seed Database with Initial Data
Initialize default admin accounts, sample farmer (`BP-1001`), product catalog, daily rates, flock batch, and passbook ledger transactions:
```bash
npm run seed
```

---

### Step 5: Run the Full Ecosystem in Development Mode
Start both the Backend API server (Port 5050) and Frontend Vite dev server (Port 5173) simultaneously:
```bash
npm run dev
```

You will see:
```
🐔 BANSHIDHAR POULTRY SERVER STARTED
🌐 Server URL: http://localhost:5050
📡 Realtime Socket.IO: Active
📁 Uploads dir: .../server/uploads

  VITE v6.4.3  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

- **Open Public Website**: [http://localhost:5173/](http://localhost:5173/)
- **Open Farmer Login**: [http://localhost:5173/farmer/login](http://localhost:5173/farmer/login)
- **Open Admin Dashboard**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

### Step 6: Run Automated Tests
Execute the Vitest test suite to verify accounting math, snapshot integrity, and AI failover:
```bash
npm run test
```

Expected output:
```
✓ tests/priceSnapshot.test.ts (1 test)
✓ tests/ledger.test.ts (2 tests)
✓ tests/aiFailover.test.ts (6 tests)
Test Files  3 passed (3)
Tests       9 passed (9)
```

---

### Step 7: Build for Production
To build production bundles for both backend and client with PWA service worker generation:
```bash
npm run build
```

---

## 📱 Features Walkthrough (सुविधाओं का विवरण)

### 1. 🌐 Public Website (`/`)
- **Hero Video & Poster**: Autoplay muted video with poster fallback, brand badge, and action buttons.
- **Download Farmer App**: Prominent PWA installation prompt with offline access benefits.
- **Today's Poultry Rates**: Live chick prices, live bird lifting rates, and feed bag rates.
- **Product Catalog**: High-quality feed and chick displays (catalogue only; no direct public checkout).
- **Weight × Rate Calculator**: Automatic gross calculator (Birds × Avg Weight × Rate/KG) with one-click copy and WhatsApp sharing.
- **Farmer Registration Form (`/join`)**: Online registration for new farmers.

---

### 2. 👨‍🌾 Farmer Portal & Installable PWA (`/farmer`)
- **Passbook Summary Banner**: Clear visibility of **आपका बकाया (Due)** vs **आपका एडवांस (Advance)**.
- **Live Ordering**: Browse dealer products, choose quantities, and place orders with locked prices.
- **Flock Batch Tracker**: Days old calculation, mortality recording, and **Inform Dealer: Birds Ready for Lifting** notification.
- **Digital Passbook / Ledger**: Detailed list of purchases, payments, and 1-click **A4 PDF Statement Download**.
- **Realtime Chat**: Voice notes with waveform player, photos, videos, and delivery receipts.
- **AI Health Doctor**: Floating chat assistant with poultry disease image recognition in Hindi, Hinglish, and English.

---

### 3. 🛠️ Admin Dealership Console (`/admin`)
- **Executive Metrics**: Total Receivables (market due) vs Total Advance credit across all farmers.
- **Farmer Management**: Auto-generated sequential Farmer IDs (`BP-1001`, `BP-1002`...), temporary passwords, and **Credentials Card** (Copy, Print, WhatsApp Share).
- **Farmer 360° Console**:
  - Ledger with manual payment/debit entries and transaction voiding.
  - Create Order on behalf of farmer.
  - Chick supply & flock batch creation.
  - Bird sale lifting settlements with gross/deduction breakdown.
- **Bird Sale Settlements**: Weight × Live Rate gross calculation, transit/mortality deductions, and atomic ledger credit posting.
- **AI Health Doctor Settings**: Realtime health monitor for **AgentRouter**, **Google Gemini**, and **Groq**, model selector, and cooldown configuration.
- **Audit Logs**: Immutable log of all financial updates, rate modifications, and authentication events.

---

## 🔌 API Reference (मुख्य API एंडपॉइंट्स)

### 🔐 Authentication & Accounts
- `POST /api/auth/admin/login` — Admin login
- `POST /api/auth/farmer/login` — Farmer login
- `POST /api/auth/forgot-password` — Password reset link via Brevo
- `POST /api/auth/reset-password` — Set new password with token
- `POST /api/auth/change-password` — Change password inside portal

### 📋 Farmers Management
- `GET /api/farmers` — List all farmers with balance summaries
- `POST /api/farmers` — Create farmer & generate credentials
- `GET /api/farmers/:id` — Farmer details
- `POST /api/farmers/:id/reset-password` — Generate new temporary password

### 💰 Double-Sided Ledger
- `GET /api/ledger/farmer/:farmerId` — Get farmer ledger & balance summary
- `GET /api/ledger/farmer/:farmerId/pdf` — Download printable A4 PDF statement
- `POST /api/ledger/transaction` — Add manual ledger entry (Payment / Debit)
- `POST /api/ledger/transaction/:id/void` — Void / reverse a transaction

### 📦 Orders & Catalog
- `GET /api/products/active` — Active catalog products
- `POST /api/orders` — Create new order with snapshot pricing
- `PUT /api/orders/:id/status` — Update status (PENDING ➔ CONFIRMED ➔ DELIVERED)

### 🐥 Chick Batches & Bird Sales
- `POST /api/batches/supply` — Record chick supply & create flock batch
- `POST /api/batches/:id/sale-inquiry` — Farmer lifting notification
- `POST /api/bird-sales/settle` — Record bird lifting (Weight × Rate) & post credit

### 🤖 AI Poultry Health Assistant
- `GET /api/ai/status` — Check if AI assistant is enabled
- `GET /api/ai/health` — Live health status of AgentRouter, Gemini, and Groq
- `POST /api/ai/chat` — Chat with AI assistant (supports text + image uploads)

---

## 📂 Project Directory Structure (प्रोजेक्ट संरचना)

```
Banshidhar_poultary/
├── package.json               # Root workspaces configuration
├── .env.example               # Environment variables template
├── README.md                  # Complete documentation (this file)
│
├── server/                    # Backend (Node.js, Express, TypeScript, MongoDB)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── src/
│   │   ├── config/            # Database connection
│   │   ├── constants/         # Poultry RAG knowledge base
│   │   ├── controllers/       # Route controllers (Auth, Ledger, Orders, AI, etc.)
│   │   ├── middlewares/       # Authentication, Upload, Error handler
│   │   ├── models/            # 19 Mongoose schemas
│   │   ├── routes/            # Express routes
│   │   ├── scripts/           # Database seeder (seed.ts)
│   │   ├── services/          # AI failover, PDF statement, Socket.IO, Email
│   │   │   └── aiProviders/   # AgentRouterProvider, GeminiProvider, GroqProvider
│   │   ├── types/             # Backend TypeScript interfaces
│   │   └── server.ts          # Server entry point (Port 5050)
│   └── tests/                 # Vitest test suites (Accounting, Snapshots, AI Failover)
│
└── client/                    # Frontend (React 18, Vite, TypeScript, Tailwind CSS, PWA)
    ├── package.json
    ├── vite.config.ts         # Vite configuration with PWA & API proxy
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── api/               # Axios client & currency formatters
        ├── components/        # Logo, Loader, AudioRecorder/Player, AI Modal, Cards
        ├── context/           # AuthContext, LanguageContext, ThemeContext, SocketContext
        ├── i18n/              # English & Hindi translation dictionaries
        ├── layouts/           # PublicLayout, FarmerLayout, AdminLayout
        ├── pages/             # Public, Auth, Farmer, and Admin pages
        ├── types/             # Frontend TypeScript interfaces
        ├── App.tsx            # React router with role guards
        └── main.tsx           # Application root
```

---

## 🧪 Testing & Verification (जांच एवं परीक्षण)

To run the automated tests:
```bash
npm run test --workspace=server
```

To run a production client build check:
```bash
npm run build --workspace=client
```

---

## 🛡️ License & Ownership

Developed exclusively for **BANSHIDHAR POULTRY** — All rights reserved.
