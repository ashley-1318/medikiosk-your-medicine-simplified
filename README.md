# MEDIKIOSK — AI-Powered Medicine Dispensing Kiosk

> **No queues. No waiting. Just care.**

## Project Structure

```
medikiosk-your-medicine-simplified/
├── frontend/          ← React + Vite + TanStack Router
│   ├── src/
│   │   ├── components/    (UI components)
│   │   ├── hooks/         (React hooks)
│   │   ├── lib/           (Firebase, Supabase, API clients)
│   │   ├── routes/        (Pages: auth, patient, doctor, admin)
│   │   └── styles.css
│   ├── public/            (Static assets, FCM service worker)
│   ├── .env               (create from .env.example)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── backend/           ← Node.js + Express
    ├── routes/        (auth, ai, chat, notifications, receipt, admin)
    ├── lib/           (supabase, firebase-admin, fcm, jwt)
    ├── middleware/    (auth JWT verifier)
    ├── schema.sql     (Supabase PostgreSQL schema)
    ├── server.js      (entry point)
    ├── .env           (create from .env.example)
    └── .env.example
```

## Quick Start

### 1. Supabase
- Create project at [supabase.com](https://supabase.com)
- Run `backend/schema.sql` in the SQL editor
- Create storage bucket `medikiosk-storage` (set to Public)

### 2. Firebase
- Create project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable **Phone Authentication**
- Copy Web App config → `frontend/.env`
- Download Service Account JSON → `backend/.env`
- Copy VAPID key → `frontend/.env`

### 3. Groq
- Get 2 API keys at [console.groq.com](https://console.groq.com)
- Add to `backend/.env`

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Run Backend

```bash
cd backend
npm run dev
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TanStack Router, TailwindCSS |
| Auth | Firebase Phone Auth (OTP) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| OCR | Tesseract.js |
| AI (Prescription) | Groq — llama-3.3-70b-versatile |
| AI (Chatbot RAG) | Groq — llama-3.3-70b-versatile |
| PDF Receipts | PDFKit |
| Backend | Node.js + Express |
