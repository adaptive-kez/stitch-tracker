import { motion } from 'framer-motion'
import { ChevronLeft, Crown, Check, Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import type { SubscriptionStatus } from '@/types'

interface SubscriptionScreenProps {
    status: SubscriptionStatus
    endDate?: string
    autoRenewal: boolean
    onToggleAutoRenewal: (enabled: boolean) => void
    onBack: () => void
}

const FEATURES = {
    free: [
        { text: 'До 10 задач в день', included: true },
        { text: 'Базовая аналитика', included: true },
        { text: 'Уведомления', included: false },
        { text: 'Личные сводки', included: false },
        { text: 'Темы оформления', included: false },
    ],
    premium: [
        { text: 'Безлимитные задачи', included: true },
        { text: 'Расширенная аналитика', included: true },
        { text: 'Умные уведомления', included: true },
        { text: 'Утренние и вечерние сводки', included: true },
        { text: 'Премиум темы', included: true },
    ],
}

export function SubscriptionScreen({ status, endDate, autoRenewal, onToggleAutoRenewal, onBack }: SubscriptionScreenProps) {
    const isActive = status === 'active' || status === 'trial'
    const features = isActive ? FEATURES.premium : FEATURES.free

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—'
        const date = new Date(dateStr)
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
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
                    <div className="font-semibold">Подписка</div>
                </div>
                <div className="w-16" />
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl ${isActive
                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                : 'bg-[var(--bg-card)]'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-full ${isActive ? 'bg-yellow-500' : 'bg-[var(--bg-button)]'}`}>
                        <Crown size={24} className={isActive ? 'text-white' : 'text-[var(--text-secondary)]'} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">
                            {status === 'active' && 'Premium'}
                            {status === 'trial' && 'Пробный период'}
                            {status === 'inactive' && 'Бесплатный'}
                        </h2>
                        {isActive && endDate && (
                            <p className="text-sm text-[var(--text-secondary)]">
                                до {formatDate(endDate)}
                            </p>
                        )}
                    </div>
                </div>

                {isActive && (
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <span>Автопродление</span>
                        <Switch
                            checked={autoRenewal}
                            onCheckedChange={onToggleAutoRenewal}
                        />
                    </div>
                )}
            </div>

            {/* Features */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl space-y-3">
                <h3 className="font-semibold mb-2">
                    {isActive ? 'Ваши возможности' : 'Что включено'}
                </h3>
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${feature.included
                                ? 'bg-[var(--accent-green)]'
                                : 'bg-[var(--bg-button)]'
                            }`}>
                            {feature.included ? (
                                <Check size={12} className="text-white" />
                            ) : (
                                <span className="text-xs text-[var(--text-secondary)]">—</span>
                            )}
                        </div>
                        <span className={feature.included ? '' : 'text-[var(--text-secondary)]'}>
                            {feature.text}
                        </span>
                    </div>
                ))}
            </div>

            {/* Upgrade CTA (only for non-premium) */}
            {!isActive && (
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Zap size={20} />
                    Получить Premium
                </motion.button>
            )}

            {/* Trial info */}
            {status === 'inactive' && (
                <p className="text-center text-sm text-[var(--text-secondary)]">
                    7 дней бесплатного пробного периода
                </p>
            )}
        </div>
    )
}
