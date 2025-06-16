# Habit Tracker - Next.js Full-Stack Application

A modern, full-stack habit tracking application built with Next.js, TypeScript, and Appwrite. Converted from a React Native Expo app to a responsive web application with backend API.

## Features

- 🔐 **Authentication** - Secure user registration and login with Appwrite Auth
- 📊 **Habit Management** - Create, track, and delete habits
- 🔥 **Streak Tracking** - Visual streak counters and progress tracking
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🎯 **Completion System** - Mark habits as complete with visual feedback
- 📈 **Analytics** - View daily completion stats and total streaks
- 🎨 **Modern UI** - Clean design with Tailwind CSS and Framer Motion animations

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Appwrite
- **Database**: Appwrite Database
- **Authentication**: Appwrite Auth
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Form Validation**: Zod

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18 or higher)
- npm or yarn
- An Appwrite account

## Appwrite Setup

### 1. Create Appwrite Project

1. Go to [Appwrite Console](https://cloud.appwrite.io/console)
2. Create a new project
3. Note down your project ID

### 2. Configure Authentication

1. In your Appwrite project, go to "Auth" > "Settings"
2. Enable "Email/Password" authentication
3. Configure your authentication settings as needed

### 3. Create Database and Collections

Run the provided script to automatically create the required collections:

```bash
node create-appwrite-collections.js
```

Or manually create collections following the `APPWRITE_SETUP.md` guide.

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
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_APPWRITE_DATABASE_ID="your-database-id"
APPWRITE_API_KEY="your-api-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**:

- Replace `your-project-id` with your actual Appwrite project ID
- Replace `your-database-id` with your Appwrite database ID
- Replace `your-api-key` with your Appwrite API key

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
nextjs-habit-tracker/
├── src/
│   ├── app/                   # Next.js 13+ app directory
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and Appwrite config
│   │   ├── appwrite.ts       # Appwrite client configuration
│   │   ├── auth-appwrite.ts  # Authentication utilities
│   │   └── habits-appwrite.ts # Habit management utilities
│   ├── contexts/             # React contexts
│   ├── types/                # TypeScript type definitions
│   └── styles/               # Global styles
├── public/                   # Static assets
├── scripts/                  # Utility scripts
└── package.json
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login (handled by Appwrite)

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

- **Backend Integration**: Added full backend with Appwrite database
- **Authentication**: Implemented secure authentication with Appwrite Auth
- **API Design**: RESTful API with proper error handling and validation
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Performance**: Optimized with Next.js features like SSR and API routes

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Make sure to add your environment variables in the Vercel dashboard.

## Troubleshooting

### Appwrite Connection Issues

- Ensure your Appwrite project ID and endpoint are correct
- Check that your API key has the necessary permissions
- Verify your database and collections are properly configured

### Build Errors

- Clear `.next` folder and rebuild
- Check for TypeScript errors with `npm run lint`
- Ensure all environment variables are set correctly

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## PWA Requirements

To enable Progressive Web App (PWA) support, add the following files to your `public/` directory:

- `manifest.json` (see below for a sample)
- `icon-192x192.png` (192x192 PNG icon)
- `icon-512x512.png` (512x512 PNG icon)
- `favicon.ico` (for browser tab icon)
- `og-image.png` (for social sharing, 1200x630 recommended)

### Sample `manifest.json`

```json
{
  "name": "Habit Tracker",
  "short_name": "Habits",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "description": "Track and build better habits with ease.",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```
