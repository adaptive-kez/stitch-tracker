import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task, JournalEntry, HabitLog } from '@/types'

export interface DayArchive {
    date: string
    tasks: Task[]
    journal: JournalEntry[]
    habitLogs: HabitLog[]
}

export function useDayArchive(userId: string | null) {
    const [archive, setArchive] = useState<DayArchive | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const loadArchive = useCallback(async (date: string) => {
        if (!userId) return

        setIsLoading(true)
        try {
            // Load tasks for the date
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .eq('date', date)
                .order('created_at', { ascending: true })

            // Load journal entries for the date
            const { data: journal } = await supabase
                .from('journal')
                .select('*')
                .eq('user_id', userId)
                .eq('date', date)
                .order('created_at', { ascending: true })

            // Load habit logs for the date
            const { data: habitLogs } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('completed_at', date)

            setArchive({
                date,
                tasks: tasks || [],
                journal: journal || [],
                habitLogs: habitLogs || [],
            })
        } catch (error) {
            console.error('Error loading day archive:', error)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    return {
        archive,
        isLoading,
        loadArchive,
    }
}
