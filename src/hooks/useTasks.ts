import { useState, useEffect, useCallback } from 'react'
import { tasksApi, type DbTask } from '@/lib/api'
import type { Task } from '@/types'

// Convert D1 row (INTEGER booleans, JSON strings) to Task type
function toTask(row: DbTask): Task {
    return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        is_completed: !!row.is_completed,
        date: row.date,
        is_important: !!row.is_important,
        has_notification: !!row.has_notification,
        notification_time: row.notification_time || undefined,
        timezone: row.timezone || undefined,
        recurrence_rule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : undefined,
        created_at: row.created_at,
        updated_at: row.updated_at || undefined,
    }
}

export function useTasks(userId: string | null) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadTasks = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        try {
            const data = await tasksApi.list(userId)
            setTasks(data.map(toTask))
        } catch (error) {
            console.error('Error loading tasks:', error)
            const stored = localStorage.getItem(`tasks_${userId}`)
            if (stored) setTasks(JSON.parse(stored))
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        loadTasks()
    }, [loadTasks])

    useEffect(() => {
        if (userId && tasks.length > 0) {
            localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks))
        }
    }, [tasks, userId])

    const generateRecurringDates = (startDate: string, rule: { type: string; interval?: number; days?: number[] }, daysAhead: number = 30): string[] => {
        const dates: string[] = []
        const start = new Date(startDate + 'T12:00:00')
        const end = new Date(start)
        end.setDate(end.getDate() + daysAhead)

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay()
            const dateStr = d.toISOString().split('T')[0]

            switch (rule.type) {
                case 'daily':
                    dates.push(dateStr)
                    break
                case 'weekdays':
                    if (dayOfWeek >= 1 && dayOfWeek <= 5) dates.push(dateStr)
                    break
                case 'weekends':
                    if (dayOfWeek === 0 || dayOfWeek === 6) dates.push(dateStr)
                    break
                case 'every_n': {
                    const daysDiff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                    if (daysDiff % (rule.interval || 1) === 0) dates.push(dateStr)
                    break
                }
                case 'specific_days':
                    if (rule.days?.includes(dayOfWeek)) dates.push(dateStr)
                    break
            }
        }
        return dates
    }

    const addTask = async (taskData: {
        title: string
        date?: string
        isImportant?: boolean
        hasNotification?: boolean
        notificationTime?: string
        recurrenceRule?: { type: string; interval?: number; days?: number[] }
    }) => {
        if (!userId) return

        const { title, date, isImportant, hasNotification, notificationTime, recurrenceRule } = taskData
        const taskDate = date || new Date().toISOString().split('T')[0]

        let datesToCreate: string[] = [taskDate]
        if (recurrenceRule && recurrenceRule.type !== 'once') {
            datesToCreate = generateRecurringDates(taskDate, recurrenceRule, 30)
        }

        try {
            const tasksToInsert: Partial<DbTask>[] = datesToCreate.map(d => ({
                title,
                date: d,
                is_completed: 0,
                is_important: isImportant ? 1 : 0,
                has_notification: hasNotification ? 1 : 0,
                notification_time: notificationTime || null,
                recurrence_rule: recurrenceRule ? JSON.stringify(recurrenceRule) : null,
            }))

            const data = await tasksApi.create(userId, tasksToInsert)
            setTasks(prev => [...data.map(toTask), ...prev])
        } catch (error) {
            console.error('Error adding task:', error)
            const newTasks: Task[] = datesToCreate.map(d => ({
                id: crypto.randomUUID(),
                user_id: userId,
                title,
                date: d,
                is_completed: false,
                is_important: isImportant || false,
                has_notification: hasNotification || false,
                notification_time: notificationTime,
                recurrence_rule: recurrenceRule as Task['recurrence_rule'],
                created_at: new Date().toISOString(),
            }))
            setTasks(prev => [...newTasks, ...prev])
        }
    }

    const toggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        setTasks(prev =>
            prev.map(t =>
                t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
            )
        )

        try {
            await tasksApi.update(userId!, taskId, { is_completed: task.is_completed ? 0 : 1 })
        } catch (error) {
            console.error('Error toggling task:', error)
        }
    }

    const deleteTask = async (taskId: string) => {
        try {
            await tasksApi.delete(userId!, taskId)
            setTasks(prev => prev.filter(t => t.id !== taskId))
        } catch (error) {
            console.error('Error deleting task:', error)
            setTasks(prev => prev.filter(t => t.id !== taskId))
        }
    }

    const deleteRecurringTasks = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task || !task.recurrence_rule) {
            return deleteTask(taskId)
        }

        const groupIds = tasks
            .filter(t =>
                t.title === task.title &&
                t.user_id === task.user_id &&
                JSON.stringify(t.recurrence_rule) === JSON.stringify(task.recurrence_rule)
            )
            .map(t => t.id)

        try {
            await tasksApi.deleteMany(userId!, groupIds)
            setTasks(prev => prev.filter(t => !groupIds.includes(t.id)))
        } catch (error) {
            console.error('Error deleting recurring tasks:', error)
            setTasks(prev => prev.filter(t => !groupIds.includes(t.id)))
        }
    }

    return {
        tasks,
        isLoading,
        addTask,
        toggleTask,
        deleteTask,
        deleteRecurringTasks,
        loadTasks,
    }
}
