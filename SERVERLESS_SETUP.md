# Serverless Functions + Real Shop Integration

## 🎯 Полный план реализации

Этот документ описывает как перейти от статичных данных к динамической генерации с парсингом реальных магазинов.

---

## 📋 Что было создано

### 1. Serverless Function (`api/generate.js`)
- Vercel Serverless Function для динамической генерации
- Использует Perplexity для поиска отзывов
- Использует Gemini для создания объяснений
- Возвращает JSON с Economy/Optimum/Premium выбором

### 2. Shop Parser (`modules/shopParser.js`)
- Парсит каталоги реальных магазинов
- Поддержка пагинации
- Извлечение specs, цен, изображений
- Генерация Awin affiliate ссылок

### 3. Partnership Pitch (`AWIN_PARTNERSHIP_PITCH.md`)
- Готовый шаблон письма для запроса партнёрства
- Показывает ценность для магазина
- Расчеты projected revenue
- Технические детали интеграции

---

## 🚀 Этап 1: Выбрать магазин из Awin

### Шаг 1.1: Найти магазин
1. Зайдите на https://www.awin.com/
2. Publishers → Browse Merchants
3. Выберите категорию (например: "Automotive > Tires")
4. Найдите магазин с хорошим каталогом

**Критерии выбора:**
- ✅ Большой каталог (100+ товаров)
- ✅ Чёткая структура сайта (легко парсить)
- ✅ Хорошие комиссии (5-10%+)
- ✅ Доступен в вашей стране
- ✅ Responsive catalog (API или feed)

### Шаг 1.2: Проанализировать сайт
Откройте каталог магазина и изучите:
- URL структуру: `/catalog/tires?page=1`
- HTML селекторы: `.product-card`, `.tire-item`
- Где находится цена, название, specs
- Есть ли pagination

---

## 🔧 Этап 2: Настроить парсер

### Шаг 2.1: Обновить `modules/shopParser.js`

Добавьте конфигурацию для вашего магазина:

```javascript
export async function parseAwinShop(shopName, category) {
  const shopConfigs = {
    // Ваш магазин
    'tire-planet': {
      url: 'https://tire-planet.com/summer-tires',
      selectors: {
        product: '.product-item',  // CSS selector для товара
        name: 'h3.product-title',
        price: '.price-current',
        brand: '.brand-logo',
        image: 'img.product-image',
        specs: {
          size: '.tire-size',
          season: '.season-badge',
          eu_label: {
            fuel: '[data-fuel-efficiency]',
            wet: '[data-wet-grip]',
            noise: '[data-noise-level]'
          }
        }
      }
    }
  };

  const config = shopConfigs[shopName];
  // ... парсинг логика
}
```

### Шаг 2.2: Протестировать локально

```bash
# Установите зависимости
npm install

# Создайте тестовый скрипт
node -e "
import { parseAwinShop } from './modules/shopParser.js';
const products = await parseAwinShop('tire-planet', 'tires');
console.log(products);
"
```

**Ожидаемый результат:**
```json
[
  {
    "id": "tire_1",
    "product": "Michelin Pilot Sport 4",
    "price": "€145.00",
    "brand": "Michelin",
    "specs": { "size": "225/45 R17", ... },
    "url": "https://tire-planet.com/michelin-pilot-sport-4",
    "in_stock": true
  },
  ...
]
```

---

## 🌐 Этап 3: Deploy Serverless Function

### Шаг 3.1: Проверьте структуру

Убедитесь что файлы на месте:
```
/OPTIMARKET
├── api/
│   └── generate.js          ← Serverless Function
├── modules/
│   ├── shopParser.js        ← Парсер магазинов
│   ├── perplexity.js        ← Поиск отзывов
│   ├── explanations.js      ← LLM объяснения
│   ├── valueCurve.js        ← Value curve расчеты
│   └── reviewSignals.js     ← Signal extraction
├── vercel.json              ← Конфигурация Functions
└── package.json             ← Зависимости (cheerio добавлен)
```

### Шаг 3.2: Deploy на Vercel

