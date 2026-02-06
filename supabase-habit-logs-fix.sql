-- Stitch Tracker: Create habit_logs table
-- Run this in Supabase SQL Editor if habit_logs doesn't exist
-- Create habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completed_at)
);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, completed_at);
-- Enable RLS
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
-- Create permissive policy
DROP POLICY IF EXISTS "habit_logs_all" ON habit_logs;
CREATE POLICY "habit_logs_all" ON habit_logs FOR ALL USING (true) WITH CHECK (true);