# 🐔 BANSHIDHAR POULTRY (बंशीधर पोल्ट्री)
### Complete Production-Quality Mobile-First Poultry Dealer Management Ecosystem & Digital Khatabook

---

## 📖 Overview (सिस्टम परिचय)

**BANSHIDHAR POULTRY** is an enterprise-grade, mobile-first Poultry Dealership Management Ecosystem designed for poultry dealers, feed & chick distributors, and rural farmers.

This is **NOT** a standard generic e-commerce app. It is tailored to the exact realities of poultry farm financing, chick rearing cycles, and market trade in India:
- **Direct Portal Redirection**: Logged-in Admins are automatically routed to the **Admin Console (`/admin`)** and Farmers directly to the **Farmer Passbook (`/farmer`)** upon opening the app or visiting the root URL.
- **Natural Hindi Web Push Notifications**: Automated background push alerts for farmer messages, order status updates, loose feed debits, cash loans (उधारी), dues collection receipts, chicken lifting credits, and registration alerts.
- **Multi-Mode Digital Khatabook (खाताबही)**:
  - **Debit Modes**: Standard catalog products, loose feed / custom items (e.g. `2 किलो दाना @ ₹40`), cash loans / udhari given to farmers (e.g. `₹5,000 काम के लिए नकद`), and manual debit adjustments.
  - **Credit Modes**: Dues payment collection (with mandatory reason fill box e.g. `पुराना बकाया चुकता किया`), mature chicken lifting / bird purchase credits (`मुर्गों की संख्या`, `कुल वजन Kg`, `भाव ₹/Kg`, `गाड़ी नंबर / कांटा पर्ची`), special discounts, and credit adjustments.
- **Flock Rearing & Live Bird Sales**: Real-time flock age tracking, mortality recording, mature bird lifting settlement with transit deduction calculations, and atomic ledger credit posting.
- **AI Poultry Health Doctor (कुक्कुट मित्र)**: 3-tier intelligent failover engine (**AgentRouter → Google Gemini → Groq → Local Poultry RAG**) supporting multilingual text and vision analysis in Hindi, Hinglish, and English.
- **Realtime Media & Audio Chat**: WhatsApp-style voice note recording with waveform player, photos, videos, and live typing indicators.
- **A4 PDF Statement Generator**: Official printable statement with dealership branding, summary cards, and itemized debit/credit tables.

---

## 🏗️ Architecture & Core Rules (सिस्टम की मुख्य विशेषताएं)

```
BANSHIDHAR POULTRY ECOSYSTEM
├── 🌐 Public Website (http://localhost:5173/) [Informational rates & calculator]
├── 👨‍🌾 Farmer PWA Portal (http://localhost:5173/farmer) [Passbook, Orders, Chat, AI]
├── 🛠️ Admin Dealership Console (http://localhost:5173/admin) [Ledger, Settlements, Orders]
├── 📊 Double-Sided Ledger [Debit = Supplies / Loans, Credit = Payments / Chicken Lifting]
├── 🐔 Bird Lifting Settlement [Actual KG × Live Rate - Deductions = Net Credit]
├── 🔔 Web Push Notifications [VAPID Service Worker + Natural Hindi Alerts]
├── 🤖 3-Tier AI Failover Engine [AgentRouter → Gemini → Groq → Local RAG + Vision]
├── 🎙️ Realtime Socket.IO Audio & Chat [Voice notes, photos, typing indicators]
└── 📄 PDF Statement Generator [A4 Printable Ledger Passbook]
```

### 1. Role-Based Portal Routing (डायरेक्ट पोर्टल रिडायरेक्शन)
| User Status | Accessed Route | Resulting Route |
| :--- | :--- | :--- |
| **Logged-in Admin** | `/` or `/admin/login` | **`/admin`** (Dealership Console) |
| **Logged-in Farmer** | `/` or `/farmer/login` | **`/farmer`** (Farmer Passbook & Portal) |
| **Unauthenticated Guest** | `/` | **`/`** (Public Homepage with Live Rates) |

---

### 2. Double-Sided Khatabook Accounting (खाताबही गणित)

