<p align="center">
  <img src="./assets/logo.png" alt="TransitOps Logo" width="420">
</p>

<h1 align="center">TransitOps</h1>

<p align="center">
  <strong>Enterprise Smart Transport Operations Platform</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black&style=flat-square" alt="React" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Node.js-20.0-339933?logo=nodedotjs&logoColor=white&style=flat-square" alt="Node.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Express-4.0-000000?logo=express&logoColor=white&style=flat-square" alt="Express" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma&logoColor=white&style=flat-square" alt="Prisma" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-14.0-4169E1?logo=postgresql&logoColor=white&style=flat-square" alt="PostgreSQL" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build" /></a>
  <a href="#"><img src="https://img.shields.io/badge/License-Odoo_Hackathon-orange?style=flat-square" alt="License" /></a>
</p>

---

## 1. Introduction

TransitOps is a high-performance Enterprise Resource Planning (ERP) platform custom-built for modern logistics, cargo routing, and fleet operations management. Developed as a production-grade submission for the Odoo Hackathon 2027, the platform centralizes vehicle tracking, driver scheduling, telemetry auditing, and operational accounting into a single interface.

In transport logistics, operational inefficiencies manifest as driver double-bookings, unregistered fuel receipts, and uncoordinated repair schedules. TransitOps resolves these pain points through atomic validation rules that prevent driver assignment overlaps, block odometer rollbacks, and guarantee that vehicles locked in repair shops cannot be dispatched on trips.

The platform is built using a strict Repository-Service architecture on the backend, complemented by a lazy-loaded, responsive React frontend. This setup ensures that fleet operations, safety compliance officers, and financial analysts can execute high-speed audits and compile reports concurrently.

---

## 2. Key Features

- **Enterprise Authentication & Session Guards**: Stateless JSON Web Tokens (JWT) using secure cookie storage and custom encryption.
- **Granular Role-Based Access Control (RBAC)**: Enforced authorization across Super Admin, Fleet Manager, Safety Officer, Financial Analyst, Dispatcher, and Driver profiles.
- **Vehicle Asset Management**: Fleet registry tracking plates, regions, odometer readings, and availability status.
- **Driver Operator Indexing**: Registry auditing operator credentials, emergency contacts, and real-time safety indices.
- **Automated Dispatch Engine**: Logistics workflows handling weight validations, driver schedules, and status overrides.
- **Active Maintenance Loop**: Ticket workflows locking vehicles to `IN_SHOP` and synchronizing actual repair costs to the general ledger.
- **Fuel Tracking**: Receipt logger mapping liters, prices, stations, and vehicle odometer progression.
- **Expense General Ledger**: Unified accounting ledger auto-recording maintenance, fuel, tolls, insurance, and parking costs.
- **Dynamic Dashboard Cockpit**: Operations control center using Recharts to present line, bar, pie, and area charts.
- **Enterprise Reports Dashboard**: Filterable tables supporting text searches, date constraints, and client-side CSV/Excel exports.
- **Global Search Index**: Hotkey-triggered (`Cmd+K` / `Ctrl+K`) search console querying all modules in parallel.
- **Alarm Center Notifications**: Bell dropdown indicator alerting operators to license expirations and overdue service tickets.
- **Log Auditing**: Record auditing that tracks actions, user emails, IP addresses, resource IDs, and client user-agents.

---

# 📸 Application Screenshots

<h2>Login</h2>

<p align="center">
  <img src="./screenshots/login.png" width="100%">
</p>

---

<h2>Enterprise Dashboard</h2>

<p align="center">
  <img src="./screenshots/dashboard.png" width="100%">
</p>

---

<h2>Notifications Center</h2>

<p align="center">
  <img src="./screenshots/dashboard-notifications.png" width="100%">
</p>

---

<h2>Dashboard Analytics</h2>

<p align="center">
  <img src="./screenshots/dashboard-analytics.png" width="100%">
</p>

---

<h2>Financial Dashboard</h2>

<p align="center">
  <img src="./screenshots/dashboard-finance.png" width="100%">
</p>

---

<h2>Vehicle Management</h2>

<p align="center">
  <img src="./screenshots/vehicles.png" width="100%">
</p>

---

<h2>Register Vehicle</h2>

