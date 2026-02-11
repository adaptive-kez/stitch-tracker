import { useState, useEffect, useCallback } from 'react'
import { habitLogsApi, type DbHabitLog } from '@/lib/api'
import type { HabitLog } from '@/types'

function toHabitLog(row: DbHabitLog): HabitLog {
    return {
        id: row.id,
        habit_id: row.habit_id,
        user_id: row.user_id,
        completed_at: row.completed_at,
    }
}

export function useHabitLogs(userId: string | null) {
    const [logs, setLogs] = useState<HabitLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadLogs = useCallback(async () => {
        if (!userId) return

        try {
            const data = await habitLogsApi.list(userId)
            setLogs(data.map(toHabitLog))
        } catch (error) {
            console.error('Error loading habit logs:', error)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        if (userId) {
            loadLogs()
        }
    }, [userId, loadLogs])

    const toggleHabitLog = async (habitId: string, date?: string) => {
        if (!userId) return

        const logDate = date || new Date().toISOString().split('T')[0]
        const existingLog = logs.find(
            l => l.habit_id === habitId && l.completed_at === logDate
        )

        // Optimistic update
        if (existingLog) {
            setLogs(prev => prev.filter(l => l.id !== existingLog.id))
        } else {
            const tempLog: HabitLog = {
                id: `temp-${Date.now()}`,
                habit_id: habitId,
                user_id: userId,
                completed_at: logDate,
            }
            setLogs(prev => [tempLog, ...prev])
        }

        try {
            if (existingLog) {
                await habitLogsApi.delete(userId, habitId, logDate)
            } else {
                const data = await habitLogsApi.create(userId, {
                    habit_id: habitId,
                    completed_at: logDate,
                })

                setLogs(prev => prev.map(l =>
                    l.id.startsWith('temp-') && l.habit_id === habitId && l.completed_at === logDate
                        ? toHabitLog(data)
                        : l
                ))
            }
        } catch (error) {
            console.error('Habit log error:', error)
            if (existingLog) {
                setLogs(prev => [existingLog, ...prev])
            } else {
                setLogs(prev => prev.filter(l => !l.id.startsWith('temp-')))
            }
        }
    }

    const isHabitCompleted = (habitId: string, date?: string) => {
        const checkDate = date || new Date().toISOString().split('T')[0]
        return logs.some(l => l.habit_id === habitId && l.completed_at === checkDate)
    }

    const getLogsByDate = (date: string) => {
        return logs.filter(l => l.completed_at === date)
    }

    const getCompletedCount = (date?: string) => {
        const checkDate = date || new Date().toISOString().split('T')[0]
        return logs.filter(l => l.completed_at === checkDate).length
    }

    return {
        logs,
        isLoading,
        toggleHabitLog,
        isHabitCompleted,
        getLogsByDate,
        getCompletedCount,
        loadLogs,
    }
}
