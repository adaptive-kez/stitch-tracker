import { Plus, ChevronDown, ChevronUp, Clock, Sparkles, Heart, MessageCircle, ChevronLeft, Star, Calendar, X, Bell, Repeat, Trash2 } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { useState } from 'react'
import { StitchMascot } from '@/components/StitchMascot'
import { Switch } from '@/components/ui/switch'
import { FrequencySelector, getRecurrenceDescription } from '@/components/ui/FrequencySelector'
import type { JournalType, JournalEntry, RecurrenceRule } from '@/types'

interface Task {
    id: string
    title: string
    completed: boolean
    date?: string
    isImportant?: boolean
    hasNotification?: boolean
}

interface TasksScreenProps {
    tasks: Task[]
    onAddTask: (task: {
        title: string;
        date: string;
        isImportant: boolean;
        hasNotification: boolean;
        notificationTime?: string;
        recurrenceRule?: RecurrenceRule;
    }) => void
    onToggleTask: (id: string) => void
    onDeleteTask?: (id: string) => void
    selectedDate: Date
    // Journal integration
    journalEntries?: JournalEntry[]
    onAddJournalEntry?: (type: JournalType, content: string) => void
    onDeleteJournalEntry?: (id: string) => void
}

// Journal type mapping
const journalTypeMap: Record<string, JournalType> = {
    notes: 'notes',
    lesson: 'lesson',
    gratitude: 'gratitude',
    thoughts: 'thought',
}

const journalLabels: Record<string, string> = {
    notes: 'Заметки',
    lesson: 'Урок дня',
    gratitude: 'Благодарность',
    thoughts: 'Мысли',
}

// Swipeable Journal Entry Component - hooks must be at top level of a component
function SwipeableJournalEntry({
    entry,
    onDelete
}: {
    entry: JournalEntry
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
            onDelete(entry.id)
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
                className="p-3 rounded-xl bg-[var(--bg-card)] text-sm relative z-10 cursor-grab active:cursor-grabbing"
            >
                <div className="text-xs text-[var(--text-secondary)] mb-1">
                    {entry.type === 'notes' && 'Заметки'}
                    {entry.type === 'lesson' && 'Урок дня'}
                    {entry.type === 'gratitude' && 'Благодарность'}
                    {entry.type === 'thought' && 'Мысли'}
                </div>
                <p>{entry.content}</p>
            </motion.div>
        </div>
    )
}

// Swipeable Task Component - swipe left to delete
function SwipeableTask({
    task,
    onToggle,
    onDelete
}: {
    task: Task
    onToggle: (id: string) => void
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
            onDelete(task.id)
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
                layout
                drag="x"
                dragConstraints={{ left: -150, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)] relative z-10 cursor-grab active:cursor-grabbing ${task.isImportant ? 'border-2 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : ''
                    }`}
            >
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onToggle(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${task.completed
                        ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)]'
                        : 'border-[var(--text-secondary)]'
                        }`}
                >
                    {task.completed && (
                        <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </motion.svg>
                    )}
                </motion.button>
                <span className={`flex-1 ${task.completed ? 'line-through text-[var(--text-secondary)]' : ''}`}>
                    {task.title}
                </span>
                {task.hasNotification && <Bell size={14} className="text-[var(--accent-blue)]" />}
                {task.isImportant && <Star size={16} className="text-yellow-500 fill-yellow-500" />}
            </motion.div>
        </div>
    )
}

