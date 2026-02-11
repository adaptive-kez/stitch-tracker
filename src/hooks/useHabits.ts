import { useState, useEffect, useCallback } from 'react'
import { habitsApi, type DbHabit } from '@/lib/api'
import type { Habit } from '@/types'

function toHabit(row: DbHabit): Habit {
    return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        icon: row.icon,
        color: row.color,
        start_date: row.start_date || undefined,
        end_date: row.end_date || undefined,
        has_notification: !!row.has_notification,
        notification_time: row.notification_time || undefined,
        timezone: row.timezone || undefined,
        recurrence_rule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : undefined,
        created_at: row.created_at,
    }
}

export function useHabits(userId: string | null) {
    const [habits, setHabits] = useState<Habit[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadHabits = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        try {
            const data = await habitsApi.list(userId)
            setHabits(data.map(toHabit))
        } catch (error) {
            console.error('Error loading habits:', error)
            const stored = localStorage.getItem(`habits_${userId}`)
            if (stored) setHabits(JSON.parse(stored))
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        loadHabits()
    }, [loadHabits])

    useEffect(() => {
        if (userId && habits.length > 0) {
            localStorage.setItem(`habits_${userId}`, JSON.stringify(habits))
        }
    }, [habits, userId])

    const addHabit = async (title: string, icon?: string, color?: string) => {
        if (!userId) return

        try {
            const data = await habitsApi.create(userId, {
                title,
                icon: icon || '⭐',
                color: color || '#6366f1',
            })
            setHabits(prev => [toHabit(data), ...prev])
        } catch (error) {
            console.error('Error adding habit:', error)
            const newHabit: Habit = {
                id: crypto.randomUUID(),
                user_id: userId,
                title,
                icon: icon || '⭐',
                color: color || '#6366f1',
                has_notification: false,
                created_at: new Date().toISOString(),
            }
            setHabits(prev => [newHabit, ...prev])
        }
    }

    const deleteHabit = async (habitId: string) => {
        try {
            await habitsApi.delete(userId!, habitId)
            setHabits(prev => prev.filter(h => h.id !== habitId))
        } catch (error) {
            console.error('Error deleting habit:', error)
            setHabits(prev => prev.filter(h => h.id !== habitId))
        }
    }

    return {
        habits,
        isLoading,
        addHabit,
        deleteHabit,
        loadHabits,
    }
}
