# Amethyst Inn System

This is a full-stack hotel management system built with Next.js (frontend) and Express.js (backend).

## Project Structure

```
backend/                  # Express.js backend server
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
frontend/
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components
├── lib/                  # Utility libraries
├── hooks/               # Custom React hooks
└── public/              # Static assets
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- npm or pnpm

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### Environment Setup

Create a `.env` file in the `backend/` directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
DATABASE_NAME=AmethystInn
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://localhost:5000
```

### Running the Application

#### Development Mode

Run both frontend and backend together:
```bash
npm run dev:full
```

Or run them separately:

Frontend only:
```bash
npm run dev
```

Backend only:
```bash
npm run backend
```

#### Production Mode

1. Build the frontend:
```bash
npm run build:full
```

2. Start both services:
```bash
npm run start:full
```

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js application
- `npm run start` - Start Next.js production server
- `npm run backend` - Start backend development server
- `npm run backend:start` - Start backend production server
- `npm run dev:full` - Start both frontend and backend in development
- `npm run build:full` - Build frontend and install backend dependencies
- `npm run start:full` - Start both frontend and backend in production

### API Endpoints

The backend API is available at `http://localhost:5000/api/`

- Authentication: `/api/auth/*`
- Users: `/api/users/*`
- Rooms: `/api/rooms/*`
- Bookings: `/api/bookings/*`
- Payments: `/api/payments/*`

### Frontend

The frontend is available at `http://localhost:3000/`

### Features

- User authentication and authorization
- Room management
- Booking system
- Payment processing
- Dashboard with analytics
- Responsive design
- Dark/Light theme support

### Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components
- Recharts for data visualization

**Backend:**
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing
- CORS enabled
- Rate limiting

### Development Notes

- The backend is now integrated into the frontend directory for easier development
- API routes in Next.js proxy requests to the Express backend
- Both services can run on different ports during development
- The frontend automatically proxies API requests to the backend
