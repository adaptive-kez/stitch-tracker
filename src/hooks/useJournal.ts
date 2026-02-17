import { useState, useEffect, useCallback } from 'react'
import { journalApi, type DbJournal } from '@/lib/api'
import type { JournalEntry, JournalType } from '@/types'

function toJournalEntry(row: DbJournal): JournalEntry {
    return {
        id: row.id,
        user_id: row.user_id,
        type: row.type as JournalType,
        content: row.content,
        date: row.date,
        created_at: row.created_at,
    }
}

export function useJournal(userId: string | null) {
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadEntries = useCallback(async (_date?: string) => {
        if (!userId) return

        try {
            const data = await journalApi.list(userId)
            setEntries(data.map(toJournalEntry))
        } catch (error) {
            console.error('Error loading journal:', error)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        if (userId) {
            loadEntries()
        }
    }, [userId, loadEntries])

    const addEntry = async (type: JournalType, content: string, date?: string) => {
        if (!userId || !content.trim()) return null

        const entryDate = date || new Date().toISOString().split('T')[0]

        // Optimistic: show entry immediately
        const tempEntry: JournalEntry = {
            id: `temp-${Date.now()}`,
            user_id: userId,
            type,
            content: content.trim(),
            date: entryDate,
            created_at: new Date().toISOString(),
        }
        setEntries(prev => [tempEntry, ...prev])

        try {
            const data = await journalApi.create(userId, {
                type,
                content: content.trim(),
                date: entryDate,
            })

            // Replace temp with real server entry
            const entry = toJournalEntry(data)
            setEntries(prev => prev.map(e => e.id === tempEntry.id ? entry : e))
            return entry
        } catch (error) {
            // Keep temp entry — don't revert, user intent preserved
            console.warn('Journal sync error (kept locally):', error)
            return tempEntry
        }
    }

    const deleteEntry = async (entryId: string) => {
        // Optimistic: remove immediately
        setEntries(prev => prev.filter(e => e.id !== entryId))

        try {
            await journalApi.delete(userId!, entryId)
        } catch (error) {
            // Don't revert — user intent preserved
            console.warn('Journal delete sync error:', error)
        }
    }

    const getEntriesByDate = (date: string) => {
        return entries.filter(e => e.date === date)
    }

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
