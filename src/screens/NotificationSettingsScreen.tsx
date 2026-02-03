import { motion } from 'framer-motion'
import { ChevronLeft, Bell, Sun, Moon, BellOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface NotificationSettingsScreenProps {
    notificationsEnabled: boolean
    morningSummaryEnabled: boolean
    eveningSummaryEnabled: boolean
    morningSummaryTime: string
    eveningSummaryTime: string
    onToggleNotifications: (enabled: boolean) => void
    onToggleMorningSummary: (enabled: boolean) => void
    onToggleEveningSummary: (enabled: boolean) => void
    onChangeMorningTime: (time: string) => void
    onChangeEveningTime: (time: string) => void
    onBack: () => void
}

export function NotificationSettingsScreen({
    notificationsEnabled,
    morningSummaryEnabled,
    eveningSummaryEnabled,
    morningSummaryTime,
    eveningSummaryTime,
    onToggleNotifications,
    onToggleMorningSummary,
    onToggleEveningSummary,
    onChangeMorningTime,
    onChangeEveningTime,
    onBack,
}: NotificationSettingsScreenProps) {
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
                    <div className="font-semibold">Уведомления</div>
                </div>
                <div className="w-16" />
            </div>

            {/* Master Toggle */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {notificationsEnabled ? (
                            <Bell size={20} className="text-[var(--accent-blue)]" />
                        ) : (
                            <BellOff size={20} className="text-[var(--text-secondary)]" />
                        )}
                        <div>
                            <div className="font-medium">Уведомления</div>
                            <div className="text-sm text-[var(--text-secondary)]">
                                {notificationsEnabled ? 'Включены' : 'Выключены'}
                            </div>
                        </div>
                    </div>
                    <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={onToggleNotifications}
                    />
                </div>
            </div>

            {/* Summary Settings */}
            <div className={`space-y-4 transition-opacity ${notificationsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="font-semibold px-1">Личные сводки</h3>

                {/* Morning Summary */}
                <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sun size={20} className="text-yellow-500" />
                            <div>
                                <div className="font-medium">Утренняя сводка</div>
                                <div className="text-sm text-[var(--text-secondary)]">
                                    Планы на день и мотивация
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={morningSummaryEnabled}
                            onCheckedChange={onToggleMorningSummary}
                        />
                    </div>

                    {morningSummaryEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]"
                        >
                            <span className="text-[var(--text-secondary)]">Время</span>
                            <input
                                type="time"
                                value={morningSummaryTime}
                                onChange={(e) => onChangeMorningTime(e.target.value)}
                                className="bg-transparent text-[var(--accent-blue)] text-right outline-none cursor-pointer"
                            />
                        </motion.div>
                    )}
                </div>

                {/* Evening Summary */}
                <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Moon size={20} className="text-indigo-400" />
                            <div>
                                <div className="font-medium">Вечерняя сводка</div>
                                <div className="text-sm text-[var(--text-secondary)]">
                                    Итоги дня и благодарности
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={eveningSummaryEnabled}
                            onCheckedChange={onToggleEveningSummary}
                        />
                    </div>

                    {eveningSummaryEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]"
                        >
                            <span className="text-[var(--text-secondary)]">Время</span>
                            <input
                                type="time"
                                value={eveningSummaryTime}
                                onChange={(e) => onChangeEveningTime(e.target.value)}
                                className="bg-transparent text-[var(--accent-blue)] text-right outline-none cursor-pointer"
                            />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Info */}
            <p className="text-sm text-[var(--text-secondary)] text-center px-4">
                Сводки будут отправляться в Telegram согласно выбранному времени
            </p>
        </div>
    )
}
