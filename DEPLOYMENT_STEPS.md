# 🚀 DEPLOYMENT STEPS - From Development to Production

## Шаг 1: Подготовка токенов (5 мин)

### 1.1 Получить GitHub Models Token

```bash
# Перейти на: https://github.com/settings/tokens
# Или: https://github.com/settings/personal-access-tokens/new

# Нажать: "Generate new token (classic)" или "New token"
# Имя: OPTIMARKET_DEPLOYMENT
# Срок: 90 дней (или меньше для безопасности)
# Scopes выбрать:
#   ✅ repo (full control)
#   ✅ write:packages
#   ✅ read:packages
# ✅ Нажать "Generate token"
# ✅ КОПИРОВАТЬ токен (больше не покажется!)

# Должен выглядеть как:
# ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 1.2 Получить другие ключи (если есть)

```
Perplexity:     https://www.perplexity.ai/api
Gemini:         https://ai.google.dev
Awin (потом):   https://www.awin.com/publishers
Web3Forms:      https://web3forms.com
```

---

## Шаг 2: Добавить токены в GitHub Secrets (3 мин)

### 2.1 Перейти в настройки репозитория

```
https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions
```

### 2.2 Добавить каждый секрет

```
Нажать: "New repository secret"

Добавить:
┌─────────────────────────────────────────────────┐
│ Name:  GITHUB_MODELS_TOKEN                      │
│ Value: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │
└─────────────────────────────────────────────────┘
Нажать: "Add secret"

┌─────────────────────────────────────────────────┐
│ Name:  PERPLEXITY_API_KEY                       │
│ Value: pplx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  │
└─────────────────────────────────────────────────┘
Нажать: "Add secret"

Повторить для:
- GEMINI_API_KEY
- WEB3FORMS_API_KEY
- AWIN_API_KEY (если есть)
```

### 2.3 Проверить секреты добавлены

```
На странице должны видны:
✓ GITHUB_MODELS_TOKEN
✓ PERPLEXITY_API_KEY
✓ GEMINI_API_KEY
✓ WEB3FORMS_API_KEY
✓ и т.д.
```

---

## Шаг 3: Локальное тестирование (5 мин)

### 3.1 Создать .env.local файл

```bash
# Выполнить в терминале (PowerShell):
echo "GITHUB_MODELS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx" > .env.local
echo "PERPLEXITY_API_KEY=pplx_xxxxxxxxxxxxxxxx" >> .env.local
echo "GEMINI_API_KEY=xxx_xxxxxxxxxxxxxxxxxxxx" >> .env.local
```

### 3.2 Проверить .env.local в .gitignore

```bash
# Выполнить:
echo ".env.local" >> .gitignore

# Проверить (должен быть .env.local):
Get-Content .gitignore | Select-String ".env"
```

### 3.3 Тестировать локально

```bash
# Установить зависимости
npm install

# Запустить тесты
npm run test:integration

# Запустить demo
npm run demo:full

# Запустить сервер
npm start

# Проверить порт 3000
# http://localhost:3000
```

---

## Шаг 4: Коммит и Пуш (2 мин)

### 4.1 Добавить изменения

```bash
git add .
git commit -m "feat: add GitHub Models integration and CI/CD setup"
```

### 4.2 Пушить в ветку

```bash
# Для тестирования - в feature branch:
git push origin feat/ai-updates

# GitHub Actions автоматически запустится!
# Проверить: https://github.com/alpro1000/OPTIMARKET/actions
```

---

## Шаг 5: GitHub Actions CI/CD (Автоматический)

### 5.1 Что происходит автоматически

```
1. ✅ GitHub Actions обнаруживает пуш
2. ✅ Загружает все secrets (GITHUB_MODELS_TOKEN и т.д.)
3. ✅ Запускает npm install
4. ✅ Запускает тесты: npm run test:integration
5. ✅ Запускает demo: npm run demo:full
6. ✅ Если все зелено ✅ → готово к merge
7. ✅ Если красно ❌ → нужно исправить
```

### 5.2 Смотреть логи

```
https://github.com/alpro1000/OPTIMARKET/actions

Найти свой коммит → Нажать на него → Смотреть логи
Должны быть зеленые галочки ✅
```

### 5.3 Если CI/CD упал ❌

```
Смотреть в логах что не так:
- "GITHUB_MODELS_TOKEN undefined" → токен не передается
- "npm ERR!" → ошибка в коде
- "Test failed" → тесты не проходят

Исправить локально и пушить еще раз!
```

---

## Шаг 6: Создать Pull Request (2 мин)

### 6.1 Перейти на GitHub

```
https://github.com/alpro1000/OPTIMARKET/pulls
```

### 6.2 Нажать "New pull request"

```
Base: main
Compare: feat/ai-updates

Title: "feat: GitHub Models integration + CI/CD deployment"

Description:
"
## Changes
- Added GitHub Models token support
- Created CI/CD workflow with GitHub Actions
- Integrated secrets management
- Added deployment to Vercel

## Testing
- All tests passed ✅
- Demo working ✅
- Local deployment verified ✅

