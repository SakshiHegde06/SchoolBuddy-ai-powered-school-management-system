# SchoolBuddy Production Deployment Guide

This guide walks you through deploying **SchoolBuddy** to the cloud with free-tier hosting for a resume-worthy, live production setup.

---

## Architecture Overview

| Component | Technology | Recommended Host | Free Tier Available? |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | **Vercel** or **Netlify** | Yes (100% Free) |
| **Backend** | Spring Boot 3.3.4 (Java 17), JWT | **Render** or **Railway** | Yes (Free Tier) |
| **Database** | MongoDB 6+ | **MongoDB Atlas** | Yes (M0 Free Cluster 512MB) |

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in or create a free account.
2. Click **Create a Deployment** and select the **M0 Free** cluster tier (AWS or Google Cloud, nearest region).
3. Under **Security Quickstart**:
   - **Database User**: Create a username (e.g. `schooladmin`) and strong password. Keep this safe.
   - **IP Access List**: Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Render/Railway can connect.
4. Click **Finish and Close**, then click **Connect** on your cluster:
   - Select **Drivers** (Java).
   - Copy the connection string. It looks like:
     ```text
     mongodb+srv://schooladmin:<password>@cluster0.xxxx.mongodb.net/schoolbuddy?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password and ensure the database name is `schoolbuddy`.

---

## Step 2: Deploy Spring Boot Backend to Render

1. Go to [Render](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your repository: `SchoolBuddy-ai-powered-school-management-system`.
4. Configure the service:
   - **Name**: `schoolbuddy-backend`
   - **Region**: Choose closest to your MongoDB region.
   - **Root Directory**: `backend`
   - **Environment**: **Docker** (Render will automatically detect `backend/Dockerfile`), OR **Java/Maven**:
     - *Build Command*: `mvn clean package -DskipTests`
     - *Start Command*: `java -jar target/school-backend-0.0.1-SNAPSHOT.jar`
5. Scroll down to **Environment Variables** and add:

| Key | Example Value | Note |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://schooladmin:pass@cluster0...` | Your Atlas connection string |
| `JWT_SECRET` | `c2Nob29sLWJ1ZGR5LXNlY3VyZS1qd3Qta2V5LTMyeHh4eA==` | Any 32+ character string |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:5173` | Include your Vercel URL |
| `PORT` | `8080` | Render sets this automatically |

6. Click **Create Web Service**. Once deployed, Render will provide a public URL like:
   `https://schoolbuddy-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub.
2. Click **Add New…** → **Project** and select your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and set to `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend.onrender.com/api` (use the backend URL from Step 2 with `/api`)
5. Click **Deploy**. Vercel will build and give you a live production URL:
   `https://schoolbuddy.vercel.app`

> [!NOTE]
> SPA routing is automatically supported via [`frontend/vercel.json`](file:///c:/projects/SchoolBuddy-ai-powered-school-management-system-main/frontend/vercel.json) so direct links (like `/verify-transcript/:code` or `/admin/students`) work seamlessly on reload without 404s.

---

## Step 4: Add Frontend URL to Backend CORS

After your Vercel frontend URL is assigned (e.g. `https://schoolbuddy-web.vercel.app`):
1. Go back to Render → `schoolbuddy-backend` → **Environment**.
2. Update `CORS_ALLOWED_ORIGINS` to include your live Vercel domain:
   ```text
   https://schoolbuddy-web.vercel.app,http://localhost:5173
   ```
3. Save changes. Render will automatically redeploy with the updated CORS policy.

---

## Step 5: Test & Verify Live Deployment

1. **Admin Login**:
   - URL: `https://your-app.vercel.app/login`
   - Default seeded credentials: `admin@school.edu` / `ChangeMe123!` (or your customized admin account).
2. **Spotlight Command Palette**:
   - Press `Ctrl + K` or click the search bar to jump between pages or search students instantly.
3. **Timetable Schedule**:
   - Admin sets time slots & subjects in `/admin/timetable`.
   - Log in as teacher (`/teacher`) and student (`/student`) to confirm periods sync accurately with `⭐ Your Class` badges.
4. **Student Marks Card & Public QR Verification**:
   - Open any student in `/admin/students` → Click **"Transcript"**.
   - Print or copy the verification link (`/verify-transcript/SB-...`).
   - Open the link on your mobile phone or incognito tab to test public verification!
