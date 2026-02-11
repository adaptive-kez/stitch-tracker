import { useState, useEffect, useCallback } from 'react'
import { goalsApi, type DbGoal } from '@/lib/api'
import type { Goal } from '@/types'

function toGoal(row: DbGoal): Goal {
    return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        description: row.description || undefined,
        progress: row.progress,
        is_completed: !!row.is_completed,
        year: row.year,
        deadline: row.deadline || undefined,
        created_at: row.created_at,
    }
}

export function useGoals(userId: string | null) {
    const [goals, setGoals] = useState<Goal[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadGoals = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        try {
            const data = await goalsApi.list(userId)
            setGoals(data.map(toGoal))
        } catch (error) {
            console.error('Error loading goals:', error)
            const stored = localStorage.getItem(`goals_${userId}`)
            if (stored) setGoals(JSON.parse(stored))
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        loadGoals()
    }, [loadGoals])

    useEffect(() => {
        if (userId && goals.length > 0) {
            localStorage.setItem(`goals_${userId}`, JSON.stringify(goals))
        }
    }, [goals, userId])

    const addGoal = async (title: string, description?: string) => {
        if (!userId) return

        const currentYear = new Date().getFullYear()

        try {
            const data = await goalsApi.create(userId, {
                title,
                description,
                year: currentYear,
            })
            setGoals(prev => [toGoal(data), ...prev])
        } catch (error) {
            console.error('Error adding goal:', error)
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

    const toggleGoal = async (goalId: string) => {
        const goal = goals.find(g => g.id === goalId)
        if (!goal) return

        const newCompleted = !goal.is_completed
        const newProgress = newCompleted ? 100 : goal.progress

        setGoals(prev =>
            prev.map(g =>
                g.id === goalId ? { ...g, is_completed: newCompleted, progress: newProgress } : g
            )
        )

        try {
            await goalsApi.update(userId!, goalId, {
                is_completed: newCompleted ? 1 : 0,
                progress: newProgress,
            })
        } catch (error) {
            console.error('Error toggling goal:', error)
        }
    }

    const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
        // Convert booleans for API
        const apiUpdates: Partial<DbGoal> = { ...updates } as Partial<DbGoal>
        if ('is_completed' in updates) {
            apiUpdates.is_completed = updates.is_completed ? 1 : 0
        }

        try {
            await goalsApi.update(userId!, goalId, apiUpdates)
            setGoals(prev =>
                prev.map(g =>
                    g.id === goalId ? { ...g, ...updates } : g
                )
            )
        } catch (error) {
            console.error('Error updating goal:', error)
            setGoals(prev =>
                prev.map(g =>
                    g.id === goalId ? { ...g, ...updates } : g
                )
            )
        }
    }

    const deleteGoal = async (goalId: string) => {
        try {
            await goalsApi.delete(userId!, goalId)
            setGoals(prev => prev.filter(g => g.id !== goalId))
        } catch (error) {
            console.error('Error deleting goal:', error)
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