<p align="center">
  <img src="./screenshots/register-vehicle.png" width="100%">
</p>

---

<h2>Driver Management</h2>

<p align="center">
  <img src="./screenshots/drivers.png" width="100%">
</p>

---

<h2>Trip Management</h2>

<p align="center">
  <img src="./screenshots/trips.png" width="100%">
</p>

---

<h2>Maintenance Management</h2>

<p align="center">
  <img src="./screenshots/maintenance.png" width="100%">
</p>

---

<h2>Fuel Management</h2>

<p align="center">
  <img src="./screenshots/fuel.png" width="100%">
</p>

---

<h2>Expense Management</h2>

<p align="center">
  <img src="./screenshots/expenses.png" width="100%">
</p>

---

<h2>Reports & Analytics</h2>

<p align="center">
  <img src="./screenshots/reports.png" width="100%">
</p>

---

<h2>User Management</h2>

<p align="center">
  <img src="./screenshots/user-management.png" width="100%">
</p>

---

<h2>Platform Settings</h2>

<p align="center">
  <img src="./screenshots/settings.png" width="100%">
</p>

---

## 3. Business Workflow

```
       [ Login ]
           │
           ▼
  [ Register Vehicle ]
           │
           ▼
   [ Register Driver ]
           │
           ▼
   [ Create Trip Draft ]
           │
           ▼
  [ Dispatch Route ] (ON_TRIP availability locks applied)
           │
           ▼
   [ Complete Route ] (Updates odometer / releases operator)
           │
  ┌────────┴────────┐
  ▼                 ▼
[ Maintenance ]   [ Fuel & Expenses ] (Auto-syncs ledger transactions)
  └────────┬────────┘
           ▼
 [ Dashboard Telemetry ] (Computes utilization indexes)
           │
           ▼
[ Reports Audit Dossier ] (Compiles data lists for CSV/Excel export)
```

---

## 4. Technology Stack

| Component | Stack | Modules |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS | Vite build engine, HTML5 semantic layout |
| **Backend** | Node.js, Express, TypeScript | REST APIs Router index, Dependency client |
| **Database** | PostgreSQL, Prisma ORM | Transaction handlers, Performance indexes |
| **Authentication**| JSON Web Tokens (JWT), bcrypt | Cookie parser, Role check interceptors |
| **Validation** | Zod, express-validator | Validation schemas middleware |
| **Charts** | Recharts, Lucide Icons | Responsive SVG canvas graphics |
| **Logging** | Winston Logger | Daily rotating files, Event console transport |

---

## 5. System Architecture

```
                 ┌────────────────────────────────┐
                 │        React Frontend          │
                 │   (TopNavbar, ReportsPage)     │
                 └───────────────┬────────────────┘
                                 │ HTTP REST Requests (Axios / Signal)
                                 ▼
                 ┌────────────────────────────────┐
                 │       Express REST API         │
                 │  (Auth, Validate, Route Guard) │
                 └───────────────┬────────────────┘
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │    Business Services Layer     │
                 │ (TripService, VehicleService)  │
                 └───────────────┬────────────────┘
                                 │ Transaction Scope
                                 ▼
                 ┌────────────────────────────────┐
                 │    Data Repositories Layer     │
                 │  (executeCompleteTransaction)  │
                 └───────────────┬────────────────┘
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │       Prisma client / DB       │
                 │  (Indexed PostgreSQL tables)   │
                 └────────────────────────────────┘
```

---

## 6. Project Structure

```
TransitOps/
├── backend/
│   ├── prisma/             # Schema models, database indexes, seed data
│   ├── src/
│   │   ├── config/         # System logger and server setups
│   │   ├── controllers/    # API controllers mapping requests
│   │   ├── database/       # Prisma client initializer
│   │   ├── middleware/     # Auth checks, RBAC filters, global error handling
│   │   ├── repositories/   # Base Prisma database interfaces
│   │   ├── routes/         # Express router mount configurations
│   │   ├── services/       # Core business workflows
│   │   ├── utils/          # Hashing, response formatting, audit logs
│   │   ├── validators/     # Request query/body validation schemas
│   │   └── server.ts       # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # TopNavbars, Sidebars, and skeleton widgets
│   │   ├── contexts/       # React AuthContext setup
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

## 7. Installation

Configure and install the application dependencies locally:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 8. Environment Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your local PostgreSQL database connection:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/transitops_dev"
JWT_ACCESS_SECRET=replace_with_min_64_char_random_secret_access
JWT_REFRESH_SECRET=replace_with_min_64_char_random_secret_refresh
```

