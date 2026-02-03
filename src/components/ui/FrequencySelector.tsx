import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { RecurrenceRule, RecurrenceType } from '@/types'

interface FrequencySelectorProps {
    value: RecurrenceRule
    onChange: (rule: RecurrenceRule) => void
    className?: string
}

const FREQUENCY_OPTIONS: { id: RecurrenceType; label: string }[] = [
    { id: 'once', label: 'Один раз' },
    { id: 'daily', label: 'Каждый день' },
    { id: 'weekdays', label: 'По будням' },
    { id: 'weekends', label: 'По выходным' },
    { id: 'every_n', label: 'Каждые N дней' },
    { id: 'specific_days', label: 'Определённые дни' },
]

const WEEKDAYS = [
    { id: 0, short: 'ВС', full: 'Воскресенье' },
    { id: 1, short: 'ПН', full: 'Понедельник' },
    { id: 2, short: 'ВТ', full: 'Вторник' },
    { id: 3, short: 'СР', full: 'Среда' },
    { id: 4, short: 'ЧТ', full: 'Четверг' },
    { id: 5, short: 'ПТ', full: 'Пятница' },
    { id: 6, short: 'СБ', full: 'Суббота' },
]

export function FrequencySelector({ value, onChange, className = '' }: FrequencySelectorProps) {
    const [intervalValue, setIntervalValue] = useState(value.interval || 2)
    const [selectedDays, setSelectedDays] = useState<number[]>(value.days || [])

    // Sync interval input with parent
    useEffect(() => {
        if (value.type === 'every_n' && intervalValue !== value.interval) {
            onChange({ ...value, interval: intervalValue })
        }
    }, [intervalValue])

    // Sync selected days with parent
    useEffect(() => {
        if (value.type === 'specific_days' && JSON.stringify(selectedDays) !== JSON.stringify(value.days)) {
            onChange({ ...value, days: selectedDays })
        }
    }, [selectedDays])

    const handleTypeChange = (type: RecurrenceType) => {
        const newRule: RecurrenceRule = { type }

        if (type === 'every_n') {
            newRule.interval = intervalValue
        } else if (type === 'specific_days') {
            newRule.days = selectedDays.length > 0 ? selectedDays : [1] // Default to Monday
        }

        onChange(newRule)
    }

    const toggleDay = (dayId: number) => {
        setSelectedDays(prev => {
            if (prev.includes(dayId)) {
                // Don't allow deselecting the last day
                if (prev.length === 1) return prev
                return prev.filter(d => d !== dayId)
            }
            return [...prev, dayId].sort((a, b) => a - b)
        })
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Frequency Type Pills */}
            <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map((option) => (
                    <motion.button
                        key={option.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTypeChange(option.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${value.type === option.id
                                ? 'bg-[var(--accent-blue)] text-white'
                                : 'bg-[var(--bg-button)] text-[var(--text-secondary)]'
                            }`}
                    >
                        {option.label}
                    </motion.button>
                ))}
            </div>

            {/* Every N Days Input */}
            {value.type === 'every_n' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3"
                >
                    <span className="text-sm text-[var(--text-secondary)]">Каждые</span>
                    <input
                        type="number"
                        min={2}
                        max={30}
                        value={intervalValue}
                        onChange={(e) => setIntervalValue(Math.max(2, Math.min(30, parseInt(e.target.value) || 2)))}
                        className="w-16 px-3 py-2 rounded-lg bg-[var(--bg-button)] text-center text-[var(--text-primary)] border-none outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">дней</span>
                </motion.div>
            )}

            {/* Specific Days Selector */}
            {value.type === 'specific_days' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 justify-center"
                >
                    {WEEKDAYS.map((day) => (
                        <motion.button
                            key={day.id}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleDay(day.id)}
                            title={day.full}
                            className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${selectedDays.includes(day.id)
                                    ? 'bg-[var(--accent-blue)] text-white'
                                    : 'bg-[var(--bg-button)] text-[var(--text-secondary)]'
                                }`}
                        >
                            {day.short}
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </div>
    )
}

// Helper function to get human-readable description of recurrence rule
export function getRecurrenceDescription(rule: RecurrenceRule): string {
    switch (rule.type) {
        case 'once':
            return 'Один раз'
        case 'daily':
            return 'Ежедневно'
        case 'weekdays':
            return 'По будням'
        case 'weekends':
            return 'По выходным'
        case 'every_n':
            return `Каждые ${rule.interval || 2} дня`
        case 'specific_days':
            if (!rule.days || rule.days.length === 0) return 'Не выбрано'
            const dayNames = rule.days.map(d => WEEKDAYS.find(w => w.id === d)?.short || '').join(', ')
            return dayNames
        default:
            return 'Один раз'
    }
}

// Helper function to check if a date matches a recurrence rule
export function matchesRecurrence(rule: RecurrenceRule, date: Date, startDate?: Date): boolean {
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

    switch (rule.type) {
        case 'once':
            return true // Will be handled by exact date match
        case 'daily':
            return true
        case 'weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5
        case 'weekends':
            return dayOfWeek === 0 || dayOfWeek === 6
        case 'every_n':
            if (!startDate || !rule.interval) return false
            const diffTime = date.getTime() - startDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            return diffDays >= 0 && diffDays % rule.interval === 0
        case 'specific_days':
            return rule.days?.includes(dayOfWeek) || false
        default:
            return false
    }
}
