-- Stitch Tracker D1 Schema (SQLite)
-- Adapted from Supabase PostgreSQL schema v3 + v4
-- ========================================
-- USERS TABLE (Profile)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'UTC',
    subscription_status TEXT DEFAULT 'inactive',
    subscription_end_date TEXT,
    auto_renewal INTEGER DEFAULT 0,
    morning_summary_time TEXT DEFAULT '09:00',
    evening_summary_time TEXT DEFAULT '21:00',
    summaries_enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
-- ========================================
-- TASKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    date TEXT NOT NULL DEFAULT (date('now')),
    is_important INTEGER DEFAULT 0,
    has_notification INTEGER DEFAULT 0,
    notification_time TEXT,
    timezone TEXT DEFAULT 'UTC',
    recurrence_rule TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
-- ========================================
-- HABITS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    icon TEXT DEFAULT '⭐',
    color TEXT DEFAULT '#6366f1',
    start_date TEXT,
    end_date TEXT,
    has_notification INTEGER DEFAULT 0,
    notification_time TEXT,
    timezone TEXT DEFAULT 'UTC',
    recurrence_rule TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
-- ========================================
-- HABIT_LOGS TABLE (Daily tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(habit_id, completed_at)
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, completed_at);
-- ========================================
-- JOURNAL TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS journal (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN ('thought', 'gratitude', 'lesson', 'notes')
    ),
    content TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal(user_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_user_type ON journal(user_id, type);
-- ========================================
-- GOALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0 CHECK (
        progress >= 0
        AND progress <= 100
    ),
    is_completed INTEGER DEFAULT 0,
    year INTEGER DEFAULT (CAST(strftime('%Y', 'now') AS INTEGER)),
    deadline TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_goals_user_year ON goals(user_id, year);
-- ========================================
-- SCHEDULED NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    message TEXT,
    scheduled_at TEXT NOT NULL,
    sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON scheduled_notifications(scheduled_at)
WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON scheduled_notifications(user_id);