---

## 9. Database Setup

Configure database parameters and generate the client interface:

```bash
cd backend

# Generate the Prisma client
npx prisma generate

# Apply database schema migrations
npx prisma migrate dev --name init

# Seed with demo data
npm run prisma:seed
```

---

## 10. Run Locally

Run both servers in separate terminals:

```bash
# Terminal 1 — Backend API
cd backend
npm run dev

# Terminal 2 — Frontend Application
cd frontend
npm run dev
```

| Service | URL |
| :--- | :--- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

---

## 11. Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| Super Admin | admin@transitops.com | TransitOps@2024! |
| Fleet Manager | fleet.manager@transitops.com | TransitOps@2024! |
| Safety Officer | safety.officer@transitops.com | TransitOps@2024! |
| Financial Analyst | finance@transitops.com | TransitOps@2024! |

---

## 12. API Overview

| Context | Endpoint | HTTP Method | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication**| `/api/auth/login` | `POST` | Public | Logs user in and sets cookie tokens |
| | `/api/auth/logout` | `POST` | Private | Clears cookie tokens |
| **Vehicles** | `/api/vehicles` | `GET` | User | Lists vehicles with filters |
| | `/api/vehicles` | `POST` | Manager | Registers new vehicle |
| **Drivers** | `/api/drivers` | `GET` | User | Lists drivers with safety score |
| **Trips** | `/api/trips` | `POST` | Dispatcher | Creates a draft trip record |
| | `/api/trips/:id/dispatch`| `PATCH` | Dispatcher | Dispatches trip (locks vehicle/driver) |
| | `/api/trips/:id/complete`| `PATCH` | Dispatcher | Completes trip (releases vehicle/driver)|
| **Maintenance** | `/api/maintenance`| `POST` | Manager | Schedules a vehicle maintenance ticket |
| | `/api/maintenance/:id/complete`| `PATCH` | Manager | Closes maintenance and writes expense |
| **Fuel** | `/api/fuel` | `POST` | User | Logs refuel receipt and writes expense |
| **Expenses** | `/api/expenses` | `GET` | Finance | Lists general ledger items |
| **Dashboard** | `/api/dashboard` | `GET` | User | Fetch live KPIs and Recharts datasets |
| **Reports** | `/api/reports` | `GET` | User | Fetch lists for CSV/Excel export |
| **Search** | `/api/search` | `GET` | User | Parallel search matching |
| **Notifications** | `/api/notifications` | `GET` | User | Lists unread compliance indicators |
| **Audit Logs** | `/api/audit-logs` | `GET` | Admin | Lists transaction audit trails |

---

## 13. Security Features

- **JWT Session Security**: Stateless cookie tokens checking session parameters.
- **Granular RBAC**: Endpoint routing checked by express role check interceptors.
- **Input Sanitization**: express-validator schemas preventing payload manipulations.
- **Helmet Headers**: Configures security headers to prevent Clickjacking and MIME sniffing.
- **CORS Constraints**: Origin constraint lists protecting backend routing.
- **Event Auditing**: Automatic logging tracking changes to resources.

---

## 14. Performance Optimizations

- **Prisma Indexes**: Index structures on query fields (`tripStartTime`, `scheduledDate`).
- **Transactions**: Multi-table database updates wrapped inside Prisma `$transaction()`.
- **Parallel Queries**: Concurrency fetching using `Promise.all` to reduce dashboard load times.
- **Lazy Loading & Code Splitting**: Page bundles loaded dynamically.
- **Debounced Search**: Delayed query calls with active request cancellation.

---

## 15. Future Roadmap

- **AI Route Optimization**: Dynamic route modeling to reduce fuel use.
- **Predictive Maintenance**: Machine learning modeling to forecast wear.
- **GPS Integration**: Live map view showing vehicle coordinates.
- **Mobile Application**: Mobile client app for drivers.

---

## 16. License

Developed for the Odoo Hackathon 2027.
Created for educational, demonstration and evaluation purposes.
