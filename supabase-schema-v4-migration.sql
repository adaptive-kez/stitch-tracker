-- Stitch Tracker v4.0 Database Schema Migration
-- Run this in Supabase SQL Editor AFTER v3 schema
-- Adds: recurrence rules, notifications, profile & subscription fields
-- ========================================
-- TASKS: Add recurrence & notification support
-- ========================================
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
-- recurrence_rule structure: 
-- { "type": "once" | "daily" | "weekdays" | "weekends" | "every_n" | "specific_days", 
--   "interval": number (for every_n), 
--   "days": int[] (for specific_days, 0=Sun...6=Sat) }
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS notification_time TIME;
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS has_notification BOOLEAN DEFAULT FALSE;
-- ========================================
-- HABITS: Add recurrence & notification support
-- ========================================
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS notification_time TIME;
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS has_notification BOOLEAN DEFAULT FALSE;
-- ========================================
-- USERS: Add profile & subscription fields
-- ========================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
-- subscription_status values: 'active', 'trial', 'inactive'
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_end_date DATE;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT FALSE;
-- Personal Summaries settings
ALTER TABLE users
ADD COLUMN IF NOT EXISTS morning_summary_time TIME DEFAULT '09:00';
ALTER TABLE users
ADD COLUMN IF NOT EXISTS evening_summary_time TIME DEFAULT '21:00';
ALTER TABLE users
ADD COLUMN IF NOT EXISTS summaries_enabled BOOLEAN DEFAULT FALSE;
-- ========================================
-- SCHEDULED NOTIFICATIONS TABLE
-- For backend processing of notification queue
-- ========================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    -- 'task', 'habit', 'morning_summary', 'evening_summary'
    entity_id UUID,
    -- nullable for summaries
    message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    -- null until sent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON scheduled_notifications(scheduled_at)
WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON scheduled_notifications(user_id);
-- Enable RLS
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all" ON scheduled_notifications;
CREATE POLICY "notifications_all" ON scheduled_notifications FOR ALL USING (true) WITH CHECK (true);
-- ========================================
-- GOALS: Add deadline field if missing
-- ========================================
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS deadline DATE;