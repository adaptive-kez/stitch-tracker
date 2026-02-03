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

    // Add task
    const addTask = async (title: string, date?: string) => {
        if (!userId) return

        const taskDate = date || new Date().toISOString().split('T')[0]

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    user_id: userId,
                    title,
                    date: taskDate,
                    is_completed: false,
                })
                .select()
                .single()

            if (error) throw error
            setTasks(prev => [data, ...prev])
        } catch (error) {
            console.error('Error adding task:', error)
            // Fallback: add locally
            const newTask: Task = {
                id: crypto.randomUUID(),
                user_id: userId,
                title,
                date: taskDate,
                is_completed: false,
                is_important: false,
                has_notification: false,
                created_at: new Date().toISOString(),
            }
            setTasks(prev => [newTask, ...prev])
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
