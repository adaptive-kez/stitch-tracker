import { useState, useEffect } from 'react'
import { tasksApi, habitLogsApi } from '@/lib/api'
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
                // Get all tasks and habit logs, compute stats client-side
                const [tasks, habitLogs] = await Promise.all([
                    tasksApi.list(userId),
                    habitLogsApi.list(userId),
                ])

                const completedTasks = tasks.filter(t => !!(t.is_completed)).length

                const allDates = new Set([
                    ...tasks.map(t => t.date),
                    ...habitLogs.map(l => l.completed_at),
                ])

                // Calculate current streak
                const today = new Date()
                let streak = 0
                const checkDate = new Date(today)

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
                    totalTasksCompleted: completedTasks,
                    totalHabitLogs: habitLogs.length,
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
