import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserStats } from '@/types'

export function useProfile(userId: string | null) {
    const [stats, setStats] = useState<UserStats>({
        totalTasksCompleted: 0,
        totalHabitLogs: 0,
        daysActive: 0,
        currentStreak: 0,
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        const loadStats = async () => {
            try {
                // Get completed tasks count
                const { count: tasksCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('is_completed', true)

                // Get habit logs count
                const { count: logsCount } = await supabase
                    .from('habit_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)

                // Get unique active days (from tasks and habit_logs)
                const { data: taskDates } = await supabase
                    .from('tasks')
                    .select('date')
                    .eq('user_id', userId)

                const { data: logDates } = await supabase
                    .from('habit_logs')
                    .select('completed_at')
                    .eq('user_id', userId)

                const allDates = new Set([
                    ...(taskDates?.map(t => t.date) || []),
                    ...(logDates?.map(l => l.completed_at) || []),
                ])

                // Calculate current streak
                const today = new Date()
                let streak = 0
                let checkDate = new Date(today)

                while (true) {
                    const dateStr = checkDate.toISOString().split('T')[0]
                    if (allDates.has(dateStr)) {
                        streak++
                        checkDate.setDate(checkDate.getDate() - 1)
                    } else {
                        break
                    }
                }

                setStats({
                    totalTasksCompleted: tasksCount || 0,
                    totalHabitLogs: logsCount || 0,
                    daysActive: allDates.size,
                    currentStreak: streak,
                })
            } catch (error) {
                console.error('Error loading profile stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadStats()
    }, [userId])

    return { stats, isLoading }
}
