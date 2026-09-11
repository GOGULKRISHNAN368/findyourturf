# Turf-Hub

Turf-Hub is a platform designed to seamlessly manage turf bookings, tournaments, and events for sports like Cricket and Football.

## Project Structure

This repository is organized into three completely independent projects:

1. **`turf/` (User Website)**
   - The public-facing frontend where users can view upcoming events, explore details, and register for tournaments.
   - Built with React and Vite.
   - Runs by default on `http://localhost:5173`.

2. **`admin/` (Admin Portal)**
   - A dedicated management portal for administrators to oversee bookings, manage events, and track statistics.
   - Built with React and Vite.
   - Runs by default on `http://localhost:5174`.

3. **`backend/` (Server API)**
   - The centralized Node.js/Express server that powers both the user website and admin portal.
   - Handles the database (MongoDB), authentication (JWT), and real-time updates (Socket.IO).
   - Runs by default on `http://localhost:5000`.

## Getting Started

To run the full stack locally, you need to start each component in its own terminal window.

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```

### 2. Start the User Website (Turf)
```bash
cd turf
npm install
npm run dev
```

### 3. Start the Admin Portal
```bash
cd admin
npm install
npm run dev
```

## Admin Credentials

To access the Admin portal (`http://localhost:5174/login`), a Super Admin user is required. If the database is fresh, you can register an admin via the `/api/auth/register` backend endpoint.

## Environment Variables (backend)

Copy `backend/.env.example` to `backend/.env` and fill in real values locally.
See that file for the full list. The only one required to boot is
`MONGODB_URI`; everything else has a working default.

## Deployment

- **Backend** — Render web service (`turf-hub-backend`, config in `render.yaml`).
  Build: `npm ci` · Start: `npm start` · Root dir: `backend`.
  Set `MONGODB_URI` and `CLIENT_ORIGINS` (comma-separated list of the deployed
  frontend URLs) in the Render dashboard under that service's Environment tab —
  they are marked `sync: false` in `render.yaml` so Render won't overwrite them.
- **Admin / Turf** — Vercel projects, built from `admin/` and `turf/`
  respectively. Set `VITE_API_URL` in each Vercel project's environment
  variables to the backend's public URL so the build points at the right API.