```bash
# Закоммитьте изменения
git add .
git commit -m "Add Serverless Functions + shop parser"
git push origin main
```

Vercel автоматически задеплоит Functions на:
```
https://your-app.vercel.app/api/generate?category=tires
```

### Шаг 3.3: Проверьте API

```bash
curl https://your-app.vercel.app/api/generate?category=tires
```

**Ожидаемый ответ:**
```json
{
  "category": "tires",
  "generated_at": "2026-01-26T...",
  "choices": {
    "economy": { "product": "...", "explanation": {...} },
    "optimum": { "product": "...", "explanation": {...} },
    "premium": { "product": "...", "explanation": {...} }
  },
  "value_curve": {...},
  "tradeoffs": {...}
}
```

---

## 🔗 Этап 4: Подключить Frontend

### Шаг 4.1: Обновите `index.html`

Измените загрузку данных с статичного JSON на API:

```javascript
// Было:
const response = await fetch('/reports/mvp-v2-output.json');

// Стало:
const response = await fetch(`/api/generate?category=${categoryKey}`);
```

### Шаг 4.2: Добавьте Loading State

```html
<div id="loading" class="loading-spinner">
  <div class="spinner"></div>
  <p>Анализируем отзывы и строим рекомендации...</p>
  <p class="loading-detail">Обычно занимает 10-15 секунд</p>
</div>
```

### Шаг 4.3: Error Handling

```javascript
try {
  const response = await fetch(`/api/generate?category=${categoryKey}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  renderResults(data);

} catch (error) {
  console.error('Failed to load data:', error);
  showError('Не удалось загрузить данные. Попробуйте позже.');
}
```

---

## 🤝 Этап 5: Запросить партнёрство

### Шаг 5.1: Соберите данные

**Перед отправкой письма убедитесь что у вас есть:**
- ✅ Production URL (Vercel)
- ✅ Week 4 results (20+ пользователей, feedback)
- ✅ Screenshots landing page
- ✅ Example output для магазина (10-20 товаров)

### Шаг 5.2: Заполните шаблон

Откройте `AWIN_PARTNERSHIP_PITCH.md` и замените placeholders:

```markdown
**Subject:** Partnership Proposal: OPTIMARKET + TirePlanet.com

Dear TirePlanet Partnership Team,

...

**Current Traction:**
- ✅ 150 unique visitors in Week 4
- ✅ 25 feedback responses (80% positive)
- ✅ Average session: 3.5 minutes
- ✅ 35% CTR on affiliate links (mock data)

**Production URL:** https://optimarket.vercel.app
```

### Шаг 5.3: Запрос через Awin

**Вариант A: Direct Email**
- Найдите email partnerships@ на сайте магазина
- Отправьте письмо из `AWIN_PARTNERSHIP_PITCH.md`
- Приложите screenshots

**Вариант B: Через Awin Platform**
1. Зарегистрируйтесь как Publisher на Awin
2. Request to join program магазина
3. В message укажите ссылку на pitch document
4. Ждите одобрения (обычно 3-7 дней)

### Шаг 5.4: Пока ждёте одобрения

Можете использовать **mock affiliate links**:

```javascript
// В shopParser.js
affiliate_link: `https://example.com/product?ref=optimarket`

// После одобрения замените на:
affiliate_link: generateAwinLink(url, YOUR_PUBLISHER_ID, MERCHANT_ID)
```

---

## 📊 Этап 6: Оптимизация после запуска

### Шаг 6.1: Кэширование

**Проблема:** API вызывает Perplexity каждый раз = медленно + дорого

**Решение:** Кэшируйте результаты

```javascript
// api/generate.js
const CACHE = {};

export default async function handler(req, res) {
  const { category } = req.query;
  const cacheKey = `${category}_${new Date().toDateString()}`;

  // Проверяем кэш
  if (CACHE[cacheKey]) {
    console.log('✅ Returning cached result');
    return res.json(CACHE[cacheKey]);
  }

  // Генерируем заново
  const result = await generateRecommendations(category);
  CACHE[cacheKey] = result;

  return res.json(result);
}
```

### Шаг 6.2: Background Jobs (Vercel Cron)

**Для production:** Обновляйте данные каждые 24h автоматически

```javascript
// api/cron/update-catalog.js
export default async function handler(req, res) {
  // Проверяем Vercel Cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Обновляем все категории
  const categories = ['tires', 'tools', 'headphones'];

  for (const category of categories) {
    await generateAndSave(category);
  }

  res.json({ success: true, updated: categories });
}
```

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/update-catalog",
    "schedule": "0 2 * * *"
  }]
}
```

