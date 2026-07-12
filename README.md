# 🚚 TransitOps

### Enterprise Smart Transport Operations Platform

TransitOps is a modern, enterprise-grade Fleet Management Enterprise Resource Planning (ERP) platform developed specifically for the Odoo Hackathon 2027. It offers end-to-end telemetry tracking, automated driver-vehicle dispatch routing, real-time maintenance logs, and dynamic financial ledger analysis.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black&style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white&style=flat-square)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20.0-339933?logo=nodedotjs&logoColor=white&style=flat-square)](#)
[![Express](https://img.shields.io/badge/Express-4.0-000000?logo=express&logoColor=white&style=flat-square)](#)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma&logoColor=white&style=flat-square)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.0-4169E1?logo=postgresql&logoColor=white&style=flat-square)](#)
[![License](https://img.shields.io/badge/License-Odoo_Hackathon-orange?style=flat-square)](#)

---

## Overview

TransitOps solves complex logistics problems by unifying operations into a single command center. 
*   **What it is**: An ERP platform that streamlines vehicle tracking, driver scheduling, and expenses.
*   **Who uses it**: Fleet Managers, Safety Officers, Financial Analysts, and Dispatchers.
*   **Problem it solves**: Prevents driver double-booking, reduces maintenance downtime, and optimizes fuel costs.
*   **Why it exists**: To replace fragmented tracking systems with an integrated, high-speed dashboard.

---

## Key Features

*   **Authentication**: Secure user session tracking using JWT access and refresh tokens.
*   **RBAC**: Granular role-based controls (Super Admin, Fleet Manager, Safety Officer, Financial Analyst, Dispatcher, Driver).
*   **Vehicle Management**: Fleet registry tracking odometers, registration numbers, and status indicators.
*   **Driver Management**: Operator records auditing experience levels, telephone details, and safety scores.
*   **Trip Management**: Automated dispatch engine locking driver/vehicle availability and matching weights.
*   **Maintenance**: Active scheduling logs locking vehicle status to `IN_SHOP` during service.
*   **Fuel Management**: Fuel log entries verifying quantity limits and cost-efficiency.
*   **Expense Tracking**: Operational ledger records auto-synchronizing fuel receipts and repairs.
*   **Enterprise Dashboard**: Interactive telemetry cockpit using responsive Recharts widgets.
*   **Reports**: Dynamic reporting grid supporting text search, parameters filtering, and CSV/Excel exports.
*   **Global Search**: Enterprise command bar query engine matching records in parallel.
*   **Notifications**: Dynamic alerts bell showing license expirations and overdue actions.
*   **Audit Logs**: Action auditing recording triggers, user emails, resource UUIDs, and client user-agents.
*   **Responsive UI**: Modern interface optimized for all tablet, mobile, and desktop layouts.

---

## Business Workflow

```
Login
  ↓
Register Vehicle
  ↓
Register Driver
  ↓
Create Trip (Draft)
  ↓
Dispatch Trip (ON_TRIP Lock)
  ↓
Complete Trip (Odometer Update)
  ↓
Maintenance (IN_SHOP Lock)
  ↓
Fuel & Expense (Auto-Sync to Ledger)
  ↓
Dashboard (Live KPI Updates)
  ↓
Reports (CSV / Excel Export)
```

---

## Technology Stack

| Layer | Technology | Key Modules |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS | Vite build engine, HTML5 Semantic structure |
| **Backend** | Node.js, Express, TypeScript | Router index, Dependency client |
| **Database** | PostgreSQL, Prisma ORM | Constraints validation, Performance indexes |
| **Authentication** | JSON Web Tokens (JWT), bcrypt | Cookie Parser, Role check guards |
| **Validation** | Zod, express-validator | Validation handlers middleware |
| **Charts** | Recharts, Lucide Icons | Responsive SVG viewport layouts |
| **Logging** | Winston Logger | Daily File Rotation, Event console transport |

---

## Project Structure

```
TransitOps/
├── backend/
│   ├── prisma/             # Schema definitions and migrations
│   ├── src/
│   │   ├── config/         # System logs and server configs
│   │   ├── controllers/    # API Request controllers
│   │   ├── database/       # Database client connections
│   │   ├── middleware/     # Auth, roles, and error handlers
│   │   ├── repositories/   # Direct Prisma database interfaces
│   │   ├── routes/         # Express endpoint definitions
│   │   ├── services/       # Core business workflows
│   │   ├── utils/          # Hashing and response helpers
│   │   ├── validators/     # Express validator schemas
│   │   └── server.ts       # Main application entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # TopNavbars, Sidebars, and UI widgets
│   │   ├── contexts/       # React AuthContext modules
│   │   ├── layouts/        # AppLayout grids
│   │   ├── pages/          # Dashboard, Vehicles, Drivers, Trips
│   │   ├── routes/         # ProtectedRoute guards and lists
│   │   ├── services/       # Axios API wrapper functions
│   │   ├── styles/         # Global CSS style files
│   │   ├── types/          # TypeScript interface types
│   │   ├── utils/          # Formats and date converters
│   │   └── main.tsx        # React mounting entry point
```

---

## Setup

### Prerequisites
* Node.js >= 20.0
* PostgreSQL >= 14.0
* npm package manager

### 1. Installation

Install dependencies for both projects:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Set up `.env` files:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and configure DATABASE_URL, JWT_ACCESS_SECRET, and PORT

# Frontend
cd ../frontend
cp .env.example .env
```

---

## Database Setup

Initialize the database schema and populate dummy records:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

---

## Running the Project

Launch development servers for both packages:
```bash
# Start backend server (Terminal 1)
cd backend
npm run dev

# Start frontend server (Terminal 2)
cd frontend
npm run dev
```

---

## 5. Access

Service | URL

Frontend | http://localhost:5173

Backend | http://localhost:5000

Health | http://localhost:5000/api/health

---

## Default Credentials (Development)

Role

Super Admin

Fleet Manager

Safety Officer

Financial Analyst

Email

admin@transitops.com

fleet.manager@transitops.com

safety.officer@transitops.com

finance@transitops.com

Password

TransitOps@2024!

---

## API Overview

*   **Authentication**:
    *   `POST /api/auth/register` - Create client user account.
    *   `POST /api/auth/login` - Authenticate account and retrieve JWT session cookies.
    *   `POST /api/auth/logout` - Invalidate session cookies.
*   **Vehicles**:
    *   `GET /api/vehicles` - Paginated vehicle fleet records.
    *   `POST /api/vehicles` - Register vehicle registry asset.
*   **Drivers**:
    *   `GET /api/drivers` - Paginated operator profiles.
    *   `POST /api/drivers` - Create driver licensing metadata.
*   **Trips**:
    *   `POST /api/trips` - Create draft trip routes.
    *   `PATCH /api/trips/:id/dispatch` - Transition trip to DISPATCHED state.
    *   `PATCH /api/trips/:id/complete` - Mark route COMPLETED.
*   **Maintenance**:
    *   `POST /api/maintenance` - Schedule repair tickets.
    *   `PATCH /api/maintenance/:id/complete` - Complete repairs and write expense.
*   **Fuel**:
    *   `POST /api/fuel` - Record fuel purchase and write expense.
*   **Expenses**:
    *   `GET /api/expenses` - Retrieve ledger entries.
*   **Dashboard**:
    *   `GET /api/dashboard` - Fetch KPI aggregates and Recharts datasets.
*   **Reports**:
    *   `GET /api/reports` - Query report logs datasets.
*   **Search**:
    *   `GET /api/search` - Parallelized global search.
*   **Notifications**:
    *   `GET /api/notifications` - Fetch active warning updates.
*   **Audit Logs**:
    *   `GET /api/audit-logs` - Query action audit trails.

---

## Completed Modules

*   **Authentication**: Access token issuance and route guard checking.
*   **Vehicle Management**: Fleet tracking with odometer protections.
*   **Driver Management**: Operator tracking with collision safeguards.
*   **Trip Engine**: Automated dispatches and availability locks.
*   **Maintenance**: Repair ticket loops locking availability.
*   **Fuel**: Log logs updating vehicle odometers and expenses.
*   **Expense**: General ledger logging fuel and workshop costs.
*   **Dashboard**: Command cockpit telemetry graphs.
*   **Reports**: Parameter grids supporting CSV/Excel downloads.
*   **Notifications**: Unread counts with action dropdown alerts.
*   **Audit Logs**: Action auditing recording triggers.
*   **Global Search**: Trigram parallel matches.

---

## Security Features

*   **JWT Authentication**: Encrypted credentials checking.
*   **RBAC**: Role check interceptors protecting system routes.
*   **Input Validation**: Schema matching validations using express-validator.
*   **Helmet**: API security headers shielding response metadata.
*   **CORS**: Configured origins routing lists.
*   **Rate Limiting**: Block spam loops on requests.
*   **Password Hashing**: String encrypting using bcrypt algorithms.
*   **Audit Logs**: System operations logs tracking updates.

---

## Performance Optimizations

*   **Prisma Indexes**: Index structures on query fields (`tripStartTime`, `scheduledDate`).
*   **Transactions**: Multi-table database updates wrapped inside Prisma `$transaction()`.
*   **Parallel Queries**: Concurrency fetching using `Promise.all`.
*   **Lazy Loading & Code Splitting**: Page bundles loaded dynamically.
*   **Debounced Search**: Delayed query calls with active request cancellation.

---

## Future Enhancements

*   **AI Route Optimization**: Dynamic route modeling to reduce fuel use.
*   **Predictive Maintenance**: Machine learning modeling to forecast wear.
*   **GPS Tracking**: Live map view showing vehicle coordinates.
*   **Mobile Application**: Mobile client app for drivers.
*   **Cloud Deployment**: Dockerized container deployment patterns.

---

## Screenshots

*   **Dashboard**: Executive command telemetry layout overview.
*   **Vehicles**: Fleet registry tracking catalog.
*   **Drivers**: Operator registry detail tracking profiles.
*   **Trips**: Dispatched routes tracking timelines.
*   **Reports**: Query report export sheets catalog.

---

## License

This project was developed for the Odoo Hackathon 2027.
It is intended for educational, demonstration, and hackathon evaluation purposes.
