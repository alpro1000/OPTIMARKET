# Настройка Web3Forms для feedback формы

## Что это?
Web3Forms — бесплатный сервис для обработки HTML форм без backend. Отправляет ответы на ваш email.

## Шаги настройки:

### 1. Зарегистрируйтесь на Web3Forms
- Перейдите на https://web3forms.com/
- Нажмите "Get Started for Free"
- Введите ваш email (куда будут приходить ответы)
- Подтвердите email

### 2. Получите Access Key
- После регистрации вы получите **Access Key** (например: `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`)
- Скопируйте его

### 3. Добавьте ключ в index.html
Найдите эту строку в `index.html` (около строки 632):
```html
<input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">
```

Замените `YOUR_WEB3FORMS_ACCESS_KEY` на ваш настоящий ключ:
```html
<input type="hidden" name="access_key" value="a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6">
```

### 4. Закоммитьте и запушьте изменения
```bash
git add index.html
git commit -m "Add Web3Forms access key for feedback"
git push -u origin claude/analyze-service-concept-nvFzq
```

### 5. После мерджа в main
- Vercel задеплоит обновленную версию
- Пользователи смогут отправлять feedback
- Ответы будут приходить на ваш email

## Формат писем
Вы будете получать email с такой информацией:
```
Subject: OPTIMARKET Feedback
From: OPTIMARKET User

clarity: 5
trust: 4
concerns: Не хватает категории "пылесосы"
would_use: yes
categories: пылесосы, кофемашины, мониторы
email: user@example.com
```

## Альтернатива: FormSpree
Если Web3Forms не подходит, можно использовать FormSpree:
1. Зарегистрируйтесь на https://formspree.io/
2. Создайте форму и получите endpoint URL
3. Замените `action="https://api.web3forms.com/submit"` на ваш FormSpree endpoint

## Лимиты (бесплатный план)
- Web3Forms: **250 submissions/month** (достаточно для MVP)
- FormSpree: **50 submissions/month**

## Что дальше?
После сбора **20+ ответов**:
1. Экспортируйте данные в CSV/Excel
2. Проанализируйте паттерны (см. CLAUDE.md Week 4)
3. Приоритизируйте улучшения на основе feedback
