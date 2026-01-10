# Deployment Guide – Pick One Meal

Complete guide for deploying Pick One Meal to GitHub, Vercel, and Railway.

---

## Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier available)
- [ ] Railway account (free tier available)
- [ ] Hostinger domain (pickonemeal.com)
- [ ] Supabase project set up
- [ ] Git installed on your local machine

---

## Step 1: Prepare Your Code

### 1.1 Initialize Git Repository (if not already done)

```bash
# Navigate to your project directory
cd /Users/patrickenin/Desktop/Pickonemeal

# Initialize git repository (if not already initialized)
git init

# Check current status
git status
```

### 1.2 Create .env.example File

Create a `.env.example` file in the `web/` directory to document required environment variables:

```bash
cd web
cat > .env.example << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
```

**Important**: Never commit actual `.env` or `.env.local` files to Git. They are already in `.gitignore`.

---

## Step 2: Push Code to GitHub

### 2.1 Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `pickonemeal` (or your preferred name)
4. Description: "Swipe together. Decide dinner fast."
5. Choose **Private** or **Public** (your preference)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

### 2.2 Connect Local Repository to GitHub

```bash
# Make sure you're in the project root directory
cd /Users/patrickenin/Desktop/Pickonemeal

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: Pick One Meal web app"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pickonemeal.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/pickonemeal.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2.3 Verify Push

1. Go to your GitHub repository page
2. Verify all files are present
3. Check that sensitive files (`.env`, `node_modules/`) are NOT visible

---

## Step 3: Deploy to Vercel (Frontend)

### 3.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create account)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Authorize Vercel to access your GitHub account if prompted
5. Select your `pickonemeal` repository
6. Click **"Import"**

### 3.2 Configure Project Settings

1. **Project Name**: `pickonemeal` (or your preferred name)
2. **Root Directory**: Click **"Edit"** and set to `web`
3. **Framework Preset**: Should auto-detect as Next.js
4. **Build Command**: `npm run build` (should be auto-filled)
5. **Output Directory**: `.next` (should be auto-filled)
6. **Install Command**: `npm install` (should be auto-filled)

### 3.3 Add Environment Variables

Before deploying, add your environment variables:

1. In the **"Environment Variables"** section, click **"Add"**
2. Add the following variables:

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: [Your Supabase project URL]
   ```

   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [Your Supabase anonymous key]
   ```

3. Make sure both are set for **Production**, **Preview**, and **Development**
4. Click **"Add"** for each variable

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-3 minutes)
3. Once deployed, you'll get a URL like: `pickonemeal.vercel.app`

### 3.5 Configure Custom Domain (Hostinger)

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `pickonemeal.com`
4. Click **"Add"**
5. Also add: `www.pickonemeal.com`
6. Vercel will show you DNS configuration instructions

#### Update DNS in Hostinger:

1. Log into your Hostinger account
2. Go to **Domains** → Select `pickonemeal.com`
3. Go to **DNS / Name Servers**
4. You have two options:

   **Option A: Use Vercel's Nameservers (Recommended)**
   - Change nameservers to:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   - Wait for DNS propagation (can take up to 48 hours, usually faster)

   **Option B: Use A Records (If you want to keep Hostinger nameservers)**
   - Add A record:
     - Type: `A`
     - Name: `@` (or leave blank)
     - Value: `76.76.21.21` (Vercel's IP - check Vercel dashboard for current IP)
   - Add CNAME record for www:
     - Type: `CNAME`
     - Name: `www`
     - Value: `cname.vercel-dns.com`

5. Wait for DNS propagation (check status in Vercel dashboard)
6. SSL certificate will be automatically provisioned by Vercel

---

## Step 4: Deploy to Railway (Backend Services - Optional)

Railway is optional and can be used for:
- Supabase Edge Functions
- Background jobs
- Additional API services

### 4.1 Connect GitHub to Railway

1. Go to [railway.app](https://railway.app) and sign in (or create account)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your `pickonemeal` repository

### 4.2 Configure Service

1. Railway will auto-detect your project
2. If deploying backend services, you may need to:
   - Set the **Root Directory** if your backend code is in a subdirectory
   - Configure **Start Command** if needed
   - Set **Build Command** if needed

### 4.3 Add Environment Variables

1. Go to your service → **Variables** tab
2. Add any required environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (if needed for backend)
   - Any other API keys

### 4.4 Deploy

1. Railway will automatically deploy on every push to your main branch
2. You'll get a Railway URL for your service
3. Configure custom domain if needed (similar to Vercel process)

---

## Step 5: Verify Deployment

### 5.1 Test Your Live Site

1. Visit `https://pickonemeal.com` (or your Vercel URL)
2. Test the following:
   - [ ] Landing page loads correctly
   - [ ] Sign up flow works
   - [ ] Sign in flow works
   - [ ] Navigation works
   - [ ] All pages are accessible
   - [ ] Supabase connection works (try creating a profile)

### 5.2 Check Build Logs

- **Vercel**: Go to your project → **Deployments** → Click on a deployment → View logs
- **Railway**: Go to your service → **Deployments** → View logs

### 5.3 Monitor for Errors

- Check browser console for any errors
- Check Vercel/Railway logs for build or runtime errors
- Test on mobile devices

---

## Step 6: Continuous Deployment

### 6.1 Automatic Deployments

Both Vercel and Railway automatically deploy when you push to your main branch:

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push origin main

# Vercel and Railway will automatically deploy
```

### 6.2 Preview Deployments

- **Vercel**: Creates preview deployments for pull requests
- **Railway**: Can be configured to deploy from different branches

---

## Troubleshooting

### Build Fails on Vercel

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies in `package.json`
   - Incorrect root directory setting

### Domain Not Working

1. Check DNS propagation: Use [whatsmydns.net](https://www.whatsmydns.net)
2. Verify DNS records in Hostinger match Vercel's requirements
3. Wait up to 48 hours for full propagation
4. Check SSL certificate status in Vercel dashboard

### Environment Variables Not Working

1. Verify variables are set in Vercel dashboard
2. Make sure variable names start with `NEXT_PUBLIC_` for client-side access
3. Redeploy after adding new variables
4. Check that variables are enabled for the correct environments

### Supabase Connection Issues

1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Check Supabase project is active
3. Verify RLS policies allow public access where needed
4. Check Supabase logs for connection errors

---

## Useful Commands

```bash
# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View git log
git log --oneline

# Create a new branch
git checkout -b feature/your-feature-name

# Switch branches
git checkout main
```

---

## Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] No API keys or secrets in code
- [ ] Environment variables set in Vercel/Railway (not in code)
- [ ] Supabase RLS policies configured
- [ ] SSL certificates active
- [ ] Domain DNS properly configured

---

## Next Steps

After successful deployment:

1. Set up error tracking (e.g., Sentry)
2. Configure analytics (e.g., Google Analytics, Plausible)
3. Set up monitoring and alerts
4. Configure backup strategy for Supabase
5. Set up CI/CD workflows if needed
6. Document any custom deployment steps

---

## Support

If you encounter issues:

1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Check Railway documentation: [docs.railway.app](https://docs.railway.app)
3. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
4. Contact support: support@monesave.com

