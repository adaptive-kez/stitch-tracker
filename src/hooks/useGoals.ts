import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Goal } from '@/types'

export function useGoals(userId: string | null) {
    const [goals, setGoals] = useState<Goal[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load goals
    const loadGoals = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setGoals(data || [])
        } catch (error) {
            console.error('Error loading goals:', error)
            // Fallback to localStorage
            const stored = localStorage.getItem(`goals_${userId}`)
            if (stored) setGoals(JSON.parse(stored))
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        loadGoals()
    }, [loadGoals])

    // Save to localStorage as backup
    useEffect(() => {
        if (userId && goals.length > 0) {
            localStorage.setItem(`goals_${userId}`, JSON.stringify(goals))
        }
    }, [goals, userId])

    // Add goal
    const addGoal = async (title: string, description?: string) => {
        if (!userId) return

        const currentYear = new Date().getFullYear()

        try {
            const { data, error } = await supabase
                .from('goals')
                .insert({
                    user_id: userId,
                    title,
                    description,
                    progress: 0,
                    is_completed: false,
                    year: currentYear,
                })
                .select()
                .single()

            if (error) throw error
            setGoals(prev => [data, ...prev])
        } catch (error) {
            console.error('Error adding goal:', error)
            // Fallback: add locally
            const newGoal: Goal = {
                id: crypto.randomUUID(),
                user_id: userId,
                title,
                description,
                progress: 0,
                is_completed: false,
                year: currentYear,
                created_at: new Date().toISOString(),
            }
            setGoals(prev => [newGoal, ...prev])
        }
    }

    // Toggle goal completion
    const toggleGoal = async (goalId: string) => {
        const goal = goals.find(g => g.id === goalId)
        if (!goal) return

        const newCompleted = !goal.is_completed
        const newProgress = newCompleted ? 100 : goal.progress

        try {
            const { error } = await supabase
                .from('goals')
                .update({
                    is_completed: newCompleted,
                    progress: newProgress,
                })
                .eq('id', goalId)

            if (error) throw error
            setGoals(prev =>
                prev.map(g =>
                    g.id === goalId ? { ...g, is_completed: newCompleted, progress: newProgress } : g
                )
            )
        } catch (error) {
            console.error('Error toggling goal:', error)
            // Fallback: update locally
            setGoals(prev =>
                prev.map(g =>
                    g.id === goalId ? { ...g, is_completed: newCompleted, progress: newProgress } : g
                )
            )
        }
    }

    // Update goal
    const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
        try {
            const { error } = await supabase
                .from('goals')
                .update(updates)
                .eq('id', goalId)

            if (error) throw error
            setGoals(prev =>
                prev.map(g =>
                    g.id === goalId ? { ...g, ...updates } : g
                )
            )
        } catch (error) {
            console.error('Error updating goal:', error)
            // Fallback: update locally
            setGoals(prev =>
                prev.map(g =>
                    g.id === goalId ? { ...g, ...updates } : g
                )
            )
        }
    }

    // Delete goal
    const deleteGoal = async (goalId: string) => {
        try {
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', goalId)

            if (error) throw error
            setGoals(prev => prev.filter(g => g.id !== goalId))
        } catch (error) {
            console.error('Error deleting goal:', error)
            // Fallback: delete locally
            setGoals(prev => prev.filter(g => g.id !== goalId))
        }
    }

    return {
        goals,
        isLoading,
        addGoal,
        toggleGoal,
        updateGoal,
        deleteGoal,
        loadGoals,
    }
}
