import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { JournalEntry, JournalType } from '@/types'

export function useJournal(userId: string | null) {
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load entries for a specific date
    const loadEntries = useCallback(async (date?: string) => {
        if (!userId) return

        try {
            let query = supabase
                .from('journal')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (date) {
                query = query.eq('date', date)
            }

            const { data, error } = await query

            if (error) throw error
            setEntries(data || [])
        } catch (error) {
            console.error('Error loading journal:', error)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    // Load entries on mount
    useEffect(() => {
        if (userId) {
            loadEntries()
        }
    }, [userId, loadEntries])

    // Add new entry
    const addEntry = async (type: JournalType, content: string, date?: string) => {
        if (!userId || !content.trim()) return null

        try {
            const entryDate = date || new Date().toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('journal')
                .insert({
                    user_id: userId,
                    type,
                    content: content.trim(),
                    date: entryDate,
                })
                .select()
                .single()

            if (error) throw error

            setEntries(prev => [data, ...prev])
            return data
        } catch (error) {
            console.error('Error adding journal entry:', error)
            return null
        }
    }

    // Delete entry
    const deleteEntry = async (entryId: string) => {
        try {
            const { error } = await supabase
                .from('journal')
                .delete()
                .eq('id', entryId)

            if (error) throw error

            setEntries(prev => prev.filter(e => e.id !== entryId))
        } catch (error) {
            console.error('Error deleting journal entry:', error)
        }
    }

    // Get entries by date
    const getEntriesByDate = (date: string) => {
        return entries.filter(e => e.date === date)
    }

    // Get entries by type
    const getEntriesByType = (type: JournalType) => {
        return entries.filter(e => e.type === type)
    }

    return {
        entries,
        isLoading,
        addEntry,
        deleteEntry,
        loadEntries,
        getEntriesByDate,
        getEntriesByType,
    }
}
