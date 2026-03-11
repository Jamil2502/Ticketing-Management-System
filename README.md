# Ticketing Management System

A simple, fast, and reliable QR-based event ticketing system built for college events. Students get tickets, admins scan them. Done. 

## What's This About?

Ever had trouble managing event attendance? Yeah, we fixed that.

This app lets you:
- **Students** create event tickets and generate QR codes
- **Admins** scan QR codes with their phone to verify attendance
- Keep everything organized in one place

Perfect for annual fests, hackathons, seminars, or any event you're hosting.

## Tech Stack

- **Next.js 15** - React framework for modern web apps
- **TypeScript** - Keeps our code safe and helpful
- **PostgreSQL** (Render) - Database for storing everything
- **Drizzle ORM** - Makes database queries clean and easy
- **Clerk** - User authentication (sign in/sign up)
- **Tailwind CSS** - Makes it look pretty
- **QR Scanner** - Camera-based ticket scanning on mobile


## How to Setup this Project 

### 1. Clone & Install
```bash
git clone https://github.com/Jamil2502/Ticketing-Management-System.git
cd Ticketing-Management-System
npm install
```

### 2. Set Up Environment
Create `.env.local` in the root:
```env
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_AFTER_SIGN_IN_URL=/
CLERK_AFTER_SIGN_UP_URL=/
```

Get these from:
- **Database**: [Render.com](https://render.com)
- **Clerk Keys**: [Clerk Dashboard](https://dashboard.clerk.com)

### 3. Push Database Schema
```bash
npx drizzle-kit push
```

### 4. Run It
```bash
npm run dev
```

Visit `http://localhost:3000` 

## How to Use

### Student Side
1. Sign up with your email
2. Fill in college info (college name, stream, year)
3. Create a new ticket for an event
4. Get a QR code instantly
5. Share it with the admin or show from your phone

### Admin Side
1. Sign up and ask to be made an admin (via Clerk dashboard - set `role: "admin"` in metadata)
2. Go to admin dashboard
3. Point phone camera at student's QR code
4. Ticket gets validated ✓

## Features

✅ User authentication with Clerk  
✅ Role-based access (Student/Admin)  
✅ QR code generation and scanning  
✅ Real-time ticket validation  
✅ Mobile-friendly design  
✅ Fast and secure  


**Built with ❤️ for college events**
