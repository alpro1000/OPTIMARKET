# Масштабирование на сотни товаров

## Проблема
Исходный алгоритм выбирает **1 товар = 1 уровень** (Economy/Optimum/Premium).
Это работает для небольших каталогов (5-10 товаров), но не масштабируется для **сотен товаров**.

## Решение
**Top-N выбор**: показывать несколько лучших товаров в каждом уровне.

---

## 🎯 Концепция (на примере автошин)

### Входные данные
```
Магазин автошин:
├── 500+ позиций
├── Разные размеры: 195/65 R15, 205/55 R16, 225/45 R17...
├── Бренды: Michelin, Continental, Nokian, Hankook, Kumho...
├── Сезонность: летние, зимние, всесезонные
└── Применение: легковые, SUV, коммерческие
```

### Шаги обработки

#### 1. Парсинг каталога
```javascript
// modules/parser.js
async function parseShopCatalog(url) {
  const products = await scrape(url);

  return products.map(p => ({
    name: "Michelin Pilot Sport 4",
    price: 12500,
    size: "225/45 R17",
    brand: "Michelin",
    season: "summer",
    specs: {
      fuel_efficiency: "B",
      wet_grip: "A",
      noise: 71
    },
    rating: 4.7,
    reviews_count: 342,
    in_stock: true
  }));
}
```

#### 2. Автоматическая категоризация
```javascript
// Создаем СВОИ категории (не как на сайте магазина!)
function categorizeProducts(products) {
  const categories = {};

  // Группировка по размеру (главный фактор для шин)
  products.forEach(p => {
    const key = `${p.size}_${p.season}`;
    if (!categories[key]) categories[key] = [];
    categories[key].push(p);
  });

  return categories;
}

// Результат:
{
  "225/45_R17_summer": [52 товара],
  "225/45_R17_winter": [38 товаров],
  "205/55_R16_summer": [67 товаров],
  ...
}
```

#### 3. Расчет Value Score (адаптирован для шин)
```javascript
function calculateValueScore(tire) {
  return (
    0.30 * (1 - tire.price / max_price) +    // Цена (30%)
    0.25 * (tire.rating / 5.0) +              // Отзывы (25%)
    0.25 * calculateEULabelScore(tire) +      // EU Label (25%)
    0.20 * getBrandScore(tire.brand)          // Бренд (20%)
  );
}

function calculateEULabelScore(tire) {
  // EU Label для шин: A/B/C/D/E
  const scores = { 'A': 1.0, 'B': 0.75, 'C': 0.5, 'D': 0.3, 'E': 0.1 };

  const fuelScore = scores[tire.specs.fuel_efficiency];
  const wetScore = scores[tire.specs.wet_grip];
  const noiseScore = tire.specs.noise <= 68 ? 1.0 : 0.7;

  return (fuelScore + wetScore + noiseScore) / 3;
}
```

#### 4. Top-N выбор (ключевое изменение!)
```javascript
function selectTopChoices(products, topN = 3) {
  // 1. Рассчитываем value_score для всех
  const withScores = products.map(p => ({
    ...p,
    value_score: calculateValueScore(p)
  }));

  // 2. Определяем ценовые квартили
  const prices = withScores.map(p => p.price).sort((a, b) => a - b);
  const q33 = prices[Math.floor(prices.length * 0.33)];
  const q66 = prices[Math.floor(prices.length * 0.66)];

  // 3. Выбираем Top-N в каждом уровне
  const economy = withScores
    .filter(p => p.price <= q33 && p.value_score >= 0.40)
    .sort((a, b) => b.value_score - a.value_score)
    .slice(0, topN);

  const optimum = withScores
    .filter(p => p.price > q33 && p.price < q66)
    .sort((a, b) => b.value_score - a.value_score)
    .slice(0, topN);

  const premium = withScores
    .filter(p => p.price >= q66)
    .sort((a, b) => b.value_score - a.value_score)
    .slice(0, topN);

  return { economy, optimum, premium };
}
```

---

## 📊 Результат

### Для категории "Летние 225/45 R17" (52 товара)
```json
{
  "economy": [
    { "name": "Nokian Model Q", "price": 6656, "score": 0.734 },
    { "name": "Matador Model U", "price": 5203, "score": 0.673 },
    { "name": "Kumho Model N", "price": 5951, "score": 0.668 }
  ],
  "optimum": [
    { "name": "Dunlop Model C", "price": 7737, "score": 0.687 },
    { "name": "Goodyear Model K", "price": 6995, "score": 0.682 },
    { "name": "Yokohama Model W", "price": 8232, "score": 0.667 }
  ],
  "premium": [
    { "name": "Continental Model D", "price": 10595, "score": 0.709 },
    { "name": "Michelin Model A", "price": 14662, "score": 0.664 },
    { "name": "Pirelli Model P", "price": 14284, "score": 0.646 }
  ]
}
```

---

## 🎨 UI для Top-N (варианты)

