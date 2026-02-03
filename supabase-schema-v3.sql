-- Stitch Tracker v3.0 Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old tables if they exist (careful in production!)
DROP TABLE IF EXISTS completions CASCADE;
DROP TABLE IF EXISTS notes CASCADE;

-- ========================================
-- USERS TABLE (Profile)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Telegram ID as string
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TASKS TABLE
-- ========================================
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_date ON tasks(user_id, date);

-- ========================================
-- HABITS TABLE
-- ========================================
DROP TABLE IF EXISTS habits CASCADE;
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_habits_user ON habits(user_id);

-- ========================================
-- HABIT_LOGS TABLE (Daily tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, completed_at)
);

CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, completed_at);

-- ========================================
-- JOURNAL TABLE (Thoughts, Gratitude, Lessons)
-- ========================================
DO $$ BEGIN
  CREATE TYPE journal_type AS ENUM ('thought', 'gratitude', 'lesson');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type journal_type NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journal_user_date ON journal(user_id, date);
CREATE INDEX idx_journal_user_type ON journal(user_id, type);

-- ========================================
-- GOALS TABLE
-- ========================================
DROP TABLE IF EXISTS goals CASCADE;
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_goals_user_year ON goals(user_id, year);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_all" ON users;
DROP POLICY IF EXISTS "tasks_all" ON tasks;
DROP POLICY IF EXISTS "habits_all" ON habits;
DROP POLICY IF EXISTS "habit_logs_all" ON habit_logs;
DROP POLICY IF EXISTS "journal_all" ON journal;
DROP POLICY IF EXISTS "goals_all" ON goals;

-- Create permissive policies (for Telegram Mini App without auth)
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "habits_all" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "habit_logs_all" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "journal_all" ON journal FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "goals_all" ON goals FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- UPDATE TRIGGERS
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