## Ready for production 🚀
"
```

### 6.3 Нажать "Create pull request"

```
GitHub Actions автоматически запустит тесты!
Будут зеленые галочки = готово к merge ✅
```

---

## Шаг 7: Merging в Main (1 мин)

### 7.1 После ревью - Merge PR

```
Нажать: "Merge pull request"
Выбрать: "Squash and merge" (чистая история)
Нажать: "Confirm squash and merge"
Нажать: "Delete branch"
```

### 7.2 GitHub Actions активируется

```
detectит пуш в main ✅
автоматически запустит:
1. Тесты
2. Сборку
3. Деплой на Vercel (if VERCEL_TOKEN set)
```

---

## Шаг 8: Настройка Vercel Deployment (5 мин)

### 8.1 Получить Vercel токены

```
1. Перейти: https://vercel.com/alpro1000/OPTIMARKET/settings
2. Найти: "Environment Variables"
3. Найти: "Tokens" (внизу)
4. Создать: "New Token"
   - Название: "OPTIMARKET_GITHUB_ACTIONS"
   - Scope: "Full Account"
5. КОПИРОВАТЬ токен
```

### 8.2 Добавить в GitHub Secrets

```
https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions

Добавить:
┌─────────────────────────────────────────┐
│ Name:  VERCEL_TOKEN                     │
│ Value: абс_tokenизВерсела               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Name:  VERCEL_ORG_ID                    │
│ Value: абс_orgIdИзВерселаProjectSettings│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Name:  VERCEL_PROJECT_ID                │
│ Value: абс_projectIdИзВерселаSettings   │
└─────────────────────────────────────────┘
```

### 8.3 Добавить переменные в Vercel

```
https://vercel.com/alpro1000/OPTIMARKET/settings/environment-variables

Добавить для Production:
- GITHUB_MODELS_TOKEN
- PERPLEXITY_API_KEY
- GEMINI_API_KEY
- AWIN_API_KEY
- WEB3FORMS_API_KEY

Нажать "Save"
```

---

## Шаг 9: Проверить Deployment (2 мин)

### 9.1 Дождаться окончания

```
https://github.com/alpro1000/OPTIMARKET/actions

Должны быть зеленые галочки ✅
Deployment Status: ✅ Successful
```

### 9.2 Проверить живое приложение

```
https://optimarket.vercel.app

Должны видны:
- Главная страница ✓
- Категории товаров ✓
- API endpoints работают ✓
- Analytics страница ✓
```

### 9.3 Проверить логи

```
https://vercel.com/alpro1000/OPTIMARKET/deployments

Нажать на последний deployment
Смотреть Build Log и Function Logs
```

---

## 🔄 Ежедневный рабочий поток

### Для каждого коммита:

```bash
# 1. Разработка локально
nano modules/newFeature.js
npm run test:integration

# 2. Коммит и пуш
git add .
git commit -m "feat: описание изменений"
git push origin feat/ветка

# 3. GitHub Actions автоматически:
#    - Тестирует ✅
#    - Собирает 🔨
#    - Если main - деплоит 🚀

# 4. Создать PR на GitHub
# 5. После одобрения - Merge
# 6. GitHub Actions деплоит на Vercel
# 7. Готово! 🎉
```

---

## 🆘 Troubleshooting

### ❌ "Secret not found" в CI/CD

```
✓ Проверить имя точно совпадает (case-sensitive!)
✓ Скопирована вся строка без пробелов?
✓ Добавлен в правильную папку (не user secrets)?
✓ Попробовать пересоздать secret
```

### ❌ "Deployment failed" в Vercel

```
✓ Проверить env vars добавлены в Vercel Dashboard
✓ VERCEL_TOKEN действителен?
✓ Смотреть Build Logs на Vercel
✓ Проверить package.json scripts
```

### ❌ GitHub Actions зависает

```
✓ Проверить нету infinite loops в коде
✓ npm install может зависнуть - добавить timeout
✓ Проверить API запросы (могут быть медленные)
```

---

## ✅ Финальный Чеклист

```
Перед production deployment:

[ ] GitHub Models Token получен
[ ] Все секреты добавлены в GitHub
[ ] .env.local создан (.gitignore добавлен)
[ ] Локальные тесты проходят ✅
[ ] npm run demo:full работает ✅
[ ] GitHub Actions workflow создан
[ ] Vercel токены добавлены
[ ] Env vars добавлены в Vercel
[ ] PR создана и одобрена
[ ] Merged в main
[ ] Deployment в Vercel успешен ✅
[ ] Live URL работает
[ ] APIs отвечают правильно

🎉 Готово к production!
```

---

## 📚 Полезные ссылки

| Задача | Ссылка |
|--------|--------|
| GitHub Secrets | https://github.com/alpro1000/OPTIMARKET/settings/secrets/actions |
| GitHub Actions | https://github.com/alpro1000/OPTIMARKET/actions |
| Vercel Dashboard | https://vercel.com/alpro1000/OPTIMARKET |
| Vercel Env Vars | https://vercel.com/alpro1000/OPTIMARKET/settings/environment-variables |
| GitHub Tokens | https://github.com/settings/tokens |
| GitHub Models Docs | https://github.com/features/models |

---

**Статус:** ✅ Готово к развертыванию  
**Время на setup:** ~30 минут  
**Время на deployment:** ~5 минут (автоматизировано)
