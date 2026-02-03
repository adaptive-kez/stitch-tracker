import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeaderProps {
    title: string
    subtitle?: string
    showDateSelector?: boolean
    showBackButton?: boolean
    onBack?: () => void
    onPrevious?: () => void
    onNext?: () => void
    onCalendar?: () => void
    onSettings?: () => void
    // Telegram user data
    user?: {
        firstName: string
        photoUrl?: string
    }
}

export function Header({
    title,
    subtitle,
    showDateSelector = true,
    showBackButton = false,
    onBack,
    onPrevious,
    onNext,
    onCalendar,
    onSettings,
    user,
}: HeaderProps) {
    // Get first letter of user's name for fallback avatar
    const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'U'

    return (
        <div className="px-4 py-3 space-y-3">
            {/* Date Selector Row */}
            {showDateSelector && (
                <div className="flex items-center gap-3">
                    {/* Avatar - clickable for settings */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onSettings}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 cursor-pointer"
                    >
                        {user?.photoUrl ? (
                            <img
                                src={user.photoUrl}
                                alt={user.firstName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            userInitial
                        )}
                    </motion.button>

                    {/* Navigation */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onPrevious}
                        className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                    </motion.button>

                    {/* Date Pill */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onCalendar}
                        className="flex-1 py-2 px-4 rounded-full bg-[var(--bg-button)] text-center cursor-pointer"
                    >
                        <div className="text-sm font-medium text-[var(--text-primary)]">{title}</div>
                        {subtitle && (
                            <div className="text-xs text-[var(--text-secondary)]">{subtitle}</div>
                        )}
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onNext}
                        className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                    >
                        <ChevronRight size={20} />
                    </motion.button>

                    {/* Calendar Icon */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onCalendar}
                        className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                    >
                        <Calendar size={20} />
                    </motion.button>
                </div>
            )}

            {/* Back Button Variant */}
            {showBackButton && (
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        className="flex items-center gap-1 text-[var(--accent-blue)] cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-base">Назад</span>
                    </motion.button>
                </div>
            )}
        </div>
    )
}