### Шаг 6.3: Analytics

Добавьте отслеживание:

```javascript
// Отслеживание кликов на affiliate ссылки
function trackAffiliateClick(product, level) {
  fetch('/api/analytics/click', {
    method: 'POST',
    body: JSON.stringify({
      product,
      level, // economy/optimum/premium
      timestamp: Date.now()
    })
  });
}
```

---

## 💰 Расчет стоимости (production)

### API Costs:
```
Perplexity:
- $5 = 1,000 requests
- 4 categories × 3 products = 12 requests/run
- 1 run/day = 360 requests/month = $1.80/month
- + dynamic requests (10x) = $18/month

Gemini:
- Free tier: 1,500 requests/day
- Достаточно для 1000+ пользователей/день
- Paid (если нужен): $0.001 per request = $30/month for 30k requests

Vercel:
- Hobby plan: Free (100GB bandwidth, 100h runtime)
- Pro plan: $20/month (1TB bandwidth, unlimited runtime)

Total: ~$20-50/month для 10,000 пользователей/месяц
```

### Revenue:
```
Traffic: 10,000 users/month
CTR: 30% (3,000 clicks to shop)
Conversion: 5% (150 sales)
AOV: €100
Commission: 5% = €5 per sale
Revenue: 150 × €5 = €750/month

Profit: €750 - €50 (costs) = €700/month
```

---

## 🎯 Чеклист запуска

### Pre-launch:
- [ ] Парсер работает для выбранного магазина
- [ ] Serverless Function деплойнута на Vercel
- [ ] API ключи (Perplexity + Gemini) настроены
- [ ] Frontend загружает данные из `/api/generate`
- [ ] Кэширование настроено (не делаем лишних API вызовов)
- [ ] Error handling + loading states готовы

### Partnership:
- [ ] Week 4 validation завершена (20+ пользователей)
- [ ] Feedback собран и проанализирован
- [ ] Screenshots и demo video готовы
- [ ] Partnership pitch отправлен
- [ ] Awin Publisher account создан

### Post-launch:
- [ ] Affiliate links работают (проверьте tracking)
- [ ] Analytics настроена (отслеживание кликов)
- [ ] Cron jobs для auto-update (опционально)
- [ ] Monitoring (Vercel logs, Sentry для ошибок)

---

## 🚨 Troubleshooting

### API Function timeout (30s limit exceeded)
**Проблема:** Perplexity + Gemini слишком медленные

**Решение:**
1. Кэшируйте результаты
2. Используйте Vercel Pro (60s timeout)
3. Переключитесь на async generation (webhook callback)

### Parser не работает
**Проблема:** Сайт изменил структуру или блокирует bot

**Решение:**
1. Проверьте selectors (inspect element на сайте)
2. Добавьте User-Agent header
3. Используйте API магазина вместо парсинга
4. Запросите product feed (CSV/XML)

### Affiliate links не трекаются
**Проблема:** Неправильный формат ссылки

**Решение:**
1. Проверьте формат в Awin documentation
2. Убедитесь что clickref уникальный
3. Тестируйте ссылку вручную (кликните сами)
4. Проверьте Awin dashboard через 24h

---

## 📞 Поддержка

**Вопросы?** Проверьте:
- Vercel logs: Dashboard → Functions → Logs
- API endpoint: `/api/generate?category=test`
- Документация Awin: https://wiki.awin.com/

**Дальнейшее развитие:**
- Больше категорий (10+)
- Больше магазинов (multi-merchant)
- User accounts (saved preferences)
- A/B testing (optimize conversion)

---

**Готово! Теперь у вас полноценная production-ready система! 🚀**
