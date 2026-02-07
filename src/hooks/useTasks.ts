import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types'

export function useTasks(userId: string | null) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load tasks
    const loadTasks = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTasks(data || [])
        } catch (error) {
            console.error('Error loading tasks:', error)
            // Fallback to localStorage
            const stored = localStorage.getItem(`tasks_${userId}`)
            if (stored) setTasks(JSON.parse(stored))
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        loadTasks()
    }, [loadTasks])

    // Save to localStorage as backup
    useEffect(() => {
        if (userId && tasks.length > 0) {
            localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks))
        }
    }, [tasks, userId])


    // Helper function to generate dates based on recurrence rule
    const generateRecurringDates = (startDate: string, rule: { type: string; interval?: number; days?: number[] }, daysAhead: number = 30): string[] => {
        const dates: string[] = []
        const start = new Date(startDate + 'T12:00:00')
        const end = new Date(start)
        end.setDate(end.getDate() + daysAhead)

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay() // 0=Sun, 1=Mon, etc.
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
                case 'every_n':
                    const daysDiff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                    if (daysDiff % (rule.interval || 1) === 0) dates.push(dateStr)
                    break
                case 'specific_days':
                    if (rule.days?.includes(dayOfWeek)) dates.push(dateStr)
                    break
            }
        }
        return dates
    }

    // Add task (with recurrence support)
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

        // Generate dates based on recurrence
        let datesToCreate: string[] = [taskDate]
        if (recurrenceRule && recurrenceRule.type !== 'once') {
            datesToCreate = generateRecurringDates(taskDate, recurrenceRule, 30)
        }

        try {
            const tasksToInsert = datesToCreate.map(d => ({
                user_id: userId,
                title,
                date: d,
                is_completed: false,
                is_important: isImportant || false,
                has_notification: hasNotification || false,
                notification_time: notificationTime || null,
                recurrence_rule: recurrenceRule || null,
            }))

            const { data, error } = await supabase
                .from('tasks')
                .insert(tasksToInsert)
                .select()

            if (error) throw error
            setTasks(prev => [...(data || []), ...prev])
        } catch (error) {
            console.error('Error adding task:', error)
            // Fallback: add locally
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

    // Toggle task
    const toggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ is_completed: !task.is_completed })
                .eq('id', taskId)

            if (error) throw error
            setTasks(prev =>
                prev.map(t =>
                    t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
                )
            )
        } catch (error) {
            console.error('Error toggling task:', error)
            // Fallback: update locally
            setTasks(prev =>
                prev.map(t =>
                    t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
                )
            )
        }
    }

    // Delete task
    const deleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)

            if (error) throw error
            setTasks(prev => prev.filter(t => t.id !== taskId))
        } catch (error) {
            console.error('Error deleting task:', error)
            // Fallback: delete locally
            setTasks(prev => prev.filter(t => t.id !== taskId))
        }
    }

    return {
        tasks,
        isLoading,
        addTask,
        toggleTask,
        deleteTask,
        loadTasks,
    }
}
