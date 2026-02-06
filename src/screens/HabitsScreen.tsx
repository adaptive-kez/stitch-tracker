import { Plus, LayoutGrid, Calendar, ChevronLeft, Bell, X, Repeat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { StitchMascot } from '@/components/StitchMascot'
import { Switch } from '@/components/ui/switch'
import { FrequencySelector, getRecurrenceDescription } from '@/components/ui/FrequencySelector'
import type { RecurrenceRule } from '@/types'

interface Habit {
    id: string
    title: string
    completedDays: number[]  // Week view: indexes 0-6 (Mon-Sun)
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
    onToggleHabitDay?: (habitId: string, dayIndex: number) => void
    selectedDate: Date
}

export function HabitsScreen({ habits, onAddHabit, onToggleHabitDay, selectedDate }: HabitsScreenProps) {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
    const [isAdding, setIsAdding] = useState(false)
    const [showStartDatePicker, setShowStartDatePicker] = useState(false)
    const [showEndDatePicker, setShowEndDatePicker] = useState(false)

    // Form state
    const [newHabitTitle, setNewHabitTitle] = useState('')
    const [startDateObj, setStartDateObj] = useState(selectedDate)
    const [endDateObj, setEndDateObj] = useState<Date | null>(null)
    const [hasNotification, setHasNotification] = useState(false)
    const [notificationTime, setNotificationTime] = useState('09:00')
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({ type: 'daily' })
    const [showFrequencySelector, setShowFrequencySelector] = useState(false)

    const completedCount = 0
    const totalCount = habits.length

    function formatDateForDisplay(date: Date): string {
        const day = date.getDate()
        const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.']
        const year = date.getFullYear()
        return `${day} ${months[date.getMonth()]} ${year}г.`
    }

    function formatDateISO(date: Date): string {
        return date.toISOString().split('T')[0]
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

    // Date Picker Modal Component
    const DatePickerModal = ({
        isOpen,
        onClose,
        selectedDate: pickerDate,
        onSelect,
        title
    }: {
        isOpen: boolean
        onClose: () => void
        selectedDate: Date
        onSelect: (date: Date) => void
        title: string
    }) => (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[var(--bg-card)] rounded-2xl p-4 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{title}</h3>
                            <button onClick={onClose} className="text-[var(--text-secondary)]">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-4">
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                                <div key={d} className="py-2 text-[var(--text-secondary)]">{d}</div>
                            ))}
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                const isSelected = pickerDate.getDate() === day
                                return (
                                    <motion.button
                                        key={day}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            const newDate = new Date(pickerDate)
                                            newDate.setDate(day)
                                            onSelect(newDate)
                                            onClose()
                                        }}
                                        className={`py-2 rounded-full cursor-pointer ${isSelected
                                            ? 'bg-[var(--accent-blue)] text-white'
                                            : 'hover:bg-[var(--bg-button)]'
                                            }`}
                                    >
                                        {day}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )

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
                            <div className="font-semibold">Просто Трекер</div>
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
                    <StitchMascot variant="sleeping" size="lg" className="mb-4" />
                    <p className="text-[var(--text-secondary)] text-base">
                        Привычек пока что нет
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {habits.map((habit) => (
                        <div
                            key={habit.id}
                            className="p-4 rounded-xl bg-[var(--bg-card)]"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">{habit.title}</span>
                                <div className="flex items-center gap-2">
                                    {habit.hasNotification && <Bell size={14} className="text-[var(--accent-blue)]" />}
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        {habit.recurrenceRule ? getRecurrenceDescription(habit.recurrenceRule) : 'ежедн.'}
                                    </span>
                                </div>
                            </div>

                            {/* Week Grid */}
                            {viewMode === 'week' && (() => {
                                const today = new Date()
                                const dayOfWeek = today.getDay()
                                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
                                const startOfWeek = new Date(today)
                                startOfWeek.setDate(today.getDate() - diffToMonday)

                                const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

                                return (
                                    <div className="flex justify-between gap-1">
                                        {weekDays.map((day, i) => {
                                            const date = new Date(startOfWeek)
                                            date.setDate(startOfWeek.getDate() + i)
                                            const dayOfMonth = date.getDate()

                                            return (
                                                <div key={day} className="flex flex-col items-center gap-1">
                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => onToggleHabitDay?.(habit.id, i)}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${habit.completedDays.includes(i)
                                                            ? 'bg-[var(--accent-blue)]'
                                                            : 'bg-[var(--bg-button)] hover:bg-[var(--bg-button-hover)]'
                                                            }`}
                                                    >
                                                        {habit.completedDays.includes(i) && (
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </motion.button>
                                                    <span className="text-xs text-[var(--text-secondary)]">{dayOfMonth}.{String(date.getMonth() + 1).padStart(2, '0')} / {day.toLowerCase()}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()}

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
                                            const isToday = day === currentDay

                                            return (
                                                <div
                                                    key={i}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs relative
                                                        ${isCompleted
                                                            ? 'bg-[var(--accent-blue)] text-white'
                                                            : 'bg-[var(--bg-button)] text-[var(--text-secondary)]'
                                                        }
                                                        ${isToday && !isCompleted ? 'ring-2 ring-[var(--accent-blue)] ring-offset-1 ring-offset-[var(--bg-card)]' : ''}
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
