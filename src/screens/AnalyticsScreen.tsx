import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { X } from 'lucide-react'

interface Task {
    id: string
    title: string
    date: string
    completed: boolean
}

interface Habit {
    id: string
    title: string
    completedDays: number[]
}

interface AnalyticsScreenProps {
    tasks: Task[]
    habits: Habit[]
}

interface DayStats {
    date: string
    dayName: string
    completed: number
    total: number
    tasks: Task[]
}

export function AnalyticsScreen({ tasks, habits: _habits }: AnalyticsScreenProps) {
    const [dataSource, setDataSource] = useState<'tasks' | 'habits'>('tasks')
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')
    const [selectedDay, setSelectedDay] = useState<DayStats | null>(null)

    // Calculate stats for current week
    const weekStats = useMemo(() => {
        const today = new Date()
        const startOfWeek = new Date(today)
        const dayOfWeek = today.getDay()
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        startOfWeek.setDate(today.getDate() - diffToMonday)
        startOfWeek.setHours(0, 0, 0, 0)

        const days: DayStats[] = []
        const dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek)
            date.setDate(startOfWeek.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]

            const dayTasks = tasks.filter(t => t.date === dateStr)
            const completedCount = dayTasks.filter(t => t.completed).length

            days.push({
                date: dateStr,
                dayName: dayNames[i],
                completed: completedCount,
                total: dayTasks.length,
                tasks: dayTasks,
            })
        }

        return days
    }, [tasks])

    // Find most productive day
    const mostProductiveDay = useMemo(() => {
        let maxCompleted = 0
        let bestDay = 'ПН'

        weekStats.forEach(day => {
            if (day.completed > maxCompleted) {
                maxCompleted = day.completed
                bestDay = day.dayName
            }
        })

        return bestDay
    }, [weekStats])

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const incompleteTasks = totalTasks - completedTasks
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Bar chart max height calculation
    const maxTotal = Math.max(...weekStats.map(d => d.total), 1)

    return (
        <div className="flex-1 px-4 space-y-4">
            {/* Title Section */}
            <div>
                <h1 className="text-2xl font-bold mb-1">Аналитика</h1>
                <p className="text-[var(--text-secondary)] text-sm">
                    Здесь вы можете посмотреть свою статистику и целеустремлённость.
                </p>
            </div>

            {/* Data Source Toggle */}
            <div className="segmented-control">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDataSource('tasks')}
                    className={`segment cursor-pointer ${dataSource === 'tasks' ? 'segment-active' : ''}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Задачи
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDataSource('habits')}
                    className={`segment cursor-pointer ${dataSource === 'habits' ? 'segment-active' : ''}`}
                >
                    Привычки
                </motion.button>
            </div>

            {/* Period Pills */}
            <div className="flex gap-2">
                {[
                    { id: 'week', label: 'Неделя' },
                    { id: 'month', label: 'Месяц' },
                    { id: 'year', label: 'Год' },
                ].map((p) => (
                    <motion.button
                        key={p.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPeriod(p.id as typeof period)}
                        className={`pill cursor-pointer ${period === p.id ? 'pill-active' : 'pill-inactive'}`}
                    >
                        {p.label}
                    </motion.button>
                ))}
            </div>

            {/* Stats Card */}
            <div className="p-4 rounded-xl bg-[var(--bg-card)]">
                <div className="flex items-center gap-6">
                    {/* Circular Progress */}
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="42"
                                fill="none"
                                stroke="var(--bg-button)"
                                strokeWidth="8"
                            />
                            <motion.circle
                                cx="48"
                                cy="48"
                                r="42"
                                fill="none"
                                stroke="var(--accent-blue)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: '264', strokeDashoffset: '264' }}
                                animate={{
                                    strokeDashoffset: 264 - (264 * completionRate / 100)
                                }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                            {completionRate}%
                        </div>
                    </div>

                    {/* Stats List */}
                    <div className="flex-1 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Всего задач:</span>
                            <span className="font-medium">{totalTasks}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Выполнено:</span>
                            <span className="font-medium text-[var(--accent-green)]">{completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Невыполнено:</span>
                            <span className="font-medium text-[var(--accent-red)]">{incompleteTasks}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Средний прогресс:</span>
                            <span className="font-medium">{completionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Продуктивный день:</span>
                            <span className="font-medium">{mostProductiveDay}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Weekly Chart */}
            <div className="p-4 rounded-xl bg-[var(--bg-card)]">
                <h3 className="text-sm font-medium mb-3 text-[var(--text-secondary)]">
                    Нажмите на столбец для подробностей
                </h3>
                <div className="flex justify-between items-end gap-2 h-32">
                    {weekStats.map((day) => {
                        const height = day.total > 0 ? Math.max(20, (day.total / maxTotal) * 100) : 20
                        const completedHeight = day.total > 0 ? (day.completed / day.total) * height : 0

                        return (
                            <motion.button
                                key={day.date}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedDay(day)}
                                className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                            >
                                <div className="w-full flex flex-col items-center">
                                    <span className="text-xs text-[var(--text-secondary)] mb-1">
                                        {day.completed}/{day.total}
                                    </span>
                                    <div className="w-full relative rounded-t-md overflow-hidden"
                                        style={{ height: `${height}px` }}>
                                        {/* Background (total) */}
                                        <div className="absolute inset-0 bg-[var(--bg-button)] group-hover:bg-[var(--bg-button-hover)] transition-colors" />
                                        {/* Completed overlay */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 bg-[var(--accent-blue)]"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${completedHeight}%` }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs text-[var(--text-secondary)]">{day.dayName}</span>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Daily Breakdown Popup */}
            <AnimatePresence>
                {selectedDay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                        onClick={() => setSelectedDay(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--bg-card)] rounded-2xl w-full max-w-sm overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                                <h3 className="text-lg font-semibold">
                                    {selectedDay.dayName} — {selectedDay.date}
                                </h3>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedDay(null)}
                                    className="p-2 rounded-full hover:bg-[var(--bg-button)] cursor-pointer"
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            {/* Stats */}
                            <div className="p-4 border-b border-[var(--border-subtle)]">
                                <div className="flex justify-around text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-[var(--accent-green)]">
                                            {selectedDay.completed}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Выполнено</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[var(--accent-red)]">
                                            {selectedDay.total - selectedDay.completed}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Невыполнено</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">
                                            {selectedDay.total > 0
                                                ? Math.round((selectedDay.completed / selectedDay.total) * 100)
                                                : 0}%
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Прогресс</div>
                                    </div>
                                </div>
                            </div>

                            {/* Task List */}
                            <div className="p-4 max-h-64 overflow-y-auto">
                                {selectedDay.tasks.length === 0 ? (
                                    <p className="text-[var(--text-secondary)] text-center py-4">
                                        Задач на этот день нет
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {selectedDay.tasks.map((task) => (
                                            <li
                                                key={task.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-button)] ${task.completed ? 'opacity-60' : ''
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.completed
                                                    ? 'bg-[var(--accent-green)] border-[var(--accent-green)]'
                                                    : 'border-[var(--text-secondary)]'
                                                    }`}>
                                                    {task.completed && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className={task.completed ? 'line-through' : ''}>
                                                    {task.title}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Close Button */}
                            <div className="p-4 border-t border-[var(--border-subtle)]">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedDay(null)}
                                    className="w-full py-3 bg-[var(--bg-button)] rounded-xl font-medium cursor-pointer"
                                >
                                    Закрыть
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
