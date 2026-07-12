# TransitOps Enterprise Cloud Deployment Guide

This guide describes how to deploy the **TransitOps Platform** to production using **Render** (backend API), **Vercel** (frontend application), and **Supabase** (hosted PostgreSQL database).

---

## 1. Cloud Database Setup (Supabase)

1. Sign in to [Supabase](https://supabase.com/).
2. Create a new project and select your database region.
3. Retrieve your **Transaction Connection String** from the Database settings. It should look like:
   ```env
   postgres://postgres.[username]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

---

## 2. Backend API Deployment (Render)

1. Sign in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your repository containing the TransitOps code.
4. Configure the Web Service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Click **Advanced** and add the following **Environment Variables**:

| Variable | Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` (Render binds this dynamically, but good to declare) |
| `DATABASE_URL` | *Your Supabase PostgreSQL Connection string* |
| `JWT_ACCESS_SECRET` | *32-character random hex string* |
| `JWT_REFRESH_SECRET` | *32-character random hex string* |
| `FRONTEND_URL` | *Your deployed Vercel domain URL* (e.g. `https://transitops.vercel.app`) |

6. Once deployed, Render will provide a public API URL (e.g. `https://transitops-api.onrender.com`).

---

## 3. Database Migration

Run the production Prisma migrations from your local environment pointing to the cloud database, or run it during Render's build step:

```bash
# Locally apply database migrations to the Supabase cloud instance
cd backend
cross-env DATABASE_URL="your-supabase-url" npx prisma migrate deploy
cross-env DATABASE_URL="your-supabase-url" npm run prisma:seed
```

---

## 4. Frontend Application Deployment (Vercel)

1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New** and select **Project**.
3. Import your TransitOps repository.
4. Configure the project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite` (Auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | *Your Render API endpoint* (e.g. `https://transitops-api.onrender.com/api`) |

6. Click **Deploy**. Vercel will build the frontend assets, apply route rewrites configured in `vercel.json`, and deploy the application.
