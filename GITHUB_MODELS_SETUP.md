# 🚀 GitHub Models Token Setup & CI/CD Deployment Guide

## 📍 Where to Store GitHub Models Token

### Option 1: GitHub Secrets (RECOMMENDED)
Used for automatic deployments and CI/CD pipelines.

#### Steps:
1. **Get your GitHub Models token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes needed: `repo`, `write:packages`
   - Or use Personal Access Token: https://github.com/settings/personal-access-tokens/new

2. **Add to GitHub Repository Secrets:**
   - Go to: https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions
   - Click "New repository secret"
   - Name: `GITHUB_MODELS_TOKEN` (or `GH_TOKEN`)
   - Value: Paste your token
   - Click "Add secret"

3. **Add other API keys:**
   - `PERPLEXITY_API_KEY`
   - `GEMINI_API_KEY`
   - `AWIN_API_KEY` (when you get it)
   - `WEB3FORMS_API_KEY`

#### In GitHub Actions Workflow:
```yaml
# .github/workflows/deploy.yml
env:
  GITHUB_MODELS_TOKEN: ${{ secrets.GITHUB_MODELS_TOKEN }}
  PERPLEXITY_API_KEY: ${{ secrets.PERPLEXITY_API_KEY }}
```

---

### Option 2: .env.local (LOCAL DEVELOPMENT ONLY)
Only for local testing, NEVER commit to git.

```bash
# .env.local (add to .gitignore)
GITHUB_MODELS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx_xxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=xxx_xxxxxxxxxxxxxxxxxxxxx
AWIN_API_KEY=xxx_xxxxxxxxxxxxxxxxxxxxx
```

#### Setup:
```bash
# 1. Create .env.local
echo "GITHUB_MODELS_TOKEN=your_token_here" > .env.local

# 2. Make sure it's in .gitignore
echo ".env.local" >> .gitignore

# 3. Load in your Node.js app
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const token = process.env.GITHUB_MODELS_TOKEN;
```

---

### Option 3: Vercel Secrets (FOR PRODUCTION DEPLOYMENT)

#### Steps:
1. **Go to Vercel Dashboard:**
   - https://vercel.com/alpro1000/OPTIMARKET/settings/environment-variables

2. **Add environment variables:**
   - Key: `GITHUB_MODELS_TOKEN`
   - Value: Your token
   - Environments: Select which (Production, Preview, Development)

3. **Add all your API keys:**
   ```
   GITHUB_MODELS_TOKEN
   PERPLEXITY_API_KEY
   GEMINI_API_KEY
   AWIN_API_KEY
   WEB3FORMS_API_KEY
   DATABASE_URL (if using external DB)
   ```

---

## 🔐 How to Get GitHub Models Token

### Method 1: Personal Access Token (Classic)
```
1. Go: https://github.com/settings/tokens
2. Click: "Generate new token" → "Generate new token (classic)"
3. Token name: "OPTIMARKET_DEPLOYMENT"
4. Expiration: 90 days (for security)
5. Scopes:
   ✅ repo (full control of private repositories)
   ✅ write:packages (write packages to GitHub Packages)
   ✅ read:packages (read packages)
6. Generate and COPY immediately (can't see again!)
7. Store safely in GitHub Secrets
```

### Method 2: Fine-grained Personal Access Token (NEW)
```
1. Go: https://github.com/settings/personal-access-tokens/new
2. Token name: "OPTIMARKET_DEPLOYMENT"
3. Expiration: 30 days
4. Resource owner: alpro1000
5. Repository access: "Only select repositories" → OPTIMARKET
6. Permissions:
   ✅ Contents: Read & Write (for deployments)
   ✅ Actions: Read (for CI/CD)
   ✅ Workflows: Read & Write
7. Generate and save to GitHub Secrets
```

---

## 🚀 Deployment Strategy (Step-by-Step)

### Phase 1: Local Development ✅
```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with tokens
echo "GITHUB_MODELS_TOKEN=your_token" > .env.local

# 3. Test locally
npm run demo:full
npm start

# 4. Verify APIs work
curl http://localhost:3000/api/analytics
```

