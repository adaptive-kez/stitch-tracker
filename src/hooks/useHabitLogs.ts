import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { HabitLog } from '@/types'

export function useHabitLogs(userId: string | null) {
    const [logs, setLogs] = useState<HabitLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load all logs
    const loadLogs = useCallback(async () => {
        if (!userId) return

        try {
            const { data, error } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', userId)
                .order('completed_at', { ascending: false })

            if (error) throw error
            setLogs(data || [])
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

    // Toggle habit completion for a date
    const toggleHabitLog = async (habitId: string, date?: string) => {
        if (!userId) return

        const logDate = date || new Date().toISOString().split('T')[0]
        const existingLog = logs.find(
            l => l.habit_id === habitId && l.completed_at === logDate
        )

        // Optimistic update for instant UI feedback
        if (existingLog) {
            // Remove from local state immediately
            setLogs(prev => prev.filter(l => l.id !== existingLog.id))
        } else {
            // Add to local state immediately with temp ID
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
                // Remove log from DB
                const { error } = await supabase
                    .from('habit_logs')
                    .delete()
                    .eq('id', existingLog.id)

                if (error) {
                    // Rollback on error
                    setLogs(prev => [existingLog, ...prev])
                    throw error
                }
            } else {
                // Add log to DB
                const { data, error } = await supabase
                    .from('habit_logs')
                    .insert({
                        habit_id: habitId,
                        user_id: userId,
                        completed_at: logDate,
                    })
                    .select()
                    .single()

                if (error) {
                    // Rollback on error
                    setLogs(prev => prev.filter(l => !l.id.startsWith('temp-')))
                    throw error
                }

                // Replace temp with real data
                setLogs(prev => prev.map(l =>
                    l.id.startsWith('temp-') && l.habit_id === habitId && l.completed_at === logDate
                        ? data
                        : l
                ))
            }
        } catch (error) {
            // Silently fail - optimistic update already reverted
        }
    }

    // Check if habit is completed for a date
    const isHabitCompleted = (habitId: string, date?: string) => {
        const checkDate = date || new Date().toISOString().split('T')[0]
        return logs.some(l => l.habit_id === habitId && l.completed_at === checkDate)
    }

    // Get logs for a specific date
    const getLogsByDate = (date: string) => {
        return logs.filter(l => l.completed_at === date)
    }

    // Count completed habits for a date
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
