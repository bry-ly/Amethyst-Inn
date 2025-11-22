# Amethyst Inn - Guest House Appointment Management System

_A full-stack booking and management platform built with Next.js (frontend) and Node.js/Express/MongoDB (backend), designed for role-based access control, real-time features, and a seamless experience._

## 🎯 Overview

Amethyst Inn is a feature-rich system for client/guest appointment booking, staff management, and administrative control. It utilizes a modern stack, beautiful responsive UI, and scalable backend architecture. This project covers comprehensive practical features for Patients/Guests, Staff, and Administrators.

### Key Highlights

- **Multi-Role System:** Dashboards tailored for Patients/Guests, Staff, and Administrators
- **Secure Authentication:** Auth with email/password and OAuth (`Better Auth`)
- **Real-time Notifications:** Email notifications for events, updates, confirmations
- **Responsive Design:** Sleek UI with TailwindCSS, Radix UI, Shadcn/ui
- **Type-Safe:** TypeScript for the frontend, Zod validation schemas
- **Database-Driven:** MongoDB + Mongoose & Prisma ORM
- **Payment Integration:** Stripe for service payments

## ✨ Features

### 👤 Patient/Guest Features
- **Booking:** Search and book services or appointments
- **Manage Bookings:** View, reschedule, or cancel
- **Profile:** Health records/history or reservation history
- **Payments:** Payment history and online checkout
- **Notifications:** Alerts for confirmations, reminders, changes

### 🦷 Staff (or Dentist/Employee) Features
- **Dashboard:** Daily schedule and stats
- **Manage Availability:** Set working hours, update profile
- **Client Management:** Patient/guest lists, records, services/treatments
- **Booking Management:** Confirm, reschedule, cancel
- **Notifications:** Updates on bookings

### 👨‍💼 Admin Features
- **System Analytics:** Usage stats, revenue, metrics
- **User Management:** Manage patients, staff, accounts
- **Booking/Appointment Oversight:** View/manage all bookings
- **Service Management:** Add/edit offered services
- **Settings:** Configure system, emails, payments

## 🛠️ Tech Stack

### Frontend (`bry-ly/Amethyst-Inn`)
- **[Next.js](https://nextjs.org/):** Modern React framework, App Router
- **TypeScript:** Type safety throughout
- **Tailwind CSS, Radix UI, Shadcn/ui:** Fast, accessible, beautiful UI
- **React Hook Form, Zod:** Form state and validation
- **Motion, Recharts, Lucide:** Animation, charts, icons

### Backend (`bry-ly/amethyst-inn-server`)
- **Node.js + Express.js:** Robust API server
- **MongoDB + Mongoose:** Data persistence for medical/guest data
- **Prisma (if used for some domain models)**
- **Stripe:** Payments
- **Resend:** Email handling
- **Authentication:** JWT, OAuth, and multi-factor support

### Dev Tools
- **ESLint, Prisma Studio, Turbopack**

## 📋 Prerequisites

- **Node.js** 18+
- **MongoDB** (local/Atlas)
- **npm/yarn/pnpm/bun**
- **Git**

## 🚀 Getting Started

### 1. Clone Both Repositories

```bash
git clone https://github.com/bry-ly/Amethyst-Inn.git
git clone https://github.com/bry-ly/amethyst-inn-server.git
```
### 2. Install Dependencies

_Frontend:_
```bash
cd Amethyst-Inn
pnpm install # or npm/yarn
```
_Backend:_
```bash
cd ../amethyst-inn-server
npm install # or yarn/pnpm
```

### 3. Environment Variables

Set up the following (`.env` for both projects):

#### Frontend (`Amethyst-Inn`)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/amethyst_inn"
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_SENDER_NAME="Amethyst Inn"
EMAIL_SENDER_ADDRESS="send@amethystinn.com"
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Backend (`amethyst-inn-server`)

_Consult `config/` for custom variables:_
- Database connection, JWT secret, SMTP/API keys, Stripe keys, etc.

### 4. Database Setup

_Backend:_
- MongoDB must be running/Atlas up and URI in env.
- Seeders are in `seeder/`

### 5. Run Development Servers

**Frontend:**  
```bash
cd Amethyst-Inn
pnpm dev # or yarn/ npm run dev
```
**Backend:**  
```bash
cd amethyst-inn-server
npm run dev # or node server.js / app.js
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

### Frontend (`Amethyst-Inn`)

```
Amethyst-Inn/
├── app/
│   ├── (auth)/
│   ├── (main)/
│   ├── api/
│   ├── docs/
│   ├── services/
│   └── page.tsx
├── components/
├── hooks/
├── lib/
│   ├── actions/
│   ├── auth-session/
│   ├── email/
│   └── types/
├── public/
├── types/
├── utils/
└── middleware.ts
```

### Backend (`amethyst-inn-server`)
```
amethyst-inn-server/
├── api/           # REST API logic
├── config/        # Configuration files (env, DB, Stripe, Mail, etc)
├── controllers/   # Route logic/handlers
├── docs/          # API docs, guides
├── middleware/    # Middleware logic
├── models/        # Mongoose models
├── routes/        # API routes
├── scripts/       # Utilities / tasks scripts
├── seeder/        # DB seed scripts
├── services/      # Business logic/services
├── uploads/       # Static uploads
├── utils/         # Helpers/utilities
├── server.js      # Server entry
├── app.js         # Express app logic
├── package.json
└── vercel.json
```

## 🔐 Authentication

Both apps support secure login, registration, and session management, using JWT, cookies, and optionally Google OAuth. Email verification, password reset, and role-based dashboards are provided.

## 📊 Database

- **User:** (role, profile, payment)
- **Service:** (name, category, pricing)
- **Appointment:** (patient/guest, provider, slot, status)
- **Payment, Notification, Audit Log, etc**

See backend `/models` and frontend `/prisma/schema.prisma` (if TypeScript models exist).

## 💳 Payment Integration

- **Stripe:** Secure checkout, PCI-compliant, payment history, multi-methods

## 🧪 Scripts

(Frontend)
```bash
pnpm run dev        # Dev server
pnpm run build      # Build production
pnpm run lint       # Code lint
```
(Backend)
```bash
npm run dev         # Start API server
npm run seed        # Seed DB (see /seeder)
```

## 🚀 Deployment

- **Frontend:** Vercel recommended (see Vercel, Netlify, or similar)
- **Backend:** Vercel, Railway, Render, or own VPS
- **MongoDB:** Atlas preferred

**Don't forget:**
- Update production URLs and secrets; whitelist IP for Atlas

## 📧 Email & Notifications

- Using Resend for transactional emails (verification, reminders, etc)
- Email config in `.env`

## 🐛 Troubleshooting

- _Database:_ Ensure MongoDB Atlas/local is up & URI correct
- _Email:_ Resend API key, verify sender address
- _Payments:_ Stripe test keys for dev, check webhooks

## 📝 License

Educational/demo only.

## 👥 Contributors

- [Your Name/Team Name]

## 📞 Support

For issues:  
- Open GitHub issues  
- Contact maintainers  
- See `/docs`

---

_Built with ❤️ using Next.js, Node.js, MongoDB, and modern web tech._
