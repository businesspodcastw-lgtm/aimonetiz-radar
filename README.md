# aimonetiz / radar — упрощённая версия (без сборки)

Эта версия работает без Node.js, без npm, без vite. Просто статичный HTML + одна serverless-функция.

## Структура файлов

```
aimonetiz-radar/
├── index.html           ← главная страница (React + Tailwind через CDN)
├── api/
│   └── search.js        ← бэкенд, ходит в YouTube API
├── package.json         ← минимальный конфиг (нужен для ES modules)
└── README.md            ← этот файл
```

## Что нужно сделать

### 1. Загрузи эти файлы на GitHub

Зайди в свой репозиторий `aimonetiz-radar` на GitHub.

**Если в репозитории уже есть файлы от прошлой попытки:**
- Открой каждый файл → нажми иконку корзины 🗑️ → Commit
- Удали все старые файлы

**Затем загрузи новые:**
- Add file → Upload files
- Перетащи: `index.html`, `package.json`, и **папку** `api/` целиком
- Commit changes

### 2. Vercel автоматически передеплоит

Зайди в Vercel → твой проект → вкладка **Deployments**.
Должен запуститься новый деплой (статус "Building" → "Ready").

### 3. Если ключ YouTube ещё не задан

Settings → Environment Variables → добавь:
- Key: `YOUTUBE_API_KEY`
- Value: твой ключ из Google Cloud Console
- Save
- Deployments → последний → ⋯ → Redeploy

### 4. Открывай сайт

В Vercel сверху увидишь URL — открывай, тестируй.

## Почему так проще

Раньше я тебе дал версию с Vite (нужна сборка через Node.js).
Эта версия — **один HTML-файл**, React и Tailwind подгружаются через интернет (CDN).
Vercel ничего не собирает, просто хостит файлы как есть.

→ Меньше шагов
→ Меньше ошибок
→ Тот же дизайн и функционал
