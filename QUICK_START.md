# Quick Start Guide – Pick One Meal Deployment

A condensed guide to get your app deployed quickly.

---

## 🚀 Quick Deployment Steps

### 1. Push to GitHub (5 minutes)

```bash
# Navigate to project directory
cd /Users/patrickenin/Desktop/Pickonemeal

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Pick One Meal web app"

# Create repository on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/pickonemeal.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel (10 minutes)

1. Go to [vercel.com](https://vercel.com) → Sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `web`
   - **Framework**: Next.js (auto-detected)
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = [Your Supabase URL]
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = [Your Supabase Key]
6. Click **"Deploy"**

### 3. Add Custom Domain (5 minutes)

1. In Vercel → Settings → Domains
2. Add `pickonemeal.com` and `www.pickonemeal.com`
3. In Hostinger → DNS Settings:
   - Change nameservers to Vercel's (shown in Vercel dashboard)
   - OR add A record: `@` → `76.76.21.21`
4. Wait for DNS propagation (5 minutes to 48 hours)

### 4. Verify (2 minutes)

- Visit `https://pickonemeal.com`
- Test sign up / sign in
- Check all pages load correctly

---

## 📝 Important Notes

- **Never commit `.env` files** - they're in `.gitignore`
- **Environment variables** must be set in Vercel dashboard
- **DNS changes** can take up to 48 hours (usually faster)
- **SSL certificates** are auto-provisioned by Vercel

---

## 📚 Need More Details?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete guide with troubleshooting.

---

## 🆘 Common Issues

**Build fails?** → Check environment variables are set in Vercel

**Domain not working?** → Check DNS propagation at [whatsmydns.net](https://www.whatsmydns.net)

**Can't connect to Supabase?** → Verify environment variables and Supabase project is active

