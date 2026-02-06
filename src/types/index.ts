// Types for Stitch Tracker v4

export type TabType = 'tasks' | 'habits' | 'goals' | 'analytics'

export type JournalType = 'thought' | 'gratitude' | 'lesson'

export type StitchMood = 'happy' | 'waiting' | 'sleeping' | 'excited' | 'thinking'

// ========================================
// Recurrence Rules
// ========================================
export type RecurrenceType =
    | 'once'
    | 'daily'
    | 'weekdays'
    | 'weekends'
    | 'every_n'
    | 'specific_days'

export interface RecurrenceRule {
    type: RecurrenceType
    interval?: number        // For 'every_n' type (e.g., every 3 days)
    days?: number[]          // For 'specific_days' (0=Sun, 1=Mon, ..., 6=Sat)
}

// ========================================
// Telegram User (from WebApp SDK)
// ========================================
export interface TelegramUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    photo_url?: string
}

// ========================================
// User Profile & Subscription
// ========================================
export type SubscriptionStatus = 'active' | 'trial' | 'inactive'

export interface User {
    id: string
    user_id: string // Telegram ID
    username?: string
    first_name?: string
    last_name?: string
    avatar_url?: string
    photo_url?: string  // Same as avatar_url, matches DB column
    email?: string
    timezone: string
    // Subscription
    subscription_status: SubscriptionStatus
    subscription_end_date?: string
    auto_renewal: boolean
    // Personal Summaries
    morning_summary_time: string // HH:MM format
    evening_summary_time: string // HH:MM format
    summaries_enabled: boolean
    created_at: string
    updated_at?: string
}

// ========================================
// Tasks
// ========================================
export interface Task {
    id: string
    user_id: string
    title: string
    is_completed: boolean
    date: string // YYYY-MM-DD
    is_important: boolean
    has_notification: boolean
    notification_time?: string // HH:MM format
    timezone?: string
    recurrence_rule?: RecurrenceRule
    created_at: string
    updated_at?: string
}

// ========================================
// Habits
// ========================================
export interface Habit {
    id: string
    user_id: string
    title: string
    icon: string
    color: string
    start_date?: string
    end_date?: string
    has_notification: boolean
    notification_time?: string // HH:MM format
    timezone?: string
    recurrence_rule?: RecurrenceRule
    created_at: string
}

export interface HabitLog {
    id: string
    habit_id: string
    user_id: string
    completed_at: string // YYYY-MM-DD
}

// Legacy type for backwards compatibility
export type HabitCompletion = HabitLog

// ========================================
// Journal
// ========================================
export interface JournalEntry {
    id: string
    user_id: string
    type: JournalType
    content: string
    date: string // YYYY-MM-DD
    created_at: string
}

// ========================================
// Goals
// ========================================
export interface Goal {
    id: string
    user_id: string
    title: string
    description?: string
    progress: number // 0-100
    is_completed: boolean
    year: number
    deadline?: string // YYYY-MM-DD
    created_at: string
}

// ========================================
// Scheduled Notifications (for backend)
// ========================================
export type NotificationEntityType = 'task' | 'habit' | 'morning_summary' | 'evening_summary'

export interface ScheduledNotification {
    id: string
    user_id: string
    entity_type: NotificationEntityType
    entity_id?: string
    message?: string
    scheduled_at: string // ISO timestamp
    sent_at?: string
    created_at: string
}

// ========================================
// Stats for Profile
// ========================================
export interface UserStats {
    totalTasksCompleted: number
    totalHabitLogs: number
    daysActive: number
    currentStreak: number
}

// ========================================
// Day Archive (Calendar)
// ========================================
export interface DayArchive {
    date: string
    tasks: Task[]
    journal: JournalEntry[]
    habitLogs: HabitLog[]
}

// Period types for analytics
export type PeriodType = 'week' | 'month' | 'year'

// ========================================
// Common Timezones (curated list for UI)
// ========================================
export const COMMON_TIMEZONES = [
    { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
    { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
    { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
    { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
    { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
    { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)' },
    { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
    { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
    { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
    { value: 'Asia/Magadan', label: 'Магадан (UTC+11)' },
    { value: 'Asia/Kamchatka', label: 'Камчатка (UTC+12)' },
    { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
    { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
    { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
    { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
    { value: 'UTC', label: 'UTC' },
] as const