* **नामे (Debit - DR)**:
  * Catalog Product Purchases (दाना, चूजा, दवाई)
  * Loose Feed & Custom Items (उदा. `2 किलो दाना @ ₹40`)
  * Cash Loans / Udhari (उदा. `₹5,000 उधारी / नकद सहायता`)
  * Debit Adjustments
* **जमा (Credit - CR)**:
  * Dues Payment Receipts (उदा. `भुगतान जमा: पुराना बकाया चुकता किया`)
  * Mature Chicken Lifting / Bird Purchase (उदा. `बड़ा मुर्गा उठाया: 200 पीस, 450.5 किग्रा @ ₹95/किग्रा`)
  * Special Discounts (उदा. `गर्मी राहत विशेष छूट`)
  * Credit Adjustments
* **Net Balance** = `Total Debit - Total Credit`
  * If `Net Balance > 0` ➔ **आपका बकाया (Due / Market Receivable)**
  * If `Net Balance < 0` ➔ **आपका एडवांस (Advance Deposit)**
  * If `Net Balance = 0` ➔ **हिसाब चुकता (Zero Balance)**

---

### 3. Natural Hindi Push Notifications (सहज हिंदी में पुश नोटिफिकेशन्स)

* **VAPID Keypair Infrastructure**: Configured with standard web-push keys in `server/.env` and background PWA Service Worker ([client/public/sw.js](file:///Users/nishantkumar/Desktop/project/Banshidhar_poultary/client/public/sw.js)).
* **Automatic Client Subscription**: Handles permission prompt and subscription persistence in [AuthContext.tsx](file:///Users/nishantkumar/Desktop/project/Banshidhar_poultary/client/src/context/AuthContext.tsx).
* **Sample Real-World Notifications**:
  * 🐔 **बड़ा मुर्गा बिक्री:** `🐔 बड़ा मुर्गा बिक्री राशि जमा हुई` → *डीलर द्वारा बड़ा मुर्गा उठाया/बिक्री: 200 पीस, 450.5 किग्रा @ ₹95/किग्रा (₹42,797.50) आपके खाते में जमा किया गया।*
  * 💵 **बकाया भुगतान:** `✅ भुगतान जमा सफल (रसीद)` → *डीलर द्वारा ₹5,000 का भुगतान जमा (भुगतान जमा: पुराना बकाया चुकता किया) आपके खाते में दर्ज किया गया।*
  * 🌾 **खुला दाना:** `🌾 नया सामान / दाना आपके खाते में जुड़ा` → *डीलर द्वारा 2 किलो दाना (₹80) आपके खाते में नामे (Debit) किया गया।*
  * 💸 **उधारी / नकद:** `💸 उधारी / नकद राशि दर्ज हुई` → *डीलर द्वारा ₹5,000 (उधारी / नकद सहायता) आपके खाते में नामे (Debit) किया गया।*
  * 💬 **डीलर चैट:** `💬 बंशीधर पोल्ट्री से नया संदेश` → *"{संदेश का टेक्स्ट}"*

---

## 🔑 Default Login Credentials (डिफ़ॉल्ट लॉगिन विवरण)

| Portal | Role | Username / Farmer ID | Password | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Portal** | Dealership Admin | `admin` | `admin123` | [http://localhost:5173/admin/login](http://localhost:5173/admin/login) |
| **Farmer Portal** | Registered Farmer | `BP-1001` | `farmer123` | [http://localhost:5173/farmer/login](http://localhost:5173/farmer/login) |

---

## ⚙️ Prerequisites (आवश्यक सॉफ्टवेयर)

Ensure you have the following installed:
1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: v9.0.0 or higher
3. **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI.

---

## 🚀 Step-by-Step Installation Guide (इंस्टॉलेशन गाइड)

> Production deployments require Node.js 20.19+, MongoDB, a strong `JWT_SECRET`, exact
> comma-separated `CLIENT_URL` origins, public `SERVER_URL`, Brevo email credentials,
> and Cloudinary credentials. The server deliberately refuses to start in production
> when these durable-storage/security dependencies are missing. AI and web-push keys
> remain optional; those features fall back or report unavailable when unconfigured.

### Step 1: Clone or Navigate to Directory
```bash
cd /Users/nishantkumar/Desktop/project/Banshidhar_poultary
```

---

### Step 2: Configure Environment Variables (`.env`)
Create or verify the `server/.env` file:
```bash
cp .env.example server/.env
```

Review and configure your `server/.env`:
```env
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/banshidhar_poultry

JWT_SECRET=super_secret_jwt_key_banshidhar_poultry_production_ready_2026
JWT_EXPIRES_IN=7d

# Media Uploads (Cloudinary optional - local fallback active)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Web Push Notification VAPID Keys
VAPID_PUBLIC_KEY=BHnfWgwgHdKgi35abqRY5-Gd9nCxt5gpKxR1LxUu7vkSAkhVB96ZSXK6TJP6s0o9vy2TRiWIw--iZxNh66fwDOg
VAPID_PRIVATE_KEY=qFI7KZhlj5_L5FkImpsQAlTmelWECtCKHuxAwn1TePU
VAPID_SUBJECT=mailto:admin@banshidharpoultry.com

# AI Health Assistant Providers (Optional - Local RAG is built-in)
AGENTROUTER_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
```

---

### Step 3: Install Dependencies
```bash
npm install
```

---

### Step 4: Seed Database with Initial Data
```bash
npm run seed
```

---

### Step 5: Start Development Servers
```bash
npm run dev
```

* **Frontend Vite Dev Server**: [http://localhost:5173](http://localhost:5173)
* **Backend API Server**: [http://localhost:5050](http://localhost:5050)

---

### Step 6: Run Automated Tests
```bash
npm run test
```

---

### Step 7: Build for Production
```bash
npm run build
```

### Production verification

Run the complete local gate before deployment:

```bash
npm ci
npm run check
npm audit --omit=dev
```

Deploy the backend from `render.yaml` and the frontend from `client/`. Configure
`VITE_API_URL` in the frontend host to the public backend URL (without a trailing
`/api`). Verify `/health` returns HTTP 200 after deployment. Never run the sample
seed script against a live production database: it clears application collections
and installs demonstration credentials.

---

## 📱 Features Walkthrough (सुविधाओं का विस्तृत विवरण)

### 1. 🌐 Public Website (`/`)
* **Hero Banner**: High-resolution video presentation, live chick prices, and direct app install link.
* **Live Market Rates**: Daily updated chick rates, mature bird lifting rates, and feed bag prices.
* **Weight × Rate Calculator**: Instant gross calculation (`Birds × Weight × Rate`) with one-click WhatsApp share.
* **Farmer Registration (`/join`)**: New farmers can submit registration details directly to the dealership.

---

### 2. 👨‍🌾 Farmer Portal & Installable PWA (`/farmer`)
* **Passbook Summary Banner**: Real-time status of **बकाया (Due)** vs **एडवांस (Advance)**.
* **Digital Passbook**: Every entry shows exact Date & Time, Description/Reason, Payment Mode / Vehicle details, DR/CR, and Running Balance.
* **A4 PDF Statement**: One-click download of official passbook statement.
* **Direct Feed & Chick Ordering**: Browse dealership products and submit orders with locked snapshot pricing.
* **Flock Batch Tracker**: Days old calculation, mortality recording, and **Inform Dealer: Birds Ready for Lifting** notification.
* **Realtime Chat & Audio Notes**: 1-on-1 messaging with voice notes, image sharing, and read receipts.
* **AI Poultry Health Doctor**: Multilingual assistant capable of diagnosing disease symptoms and bird photos.

---

### 3. 🛠️ Admin Dealership Console (`/admin`)
* **Executive Financial Metrics**: Total market receivables, total advance deposits, active flock counts, and pending orders.
* **Farmer 360° Management**:
  * Sequential Farmer IDs (`BP-1001`, `BP-1002`...).
  * Credential Cards with 1-click WhatsApp credentials share.
  * Direct order placement on behalf of farmers.
* **Multi-Mode Debit Modal**:
  * `CATALOG`: Feed, chicks, medicines from active catalog.
  * `CUSTOM_ITEM`: Loose feed (e.g. `2 किलो दाना @ ₹40`), customized medicines.
  * `LOAN_CASH`: Cash loans / udhari with reason (e.g. `₹5,000 काम के लिए नकद`).
  * `ADJUSTMENT`: Ledger balance corrections.
* **Multi-Mode Credit Modal**:
  * `PAYMENT`: Dues collection with payment mode & mandatory **Reason fill box**.
  * `BIRD_SALE`: Mature chicken lifting with birds count, total kg, rate per kg, vehicle/weigh slip notes.
  * `DISCOUNT`: Special relief / seasonal discounts.
  * `ADJUSTMENT_CREDIT`: Credit adjustments.
* **Audit Trail**: Immutable logs of all financial entries, transaction voids, and administrative actions.

---

## 🔌 API Reference (मुख्य API एंडपॉइंट्स)

### 🔐 Authentication & Accounts
* `POST /api/auth/admin/login` — Admin login
* `POST /api/auth/farmer/login` — Farmer login
* `POST /api/auth/forgot-password` — Request password reset
* `POST /api/auth/reset-password` — Set new password with token

### 📋 Farmer Management
* `GET /api/farmers` — List all farmers with balance summaries
* `POST /api/farmers` — Create farmer & generate credentials
* `GET /api/farmers/:id` — Farmer profile details
* `POST /api/farmers/:id/reset-password` — Reset temporary password

### 💰 Double-Sided Ledger & Khatabook
* `GET /api/ledger/khatabook/overview` — Admin Khatabook overview with search & filters
* `GET /api/ledger/farmer/:farmerId` — Get farmer ledger & balance summary
* `GET /api/ledger/farmer/:farmerId/pdf` — Download printable A4 PDF statement
* `POST /api/ledger/transaction` — Add manual entry (Debit / Loose Feed / Loan / Payment / Chicken Lifting)
* `POST /api/ledger/transaction/:id/void` — Void / reverse a transaction

### 🔔 Web Push Notifications
* `GET /api/notifications/vapid-key` — Get public VAPID key
* `POST /api/notifications/push-subscribe` — Save browser push subscription
* `GET /api/notifications` — Get user notifications

### 📦 Orders & Catalog
* `GET /api/products/active` — Active catalog products
* `POST /api/orders` — Create new order with locked snapshot pricing
* `PUT /api/orders/:id/status` — Update order status

### 🐥 Chick Batches & Bird Sales
* `POST /api/batches/supply` — Record chick supply & initialize flock batch
* `POST /api/batches/:id/sale-inquiry` — Send bird lifting notification to dealer
* `POST /api/bird-sales/settle` — Record mature bird sale settlement & post credit

### 🤖 AI Poultry Health Assistant
* `GET /api/ai/health` — Live health check of AI providers
* `POST /api/ai/chat` — Chat with AI assistant (Text + Vision image analysis)

---

## 📂 Project Directory Structure (प्रोजेक्ट संरचना)

```
Banshidhar_poultary/
├── package.json               # Root workspaces configuration
├── .env.example               # Environment variables template
├── README.md                  # Comprehensive documentation
│
├── server/                    # Backend (Node.js, Express, TypeScript, MongoDB)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── src/
│   │   ├── config/            # Database connection
│   │   ├── constants/         # Poultry RAG knowledge base
│   │   ├── controllers/       # Route controllers (Auth, Ledger, Orders, AI, Push)
│   │   ├── middlewares/       # Authentication, Upload, Error handler
│   │   ├── models/            # 19 Mongoose schemas (Farmer, LedgerTransaction, PushSubscription...)
│   │   ├── routes/            # Express routes
│   │   ├── scripts/           # Database seeder (seed.ts)
│   │   ├── services/          # PushService, PDFService, SocketService, EmailService
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
    ├── public/
    │   └── sw.js              # Background Push & Notification Click Service Worker
    └── src/
        ├── api/               # Axios client & currency formatters
        ├── components/        # UI components, AudioRecorder, AI Assistant Modal
        ├── context/           # AuthContext, LanguageContext, ThemeContext, SocketContext
        ├── i18n/              # English & Hindi translation dictionaries
        ├── layouts/           # PublicLayout, FarmerLayout, AdminLayout
        ├── pages/             # Public, Auth, Farmer, and Admin pages
        ├── utils/             # Push notification subscription helpers
        ├── types/             # Frontend TypeScript interfaces
        ├── App.tsx            # React router with smart RootRedirect & role guards
        └── main.tsx           # Application root
```

---

## 🛡️ License & Ownership

Developed exclusively for **BANSHIDHAR POULTRY** — All rights reserved.
