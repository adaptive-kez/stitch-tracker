import { useState } from 'react'
import { User, Bell, HelpCircle, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { ProfileScreen } from './ProfileScreen'
import { NotificationSettingsScreen } from './NotificationSettingsScreen'
import type { User as UserType } from '@/types'

interface SettingsScreenProps {
    onClose: () => void
    onUpdateProfile: (data: { firstName: string; lastName?: string; email?: string; timezone: string }) => Promise<boolean>
    userProfile: UserType | null
}

type SettingsView = 'main' | 'profile' | 'notifications'

export function SettingsScreen({ onClose, onUpdateProfile, userProfile }: SettingsScreenProps) {
    const [currentView, setCurrentView] = useState<SettingsView>('main')

    // Default user data
    const userData = {
        firstName: userProfile?.first_name || 'Пользователь',
        lastName: userProfile?.last_name,
        email: userProfile?.email,
        timezone: userProfile?.timezone || 'Europe/Moscow',
        summariesEnabled: userProfile?.summaries_enabled || false,
        morningSummaryTime: userProfile?.morning_summary_time || '09:00',
        eveningSummaryTime: userProfile?.evening_summary_time || '21:00',
    }

    // Local state for settings
    const [notificationsEnabled, setNotificationsEnabled] = useState(userData.summariesEnabled)
    const [morningSummaryEnabled, setMorningSummaryEnabled] = useState(true)
    const [eveningSummaryEnabled, setEveningSummaryEnabled] = useState(true)
    const [morningSummaryTime, setMorningSummaryTime] = useState(userData.morningSummaryTime)
    const [eveningSummaryTime, setEveningSummaryTime] = useState(userData.eveningSummaryTime)

    // Render sub-screens
    if (currentView === 'profile') {
        return (
            <ProfileScreen
                user={{
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    timezone: userData.timezone,
                }}
                onSave={async (data) => {
                    const success = await onUpdateProfile(data)
                    if (success) {
                        setCurrentView('main')
                    }
                }}
                onBack={() => setCurrentView('main')}
            />
        )
    }

    if (currentView === 'notifications') {
        return (
            <NotificationSettingsScreen
                notificationsEnabled={notificationsEnabled}
                morningSummaryEnabled={morningSummaryEnabled}
                eveningSummaryEnabled={eveningSummaryEnabled}
                morningSummaryTime={morningSummaryTime}
                eveningSummaryTime={eveningSummaryTime}
                onToggleNotifications={setNotificationsEnabled}
                onToggleMorningSummary={setMorningSummaryEnabled}
                onToggleEveningSummary={setEveningSummaryEnabled}
                onChangeMorningTime={setMorningSummaryTime}
                onChangeEveningTime={setEveningSummaryTime}
                onBack={() => setCurrentView('main')}
            />
        )
    }

    const settingsItems = [
        {
            id: 'profile' as const,
            icon: User,
            label: 'Профиль',
            color: '#3B82F6',
            rightText: undefined,
        },
        {
            id: 'notifications' as const,
            icon: Bell,
            label: 'Уведомления',
            color: '#EF4444',
            rightText: notificationsEnabled ? 'Вкл' : 'Выкл',
        },
        {
            id: 'support' as const,
            icon: HelpCircle,
            label: 'Обратиться в поддержку',
            color: '#F97316',
            rightText: undefined,
        },
    ]

    const handleItemClick = (id: string) => {
        if (id === 'profile' || id === 'notifications') {
            setCurrentView(id as SettingsView)
        } else if (id === 'support') {
            window.open('https://t.me/prostotracker_support', '_blank')
        }
    }

    return (
        <div className="flex-1 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between py-2">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="flex items-center gap-1 text-[var(--accent-blue)] cursor-pointer"
                >
                    <ChevronRight size={20} className="rotate-180" />
                    <span>Назад</span>
                </motion.button>
                <div className="text-center">
                    <div className="font-semibold">Просто Трекер</div>
                    <div className="text-xs text-[var(--text-secondary)]">мини-приложение</div>
                </div>
                <div className="w-16" />
            </div>

            {/* Section Title */}
            <h2 className="text-lg text-[var(--text-secondary)]">Основные настройки</h2>

            {/* Settings List */}
            <div className="space-y-1">
                {settingsItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <motion.button
                            key={item.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleItemClick(item.id)}
                            className="settings-item w-full cursor-pointer"
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: item.color }}
                            >
                                <Icon size={18} className="text-white" />
                            </div>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.rightText && (
                                <span className="text-[var(--text-secondary)] text-sm mr-2">
                                    {item.rightText}
                                </span>
                            )}
                            <ChevronRight size={18} className="text-[var(--text-secondary)]" />
                        </motion.button>
                    )
                })}
            </div>

            {/* Legal Links */}
            <div className="pt-4 space-y-3">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left text-[var(--accent-blue)] cursor-pointer"
                >
                    Пользовательское соглашение
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left text-[var(--accent-blue)] cursor-pointer"
                >
                    Политика конфиденциальности
                </motion.button>
            </div>
        </div>
    )
}
