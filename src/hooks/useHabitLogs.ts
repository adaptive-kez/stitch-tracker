import { useState, useEffect, useCallback, useRef } from 'react'
import { habitLogsApi, type DbHabitLog } from '@/lib/api'
import type { HabitLog } from '@/types'

const LOCAL_LOGS_KEY = 'stitch_habit_logs'

function toHabitLog(row: DbHabitLog): HabitLog {
    return {
        id: row.id,
        habit_id: row.habit_id,
        user_id: row.user_id,
        completed_at: row.completed_at?.split('T')[0] ?? row.completed_at,
    }
}

// Persist logs to localStorage as fallback
function saveLogsLocally(logs: HabitLog[]) {
    try {
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs))
    } catch { /* quota exceeded, ignore */ }
}

function loadLogsLocally(): HabitLog[] {
    try {
        const stored = localStorage.getItem(LOCAL_LOGS_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

export function useHabitLogs(userId: string | null) {
    // Initialize from localStorage for instant display
    const [logs, setLogs] = useState<HabitLog[]>(() => loadLogsLocally())
    const [isLoading, setIsLoading] = useState(true)
    const logsRef = useRef(logs)

    // Keep ref in sync for use in async closures
    useEffect(() => {
        logsRef.current = logs
    }, [logs])

    // Persist to localStorage whenever logs change
    useEffect(() => {
        saveLogsLocally(logs)
    }, [logs])

    const loadLogs = useCallback(async () => {
        if (!userId) return

        try {
            const data = await habitLogsApi.list(userId)
            const serverLogs = data.map(toHabitLog)
            setLogs(serverLogs)
        } catch (error) {
            console.error('Error loading habit logs:', error)
            // Keep existing logs (from localStorage) on load failure
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

        // Use ref for fresh state to avoid stale closure issues
        const currentLogs = logsRef.current
        const existingLog = currentLogs.find(
            l => l.habit_id === habitId && l.completed_at === logDate
        )

        // Optimistic update — these NEVER get rolled back
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

        // Fire-and-forget API call — don't revert on failure
        try {
            if (existingLog) {
                await habitLogsApi.delete(userId, habitId, logDate)
            } else {
                const data = await habitLogsApi.create(userId, {
                    habit_id: habitId,
                    completed_at: logDate,
                })

                // Replace temp with real server ID
                setLogs(prev => prev.map(l =>
                    l.id.startsWith('temp-') && l.habit_id === habitId && l.completed_at === logDate
                        ? toHabitLog(data)
                        : l
                ))
            }
        } catch (error) {
            // Log but do NOT revert — user intent is preserved
            // localStorage backup ensures persistence across reloads
            console.warn('Habit log sync error (kept locally):', error)
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
