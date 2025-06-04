# Habit Tracker - Next.js Full-Stack Application

A modern, full-stack habit tracking application built with Next.js, TypeScript, PostgreSQL, and Prisma. Converted from a React Native Expo app to a responsive web application with backend API.

## Features

- 🔐 **Authentication** - Secure user registration and login with NextAuth.js
- 📊 **Habit Management** - Create, track, and delete habits
- 🔥 **Streak Tracking** - Visual streak counters and progress tracking
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🎯 **Completion System** - Mark habits as complete with visual feedback
- 📈 **Analytics** - View daily completion stats and total streaks
- 🎨 **Modern UI** - Clean design with Tailwind CSS and Framer Motion animations

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Form Validation**: Zod

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18 or higher)
- npm or yarn
- PostgreSQL (version 12 or higher)

## Database Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**

```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE habit_tracker;
CREATE USER habit_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE habit_tracker TO habit_user;

# Exit PostgreSQL
\q
```

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd nextjs-habit-tracker

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://habit_user:your_password@localhost:5432/habit_tracker?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-jwt-secret-change-this-in-production"
```

**Important**:

- Replace `your_password` with the actual password you set for the database user
- Replace `your-super-secret-jwt-secret-change-this-in-production` with a secure random string

### 3. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to your database
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
nextjs-habit-tracker/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js 13+ app directory
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   └── types/                # TypeScript type definitions
├── .env.local               # Environment variables
├── package.json
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login (handled by NextAuth)

### Habits

- `GET /api/habits` - Get all user habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/[id]` - Update habit
- `DELETE /api/habits/[id]` - Delete habit

### Completions

- `POST /api/habits/[id]/completions` - Mark habit as complete
- `GET /api/habits/[id]/completions` - Get habit completion history

## Usage

1. **Sign Up**: Create a new account or sign in with existing credentials
2. **Add Habits**: Click "Add Habit" to create new habits with title, description, and frequency
3. **Track Progress**: Mark habits as complete by clicking the check button
4. **View Stats**: Monitor your progress with streak counters and daily completion stats
5. **Manage Habits**: Edit or delete habits using the action buttons

## Conversion from React Native

This application was converted from a React Native Expo app with the following improvements:

- **Backend Integration**: Added full backend with PostgreSQL database
- **Authentication**: Implemented secure authentication with NextAuth.js
- **API Design**: RESTful API with proper error handling and validation
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Performance**: Optimized with Next.js features like SSR and API routes

## Production Deployment

### Database Setup

1. Create a PostgreSQL database on your hosting provider
2. Update `DATABASE_URL` in your production environment variables
3. Run migrations: `npm run db:migrate`

### Environment Variables

Set the following in your production environment:

```
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check database credentials in `.env.local`
- Verify database exists and user has proper permissions

### Build Errors

- Run `npm run db:generate` after schema changes
- Clear `.next` folder and rebuild
- Check for TypeScript errors with `npm run lint`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
