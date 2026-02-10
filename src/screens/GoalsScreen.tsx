import { Plus, ChevronLeft, X, Target, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { StitchMascot } from '@/components/StitchMascot'

interface Goal {
    id: string
    title: string
    year: number
    deadline?: string
    isCompleted?: boolean
}

interface GoalsScreenProps {
    goals: Goal[]
    onAddGoal: (goal: { title: string; year: number; deadline?: string }) => void
    onToggleGoal?: (id: string) => void
}

export function GoalsScreen({ goals, onAddGoal, onToggleGoal }: GoalsScreenProps) {
    const currentYear = new Date().getFullYear()
    const years = [2026, 2027, 2028, 2029, 2030]

    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [isAdding, setIsAdding] = useState(false)
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false)

    // Form state
    const [newGoalTitle, setNewGoalTitle] = useState('')
    const [deadlineDate, setDeadlineDate] = useState<Date | null>(null)

    const filteredGoals = goals.filter(g => g.year === selectedYear)
    const completedCount = 0
    const totalCount = filteredGoals.length

    function formatDateForDisplay(date: Date): string {
        const day = date.getDate()
        const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.']
        const year = date.getFullYear()
        return `${day} ${months[date.getMonth()]} ${year}г.`
    }

    function formatDateISO(date: Date): string {
        return date.toISOString().split('T')[0]
    }

    const handleAddGoal = () => {
        if (newGoalTitle.trim()) {
            onAddGoal({
                title: newGoalTitle.trim(),
                year: selectedYear,
                deadline: deadlineDate ? formatDateISO(deadlineDate) : undefined,
            })
            setNewGoalTitle('')
            setDeadlineDate(null)
            setIsAdding(false)
        }
    }

    // Deadline Date Picker Modal
    const DeadlinePickerModal = () => (
        <AnimatePresence>
            {showDeadlinePicker && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setShowDeadlinePicker(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[var(--bg-card)] rounded-2xl p-4 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Выберите дедлайн</h3>
                            <button onClick={() => setShowDeadlinePicker(false)} className="text-[var(--text-secondary)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Month selector for goal year */}
                        <div className="mb-4">
                            <div className="text-sm text-[var(--text-secondary)] mb-2">Месяц {selectedYear}</div>
                            <div className="grid grid-cols-4 gap-2">
                                {['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'].map((month, i) => (
                                    <motion.button
                                        key={month}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            // Set to last day of selected month
                                            const lastDay = new Date(selectedYear, i + 1, 0)
                                            setDeadlineDate(lastDay)
                                            setShowDeadlinePicker(false)
                                        }}
                                        className="py-2 px-3 rounded-xl text-sm cursor-pointer bg-[var(--bg-button)] hover:bg-[var(--accent-blue)] hover:text-white transition-colors"
                                    >
                                        {month}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Quick options */}
                        <div className="space-y-2">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    // End of Q1
                                    setDeadlineDate(new Date(selectedYear, 2, 31))
                                    setShowDeadlinePicker(false)
                                }}
                                className="w-full p-3 rounded-xl bg-[var(--bg-button)] text-left"
                            >
                                Конец Q1 (31 марта)
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    // End of Q2
                                    setDeadlineDate(new Date(selectedYear, 5, 30))
                                    setShowDeadlinePicker(false)
                                }}
                                className="w-full p-3 rounded-xl bg-[var(--bg-button)] text-left"
                            >
                                Конец Q2 (30 июня)
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    // End of year
                                    setDeadlineDate(new Date(selectedYear, 11, 31))
                                    setShowDeadlinePicker(false)
                                }}
                                className="w-full p-3 rounded-xl bg-[var(--bg-button)] text-left"
                            >
                                Конец года (31 декабря)
                            </motion.button>
                            {deadlineDate && (
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setDeadlineDate(null)
                                        setShowDeadlinePicker(false)
                                    }}
                                    className="w-full p-3 rounded-xl text-red-500 text-center"
                                >
                                    Убрать дедлайн
                                </motion.button>
                            )}
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
                <DeadlinePickerModal />
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
                    <h1 className="text-xl font-semibold text-center">Добавить цель на {selectedYear}</h1>

                    {/* Form */}
                    <div className="space-y-4">
                        {/* Goal Title Input */}
                        <textarea
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                            placeholder="Введите цель"
                            autoFocus
                            className="w-full h-24 p-4 bg-[var(--bg-card)] rounded-xl text-base resize-none outline-none"
                        />

                        {/* Deadline Row - CLICKABLE */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowDeadlinePicker(true)}
                            className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-xl w-full cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Target size={18} className="text-[var(--text-secondary)]" />
                                <span>Дедлайн</span>
                            </div>
                            <span className={deadlineDate ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"}>
                                {deadlineDate ? formatDateForDisplay(deadlineDate) : 'Не указан'}
                            </span>
                        </motion.button>

                        {/* Add Button */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddGoal}
                            disabled={!newGoalTitle.trim()}
                            className="btn btn-primary w-full mt-6 cursor-pointer disabled:opacity-50"
                        >
                            Добавить цель
                        </motion.button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className="flex-1 px-4 space-y-4">
            {/* Title Section */}
            <div>
                <h1 className="text-2xl font-bold mb-1">Цели на год</h1>
                <p className="text-[var(--text-secondary)] text-sm">
                    Здесь вы можете добавлять и просматривать ваши цели на год.
                </p>
            </div>

            {/* Year Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {years.map((year) => (
                    <motion.button
                        key={year}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedYear(year)}
                        className={`pill cursor-pointer ${selectedYear === year ? 'pill-active' : 'pill-inactive'}`}
                    >
                        {year}
                    </motion.button>
                ))}
            </div>

            {/* Counter */}
            <div className="flex justify-end">
                <div className="py-2 px-4 rounded-xl bg-[var(--bg-card)] text-base font-medium">
                    {completedCount} / {totalCount}
                </div>
            </div>

            {/* Content */}
            {filteredGoals.length === 0 ? (
                <div className="empty-state py-12">
                    <StitchMascot variant="thinking" size="lg" className="mb-4" interactive />
                    <p className="text-[var(--text-secondary)] text-base">
                        Целей пока нет
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredGoals.map((goal) => (
                        <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl bg-[var(--bg-card)] ${goal.isCompleted ? 'opacity-70' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Completion Checkbox */}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onToggleGoal?.(goal.id)}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer border-2 transition-colors ${goal.isCompleted
                                        ? 'bg-green-500 border-green-500'
                                        : 'bg-transparent border-[var(--text-secondary)]'
                                        }`}
                                >
                                    {goal.isCompleted && <Check size={16} className="text-white" />}
                                </motion.button>

                                <div className="flex-1">
                                    <div className={`font-medium ${goal.isCompleted ? 'line-through text-[var(--text-secondary)]' : ''}`}>
                                        {goal.title}
                                    </div>
                                    {goal.deadline && (
                                        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)] mt-1">
                                            <Target size={14} />
                                            <span>Дедлайн: {goal.deadline}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Goal */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAdding(true)}
                className="btn btn-secondary w-full cursor-pointer"
            >
                <Plus size={20} />
                Добавить цель
            </motion.button>
        </div>
    )
}
