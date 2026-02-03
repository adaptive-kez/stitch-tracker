import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Task {
    id: string
    date: string
    completed: boolean
}

interface CalendarModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    onSelectDate: (date: Date) => void
    tasks: Task[]
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

export function CalendarModal({ isOpen, onClose, selectedDate, onSelectDate, tasks }: CalendarModalProps) {
    const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate))

    // Calculate productivity stats for each day
    const dayStats = useMemo(() => {
        const stats: Record<string, { completed: number; total: number }> = {}

        tasks.forEach(task => {
            const dateKey = task.date
            if (!stats[dateKey]) {
                stats[dateKey] = { completed: 0, total: 0 }
            }
            stats[dateKey].total++
            if (task.completed) {
                stats[dateKey].completed++
            }
        })

        return stats
    }, [tasks])

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const year = viewMonth.getFullYear()
        const month = viewMonth.getMonth()

        // First day of month
        const firstDay = new Date(year, month, 1)
        // Last day of month
        const lastDay = new Date(year, month + 1, 0)

        // Start from Monday (0 = Mon, 6 = Sun)
        const startDayOfWeek = (firstDay.getDay() + 6) % 7

        const days: (Date | null)[] = []

        // Padding for days before first of month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null)
        }

        // Actual days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d))
        }

        return days
    }, [viewMonth])

    const goToPrevMonth = () => {
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const formatDateKey = (date: Date): string => {
        return date.toISOString().split('T')[0]
    }

    const isToday = (date: Date): boolean => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    const isSelected = (date: Date): boolean => {
        return date.toDateString() === selectedDate.toDateString()
    }

    const getProductivityColor = (stats: { completed: number; total: number }) => {
        if (stats.total === 0) return ''
        const ratio = stats.completed / stats.total
        if (ratio === 1) return 'text-green-400'
        if (ratio >= 0.5) return 'text-yellow-400'
        return 'text-red-400'
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={goToPrevMonth}
                                className="p-2 rounded-full hover:bg-[var(--bg-button)] cursor-pointer"
                            >
                                <ChevronLeft size={20} />
                            </motion.button>

                            <h2 className="text-lg font-semibold">
                                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                            </h2>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={goToNextMonth}
                                className="p-2 rounded-full hover:bg-[var(--bg-button)] cursor-pointer"
                            >
                                <ChevronRight size={20} />
                            </motion.button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 p-2 text-center text-sm text-[var(--text-secondary)]">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="py-2">{day}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1 p-2">
                            {calendarDays.map((date, idx) => {
                                if (!date) {
                                    return <div key={`empty-${idx}`} className="h-16" />
                                }

                                const dateKey = formatDateKey(date)
                                const stats = dayStats[dateKey]
                                const productivityColor = stats ? getProductivityColor(stats) : ''

                                return (
                                    <motion.button
                                        key={dateKey}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            onSelectDate(date)
                                            onClose()
                                        }}
                                        className={`
                                            h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer
                                            transition-colors
                                            ${isSelected(date) ? 'bg-[var(--accent-blue)] text-white' : 'hover:bg-[var(--bg-button)]'}
                                            ${isToday(date) && !isSelected(date) ? 'ring-2 ring-[var(--accent-blue)]' : ''}
                                        `}
                                    >
                                        <span className={`text-base font-medium ${isSelected(date) ? 'text-white' : ''}`}>
                                            {date.getDate()}
                                        </span>

                                        {/* Productivity indicator */}
                                        {stats && stats.total > 0 && (
                                            <span className={`text-xs ${isSelected(date) ? 'text-white/80' : productivityColor}`}>
                                                {stats.completed}/{stats.total}
                                            </span>
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-subtle)] flex justify-between">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    onSelectDate(new Date())
                                    setViewMonth(new Date())
                                }}
                                className="px-4 py-2 text-[var(--accent-blue)] font-medium cursor-pointer"
                            >
                                Сегодня
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="px-4 py-2 bg-[var(--bg-button)] rounded-xl cursor-pointer"
                            >
                                Закрыть
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
