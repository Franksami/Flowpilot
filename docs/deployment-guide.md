# FlowPilot Deployment Guide

## Quick Setup for Staging

### 1. Vercel Project Setup

1. Go to [vercel.com](https://vercel.com) and create a new project
2. Connect your GitHub repository
3. Choose "Next.js" framework (auto-detected)
4. Set build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm ci`

### 2. Environment Variables in Vercel

Add these in Project Settings → Environment Variables:

| Variable              | Value              | Environment          |
| --------------------- | ------------------ | -------------------- |
| `WEBFLOW_API_TOKEN`   | Your staging token | Preview, Development |
| `NEXT_PUBLIC_APP_ENV` | `staging`          | Preview, Development |

### 3. GitHub Repository Secrets

Add these in GitHub repo Settings → Secrets and variables → Actions:

| Secret              | How to get it                               |
| ------------------- | ------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel Account Settings → Tokens → Create   |
| `VERCEL_ORG_ID`     | Vercel Project Settings → General (Team ID) |
| `VERCEL_PROJECT_ID` | Vercel Project Settings → General           |

### 4. Deploy

- **Automatic:** Push to `main` branch → triggers staging deploy
- **Manual:** Run `vercel --prod` from terminal (requires Vercel CLI)

## URLs After Setup

- **Staging:** `https://your-project-name.vercel.app`
- **PR Previews:** `https://your-project-name-git-branch-name.vercel.app`

## Local Development

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Test production build locally
npm run start        # Serve production build
npm run lint         # Check for linting issues
npm test             # Run test suite
```

## Troubleshooting

- **Build fails:** Check `npm run build` works locally first
- **Lint errors:** Run `npm run lint:fix` to auto-fix issues
- **Tests fail:** Run `npm test` locally to debug
- **Missing env vars:** Verify all required variables are set in Vercel

## Next Steps

1. Set up custom domain in Vercel
2. Configure monitoring (Vercel Analytics)
3. Add performance budgets in CI
