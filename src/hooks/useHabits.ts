import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Habit } from '@/types'

export function useHabits(userId: string | null) {
    const [habits, setHabits] = useState<Habit[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load habits
    const loadHabits = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setHabits(data || [])
        } catch (error) {
            console.error('Error loading habits:', error)
            // Fallback to localStorage
            const stored = localStorage.getItem(`habits_${userId}`)
            if (stored) setHabits(JSON.parse(stored))
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        loadHabits()
    }, [loadHabits])

    // Save to localStorage as backup
    useEffect(() => {
        if (userId && habits.length > 0) {
            localStorage.setItem(`habits_${userId}`, JSON.stringify(habits))
        }
    }, [habits, userId])

    // Add habit
    const addHabit = async (title: string, icon?: string, color?: string) => {
        if (!userId) return

        try {
            const { data, error } = await supabase
                .from('habits')
                .insert({
                    user_id: userId,
                    title,
                    icon: icon || '⭐',
                    color: color || '#6366f1',
                })
                .select()
                .single()

            if (error) throw error
            setHabits(prev => [data, ...prev])
        } catch (error) {
            console.error('Error adding habit:', error)
            // Fallback: add locally
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

    // Delete habit
    const deleteHabit = async (habitId: string) => {
        try {
            const { error } = await supabase
                .from('habits')
                .delete()
                .eq('id', habitId)

            if (error) throw error
            setHabits(prev => prev.filter(h => h.id !== habitId))
        } catch (error) {
            console.error('Error deleting habit:', error)
            // Fallback: delete locally
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