export function TasksScreen({
    tasks,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    selectedDate,
    journalEntries = [],
    onAddJournalEntry,
    onDeleteJournalEntry,
}: TasksScreenProps) {
    const [showMore, setShowMore] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showJournalModal, setShowJournalModal] = useState(false)
    const [activeJournalType, setActiveJournalType] = useState<string>('notes')
    const [journalContent, setJournalContent] = useState('')

    // Form state
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [taskDate, setTaskDate] = useState(selectedDate)
    const [hasNotification, setHasNotification] = useState(false)
    const [notificationTime, setNotificationTime] = useState('09:00')
    const [isImportant, setIsImportant] = useState(false)
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({ type: 'once' })
    const [showFrequencySelector, setShowFrequencySelector] = useState(false)

    const completedCount = tasks.filter(t => t.completed).length
    const totalCount = tasks.length

    function formatDateForDisplay(date: Date): string {
        const day = date.getDate()
        const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.']
        const year = date.getFullYear()
        return `${day} ${months[date.getMonth()]} ${year}г.`
    }

    function formatDateISO(date: Date): string {
        return date.toISOString().split('T')[0]
    }

    const handleAddTask = () => {
        if (newTaskTitle.trim()) {
            onAddTask({
                title: newTaskTitle.trim(),
                date: formatDateISO(taskDate),
                isImportant,
                hasNotification,
                notificationTime: hasNotification ? notificationTime : undefined,
                recurrenceRule: recurrenceRule.type !== 'once' ? recurrenceRule : undefined,
            })
            // Reset form
            setNewTaskTitle('')
            setTaskDate(selectedDate)
            setHasNotification(false)
            setNotificationTime('09:00')
            setIsImportant(false)
            setRecurrenceRule({ type: 'once' })
            setShowFrequencySelector(false)
            setIsAdding(false)
        }
    }

    const handleOpenJournal = (type: string) => {
        setActiveJournalType(type)
        setShowJournalModal(true)
        setJournalContent('')
    }

    const handleSaveJournalEntry = () => {
        if (journalContent.trim() && onAddJournalEntry) {
            onAddJournalEntry(journalTypeMap[activeJournalType], journalContent.trim())
            setJournalContent('')
            setShowJournalModal(false)
        }
    }

    // Get today's journal entries
    const todayISO = formatDateISO(selectedDate)
    const todayEntries = journalEntries.filter(e => e.date === todayISO)

    // Date Picker Modal
    const DatePickerModal = () => (
        <AnimatePresence>
            {showDatePicker && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setShowDatePicker(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[var(--bg-card)] rounded-2xl p-4 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Выберите дату</h3>
                            <button onClick={() => setShowDatePicker(false)} className="text-[var(--text-secondary)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Simple calendar grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-4">
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                                <div key={d} className="py-2 text-[var(--text-secondary)]">{d}</div>
                            ))}
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                const isSelected = taskDate.getDate() === day
                                return (
                                    <motion.button
                                        key={day}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            const newDate = new Date(taskDate)
                                            newDate.setDate(day)
                                            setTaskDate(newDate)
                                            setShowDatePicker(false)
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



    // Full screen add task form
    if (isAdding) {
        return (
            <>
                <DatePickerModal />
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
                    <h1 className="text-xl font-semibold text-center">Добавить задачу</h1>

                    {/* Form */}
                    <div className="space-y-4">
                        {/* Task Title Input */}
                        <textarea
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Введите задачу"
                            autoFocus
                            className="w-full h-24 p-4 bg-[var(--bg-card)] rounded-xl text-base resize-none outline-none"
                        />

                        {/* Date Row - CLICKABLE */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowDatePicker(true)}
                            className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-xl w-full cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-[var(--text-secondary)]" />
                                <span>Дата</span>
                            </div>
                            <span className="text-[var(--accent-blue)]">{formatDateForDisplay(taskDate)}</span>
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
                                    <span>Повторение</span>
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

                            {/* Notification Time - shown when enabled */}
                            {hasNotification && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]"
                                >
                                    <span className="text-[var(--text-secondary)]">Время</span>
                                    <input
                                        type="time"
                                        value={notificationTime}
                                        onChange={(e) => setNotificationTime(e.target.value)}
                                        className="bg-transparent text-[var(--accent-blue)] text-right outline-none"
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Important Toggle */}
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-xl">
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-yellow-500" />
                                <span>Важная</span>
                            </div>
                            <Switch
                                checked={isImportant}
                                onCheckedChange={setIsImportant}
                            />
                        </div>

                        {/* Add Button */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddTask}
                            disabled={!newTaskTitle.trim()}
                            className="btn btn-primary w-full mt-6 cursor-pointer disabled:opacity-50"
                        >
                            Добавить задачу
                        </motion.button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            {/* Journal Modal - inline to avoid re-render issues */}
            <AnimatePresence>
                {showJournalModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
                        onClick={() => setShowJournalModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[var(--bg-primary)] rounded-t-3xl p-6 w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-[var(--bg-button)] rounded-full mx-auto mb-4" />

                            <h3 className="font-semibold text-lg mb-4">
                                {journalLabels[activeJournalType]}
                            </h3>

                            <textarea
                                value={journalContent}
                                onChange={(e) => setJournalContent(e.target.value)}
                                placeholder={`Напишите ${journalLabels[activeJournalType].toLowerCase()}...`}
                                autoFocus
                                className="w-full h-32 p-4 bg-[var(--bg-card)] rounded-xl text-base resize-none outline-none mb-4"
                            />

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSaveJournalEntry}
                                disabled={!journalContent.trim()}
                                className="btn btn-primary w-full cursor-pointer disabled:opacity-50"
                            >
                                Сохранить
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex-1 px-4 space-y-4">
                {/* Counter */}
                <div className="flex justify-end">
                    <div className="py-2 px-4 rounded-xl bg-[var(--bg-card)] text-base font-medium">
                        {completedCount} / {totalCount}
                    </div>
                </div>

                {/* Empty State or Task List */}
                {tasks.length === 0 ? (
                    <div className="empty-state py-12">
                        <StitchMascot variant="waiting" size="lg" className="mb-4" interactive />
                        <p className="text-[var(--text-secondary)] text-base">
                            На сегодня задач нет
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <SwipeableTask
                                key={task.id}
                                task={task}
                                onToggle={onToggleTask}
                                onDelete={onDeleteTask}
                            />
                        ))}
                    </div>
                )}

                {/* Journal Entries for Today */}
                {todayEntries.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[var(--text-secondary)]">Записи дня</h3>
                        {todayEntries.map((entry) => (
                            <SwipeableJournalEntry
                                key={entry.id}
                                entry={entry}
                                onDelete={onDeleteJournalEntry}
                            />
                        ))}
                    </div>
                )}

                {/* Add Task Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAdding(true)}
                    className="btn btn-secondary w-full cursor-pointer"
                >
                    <Plus size={20} />
                    Добавить задачу
                </motion.button>

                {/* More Section Toggle */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowMore(!showMore)}
                    className="flex items-center justify-center gap-2 w-full py-3 text-[var(--text-secondary)] cursor-pointer"
                >
                    {showMore ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <span>Ещё</span>
                </motion.button>

                {/* Extra Sections - Journal buttons */}
                <AnimatePresence>
                    {showMore && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            {[
                                { icon: Clock, label: 'Заметки', type: 'notes' },
                                { icon: Sparkles, label: 'Урок дня', type: 'lesson' },
                                { icon: Heart, label: 'Благодарность', type: 'gratitude' },
                                { icon: MessageCircle, label: 'Мысли', type: 'thoughts' },
                            ].map((item) => (
                                <motion.button
                                    key={item.label}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleOpenJournal(item.type)}
                                    className="list-item w-full cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className="text-[var(--text-secondary)]" />
                                        <span>{item.label}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
