## Web App – pickonemeal.com

This folder contains the Web implementation (Next.js/React) of pickonemeal.com using Supabase as the backend.

**Domain**: Hosted on Hostinger (pickonemeal.com)

---

## Tech stack

- **Framework**: Next.js (App Router, TypeScript).
- **UI**: React with a simple component library / design system.
- **Auth & Data**: Supabase (`@supabase/supabase-js`).
- **Deployment**: Vercel (frontend) and Railway (backend services if needed).

---

## Project structure

- `web/app/` – Next.js App Router pages
  - `app/(app)/onboarding` – Onboarding & auth.
  - `app/(app)/home` – Home dashboard.
  - `app/(app)/swipe` – Swipe UI.
  - `app/(app)/tables` – Dining Tables list & detail.
  - `app/(app)/history` – Meal history.
  - `app/(app)/subscription` – Paywall & subscription management.
  - `app/(app)/profile` – Profile & preferences.
- `web/lib/` – `supabaseClient`, helpers, hooks.

---

## Environment Variables

Required environment variables (set in Vercel dashboard):

- `NEXT_PUBLIC_SUPABASE_URL` – Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anonymous key

---

## Deployment

> **📖 Full Deployment Guide**: See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete step-by-step instructions including GitHub setup.

### Quick Start

1. **Push to GitHub** (see [DEPLOYMENT.md](../DEPLOYMENT.md) for details)
2. **Deploy to Vercel** (frontend)
3. **Deploy to Railway** (optional, for backend services)

### Vercel (Frontend)

The web application is deployed on Vercel.

#### Prerequisites

- Code pushed to GitHub repository
- Vercel account (free tier available)

#### Setup

1. **Connect Repository**
   - Push your code to GitHub (see [DEPLOYMENT.md](../DEPLOYMENT.md) Step 2)
   - Import the project in Vercel dashboard
   - Select the `web/` directory as the root directory

2. **Configure Environment Variables**
   - In Vercel project settings, add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `web`
   - Build Command: `npm run build` (or `yarn build`)
   - Output Directory: `.next`

4. **Custom Domain (Hostinger)**
   - In Vercel project settings → Domains
   - Add your domain: `pickonemeal.com` and `www.pickonemeal.com`
   - Update DNS records in Hostinger:
     - Add A record pointing to Vercel's IP (or use CNAME if supported)
     - Or use Vercel's nameservers if preferred
   - SSL certificates are automatically provisioned by Vercel

#### Deployment Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server (for Railway/local testing)
npm start
```

### Railway (Backend Services)

Railway can be used for:
- Supabase Edge Functions (if needed)
- Background jobs
- API services

#### Setup

1. **Create Railway Project**
   - Connect your repository
   - Select the appropriate service type

2. **Environment Variables**
   - Add Supabase credentials if running backend services
   - Add any required API keys

3. **Deploy**
   - Railway will auto-detect and deploy based on your configuration

---

## Local Development

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

---

## Production Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub repository
- [ ] `.gitignore` configured (sensitive files excluded)
- [ ] `.env.example` file created (documenting required variables)

### Vercel Setup
- [ ] Repository connected to Vercel
- [ ] Root directory set to `web`
- [ ] Environment variables configured in Vercel
- [ ] Build settings verified
- [ ] Initial deployment successful

### Domain & DNS
- [ ] Custom domain configured (pickonemeal.com)
- [ ] DNS records updated in Hostinger
- [ ] SSL certificate active (auto-provisioned by Vercel)
- [ ] Both `pickonemeal.com` and `www.pickonemeal.com` working

### Backend & Database
- [ ] Supabase RLS policies configured
- [ ] Database migrations applied
- [ ] Environment variables verified in production

### Post-Deployment
- [ ] Site accessible at custom domain
- [ ] Authentication flow tested
- [ ] All features working correctly
- [ ] Mobile responsiveness verified
- [ ] Error tracking/monitoring set up (optional)

---

## Quick Reference

### Git Commands

```bash
# Initial setup (first time only)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pickonemeal.git
git push -u origin main

# Regular workflow
git add .
git commit -m "Your commit message"
git push origin main
```

### Environment Variables

**Required for Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Never commit `.env` files to Git!**

For detailed deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md).


