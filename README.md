# PROMETEO
**Real-Time Emergency Incident Reporting & Resource Coordination Platform**

## Project Purpose
A life-saving emergency platform where citizens can report incidents and verified authorities coordinate rescue using real-time in-app + email alerts, GPS routing, video evidence preview, live status updates, and chat communication.

## Features
- Register & Login (User / Admin roles)
- Protected flow: **Report → Register → Login → Incident Form**
- Admin selects department type: **Hospital / Fire Station / Police** (dropdown/radio)
- Mandatory Verification ID upload for Admin
- Incident Form auto-fetches Name & Phone after login (locked)
- GPS capture on user allow (lat/lng)
- Incident type selection: **Medical / Fire / Crime / Accident / Other**
- Video upload to **Supabase Storage** (`mp4 / mov / webm`, max 50MB)
- Checkbox: **Whom to notify?** (Hospital / Fire / Police)
- Minimum 10-word description validation
- Admin Dashboard gets:
  - Real-time in-app alerts (Socket.io/WebSockets)
  - Live incident markers on **Leaflet + OpenStreetMap** (no refresh)
  - Route drawn from **Admin → Citizen location**
  - Status updates (**Seen / Responding / Resolved**) update live on user side
  - Thumbnail click opens modal video player
  - Real-time chat with reporter
  - Department badge + timestamp
- Navbar: **Home | Login | Register | Report | Contact Support** (fixed & responsive)
- Dark/Light mode toggle in Navbar
- Footer adapts to theme and shows contact info
- Backend built using **Node.js + Express + TypeScript + Socket.io**
- Includes **CORS, rate-limit, input validation, protected routes**

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Leaflet + OpenStreetMap
- **Backend:** Node.js, Express.js, TypeScript, Socket.io
- **Storage:** Supabase Storage (Incident Videos & Admin IDs)
- **Routing:** OSRM / GraphHopper (Free routing plugins)
- **Config:** dotenv (`.env`)

## .env
- VITE_SUPABASE_PROJECT_ID=""
- VITE_SUPABASE_PUBLISHABLE_KEY=""
- VITE_SUPABASE_URL=""

## Super Admin id & password
ID: imisouvik@gmail.com
Passwprd: Pranav1234@
* Super admin id & password will be given by government to the workers
