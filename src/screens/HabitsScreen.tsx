import { Plus, LayoutGrid, Calendar, ChevronLeft, ChevronRight, Bell, Repeat, Trash2 } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { useState } from 'react'
import { StitchMascot } from '@/components/StitchMascot'
import { Switch } from '@/components/ui/switch'
import { FrequencySelector, getRecurrenceDescription } from '@/components/ui/FrequencySelector'
import type { RecurrenceRule } from '@/types'
import { DatePickerModal } from '@/components/ui/DatePickerModal'

interface Habit {
    id: string
    title: string
    completedDates: string[]  // ISO date strings of completed days
    completedDaysOfMonth?: number[]  // Month view: actual day numbers (1-31)
    startDate?: string
    endDate?: string
    hasNotification?: boolean
    recurrenceRule?: RecurrenceRule
}

interface HabitsScreenProps {
    habits: Habit[]
    onAddHabit: (habit: {
        title: string
        startDate: string
        endDate?: string
        hasNotification: boolean
        notificationTime?: string
        recurrenceRule?: RecurrenceRule
    }) => void
    onToggleHabitDay?: (habitId: string, dateStr: string) => void
    onDeleteHabit?: (habitId: string) => void
    selectedDate: Date
}

// Helper: format Date to ISO string (YYYY-MM-DD)
function toISO(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

// Swipeable Habit Component — swipe left to delete
function SwipeableHabit({
    habit,
    children,
    onDelete,
}: {
    habit: Habit
    children: React.ReactNode
    onDelete?: (id: string) => void
}) {
    const x = useMotionValue(0)
    const background = useTransform(
        x,
        [-100, 0],
        ['rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0)']
    )
    const deleteOpacity = useTransform(x, [-100, -50], [1, 0])

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100 && onDelete) {
            onDelete(habit.id)
        }
    }

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Delete indicator */}
            <motion.div
                style={{ background }}
                className="absolute inset-0 flex items-center justify-end pr-4 rounded-xl"
            >
                <motion.div style={{ opacity: deleteOpacity }}>
                    <Trash2 size={20} className="text-white" />
                </motion.div>
            </motion.div>

            {/* Swipeable content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -150, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="relative z-10"
            >
                {children}
            </motion.div>
        </div>
    )
}

export function HabitsScreen({ habits, onAddHabit, onToggleHabitDay, onDeleteHabit, selectedDate }: HabitsScreenProps) {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
    const [isAdding, setIsAdding] = useState(false)
    const [showStartDatePicker, setShowStartDatePicker] = useState(false)
    const [showEndDatePicker, setShowEndDatePicker] = useState(false)
    const [weekOffset, setWeekOffset] = useState(0) // 0 = current window, -1 = previous, +1 = next

    // Form state
    const [newHabitTitle, setNewHabitTitle] = useState('')
    const [startDateObj, setStartDateObj] = useState(selectedDate)
    const [endDateObj, setEndDateObj] = useState<Date | null>(null)
    const [hasNotification, setHasNotification] = useState(false)
    const [notificationTime, setNotificationTime] = useState('09:00')
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({ type: 'daily' })
    const [showFrequencySelector, setShowFrequencySelector] = useState(false)

    const totalCount = habits.length

    // Generate 7 dates centered around today with weekOffset
    const getVisibleDates = (): Date[] => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dates: Date[] = []
        // Center today: show 3 days before, today, 3 days after
        // weekOffset shifts by 7 days
        const baseOffset = -3 + (weekOffset * 7)
        for (let i = 0; i < 7; i++) {
            const d = new Date(today)
            d.setDate(today.getDate() + baseOffset + i)
            dates.push(d)
        }
        return dates
    }

    const visibleDates = getVisibleDates()

    // Count how many habits are completed for today
    const todayISO = toISO(new Date())
    const completedCount = habits.filter(h => h.completedDates.includes(todayISO)).length

    // Short day names
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

    function formatDateForDisplay(date: Date): string {
        const day = date.getDate()
        const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.']
        const year = date.getFullYear()
        return `${day} ${months[date.getMonth()]} ${year}г.`
    }

    function formatDateISO(date: Date): string {
        return toISO(date)
    }

    const handleAddHabit = () => {
        if (newHabitTitle.trim()) {
            onAddHabit({
                title: newHabitTitle.trim(),
                startDate: formatDateISO(startDateObj),
                endDate: endDateObj ? formatDateISO(endDateObj) : undefined,
                hasNotification,
                notificationTime: hasNotification ? notificationTime : undefined,
                recurrenceRule: recurrenceRule.type !== 'once' ? recurrenceRule : undefined,
            })
            // Reset form
            setNewHabitTitle('')
            setStartDateObj(selectedDate)
            setEndDateObj(null)
            setHasNotification(false)
            setNotificationTime('09:00')
            setRecurrenceRule({ type: 'daily' })
            setShowFrequencySelector(false)
            setIsAdding(false)
        }
    }

    // Full screen add form
    if (isAdding) {
        return (
            <>
                <DatePickerModal
                    isOpen={showStartDatePicker}
                    onClose={() => setShowStartDatePicker(false)}
                    selectedDate={startDateObj}
                    onSelect={setStartDateObj}
                    title="Дата начала"
                />
                <DatePickerModal
                    isOpen={showEndDatePicker}
                    onClose={() => setShowEndDatePicker(false)}
                    selectedDate={endDateObj || new Date()}
                    onSelect={setEndDateObj}
                    title="Дата окончания"
                />

                <div className="flex-1 px-4 py-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAdding(false)}
                            className="flex items-center gap-1 text-[var(--accent-blue)] cursor-pointer"
                        >
                            <ChevronLeft size={20} />
                            <span>Назад</span>
                        </motion.button>
                        <div className="text-center">
                            <div className="font-semibold">Ya Reji</div>
                            <div className="text-xs text-[var(--text-secondary)]">мини-приложение</div>
                        </div>
                        <div className="w-16" />
                    </div>

                    {/* Title */}
                    <h1 className="text-xl font-semibold text-center">Добавить привычку</h1>

                    {/* Form */}
                    <div className="space-y-4">
                        {/* Habit Title Input */}
                        <textarea
                            value={newHabitTitle}
                            onChange={(e) => setNewHabitTitle(e.target.value)}
                            placeholder="Введите привычку"
                            autoFocus
                            className="w-full h-24 p-4 bg-[var(--bg-card)] rounded-xl text-base resize-none outline-none"
                        />

                        {/* Start Date Row - CLICKABLE */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowStartDatePicker(true)}
                            className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-xl w-full cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-[var(--text-secondary)]" />
                                <span>Дата начала</span>
                            </div>
                            <span className="text-[var(--accent-blue)]">{formatDateForDisplay(startDateObj)}</span>
                        </motion.button>

                        {/* End Date Row - CLICKABLE */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowEndDatePicker(true)}
                            className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-xl w-full cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-[var(--text-secondary)]" />
                                <span>Дата окончания</span>
                            </div>
                            <span className={endDateObj ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"}>
                                {endDateObj ? formatDateForDisplay(endDateObj) : 'Не указана'}
                            </span>
                        </motion.button>

                        {/* Frequency Selector */}
                        <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-3">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowFrequencySelector(!showFrequencySelector)}
                                className="flex items-center justify-between w-full"
                            >
                                <div className="flex items-center gap-2">
                                    <Repeat size={18} className="text-[var(--text-secondary)]" />
                                    <span>Периодичность</span>
                                </div>
                                <span className="text-[var(--accent-blue)]">
                                    {getRecurrenceDescription(recurrenceRule)}
                                </span>
                            </motion.button>

                            <AnimatePresence>
                                {showFrequencySelector && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pt-3 border-t border-[var(--border-subtle)]"
                                    >
                                        <FrequencySelector
                                            value={recurrenceRule}
                                            onChange={setRecurrenceRule}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notification Toggle */}
                        <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell size={18} className="text-[var(--text-secondary)]" />
                                    <span>Уведомление</span>
                                </div>
                                <Switch
                                    checked={hasNotification}
                                    onCheckedChange={setHasNotification}
                                />
                            </div>

                            {/* Notification Time */}
                            <AnimatePresence>
                                {hasNotification && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]"
                                    >
                                        <span className="text-[var(--text-secondary)]">Время напоминания</span>
                                        <input
                                            type="time"
                                            value={notificationTime}
                                            onChange={(e) => setNotificationTime(e.target.value)}
                                            className="bg-transparent text-[var(--accent-blue)] text-right outline-none"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Add Button */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddHabit}
                            disabled={!newHabitTitle.trim()}
                            className="btn btn-primary w-full mt-6 cursor-pointer disabled:opacity-50"
                        >
                            Добавить привычку
                        </motion.button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className="flex-1 px-4 space-y-4">
            {/* Segmented Control */}
            <div className="segmented-control">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('week')}
                    className={`segment cursor-pointer ${viewMode === 'week' ? 'segment-active' : ''}`}
                >
                    <LayoutGrid size={16} />
                    Неделя
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('month')}
                    className={`segment cursor-pointer ${viewMode === 'month' ? 'segment-active' : ''}`}
                >
                    <Calendar size={16} />
                    Месяц
                </motion.button>
            </div>

            {/* Counter */}
            <div className="flex justify-end">
                <div className="py-2 px-4 rounded-xl bg-[var(--bg-card)] text-base font-medium">
                    {completedCount} / {totalCount}
                </div>
            </div>

            {/* Content */}
            {habits.length === 0 ? (
                <div className="empty-state py-12">
                    <StitchMascot variant="sleeping" size="lg" className="mb-4" interactive />
                    <p className="text-[var(--text-secondary)] text-base">
                        Привычек пока что нет
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {habits.map((habit) => (
                        <SwipeableHabit
                            key={habit.id}
                            habit={habit}
                            onDelete={onDeleteHabit}
                        >
                            <div className="p-4 rounded-xl bg-[var(--bg-card)]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium">{habit.title}</span>
                                    <div className="flex items-center gap-2">
                                        {habit.hasNotification && <Bell size={14} className="text-[var(--accent-blue)]" />}
                                        <span className="text-xs text-[var(--text-secondary)]">
                                            {habit.recurrenceRule ? getRecurrenceDescription(habit.recurrenceRule) : 'ежедн.'}
                                        </span>
                                    </div>
                                </div>

                                {/* Week Grid with scrollable dates */}
                                {viewMode === 'week' && (
                                    <div className="flex items-center gap-1">
                                        {/* Left arrow */}
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => setWeekOffset(prev => prev - 1)}
                                            className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex-shrink-0"
                                        >
                                            <ChevronLeft size={16} />
                                        </motion.button>

                                        <div className="flex justify-between flex-1 gap-1">
                                            {visibleDates.map((date) => {
                                                const dateStr = toISO(date)
                                                const isCompleted = habit.completedDates.includes(dateStr)
                                                const isToday = dateStr === todayISO

                                                return (
                                                    <div key={dateStr} className="flex flex-col items-center gap-1">
                                                        <span className={`text-[10px] ${isToday ? 'text-[var(--accent-blue)] font-bold' : 'text-[var(--text-secondary)]'}`}>
                                                            {dayNames[date.getDay()]}
                                                        </span>
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => onToggleHabitDay?.(habit.id, dateStr)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isCompleted
                                                                ? 'bg-[var(--accent-blue)]'
                                                                : isToday
                                                                    ? 'bg-[var(--bg-button)] ring-2 ring-[var(--accent-blue)] ring-offset-1 ring-offset-[var(--bg-card)]'
                                                                    : 'bg-[var(--bg-button)] hover:bg-[var(--bg-button-hover)]'
                                                                }`}
                                                        >
                                                            {isCompleted && (
                                                                <motion.svg
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="w-4 h-4 text-white"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </motion.svg>
                                                            )}
                                                        </motion.button>
                                                        <span className={`text-[10px] ${isToday ? 'text-[var(--accent-blue)] font-bold' : 'text-[var(--text-secondary)]'}`}>
                                                            {String(date.getDate()).padStart(2, '0')}.{String(date.getMonth() + 1).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Right arrow */}
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => setWeekOffset(prev => prev + 1)}
                                            className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex-shrink-0"
                                        >
                                            <ChevronRight size={16} />
                                        </motion.button>
                                    </div>
                                )}

                                {/* Month Grid */}
                                {viewMode === 'month' && (() => {
                                    const today = new Date()
                                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
                                    const currentDay = today.getDate()
                                    const completedDaysOfMonth = habit.completedDaysOfMonth || []

                                    return (
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: daysInMonth }, (_, i) => {
                                                const day = i + 1
                                                const isCompleted = completedDaysOfMonth.includes(day)
                                                const isDayToday = day === currentDay

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs relative
                                                            ${isCompleted
                                                                ? 'bg-[var(--accent-blue)] text-white'
                                                                : 'bg-[var(--bg-button)] text-[var(--text-secondary)]'
                                                            }
                                                            ${isDayToday && !isCompleted ? 'ring-2 ring-[var(--accent-blue)] ring-offset-1 ring-offset-[var(--bg-card)]' : ''}
                                                        `}
                                                    >
                                                        {day}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })()}
                            </div>
                        </SwipeableHabit>
                    ))}
                </div>
            )}

            {/* Add Habit */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAdding(true)}
                className="btn btn-secondary w-full cursor-pointer"
            >
                <Plus size={20} />
                Добавить привычку
            </motion.button>
        </div>
    )
}
