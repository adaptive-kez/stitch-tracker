import { useState } from 'react'
import { User, Crown, Bell, HelpCircle, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { ProfileScreen } from './ProfileScreen'
import { SubscriptionScreen } from './SubscriptionScreen'
import { NotificationSettingsScreen } from './NotificationSettingsScreen'
import type { SubscriptionStatus } from '@/types'

interface SettingsScreenProps {
    onClose: () => void
    // User data (would come from context/props in real app)
    user?: {
        firstName: string
        lastName?: string
        email?: string
        timezone: string
        subscriptionStatus: SubscriptionStatus
        subscriptionEndDate?: string
        autoRenewal: boolean
        summariesEnabled: boolean
        morningSummaryTime: string
        eveningSummaryTime: string
    }
}

type SettingsView = 'main' | 'profile' | 'subscription' | 'notifications'

export function SettingsScreen({ onClose, user }: SettingsScreenProps) {
    const [currentView, setCurrentView] = useState<SettingsView>('main')

    // Mock user data if not provided
    const userData = user || {
        firstName: 'Пользователь',
        lastName: undefined,
        email: undefined,
        timezone: 'Europe/Moscow',
        subscriptionStatus: 'inactive' as SubscriptionStatus,
        subscriptionEndDate: undefined,
        autoRenewal: false,
        summariesEnabled: true,
        morningSummaryTime: '09:00',
        eveningSummaryTime: '21:00',
    }

    // Local state for settings (in real app, this would sync with backend)
    const [notificationsEnabled, setNotificationsEnabled] = useState(userData.summariesEnabled)
    const [morningSummaryEnabled, setMorningSummaryEnabled] = useState(true)
    const [eveningSummaryEnabled, setEveningSummaryEnabled] = useState(true)
    const [morningSummaryTime, setMorningSummaryTime] = useState(userData.morningSummaryTime)
    const [eveningSummaryTime, setEveningSummaryTime] = useState(userData.eveningSummaryTime)
    const [autoRenewal, setAutoRenewal] = useState(userData.autoRenewal)

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
                onSave={(data) => {
                    console.log('Save profile:', data)
                    setCurrentView('main')
                }}
                onBack={() => setCurrentView('main')}
            />
        )
    }

    if (currentView === 'subscription') {
        return (
            <SubscriptionScreen
                status={userData.subscriptionStatus}
                endDate={userData.subscriptionEndDate}
                autoRenewal={autoRenewal}
                onToggleAutoRenewal={setAutoRenewal}
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
            id: 'subscription' as const,
            icon: Crown,
            label: 'Подписка',
            color: '#F59E0B',
            rightText: userData.subscriptionStatus === 'active' ? 'Premium'
                : userData.subscriptionStatus === 'trial' ? 'Пробный'
                    : 'Неактивна',
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
        if (id === 'profile' || id === 'subscription' || id === 'notifications') {
            setCurrentView(id as SettingsView)
        } else if (id === 'support') {
            // Open Telegram support chat
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
                <div className="w-16" /> {/* Spacer for centering */}
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
