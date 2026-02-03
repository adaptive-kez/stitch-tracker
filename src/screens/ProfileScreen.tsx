import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, User, Mail, Globe, Save } from 'lucide-react'
import { COMMON_TIMEZONES } from '@/types'

interface ProfileScreenProps {
    user: {
        firstName: string
        lastName?: string
        email?: string
        timezone: string
    }
    onSave: (data: { firstName: string; lastName?: string; email?: string; timezone: string }) => void
    onBack: () => void
}

export function ProfileScreen({ user, onSave, onBack }: ProfileScreenProps) {
    const [firstName, setFirstName] = useState(user.firstName)
    const [lastName, setLastName] = useState(user.lastName || '')
    const [email, setEmail] = useState(user.email || '')
    const [timezone, setTimezone] = useState(user.timezone)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave({
                firstName,
                lastName: lastName || undefined,
                email: email || undefined,
                timezone,
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex-1 px-4 py-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="flex items-center gap-1 text-[var(--accent-blue)] cursor-pointer"
                >
                    <ChevronLeft size={20} />
                    <span>Назад</span>
                </motion.button>
                <div className="text-center">
                    <div className="font-semibold">Профиль</div>
                </div>
                <div className="w-16" />
            </div>

            {/* Avatar */}
            <div className="flex justify-center py-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {firstName.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
                {/* First Name */}
                <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-2">
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <User size={16} />
                        Имя
                    </label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-transparent outline-none text-base"
                        placeholder="Введите имя"
                    />
                </div>

                {/* Last Name */}
                <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-2">
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <User size={16} />
                        Фамилия
                    </label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-transparent outline-none text-base"
                        placeholder="Введите фамилию"
                    />
                </div>

                {/* Email */}
                <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-2">
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Mail size={16} />
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent outline-none text-base"
                        placeholder="example@mail.com"
                    />
                </div>

                {/* Timezone */}
                <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-2">
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Globe size={16} />
                        Часовой пояс
                    </label>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-transparent outline-none text-base cursor-pointer"
                    >
                        {COMMON_TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value} className="bg-[var(--bg-card)]">
                                {tz.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Save Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={!firstName.trim() || isSaving}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    <Save size={18} />
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                </motion.button>
            </div>
        </div>
    )
}
