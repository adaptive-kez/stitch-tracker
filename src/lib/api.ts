/**
 * API Client for Cloudflare Worker (D1 + KV)
 * Uses Telegram initData for authentication
 */

import WebApp from '@twa-dev/sdk'

const API_URL = import.meta.env.VITE_API_URL || ''

interface RequestOptions {
    method?: string
    body?: unknown
    userId?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, userId } = options

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    // Production: send Telegram initData for HMAC validation
    const initData = WebApp.initData
    if (initData) {
        headers['X-Telegram-Init-Data'] = initData
    } else if (userId) {
        // Dev fallback: X-User-Id only works in non-production Worker
        headers['X-User-Id'] = userId
    }

    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error((err as { error: string }).error || `API error: ${res.status}`)
    }

    return res.json() as Promise<T>
}


// ========================================
// Tasks API
// ========================================
export const tasksApi = {
    list: (userId: string) =>
        request<DbTask[]>('/api/tasks', { userId }),

    create: (userId: string, tasks: Partial<DbTask>[]) =>
        request<DbTask[]>('/api/tasks', { method: 'POST', body: tasks, userId }),

    update: (userId: string, taskId: string, data: Partial<DbTask>) =>
        request<{ success: boolean }>(`/api/tasks/${taskId}`, { method: 'PUT', body: data, userId }),

    delete: (userId: string, taskId: string) =>
        request<{ success: boolean }>('/api/tasks', { method: 'DELETE', body: { id: taskId }, userId }),

    deleteMany: (userId: string, taskIds: string[]) =>
        request<{ success: boolean }>('/api/tasks', { method: 'DELETE', body: { ids: taskIds }, userId }),
}

// ========================================
// Habits API
// ========================================
export const habitsApi = {
    list: (userId: string) =>
        request<DbHabit[]>('/api/habits', { userId }),

    create: (userId: string, habit: Partial<DbHabit>) =>
        request<DbHabit>('/api/habits', { method: 'POST', body: habit, userId }),

    delete: (userId: string, habitId: string) =>
        request<{ success: boolean }>('/api/habits', { method: 'DELETE', body: { id: habitId }, userId }),
}

// ========================================
// Habit Logs API
// ========================================
export const habitLogsApi = {
    list: (userId: string) =>
        request<DbHabitLog[]>('/api/habit-logs', { userId }),

    create: (userId: string, log: { habit_id: string; completed_at: string }) =>
        request<DbHabitLog>('/api/habit-logs', { method: 'POST', body: log, userId }),

    delete: (userId: string, habitId: string, completedAt: string) =>
        request<{ success: boolean }>('/api/habit-logs', {
            method: 'DELETE',
            body: { habit_id: habitId, completed_at: completedAt },
            userId,
        }),
}

// ========================================
// Journal API
// ========================================
export const journalApi = {
    list: (userId: string) =>
        request<DbJournal[]>('/api/journal', { userId }),

    create: (userId: string, entry: { type: string; content: string; date: string }) =>
        request<DbJournal>('/api/journal', { method: 'POST', body: entry, userId }),

    delete: (userId: string, entryId: string) =>
        request<{ success: boolean }>('/api/journal', { method: 'DELETE', body: { id: entryId }, userId }),
}

// ========================================
// Goals API
// ========================================
export const goalsApi = {
    list: (userId: string) =>
        request<DbGoal[]>('/api/goals', { userId }),

    create: (userId: string, goal: Partial<DbGoal>) =>
        request<DbGoal>('/api/goals', { method: 'POST', body: goal, userId }),

    update: (userId: string, goalId: string, data: Partial<DbGoal>) =>
        request<{ success: boolean }>(`/api/goals/${goalId}`, { method: 'PUT', body: data, userId }),

    delete: (userId: string, goalId: string) =>
        request<{ success: boolean }>('/api/goals', { method: 'DELETE', body: { id: goalId }, userId }),
}

// ========================================
// Profile API (with KV caching on backend)
// ========================================
export const profileApi = {
    get: (userId: string) =>
        request<DbProfile | null>('/api/profile', { userId }),

    upsert: (userId: string, data: Partial<DbProfile>) =>
        request<DbProfile>('/api/profile', { method: 'PUT', body: data, userId }),
}

// ========================================
// Notifications API
// ========================================
export const notificationsApi = {
    create: (userId: string, notification: {
        entity_type: string
        entity_id?: string
        message?: string
        scheduled_at: string
    }) =>
        request<{ id: string }>('/api/notifications', { method: 'POST', body: notification, userId }),
}

// ========================================
// DB Types (D1 SQLite — INTEGER booleans)
// ========================================
export interface DbTask {
    id: string
    user_id: string
    title: string
    is_completed: number // 0 | 1
    date: string
    is_important: number
    has_notification: number
    notification_time: string | null
    timezone: string
    recurrence_rule: string | null // JSON string
    created_at: string
    updated_at: string
}

export interface DbHabit {
    id: string
    user_id: string
    title: string
    icon: string
    color: string
    start_date: string | null
    end_date: string | null
    has_notification: number
    notification_time: string | null
    timezone: string
    recurrence_rule: string | null
    created_at: string
}

export interface DbHabitLog {
    id: string
    habit_id: string
    user_id: string
    completed_at: string
    created_at: string
}

export interface DbJournal {
    id: string
    user_id: string
    type: string
    content: string
    date: string
    created_at: string
}

export interface DbGoal {
    id: string
    user_id: string
    title: string
    description: string | null
    progress: number
    is_completed: number
    year: number
    deadline: string | null
    created_at: string
}

export interface DbProfile {
    id: string
    user_id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    email: string | null
    timezone: string
    subscription_status: string
    subscription_end_date: string | null
    auto_renewal: number
    morning_summary_time: string
    evening_summary_time: string
    summaries_enabled: number
    created_at: string
    updated_at: string
}
