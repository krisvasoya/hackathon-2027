# TransitOps

**Enterprise Smart Transport Operations Platform**

---

## Overview

TransitOps is a full-stack enterprise ERP platform for managing vehicle fleets, drivers, trips, maintenance, and fuel — built for professional transport operations teams.

---

## Project Structure

```
hackathon/
├── frontend/        React 19 + Vite + TypeScript + Tailwind CSS
├── backend/         Node.js + Express + TypeScript + Prisma + PostgreSQL
└── README.md
```

---

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v3             |
| Routing    | React Router DOM v7                                     |
| Server     | TanStack Query, Axios, React Hook Form, Zod, Sonner     |
| Backend    | Node.js, Express, TypeScript                            |
| Database   | PostgreSQL + Prisma ORM                                 |
| Auth       | JWT (Access + Refresh), bcrypt, RBAC                    |
| Security   | Helmet, CORS, Rate Limiting, express-validator          |
| Logging    | Winston + Daily Rotate                                  |

---

## Setup

### Prerequisites
- Node.js >= 20
- PostgreSQL >= 14
- npm

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secrets

# Frontend
cd ../frontend
cp .env.example .env
```

### 3. Database Setup

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### 5. Access

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| Backend   | http://localhost:5000        |
| Health    | http://localhost:5000/api/health |

### Default Credentials (Development)

| Role              | Email                           | Password           |
|-------------------|---------------------------------|--------------------|
| Super Admin       | admin@transitops.com            | TransitOps@2024!   |
| Fleet Manager     | fleet.manager@transitops.com    | TransitOps@2024!   |
| Safety Officer    | safety.officer@transitops.com   | TransitOps@2024!   |
| Financial Analyst | finance@transitops.com          | TransitOps@2024!   |

> ⚠️ Change all passwords immediately after first login in any real environment.

---

## Development Phases

| Phase | Status      | Description                          |
|-------|-------------|--------------------------------------|
| 0     | ✅ Complete | Architecture design                  |
| 1     | ✅ Complete | Foundation, auth, project structure  |
| 2     | ⏳ Next     | Fleet, drivers, trips modules        |
| 3     | ⏳ Planned  | Maintenance, fuel modules            |
| 4     | ⏳ Planned  | Reports, analytics, charts           |

---

## License

Internal use only. Enterprise software.
