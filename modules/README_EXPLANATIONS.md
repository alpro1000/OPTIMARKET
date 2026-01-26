# LLM-объяснения для OPTIMARKET

## Что это?

Модуль `explanations.js` генерирует человекочитаемые объяснения для каждого уровня выбора (Economy/Optimum/Premium) с помощью Gemini API.

## Философия

- **Спокойный инженер-консультант** — фактический тон, без маркетинга
- **LLM только объясняет** — не принимает решений, алгоритм уже выбрал
- **Только реальные данные** — нет фантазий AI, все из отзывов

## Установка

```bash
# 1. Установить зависимости
npm install

# 2. Получить Gemini API key
# https://ai.google.dev

# 3. Добавить в .env
echo "GEMINI_API_KEY=your_key_here" >> .env
```

## Быстрый старт

```bash
# Запустить тест на категории "дрели"
npm run test:explanations
```

## API модуля

### `generateExplanation(params)`

Генерирует объяснение для одного уровня.

```javascript
import { generateExplanation } from './modules/explanations.js';

const result = await generateExplanation({
  product: {
    product: "Bosch GSR 18V-110",
    price: "249€",
    specs: { "Крутящий момент": "110 Н·м" },
    pros: ["металлический патрон", "точная электроника"],
    cons: ["высокая цена"]
  },
  level: "Premium",
  signals: {
    positive_mentions: 45,
    negative_mentions: 3,
    trust_score: 3.8
  },
  competitors: [economyProduct, optimumProduct],
  category: "drill"
});

// Результат:
// {
//   why: "Bosch попал в Premium, потому что...",
//   tradeoffs: [
//     "Высокая цена (+150€ к Optimum)",
//     "Максимальный крутящий момент (110 Н·м)",
//     "Служит в 2-3 раза дольше"
//   ],
//   bestFor: "Для профессионалов, работающих ежедневно"
// }
```

### `generateTradeoffComparison(params)`

Генерирует сравнение между уровнями.

```javascript
import { generateTradeoffComparison } from './modules/explanations.js';

const result = await generateTradeoffComparison({
  economy: economyProduct,
  optimum: optimumProduct,
  premium: premiumProduct,
  category: "drill"
});

// Результат:
// {
//   economyVsOptimum: {
//     priceDiff: "+70€",
//     valueGain: "Надежный редуктор, в 2 раза больший ресурс",
//     breakEven: "Окупается через год регулярного использования"
//   },
//   optimumVsPremium: {
//     priceDiff: "+80€",
//     valueGain: "Металлический патрон, 3-летняя гарантия vs 2 года",
//     breakEven: "Для профессионального ежедневного использования"
//   }
// }
```

### `generateAllExplanations(params)`

Генерирует полный набор объяснений для всех трех уровней + сравнения.

```javascript
import { generateAllExplanations } from './modules/explanations.js';

const result = await generateAllExplanations({
  choices: { economy, optimum, premium },
  signals: {
    economy: { positive_mentions: 15, negative_mentions: 8, trust_score: 2.5 },
    optimum: { positive_mentions: 32, negative_mentions: 5, trust_score: 3.2 },
    premium: { positive_mentions: 45, negative_mentions: 3, trust_score: 3.8 }
  },
  category: "drill"
});

// Результат:
// {
//   economy: { ...product, explanation: {...} },
//   optimum: { ...product, explanation: {...} },
//   premium: { ...product, explanation: {...} },
//   tradeoffs: { economyVsOptimum: {...}, optimumVsPremium: {...} }
// }
```

## Конфигурация

### Модель LLM

По умолчанию используется `gemini-1.5-flash` (быстрая и дешевая):

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.3,  // Низкая = фактический стиль
    maxOutputTokens: 800
  }
});
```

Для более качественных объяснений можно использовать `gemini-1.5-pro`:

```javascript
model: 'gemini-1.5-pro'  // Медленнее, дороже, но качественнее
```

### Промпт-инструкции

Промпт включает:
- ✅ Запрет на слова "идеальный", "лучший", "невероятный"
- ✅ Инструкцию использовать только факты
- ✅ Few-shot примеры хорошего/плохого стиля
- ✅ Требование вернуть JSON

## Обработка ошибок

Модуль имеет fallback на базовые объяснения при ошибках:

```javascript
// Если LLM не отвечает или формат неверный
return {
  why: "Базовое объяснение на основе данных",
  tradeoffs: ["Цена: 249€", "Отзывы: 45 положительных"],
  bestFor: "Подходит для использования в категории drill"
};
```

## Интеграция в основной pipeline

```javascript
// В runMVP.js

import { generateAllExplanations } from './modules/explanations.js';

// После выбора Economy/Optimum/Premium
const choices = { economy, optimum, premium };
const signals = { economy: {...}, optimum: {...}, premium: {...} };

const withExplanations = await generateAllExplanations({
  choices,
  signals,
  category: 'drill'
});

// Сохранить результат
fs.writeFileSync(
  './reports/choices_with_explanations.json',
  JSON.stringify(withExplanations, null, 2)
);
```

## Стоимость

Примерная стоимость (Gemini 1.5 Flash):
- **Input:** ~$0.00015 за 1K tokens
- **Output:** ~$0.00060 за 1K tokens
- **Один запрос:** ~600 input + ~200 output tokens = **~$0.0002 (0.02¢)**

Для 1000 товаров: **~$0.20**

## Следующие шаги

1. ✅ Создан модуль `explanations.js`
2. ✅ Создан тестовый скрипт
3. ⏳ Интегрировать в `runMVP.js`
4. ⏳ Добавить human review первых 50 объяснений
5. ⏳ Создать UI для отображения объяснений

## Troubleshooting

### Ошибка "GEMINI_API_KEY is not defined"

```bash
# Добавить ключ в .env
echo "GEMINI_API_KEY=your_actual_key" >> .env
```

### JSON parse error

LLM иногда возвращает текст с markdown блоками:

````
```json
{"why": "..."}
```
````

Модуль автоматически убирает обертки ````json` и ```` ``` ``.

### Rate limit exceeded

При большом количестве запросов:

```javascript
// Добавить задержку между запросами
await new Promise(r => setTimeout(r, 1000));
```

---

**Последнее обновление:** 2026-01-26
**Статус:** ✅ Ready for testing
