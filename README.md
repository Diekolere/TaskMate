# 🛠️ TaskMate

> **Connecting Nigerian consumers with verified local service providers through a secure, transparent, and platform-governed escrow marketplace.**

![TaskMate Banner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![React](https://img.shields.io/badge/Frontend-React%2019-blue) ![Supabase](https://img.shields.io/badge/Backend-Supabase-green) ![Escrow](https://img.shields.io/badge/Payments-Squad%20Escrow-orange)

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Escrow Infrastructure](#escrow-infrastructure)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Key Workflows](#key-workflows)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Integrations](#api-integrations)
- [Running Locally](#running-locally)

---

## 🎯 System Overview

TaskMate is a full-stack digital service marketplace designed for the Nigerian informal economy. It solves the critical "trust gap" by providing a platform-governed infrastructure where payments are secured in escrow until the job is verified as complete.

- **Verified Identity**: Multi-step KYC including government ID and BVN verification.
- **Escrow Security**: Payments are held by TaskMate until the customer confirms completion.
- **Transparency**: Unified ledgers for providers to track earnings and platform commissions.
- **Smart Matching**: Proximity-based discovery using Leaflet maps and category filtering.

---

## 🛡️ Escrow Infrastructure

The heart of TaskMate's trust system is its **Automated Escrow Engine**, integrated with **Squad by GTCO**.

### How it Works:
1. **Dynamic Virtual Accounts**: For every job, a unique, temporary Virtual Account (VA) is generated for the customer.
2. **Platform Governance**: Funds are received by the platform and held in a `held` state in the escrow ledger.
3. **Commission Automation**: A 10% platform fee is automatically calculated but hidden from the customer's checkout view.
4. **Secured Release**: Once the customer taps "Confirm Completion," the platform triggers a server-side release:
   - **Provider receives 90%** directly into their platform wallet.
   - **TaskMate retains 10%** as commission.
   - **Full Audit Trail**: Both events are logged in the transaction history for transparency.

---

## ✨ Core Features

### For Customers
- ✅ **Escrow Payments** — Secure checkout where funds are held until you are satisfied.
- ✅ **AI Dispute Assistant** — Guided workflow to raise issues if a job doesn't meet standards.
- ✅ **Provider Discovery** — Browse verified pros with ratings, rates, and real portfolios.
- ✅ **OTP Security** — Securely start jobs with 4-digit verification codes.
- ✅ **AI Chat Assistant** — Instant help with request composition and navigation.

### For Providers
- ✅ **Escrow Dashboard** — View "Held" vs "Available" balances in real-time.
- ✅ **Verified Badge** — Professional status earned through KYC and BVN verification.
- ✅ **Unified History** — A "Bank-statement" style ledger showing every credit and commission fee.
- ✅ **Automated Payouts** — Withdraw earnings to any verified Nigerian bank account.
- ✅ **Service Radius** — Define your coverage area with an interactive map slider.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 3 |
| **Backend** | Supabase (PostgreSQL 15), Edge Functions (Deno) |
| **Payments** | Squad (GTCO) |
| **Auth** | Supabase Auth (JWT) |
| **Maps** | Leaflet + OpenStreetMap |
| **AI** | Gemini / Claude API |
| **UI/UX** | Framer Motion, Lucide Icons, Sonner |

---

## 📂 Project Structure

```
TaskMate/
├── src/
│   ├── components/        # Reusable UI, Layout, and Logic
│   ├── pages/             # Customer, Provider, and Admin Portals
│   ├── context/           # Global State (Auth, Data/Real-time)
│   └── lib/               # Supabase Client & Shared Helpers
├── supabase/
│   ├── functions/         # Edge Functions (Squad, Matching, AI)
│   ├── migrations/        # Database Schema & RLS Policies
│   └── seed.sql           # Demo data for development
└── public/                # Static assets
```

---

## ⚙️ Setup & Installation

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-username/taskmate.git
   npm install
   ```

2. **Environment Setup**:
   Create a `.env.local` with your Supabase and Squad credentials:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   VITE_SQUAD_API_KEY=your_squad_key
   ```

3. **Run Locally**:
   ```bash
   npm run dev
   ```

---

## 📄 License
MIT License - Copyright (c) 2026 TaskMate Nigeria.
