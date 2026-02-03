import { useEffect, useState } from 'react'
import { getTelegramUser, getTelegramTheme, expandWebApp } from '@/lib/telegram'
import type { TelegramUser } from '@/types'

interface TelegramState {
    user: TelegramUser | null
    theme: ReturnType<typeof getTelegramTheme>
    isReady: boolean
}

export function useTelegram() {
    const [state, setState] = useState<TelegramState>({
        user: null,
        theme: getTelegramTheme(),
        isReady: false,
    })

    useEffect(() => {
        // Expand WebApp to full height
        expandWebApp()

        // Get user data
        const user = getTelegramUser()
        const theme = getTelegramTheme()

        setState({
            user,
            theme,
            isReady: true,
        })
    }, [])

    return state
}
