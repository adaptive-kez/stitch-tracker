import WebApp from '@twa-dev/sdk'
import type { TelegramUser } from '@/types'

// Get Telegram WebApp instance
export const tg = WebApp

// Check if running in Telegram WebApp
export const isTelegramWebApp = (): boolean => {
    try {
        return WebApp.initData !== ''
    } catch {
        return false
    }
}

// Get user from Telegram WebApp
export const getTelegramUser = (): TelegramUser | null => {
    try {
        if (!isTelegramWebApp()) {
            // Development mode - return mock user
            return {
                id: 123456789,
                first_name: 'Dev',
                last_name: 'User',
                username: 'devuser',
                language_code: 'ru',
            }
        }

        const user = WebApp.initDataUnsafe.user
        if (!user) return null

        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            language_code: user.language_code,
            photo_url: user.photo_url,
        }
    } catch {
        return null
    }
}

// Get theme colors from Telegram
export const getTelegramTheme = () => {
    try {
        return {
            bgColor: WebApp.themeParams.bg_color || '#1c1c1e',
            textColor: WebApp.themeParams.text_color || '#ffffff',
            hintColor: WebApp.themeParams.hint_color || '#8e8e93',
            linkColor: WebApp.themeParams.link_color || '#6366f1',
            buttonColor: WebApp.themeParams.button_color || '#6366f1',
            buttonTextColor: WebApp.themeParams.button_text_color || '#ffffff',
            secondaryBgColor: WebApp.themeParams.secondary_bg_color || '#2c2c2e',
        }
    } catch {
        return {
            bgColor: '#1c1c1e',
            textColor: '#ffffff',
            hintColor: '#8e8e93',
            linkColor: '#6366f1',
            buttonColor: '#6366f1',
            buttonTextColor: '#ffffff',
            secondaryBgColor: '#2c2c2e',
        }
    }
}

// Expand the WebApp to full height
export const expandWebApp = () => {
    try {
        WebApp.expand()
    } catch {
        // Not in Telegram environment
    }
}

// Enable closing confirmation
export const enableClosingConfirmation = () => {
    try {
        WebApp.enableClosingConfirmation()
    } catch {
        // Not in Telegram environment
    }
}

// Close the WebApp
export const closeApp = () => {
    try {
        WebApp.close()
    } catch {
        // Not in Telegram environment
    }
}

// Haptic feedback
export const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
        try {
            WebApp.HapticFeedback.impactOccurred(style)
        } catch {
            // Not in Telegram environment
        }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
        try {
            WebApp.HapticFeedback.notificationOccurred(type)
        } catch {
            // Not in Telegram environment
        }
    },
    selection: () => {
        try {
            WebApp.HapticFeedback.selectionChanged()
        } catch {
            // Not in Telegram environment
        }
    },
}