### Вариант 1: Карусель (рекомендуется для 3+ товаров)
```html
<div class="level-section">
  <h3>💙 Optimum — Лучшее соотношение</h3>
  <p class="subtitle">Top-3 из 17 вариантов в этой ценовой категории</p>

  <div class="carousel">
    <!-- Карточка 1 -->
    <div class="tire-card active">
      <span class="badge">🏆 Best Value</span>
      <img src="dunlop.jpg">
      <h4>Dunlop Model C</h4>
      <p class="price">7 737₽</p>

      <div class="eu-label">
        <span title="Экономичность">🔋 B</span>
        <span title="Сцепление">💧 B</span>
        <span title="Шум">🔊 71 dB</span>
      </div>

      <div class="stats">
        ⭐ 4.4 (156 отзывов)
        <br>Value Score: 0.69
      </div>

      <button class="buy-button">Выбрать →</button>
    </div>

    <!-- Карточки 2-3 -->
    ...
  </div>

  <div class="navigation">
    <button class="prev">←</button>
    <span>1 / 3</span>
    <button class="next">→</button>
  </div>
</div>
```

### Вариант 2: Компактный grid (для 3 товаров)
```html
<div class="level-section">
  <h3>💚 Economy — Бюджетно, но надежно</h3>

  <div class="tire-grid">
    <div class="tire-card-compact">
      <span class="badge">🏆 Best Value</span>
      <h4>Nokian Model Q</h4>
      <p class="price">6 656₽</p>
      <div class="mini-label">A/C/68dB</div>
      <p class="score">Score: 0.73 · ⭐4.4</p>
      <button>Выбрать</button>
    </div>

    <div class="tire-card-compact">
      <span class="badge">💰 Cheapest</span>
      <h4>Matador Model U</h4>
      <p class="price">5 203₽</p>
      <div class="mini-label">B/B/71dB</div>
      <p class="score">Score: 0.67 · ⭐4.3</p>
      <button>Выбрать</button>
    </div>

    <div class="tire-card-compact">
      <h4>Kumho Model N</h4>
      <p class="price">5 951₽</p>
      <div class="mini-label">B/B/68dB</div>
      <p class="score">Score: 0.67 · ⭐4.0</p>
      <button>Выбрать</button>
    </div>
  </div>
</div>
```

### Вариант 3: Таблица сравнения (для power users)
```html
<div class="comparison-table">
  <h3>💙 Optimum — Сравнение Top-3</h3>

  <table>
    <thead>
      <tr>
        <th>Модель</th>
        <th>Цена</th>
        <th>EU Label</th>
        <th>Рейтинг</th>
        <th>Score</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr class="recommended">
        <td>
          🏆 Dunlop Model C
        </td>
        <td>7 737₽</td>
        <td>B/B/71dB</td>
        <td>⭐4.4 (156)</td>
        <td>0.69</td>
        <td><button>Выбрать</button></td>
      </tr>
      <tr>
        <td>Goodyear Model K</td>
        <td>6 995₽</td>
        <td>C/B/69dB</td>
        <td>⭐4.4 (203)</td>
        <td>0.68</td>
        <td><button>Выбрать</button></td>
      </tr>
      <tr>
        <td>Yokohama Model W</td>
        <td>8 232₽</td>
        <td>B/B/69dB</td>
        <td>⭐4.2 (98)</td>
        <td>0.67</td>
        <td><button>Выбрать</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🔄 Обновленный User Flow

```
[Пользователь заходит на сайт]
    ↓
[Выбирает параметры]
    • Размер шин: 225/45 R17
    • Сезон: Летние
    ↓
[Система фильтрует]
    500 товаров → 52 подходящих
    ↓
[Алгоритм анализирует]
    • Рассчитывает value_score для 52 шин
    • Строит scatter plot (52 точки)
    • Находит квартили: Q33=6706₽, Q66=10595₽
    • Находит inflection point (точка перегиба)
    ↓
[Выбирает Top-3 в каждом уровне]
    💚 Economy: 3 варианта из 4 (5203₽ - 6656₽)
    💙 Optimum: 3 варианта из 17 (6995₽ - 8232₽) 🏆
    💛 Premium: 3 варианта из 6 (10595₽ - 14662₽)
    ↓
[Показывает результат]
    📊 Кривая ценности (52 точки на графике)
    🎯 9 конкретных рекомендаций (по 3 в каждом уровне)
    💬 Объяснения для каждого уровня
    🔄 Возможность переключаться между вариантами
```

---

## ⚙️ Технические детали

### 1. Парсинг сайта
```javascript
// modules/parser.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function parseShopCatalog(url, options = {}) {
  const { page = 1, perPage = 100 } = options;

  const response = await axios.get(`${url}?page=${page}&per_page=${perPage}`);
  const $ = cheerio.load(response.data);

  const products = [];

  $('.product-card').each((i, el) => {
    products.push({
      id: $(el).data('product-id'),
      name: $(el).find('.product-name').text().trim(),
      price: parseFloat($(el).find('.price').text().replace(/[^\d.]/g, '')),
      brand: $(el).find('.brand').text().trim(),
      rating: parseFloat($(el).find('.rating').text()),
      reviews_count: parseInt($(el).find('.reviews-count').text()),
      image: $(el).find('img').attr('src'),
      link: $(el).find('a').attr('href'),
      specs: extractSpecs($(el))
    });
  });

  return products;
}