### Phase 2: Staging (GitHub Actions)
```yaml
# .github/workflows/staging.yml
name: Staging Deploy

on:
  push:
    branches: [feat/ai-updates]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        env:
          GITHUB_MODELS_TOKEN: ${{ secrets.GITHUB_MODELS_TOKEN }}
          PERPLEXITY_API_KEY: ${{ secrets.PERPLEXITY_API_KEY }}
        run: npm run test:integration
      
      - name: Run demo
        env:
          GITHUB_MODELS_TOKEN: ${{ secrets.GITHUB_MODELS_TOKEN }}
        run: npm run demo:full
```

### Phase 3: Production (Vercel)
```yaml
# .github/workflows/deploy-prod.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        env:
          GITHUB_MODELS_TOKEN: ${{ secrets.GITHUB_MODELS_TOKEN }}
          PERPLEXITY_API_KEY: ${{ secrets.PERPLEXITY_API_KEY }}
```

---

## 📋 Complete Setup Checklist

### 🔑 1. Get All Tokens

```bash
# GitHub Personal Access Token
# https://github.com/settings/tokens
GITHUB_MODELS_TOKEN: ghp_xxxxxxxxxxxxxxxxxxxx

# Perplexity API Key
# https://www.perplexity.ai/api
PERPLEXITY_API_KEY: pplx_xxxxxxxxxxxxxxxxxxxx

# Google Gemini API Key
# https://ai.google.dev/
GEMINI_API_KEY: xxx_xxxxxxxxxxxxxxxxxxxx

# Awin API Key (after partnership approval)
# https://www.awin.com/publishers/api
AWIN_API_KEY: xxx_xxxxxxxxxxxxxxxxxxxx

# Web3Forms API Key
# https://web3forms.com/
WEB3FORMS_API_KEY: xxx_xxxxxxxxxxxxxxxxxxxx
```

### 📍 2. Store in GitHub Secrets

```bash
# Go to: https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions

# Add each secret:
GITHUB_MODELS_TOKEN
PERPLEXITY_API_KEY
GEMINI_API_KEY
AWIN_API_KEY
WEB3FORMS_API_KEY
```

### 📍 3. Store in Vercel Secrets

```bash
# Go to: https://vercel.com/alpro1000/OPTIMARKET/settings/environment-variables

# Add for Production environment:
GITHUB_MODELS_TOKEN
PERPLEXITY_API_KEY
GEMINI_API_KEY
AWIN_API_KEY
WEB3FORMS_API_KEY
NODE_ENV=production
```

### 📍 4. Local Development (.env.local)

```bash
# Create file: .env.local
GITHUB_MODELS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx_xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=xxx_xxxxxxxxxxxxxxxxxxxx
AWIN_API_KEY=xxx_xxxxxxxxxxxxxxxxxxxx
WEB3FORMS_API_KEY=xxx_xxxxxxxxxxxxxxxxxxxx

# IMPORTANT: Add to .gitignore
echo ".env.local" >> .gitignore
```

---

## 🚀 Deployment Commands

### Local Development
```bash
# 1. Verify token is loaded
node -e "console.log(process.env.GITHUB_MODELS_TOKEN)"

# 2. Run demo with token
npm run demo:full

# 3. Start server
npm start
```

### Manual Deploy to Vercel
```bash
# 1. Install Vercel CLI (if not already)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project (first time)
vercel link

# 4. Deploy to production
vercel --prod

# 5. Deploy with environment vars
vercel --prod --env GITHUB_MODELS_TOKEN=your_token
```

### GitHub Actions Deploy
```bash
# 1. Push to feat/ai-updates branch
git add .
git commit -m "feat: ready for staging"
git push origin feat/ai-updates

# 2. GitHub Actions will:
#    - Run tests
#    - Use secrets automatically
#    - Deploy to Vercel

# 3. View logs at:
# https://github.com/alpro1000/OPTIMARKET/actions
```

---

## 🔄 Step-by-Step Deployment Workflow

### Development to Production:

