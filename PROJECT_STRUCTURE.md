# Stitch Tracker - Структура проекта

## Обзор

Stitch Tracker — Telegram WebApp для трекинга задач, привычек и целей с персонажем Стичем.

**Репозитории:**

- **Frontend:** `stitch-tracker/` — React + Vite + TypeScript
- **Backend Worker:** `stitch-tracker-worker/` — Go + Cloudflare Workers

---

## 🎨 Frontend (stitch-tracker/)

### Tech Stack

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 19.2 | UI Framework |
| Vite | 7.2 | Build Tool |
| TypeScript | 5.9 | Type Safety |
| Tailwind CSS | 4.1 | Styling |
| Framer Motion | 12.29 | Animations |
| Supabase JS | 2.93 | Database Client |
| @twa-dev/sdk | 8.0 | Telegram WebApp SDK |

### Структура src/

```
src/
├── App.tsx                 # Главный компонент, роутинг
├── main.tsx                # Entry point
├── index.css               # Tailwind + CSS variables
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx      # Шапка с аватаром и датой
│   │   └── TabBar.tsx      # Нижняя навигация
│   ├── ui/
│   │   ├── button.tsx      # shadcn/ui Button
│   │   ├── card.tsx        # shadcn/ui Card
│   │   ├── switch.tsx      # shadcn/ui Switch
│   │   ├── CalendarModal.tsx
│   │   └── FrequencySelector.tsx
│   ├── ErrorBoundary.tsx
│   ├── Skeleton.tsx        # Loading states
│   └── StitchMascot.tsx    # Анимированный Стич
│
├── screens/
│   ├── TasksScreen.tsx        # Задачи + Журнал
│   ├── HabitsScreen.tsx       # Привычки
│   ├── GoalsScreen.tsx        # Цели на год
│   ├── AnalyticsScreen.tsx    # Статистика
│   ├── SettingsScreen.tsx     # Настройки
│   ├── ProfileScreen.tsx      # Профиль
│   ├── SubscriptionScreen.tsx # Подписка
│   └── NotificationSettingsScreen.tsx
│
├── hooks/
│   ├── useTasks.ts         # CRUD задач
│   ├── useHabits.ts        # CRUD привычек
│   ├── useHabitLogs.ts     # Логи выполнения привычек
│   ├── useGoals.ts         # CRUD целей
│   ├── useJournal.ts       # Дневник
│   ├── useUser.ts          # Авторизация через Telegram
│   ├── useProfile.ts       # Статистика профиля
│   ├── useTelegram.ts      # Telegram WebApp data
│   └── useDayArchive.ts    # Архив дней
│
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── telegram.ts         # Telegram helpers
│   ├── notifications.ts    # Push-уведомления
│   └── utils.ts            # cn() helper
│
└── types/
    └── index.ts            # TypeScript типы
```

### Ключевые файлы

| Файл | Описание |
|------|----------|
| `supabase-schema-v3.sql` | Схема БД (users, tasks, habits, goals, journal) |
| `supabase-schema-v4-migration.sql` | Миграция для habit_logs |
| `.env` | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |

---

## ⚙️ Backend Worker (stitch-tracker-worker/)

### Tech Stack

| Технология | Назначение |
|------------|------------|
| Go 1.21+ | Основной язык |
| Cloudflare Workers | Hosting |
| Supabase | Database |
| Telegram Bot API | Уведомления |

### Структура

```
stitch-tracker-worker/
├── cmd/
│   └── worker/
│       └── main.go         # Entry point
│
├── internal/
│   ├── scheduler/          # Cron для уведомлений
│   ├── summaries/
│   │   └── generator.go    # AI-генерация саммари
│   ├── supabase/
│   │   └── client.go       # Supabase client
│   └── telegram/
│       └── bot.go          # Telegram Bot API
│
├── src/                    # TypeScript wrapper
├── worker                  # Compiled Go binary
├── wrangler.toml           # Cloudflare config
└── go.mod / go.sum
```

---

## 🗄️ Database (Supabase)

### Таблицы

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи (telegram_id, first_name, language) |
| `tasks` | Задачи (title, date, is_completed, is_important) |
| `habits` | Привычки (title, recurrence_rule, has_notification) |
| `habit_logs` | Логи выполнения привычек (habit_id, completed_at) |
| `goals` | Цели на год (title, year, deadline, is_completed) |
| `journal_entries` | Записи дневника (type, content, date) |

---

## 🚀 Deployment

| Сервис | URL |
|--------|-----|
| Frontend (Cloudflare Pages) | <https://stitch-tracker.pages.dev> |
| Backend (Cloudflare Workers) | stitch-worker.* |
| Database | Supabase |
| GitHub | <https://github.com/adaptive-kez/stitch-tracker> |

### Команды

```bash
# Frontend
npm run dev          # Локальный сервер
npm run build        # Production build
npx wrangler pages deploy dist  # Deploy to Cloudflare

# Backend
go build -o worker cmd/worker/main.go
npx wrangler deploy
```

---

## 📱 Telegram Integration

- **WebApp SDK:** @twa-dev/sdk для темы, хаптика, данных пользователя
- **Bot API:** Уведомления через sendMessage
- **InitData:** Авторизация через Telegram.WebApp.initDataUnsafe

---

## 🎯 Фичи

- ✅ Задачи с датами, важностью, уведомлениями
- ✅ Привычки с трекингом по дням недели
- ✅ Цели на год с дедлайнами
- ✅ Дневник (Заметки, Уроки, Благодарности, Мысли)
- ✅ Аналитика (статистика по периодам)
- ✅ Анимированный маскот Стич
- ✅ Dark/Light theme от Telegram
