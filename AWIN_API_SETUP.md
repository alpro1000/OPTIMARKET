# Awin API Setup Guide

## 🎯 Цель

Получить доступ к Awin Product Feed API для загрузки реальных товаров с партнёрскими ссылками.

---

## 📋 Шаг 1: Регистрация в Awin

### 1.1 Создайте Publisher аккаунт

1. Зайдите на https://www.awin.com/
2. Нажмите **"Join Awin" → "Publishers"**
3. Заполните форму регистрации:
   - Website URL: укажите ваш Vercel URL (`https://your-app.vercel.app`)
   - Category: "Technology / Comparison Site"
   - Description: "AI-powered product comparison service helping users choose between Economy/Optimum/Premium options"
   - Traffic: укажите прогнозируемый трафик (можно начать с 1,000-5,000/month)

4. Подтвердите email и дождитесь одобрения (1-3 дня)

### 1.2 Верификация

Awin может запросить дополнительную информацию:
- Скриншоты вашего сайта
- Описание бизнес-модели
- Traffic sources (SEO, Social Media, Direct)

**Совет:** Убедитесь что на сайте есть:
- Privacy Policy
- About page
- Contact information
- Clear explanation как работает сервис

---

## 🔑 Шаг 2: Получить API Key

### 2.1 Найти API Key в интерфейсе

После одобрения аккаунта:

1. Войдите в Awin Publisher Dashboard
2. Перейдите в **Toolbox → Create-a-Feed**
3. Внизу страницы найдите **"API Key"** или **"Authentication Token"**
4. Скопируйте API Key (формат: `a1b2c3d4e5f6g7h8i9j0`)

### 2.2 Альтернативный способ (через API Settings)

1. Awin Dashboard → Settings → API Access
2. Enable API Access
3. Generate new API Key
4. Скопируйте и сохраните в безопасном месте

**⚠️ Важно:** API Key даёт доступ к вашему аккаунту, не публикуйте его в коде!

---

## 🛍️ Шаг 3: Найти Advertiser IDs

### 3.1 Browse Merchants

1. Awin Dashboard → **"Browse Advertisers"**
2. Выберите категорию:
   - **Power Tools / DIY** (для дрелей)
   - **Electronics > Audio** (для наушников)
   - **Computers & Accessories** (для ноутбуков)
   - **Mobile Phones** (для смартфонов)

3. Найдите магазины с:
   - ✅ Product Feed available
   - ✅ Good commission rate (5-10%+)
   - ✅ High EPC (Earnings Per Click)
   - ✅ Good advertiser rating

### 3.2 Apply to Program

1. Нажмите **"Join Programme"** для каждого магазина
2. Заполните application:
   - Describe promotion method: "Product comparison and recommendations via AI-powered selection tool"
   - Website traffic: (ваши прогнозы)
   - Why you want to join: "To provide affiliate links to products recommended by our algorithm"

3. Дождитесь одобрения (instant approval или 1-7 дней)

### 3.3 Найти Advertiser ID

После одобрения:

1. My Programmes → Joined Programmes
2. Найдите магазин и откройте детали
3. Скопируйте **Advertiser ID** (число, например: `12345`)

**Пример:**
```
Screwfix       → Advertiser ID: 1228
Conrad         → Advertiser ID: 5678
Stock Must Go  → Advertiser ID: 21279
```

---

## ⚙️ Шаг 4: Настроить Environment Variables

### 4.1 Локально (.env)

Создайте/обновите файл `.env`:

```bash
# Awin Product Feed API
AWIN_API_KEY=your_api_key_here

# Advertiser IDs для каждой категории
AWIN_ADVERTISER_TOOLS=1228        # Screwfix (dрели)
AWIN_ADVERTISER_ELECTRONICS=5678  # Conrad (наушники)
AWIN_ADVERTISER_COMPUTERS=9012    # Stock Must Go (ноутбуки)
AWIN_ADVERTISER_MOBILE=3456       # Mobile shop (телефоны)
AWIN_ADVERTISER_AUTO=7890         # Auto shop (шины)

# Другие API (уже настроены)
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
```

### 4.2 На Vercel (Production)

1. Откройте Vercel Dashboard
2. Project → Settings → Environment Variables
3. Добавьте переменные:

| Name | Value | Environment |
|------|-------|-------------|
| `AWIN_API_KEY` | `a1b2c3...` | Production, Preview, Development |
| `AWIN_ADVERTISER_TOOLS` | `1228` | Production, Preview, Development |
| `AWIN_ADVERTISER_ELECTRONICS` | `5678` | Production, Preview, Development |
| ... | ... | ... |

4. Нажмите **"Save"**
5. Redeploy проект (Settings → Deployments → Redeploy)

---

## 🧪 Шаг 5: Протестировать API

