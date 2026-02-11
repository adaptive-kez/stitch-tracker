import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    onSelect: (date: Date) => void
    title?: string
}

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function DatePickerModal({
    isOpen,
    onClose,
    selectedDate,
    onSelect,
    title = 'Выберите дату'
}: DatePickerModalProps) {
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())

    const today = new Date()
    const todayDate = today.getDate()
    const todayMonth = today.getMonth()
    const todayYear = today.getFullYear()

    // Days in the viewed month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    // First day of month (0=Sun, convert so Mon=0)
    const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay()
    const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1 // Mon=0, Sun=6

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(viewYear - 1)
        } else {
            setViewMonth(viewMonth - 1)
        }
    }

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(viewYear + 1)
        } else {
            setViewMonth(viewMonth + 1)
        }
    }

    const handleSelectDay = (day: number) => {
        const newDate = new Date(viewYear, viewMonth, day, 12, 0, 0)
        onSelect(newDate)
        onClose()
    }

    const isSelected = (day: number) =>
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear

    const isToday = (day: number) =>
        day === todayDate && viewMonth === todayMonth && viewYear === todayYear

    return (
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
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{title}</h3>
                            <button onClick={onClose} className="text-[var(--text-secondary)] cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Month/Year Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={goToPrevMonth}
                                className="p-2 rounded-full hover:bg-[var(--bg-button)] cursor-pointer"
                            >
                                <ChevronLeft size={20} />
                            </motion.button>
                            <span className="font-medium text-base">
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </span>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={goToNextMonth}
                                className="p-2 rounded-full hover:bg-[var(--bg-button)] cursor-pointer"
                            >
                                <ChevronRight size={20} />
                            </motion.button>
                        </div>

                        {/* Day names header */}
                        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                            {DAY_NAMES.map(d => (
                                <div key={d} className="py-1 text-[var(--text-secondary)] text-xs font-medium">{d}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                            {/* Empty cells for padding before day 1 */}
                            {Array.from({ length: firstDay }, (_, i) => (
                                <div key={`empty-${i}`} className="py-2" />
                            ))}

                            {/* Actual days */}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1
                                const selected = isSelected(day)
                                const todayMark = isToday(day)

                                return (
                                    <motion.button
                                        key={day}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleSelectDay(day)}
                                        className={`py-2 rounded-full cursor-pointer relative ${selected
                                                ? 'bg-[var(--accent-blue)] text-white'
                                                : todayMark
                                                    ? 'ring-2 ring-[var(--accent-blue)] ring-offset-1 ring-offset-[var(--bg-card)]'
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
}