```
┌─────────────────────────────────┐
│ 1. DEVELOP LOCALLY              │
│ ├─ npm install                  │
│ ├─ Create .env.local            │
│ ├─ Add GITHUB_MODELS_TOKEN      │
│ ├─ npm run test:integration     │
│ └─ npm start (test locally)     │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 2. COMMIT & PUSH                │
│ ├─ git add .                    │
│ ├─ git commit -m "..."          │
│ └─ git push origin feat/ai-...  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 3. GITHUB ACTIONS (Auto)        │
│ ├─ Load GITHUB_MODELS_TOKEN     │
│ ├─ npm run test:integration     │
│ ├─ npm run demo:full            │
│ └─ Check all pass ✓             │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 4. CREATE PULL REQUEST          │
│ ├─ https://github.com/...       │
│ ├─ feat/ai-updates → main       │
│ └─ Code review                  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 5. MERGE TO MAIN                │
│ ├─ Squash & merge               │
│ └─ Delete branch                │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 6. VERCEL AUTO-DEPLOY           │
│ ├─ Detects main push            │
│ ├─ Loads env secrets            │
│ ├─ Builds & deploys             │
│ └─ Live at optimarket.vercel.app│
└─────────────────────────────────┘
```

---

## ❌ Common Mistakes to Avoid

```
❌ WRONG:
- Commit .env.local to git
- Store tokens in code comments
- Use tokens in console.log()
- Share tokens in chat/email
- Commit package-lock.json with secrets

✅ RIGHT:
- Use GitHub Secrets for CI/CD
- Use .env.local (add to .gitignore)
- Use Vercel environment variables
- Rotate tokens every 90 days
- Use least-privilege permissions
```

---

## 🔍 Verify Setup

### Check GitHub Secrets
```bash
# You should see these at:
# https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions

✓ GITHUB_MODELS_TOKEN
✓ PERPLEXITY_API_KEY
✓ GEMINI_API_KEY
✓ AWIN_API_KEY
✓ WEB3FORMS_API_KEY
```

### Check Vercel Environment
```bash
# Run deployment and verify:
vercel env list

# Should show:
✓ GITHUB_MODELS_TOKEN (Production)
✓ PERPLEXITY_API_KEY (Production)
✓ etc...
```

### Test in CI/CD
```bash
# After pushing, check:
# https://github.com/alpro1000/OPTIMARKET/actions

# Green checkmarks = secrets loaded correctly ✅
```

---

## 📞 Troubleshooting

### "GITHUB_MODELS_TOKEN is undefined"
```bash
# Check:
1. Is secret added to GitHub?
2. Is secret spelled correctly? (case-sensitive!)
3. Is workflow using ${{ secrets.GITHUB_MODELS_TOKEN }}?
4. Local: Is .env.local created?
```

### "Request failed 401 Unauthorized"
```bash
# Check:
1. Token expired? (renew: https://github.com/settings/tokens)
2. Token has right scopes? (repo, write:packages)
3. Token value copied correctly? (no spaces)
4. Is token for right account? (alpro1000)
```

### "Vercel deployment failed"
```bash
# Check:
1. Are env vars set in Vercel dashboard?
2. Are they in Production environment?
3. Did you click "Save"?
4. Check Vercel logs: https://vercel.com/alpro1000/OPTIMARKET/logs
```

---

## 🎯 Quick Reference

| Where | What | Access |
|-------|------|--------|
| GitHub Secrets | GITHUB_MODELS_TOKEN | https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions |
| .env.local | Local development tokens | .gitignore (never commit) |
| Vercel Env | Production secrets | https://vercel.com/alpro1000/OPTIMARKET/settings/environment-variables |
| GitHub Actions | Auto-run CI/CD | https://github.com/alpro1000/OPTIMARKET/actions |

---

## 🚀 Next Steps

1. **Get GitHub Models Token** → https://github.com/settings/tokens
2. **Add to GitHub Secrets** → secrets/actions
3. **Add to .env.local** → for local testing
4. **Create .github/workflows** → for auto-deploy
5. **Deploy to Vercel** → via GitHub Actions
6. **Monitor logs** → Verify everything works

**Status:** Ready to deploy! 🎉
