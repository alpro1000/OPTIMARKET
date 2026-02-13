# 📋 Token Setup & Deployment - Quick Summary

## 🎯 Where to Store Tokens

### 1. **GitHub Secrets** (for CI/CD) ← USE THIS FOR DEPLOYMENT
```
https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions
```
✅ Automatic CI/CD pipeline  
✅ Secure (not visible in logs)  
✅ Can use in GitHub Actions workflow  

**Add these secrets:**
- `GITHUB_MODELS_TOKEN`
- `PERPLEXITY_API_KEY`
- `GEMINI_API_KEY`
- `AWIN_API_KEY`
- `WEB3FORMS_API_KEY`

---

### 2. **.env.local** (local development only)
```bash
# Create file: .env.local
GITHUB_MODELS_TOKEN=ghp_xxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx_xxxxxxxxxxxx
# etc...

# Make sure it's ignored:
echo ".env.local" >> .gitignore
```
✅ Local testing  
✅ Never commit!  
⚠️ Only use on your machine  

---

### 3. **Vercel Environment** (production)
```
https://vercel.com/alpro1000/OPTIMARKET/settings/environment-variables
```
✅ Production secrets  
✅ Automatic in deployments  
✅ Set for Production environment  

---

## 🚀 Quick 5-Step Setup

### Step 1: Get GitHub Models Token (2 min)
```
https://github.com/settings/tokens
→ Generate new token (classic)
→ Name: "OPTIMARKET_DEPLOYMENT"
→ Scopes: repo, write:packages
→ Generate & COPY
```

### Step 2: Add to GitHub Secrets (2 min)
```
https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions
→ New repository secret
→ Name: GITHUB_MODELS_TOKEN
→ Value: ghp_xxxx (paste)
→ Add secret ✅
```

### Step 3: Create .env.local (1 min)
```bash
echo "GITHUB_MODELS_TOKEN=ghp_xxxx" > .env.local
echo ".env.local" >> .gitignore
```

### Step 4: Test Locally (1 min)
```bash
npm install
npm run test:integration
npm start
```

### Step 5: Commit & Push (1 min)
```bash
git add .
git commit -m "feat: add GitHub Models"
git push origin feat/ai-updates
# GitHub Actions runs automatically! ✅
```

---

## 📊 Files Created

| File | Purpose |
|------|---------|
| `GITHUB_MODELS_SETUP.md` | Complete setup guide with all options |
| `DEPLOYMENT_STEPS.md` | Step-by-step deployment instructions |
| `.github/workflows/deploy.yml` | CI/CD automation workflow |
| `.env.example` | Template for environment variables |

---

## 🔄 How It Works

```
1. You commit code to feat/ai-updates
          ↓
2. GitHub Actions detects push
          ↓
3. Loads secrets from GitHub Settings
   - GITHUB_MODELS_TOKEN
   - PERPLEXITY_API_KEY
   - etc...
          ↓
4. Runs tests (npm run test:integration)
          ↓
5. Runs demo (npm run demo:full)
          ↓
6. If all green ✅ → Ready to merge
          ↓
7. Create PR and merge to main
          ↓
8. GitHub Actions deploys to Vercel
   (using VERCEL_TOKEN secret)
          ↓
9. Live at https://optimarket.vercel.app 🎉
```

---

## 🔐 Security Best Practices

✅ DO:
- Store tokens in GitHub Secrets
- Use .env.local + .gitignore locally
- Rotate tokens every 90 days
- Use least-privilege permissions
- Add token to multiple branches if needed

❌ DON'T:
- Commit .env.local to git
- Store tokens in code comments
- Share tokens in messages/email
- Use same token for multiple projects
- Log token values in console

---

## 📸 Visual Map

```
┌─────────────────────────────────────────┐
│  Your Local Machine                     │
│  ├─ .env.local (GITHUB_MODELS_TOKEN)   │
│  ├─ npm install                        │
│  ├─ npm run test:integration           │
│  └─ npm start ✅                       │
└──────────┬──────────────────────────────┘
           │ git push
           ↓
┌─────────────────────────────────────────┐
│  GitHub Repository                      │
│  ├─ Secrets (GITHUB_MODELS_TOKEN)      │
│  ├─ Actions workflow runs ✅            │
│  ├─ Tests pass ✅                       │
│  └─ Demo works ✅                       │
└──────────┬──────────────────────────────┘
           │ merge to main
           ↓
┌─────────────────────────────────────────┐
│  Vercel Deployment                      │
│  ├─ Build with secrets ✅              │
│  ├─ Deploy to production ✅             │
│  └─ Live! 🚀                           │
└─────────────────────────────────────────┘
```

---

## 🔗 Important Links

| Task | Link |
|------|------|
| Get GitHub Token | https://github.com/settings/tokens |
| Add GitHub Secrets | https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions |
| View GitHub Actions | https://github.com/alpro1000/OPTIMARKET/actions |
| Vercel Dashboard | https://vercel.com/alpro1000/OPTIMARKET |
| Vercel Env Vars | https://vercel.com/alpro1000/OPTIMARKET/settings/environment-variables |

---

## ❓ FAQ

**Q: Where exactly do I paste the GitHub Models token?**  
A: https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions → New repository secret

**Q: Will GitHub Actions automatically use my secrets?**  
A: Yes! Add `${{ secrets.GITHUB_MODELS_TOKEN }}` in workflow.yml

**Q: Can I test locally without secrets?**  
A: Yes, but some APIs won't work. Use .env.local for full testing.

**Q: How often should I rotate tokens?**  
A: Every 90 days recommended. Or immediately if exposed.

**Q: What if deployment fails?**  
A: Check GitHub Actions logs and Vercel logs for errors.

---

## ✅ Current Status

- ✅ Documentation created
- ✅ CI/CD workflow ready
- ✅ Deployment steps clear
- ✅ Setup guides completed
- ⏳ Ready for your token & deployment
- 🚀 Can deploy in <5 minutes

**Next:** Follow DEPLOYMENT_STEPS.md step-by-step!