### 5.1 Локальный тест

Запустите тестовый скрипт:

```bash
node testAwinAPI.js
```

**Ожидаемый output:**
```
🧪 ТЕСТ AWIN PRODUCT FEED API

✅ AWIN_API_KEY найден: a1b2c3...
✅ Advertiser IDs настроены: tools=1228, electronics=5678, ...

📡 Запрос к Awin API для категории: drills
✅ Получено 50 товаров

Примеры:
• Makita DDF484 18V Drill - €169.00 (Makita)
• Bosch GSR 18V-110 C - €249.00 (Bosch)
• ...

✅ ТЕСТ ПРОЙДЕН!
```

### 5.2 Test Serverless Function локально

```bash
# Установите vercel cli
npm install -g vercel

# Запустите локально
vercel dev

# Откройте в браузере
http://localhost:3000/api/generate?category=drills
```

### 5.3 Проверьте на production

После деплоя:
```
https://your-app.vercel.app/api/generate?category=drills
```

**Ожидаемый JSON:**
```json
{
  "category": "drills",
  "choices": {
    "economy": {...},
    "optimum": {...},
    "premium": {...}
  },
  "metadata": {
    "data_source": "awin",
    "awin_advertiser_id": 1228,
    "api_keys_used": {
      "perplexity": true,
      "gemini": true,
      "awin": true
    }
  }
}
```

---

## 🚨 Troubleshooting

### Проблема: "AWIN_API_KEY not set, using fallback"

**Решение:**
1. Проверьте что `.env` файл существует и содержит ключ
2. Проверьте что Vercel Environment Variables настроены
3. Redeploy после добавления переменных

### Проблема: "Awin API error: 401 Unauthorized"

**Решение:**
1. Проверьте что API Key правильный (скопирован полностью)
2. Убедитесь что Publisher аккаунт активен и одобрен
3. Проверьте что вы используете правильный endpoint

### Проблема: "Awin API error: 403 Forbidden"

**Решение:**
1. Убедитесь что вы одобрены в программе advertiser
2. Проверьте что Advertiser ID правильный
3. Убедитесь что у merchant есть product feed

### Проблема: "No products found"

**Решение:**
1. Проверьте что category name совпадает с категорией в feed
2. Попробуйте убрать фильтр по категории (загрузить все товары)
3. Проверьте что у merchant есть товары в stock

### Проблема: "Rate limit exceeded (429)"

**Решение:**
- Awin лимит: 20 запросов/минуту
- Используйте кэширование (см. `api/generate.js:82`)
- Добавьте Redis для продакшн (Vercel KV Storage)

---

## 📊 API Limits и Costs

### Rate Limits
- **Product Feed API:** 20 requests/minute per user
- **Recommendation:** Кэшировать результаты на 1 час minimum

### Стоимость
- **Publisher аккаунт:** Бесплатно (комиссия только с продаж)
- **API Access:** Бесплатно для publishers
- **Комиссия:** 5-15% от продажи (зависит от merchant)

### Projected Costs (for 10k monthly users)

**Scenario:** 10,000 users, 4 categories

```
API Calls:
- Product Feed: 4 calls/day × 30 days = 120 calls/month (в пределах лимита)
- Кэширование: S-maxage=3600 (1h) → повторные запросы не бьют API

Total Cost:
- Awin API: €0 (бесплатно)
- Perplexity: ~$30/month (50 products × 5 snippets × 4 categories × $0.001)
- Gemini: ~$5/month (50 products × 3 levels × 4 categories × $0.00002)

Total: ~€35/month для 10k пользователей
```

---

## 📚 Resources

### Официальная документация:
- **Product Feed API:** https://help.awin.com/apidocs/introduction-1
- **Publisher Guide:** https://developer.awin.com/docs/product-feed-publisher-guide-intro
- **Support Center:** https://success.awin.com/

### Useful Links:
- Awin Dashboard: https://ui.awin.com/
- Create-a-Feed Tool: https://ui.awin.com/awin-toolbox/create-a-feed
- API Documentation: https://help.awin.com/apidocs/

---

## ✅ Checklist

Перед деплоем убедитесь:

- [ ] Awin Publisher аккаунт одобрен
- [ ] API Key получен и добавлен в `.env` и Vercel
- [ ] Одобрены минимум 2 advertiser programmes (для разных категорий)
- [ ] Advertiser IDs добавлены в environment variables
- [ ] Локальный тест пройден (`node testAwinAPI.js`)
- [ ] Serverless Function работает локально (`vercel dev`)
- [ ] Задеплоено на Vercel
- [ ] Production endpoint работает (`/api/generate?category=drills`)
- [ ] В Vercel logs видно "Fetched X products from Awin API"

---

**Последнее обновление:** 2026-01-27
**Статус:** Ready for production
