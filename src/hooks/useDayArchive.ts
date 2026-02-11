import { useState, useCallback } from 'react'
import { tasksApi, journalApi, habitLogsApi, type DbTask } from '@/lib/api'
import type { Task, JournalEntry, HabitLog, JournalType } from '@/types'

export interface DayArchive {
    date: string
    tasks: Task[]
    journal: JournalEntry[]
    habitLogs: HabitLog[]
}

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
        recurrence_rule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : undefined,
        created_at: row.created_at,
    }
}

export function useDayArchive(userId: string | null) {
    const [archive, setArchive] = useState<DayArchive | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const loadArchive = useCallback(async (date: string) => {
        if (!userId) return

        setIsLoading(true)
        try {
            const [allTasks, allJournal, allHabitLogs] = await Promise.all([
                tasksApi.list(userId),
                journalApi.list(userId),
                habitLogsApi.list(userId),
            ])

            setArchive({
                date,
                tasks: allTasks.filter(t => t.date === date).map(toTask),
                journal: allJournal
                    .filter(j => j.date === date)
                    .map(j => ({
                        id: j.id,
                        user_id: j.user_id,
                        type: j.type as JournalType,
                        content: j.content,
                        date: j.date,
                        created_at: j.created_at,
                    })),
                habitLogs: allHabitLogs
                    .filter(l => l.completed_at === date)
                    .map(l => ({
                        id: l.id,
                        habit_id: l.habit_id,
                        user_id: l.user_id,
                        completed_at: l.completed_at,
                    })),
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
