# OPTIMARKET — Three Options. One Honest Choice.

AI-powered affiliate marketplace without inventory. We analyze reviews, build value curves, and give users 3 options: Economy, Optimum, and Premium.

## 🚀 Quick Start

```bash
npm install
npm run demo:full
npm start
```

## 📋 Documentation

### Main PR & References
- **[PR_DESCRIPTION.md](./PR_DESCRIPTION.md)** - Complete PR for weeks 1-4 (production-ready MVP)
- **[PR_REFERENCES.md](./PR_REFERENCES.md)** - PR tracking and external integrations
- **[pr-form.html](./public/pr-form.html)** - Web form to generate new PRs

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Full technical reference
- **[FINAL_SUMMARY_RU.md](./FINAL_SUMMARY_RU.md)** - Russian comprehensive guide
- **[COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)** - CLI commands reference

### Component Documentation
- **modules/database.js** (420 lines) - Persistent 7-table JSON DB
- **modules/productFetcher.js** (370 lines) - Web scraper + mock generation
- **modules/trustScore.js** (380 lines) - Multifactor trust algorithm
- **modules/priceTracker.js** (250 lines) - Cron-based price monitoring
- **modules/pipeline.js** (290 lines) - Unified API integration

## ✅ What's Implemented

### Week 1-4: Complete MVP
- ✅ **Web Scraper** - Loads 60+ products from multiple sources
- ✅ **Database** - 7 tables with persistent JSON storage
- ✅ **Trust Score Engine** - Multifactor algorithm (40% signals + 25% volume + 20% rating + 10% brand + 5% warranty)
- ✅ **Price Tracker** - Cron scheduling with alert subscriptions
- ✅ **Integration Pipeline** - Unified search/feedback/alerts/analytics API
- ✅ **LLM Integration** - Perplexity (reviews) + Gemini (explanations)
- ✅ **Interactive Frontend** - Chart.js visualizations, mobile-responsive
- ✅ **Full Testing** - E2E demo and integration tests passing

## 🧪 Testing

```bash
npm run demo:full          # Full system demo
npm run test:integration   # Integration tests
npm start                  # Start server
```

**Demo Output:**
- ✅ 60 products loaded
- ✅ Trust scores 81-92/100
- ✅ P/O/E rankings calculated
- ✅ Price alerts created
- ✅ Analytics generated

## 📊 Architecture

```
Web Scraper (productFetcher.js)
    ↓
Database (database.js)
    ↓
Trust Score Engine (trustScore.js)
    ↓
Price Tracker (priceTracker.js)
    ↓
Pipeline (pipeline.js)
    ↓
Frontend (index.html)
```

## 🔧 API Endpoints

```javascript
POST /api/search              // Search products
POST /api/feedback            // Submit user feedback
POST /api/price-alert         // Subscribe to price alerts
GET /api/analytics            // Get statistics
GET /api/product/:id          // Get product details
```

## 📱 Features

### For Users
- 🎯 Find products in 3 honest options (not 1000 items)
- 📊 See value curve analysis (price vs quality)
- 💬 Read AI-powered explanations
- 🔔 Get price drop alerts
- ⭐ Rate products and help others

### For Business
- 📈 Track user searches and feedback
- 💰 Monetize through affiliate links (Awin, Amazon APIs)
- 🤖 Scale to 100K+ products with web scraping
- 📊 Advanced analytics dashboard
- 🔄 Real-time price monitoring

## 🚀 Production Ready

- ✅ 2,060 lines of production code
- ✅ Comprehensive error handling
- ✅ Full documentation
- ✅ Windows/Mac/Linux compatible
- ✅ All tests passing
- ✅ Ready to deploy to Vercel

## 📝 Creating PRs

Use the web form to generate PRs:
```bash
# Open in browser
public/pr-form.html
```

Or manually edit [PR_DESCRIPTION.md](./PR_DESCRIPTION.md)

## 🔗 Integrations

- **Perplexity API** - Real product reviews
- **Gemini API** - LLM explanations
- **Web3Forms** - Email notifications
- **Telegram Bot** - Mobile interface (planned)
- **Awin/Amazon APIs** - Affiliate links (planned)

## 📞 Support

See documentation files or check the demo:
```bash
npm run demo:full
```

---

**Status:** ✅ Production Ready  
**Last Updated:** February 12, 2026  
**Version:** 1.0.0