function extractSpecs($el) {
  const specs = {};
  $el.find('.spec-item').each((i, spec) => {
    const key = $(spec).find('.spec-label').text().trim();
    const value = $(spec).find('.spec-value').text().trim();
    specs[key] = value;
  });
  return specs;
}
```

### 2. Пагинация (для тысяч товаров)
```javascript
async function parseAllPages(baseUrl) {
  const allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`📄 Parsing page ${page}...`);
    const products = await parseShopCatalog(baseUrl, { page });

    if (products.length === 0) {
      hasMore = false;
    } else {
      allProducts.push(...products);
      page++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return allProducts;
}
```

### 3. Кэширование (для production)
```javascript
import fs from 'fs';
import crypto from 'crypto';

const CACHE_DIR = './cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

async function getCachedOrFetch(url, fetchFn) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const cachePath = `${CACHE_DIR}/${hash}.json`;

  // Проверяем кэш
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    const age = Date.now() - stats.mtimeMs;

    if (age < CACHE_TTL) {
      console.log('✅ Using cached data');
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
  }

  // Fetch fresh data
  console.log('🔄 Fetching fresh data...');
  const data = await fetchFn(url);

  // Сохраняем в кэш
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));

  return data;
}
```

---

## 📈 Масштабирование на другие категории

Та же логика применима к любым категориям с сотнями товаров:

### Пылесосы
```javascript
// Факторы для value_score:
- Цена (30%)
- Мощность всасывания (20%)
- Уровень шума (15%)
- Объем пылесборника (10%)
- Бренд reputation (15%)
- Отзывы (10%)

// Категоризация:
- По типу: вертикальные / роботы / классические
- По применению: для квартиры / для дома / коммерческие
```

### Кофемашины
```javascript
// Факторы:
- Цена (25%)
- Тип: капсульные / зерновые / гейзерные (20%)
- Давление помпы (15%)
- Функции: капучинатор, автоочистка (20%)
- Бренд (10%)
- Отзывы (10%)

// Категоризация:
- По типу приготовления
- По объему резервуара
- По автоматизации
```

### Мониторы
```javascript
// Факторы:
- Цена (25%)
- Разрешение + частота обновления (25%)
- Технология матрицы: IPS / VA / TN (15%)
- Цветопередача: sRGB / Adobe RGB (15%)
- Бренд (10%)
- Отзывы (10%)

// Категоризация:
- По применению: gaming / professional / office
- По размеру: 24" / 27" / 32"+
```

---

## 🚀 План внедрения

### Фаза 1: Прототип (1-2 недели)
- [ ] Выбрать 1 категорию (например, автошины)
- [ ] Написать парсер для конкретного магазина
- [ ] Адаптировать value_score под категорию
- [ ] Протестировать Top-N выбор
- [ ] Создать UI для карусели

### Фаза 2: Валидация (2 недели)
- [ ] Запустить для 1 категории
- [ ] Собрать feedback от 20+ пользователей
- [ ] Измерить метрики:
  - Conversion rate (клики → покупки)
  - Time to decision (сколько времени на выбор)
  - Satisfaction (довольны ли результатом)

### Фаза 3: Масштабирование (1-2 месяца)
- [ ] Добавить 5-10 категорий
- [ ] Автоматизировать парсинг (cron jobs)
- [ ] Настроить кэширование (Redis)
- [ ] Оптимизировать performance (< 2s response time)

---

## 💡 Ключевые инсайты

1. **Top-N вместо Top-1** критично для масштабирования
   - Дает пользователю выбор внутри уровня
   - Снижает risk "единственного неправильного выбора"

2. **Автоматическая категоризация** важнее ручной
   - Свои категории (по value proposition), не копия магазина
   - Для шин: размер + сезон (не бренд!)
   - Для ноутбуков: использование (gaming/work/student), не процессор

3. **Value Score должен быть category-specific**
   - Для шин: EU Label > бренд
   - Для электроники: specs > бренд
   - Для одежды: материалы + отзывы > бренд

4. **UI должен масштабироваться**
   - Карусель для 3+ товаров
   - Таблица для power users
   - Фильтры для дополнительного сужения

---

## 📋 Checklist для новой категории

- [ ] Определить ключевые specs (что важно для покупателя?)
- [ ] Написать парсер (или использовать API магазина)
- [ ] Адаптировать calculateValueScore() под категорию
- [ ] Определить правила категоризации (как группировать?)
- [ ] Протестировать на 100+ товарах
- [ ] Проверить качество Top-N выборов (manual review)
- [ ] Создать category-specific объяснения
- [ ] Запустить A/B тест с пользователями

---

## 📞 Дальнейшие шаги

Хотите внедрить для конкретной категории? Скажите какую, и я адаптирую pipeline!

Примеры:
- Автошины: уже есть пример (см. runMVP_tires_example.js)
- Пылесосы: нужны specs (мощность, тип, объем)
- Кофемашины: нужны specs (тип, давление, функции)
- Мониторы: нужны specs (разрешение, Hz, матрица)
- Другое: опишите категорию
