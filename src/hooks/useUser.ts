import { useState, useEffect, useCallback } from 'react'
import { profileApi, type DbProfile } from '@/lib/api'
import type { User, TelegramUser, SubscriptionStatus } from '@/types'

interface UseUserState {
    user: User | null
    isLoading: boolean
    error: string | null
}

const LOCAL_USER_KEY = 'stitch_tracker_user'

function profileToUser(p: DbProfile): User {
    return {
        id: p.id,
        user_id: p.user_id,
        username: p.username || undefined,
        first_name: p.first_name || undefined,
        last_name: p.last_name || undefined,
        avatar_url: p.avatar_url || undefined,
        email: p.email || undefined,
        timezone: p.timezone || 'Europe/Moscow',
        subscription_status: (p.subscription_status || 'inactive') as SubscriptionStatus,
        auto_renewal: !!p.auto_renewal,
        morning_summary_time: p.morning_summary_time || '09:00',
        evening_summary_time: p.evening_summary_time || '21:00',
        summaries_enabled: !!p.summaries_enabled,
        created_at: p.created_at,
    }
}

export function useUser(telegramUser: TelegramUser | null) {
    const [state, setState] = useState<UseUserState>({
        user: null,
        isLoading: true,
        error: null,
    })

    useEffect(() => {
        if (!telegramUser) {
            setState({ user: null, isLoading: false, error: null })
            return
        }

        const fetchOrCreateUser = async () => {
            const userId = telegramUser.id.toString()

            // Check localStorage first for faster load
            const storedUser = localStorage.getItem(LOCAL_USER_KEY)
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser)
                    if (parsed.user_id === userId) {
                        setState({ user: parsed, isLoading: false, error: null })
                    }
                } catch {
                    // Invalid stored data, continue
                }
            }

            try {
                // Upsert profile via Worker API
                const profile = await profileApi.upsert(userId, {
                    username: telegramUser.username || undefined,
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name || undefined,
                    avatar_url: telegramUser.photo_url || undefined,
                })

                if (profile) {
                    const user = profileToUser(profile)
                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
                    setState({ user, isLoading: false, error: null })
                }
            } catch (error) {
                console.error('Error syncing user profile:', error)
                const localUser: User = {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    username: telegramUser.username,
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name,
                    avatar_url: telegramUser.photo_url,
                    timezone: 'Europe/Moscow',
                    subscription_status: 'inactive',
                    auto_renewal: false,
                    morning_summary_time: '09:00',
                    evening_summary_time: '21:00',
                    summaries_enabled: false,
                    created_at: new Date().toISOString(),
                }
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser))
                setState({ user: localUser, isLoading: false, error: null })
            }
        }

        fetchOrCreateUser()
    }, [telegramUser])

    const updateProfile = useCallback(async (data: {
        firstName: string
        lastName?: string
        email?: string
        timezone: string
    }): Promise<boolean> => {
        if (!state.user) return false

        try {
            await profileApi.upsert(state.user.user_id, {
                first_name: data.firstName,
                last_name: data.lastName || null,
                email: data.email || null,
                timezone: data.timezone,
            })

            const updatedUser = {
                ...state.user,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                timezone: data.timezone,
            }
            setState(prev => ({ ...prev, user: updatedUser }))
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser))
            return true
        } catch (error) {
            console.error('Error updating profile:', error)
            const updatedUser = {
                ...state.user,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                timezone: data.timezone,
            }
            setState(prev => ({ ...prev, user: updatedUser }))
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser))
            return true
        }
    }, [state.user])

    return {
        ...state,
        updateProfile,
    }
}
