# FlowPilot Deployment Guide

## Quick Deploy to Vercel

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```
Choose your preferred authentication method.

### 3. Deploy to Production
```bash
vercel --prod
```

During first deployment, you'll be asked:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (for first time)
- Project name? **flowpilot** (or your preferred name)
- Directory? **./** (current directory)
- Override settings? **N**

### 4. Configure Environment Variables

After deployment, go to your Vercel dashboard:
1. Navigate to your project settings
2. Go to "Environment Variables"
3. Add these required variables:

```
NEXTAUTH_SECRET=<generate-secure-secret>
ENCRYPTION_KEY=<generate-32-char-key>
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### Generate Secure Values:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY (32 characters)
openssl rand -hex 16
```

### 5. Redeploy After Adding Environment Variables
```bash
vercel --prod
```

## Alternative: Deploy via GitHub

1. Push your code to GitHub
2. Import project on [vercel.com](https://vercel.com/new)
3. Configure environment variables during import
4. Vercel will auto-deploy on every push to main

## Post-Deployment Checklist

- [ ] Verify the app loads at your production URL
- [ ] Test the onboarding flow
- [ ] Ensure environment variables are properly set
- [ ] Check that all API routes are working
- [ ] Test CMS data loading with a Webflow API key

## Troubleshooting

### Build Errors
- Check `vercel.json` configuration
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Environment Variable Issues
- Ensure all required variables are set
- Variables must be added in Vercel dashboard, not just `.env`
- Redeploy after adding/changing environment variables

### API Route Errors
- Check CORS settings if accessing from different domain
- Verify `NEXT_PUBLIC_APP_URL` matches your deployment URL