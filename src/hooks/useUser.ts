import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, TelegramUser } from '@/types'

interface UseUserState {
    user: User | null
    isLoading: boolean
    error: string | null
}

const LOCAL_USER_KEY = 'stitch_tracker_user'

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
                        // Continue to sync with server in background
                    }
                } catch {
                    // Invalid stored data, continue
                }
            }

            try {
                // Check if user exists in Supabase by telegram_id
                const telegramId = telegramUser.id // Use numeric ID directly
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('telegram_id', telegramId)
                    .single()

                if (fetchError && fetchError.code !== 'PGRST116') {
                    throw fetchError
                }

                if (existingUser) {
                    // Update user info if needed
                    const { data: updatedUser } = await supabase
                        .from('users')
                        .update({
                            username: telegramUser.username || undefined,
                            first_name: telegramUser.first_name,
                            last_name: telegramUser.last_name || undefined,
                            photo_url: telegramUser.photo_url || undefined,
                        })
                        .eq('telegram_id', telegramId)
                        .select()
                        .single()

                    const user = updatedUser || existingUser
                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
                    setState({ user, isLoading: false, error: null })
                } else {
                    // Create new user
                    const { data: newUser, error: createError } = await supabase
                        .from('users')
                        .insert({
                            telegram_id: telegramId,
                            username: telegramUser.username || undefined,
                            first_name: telegramUser.first_name,
                            last_name: telegramUser.last_name || undefined,
                            photo_url: telegramUser.photo_url || undefined,
                        })
                        .select()
                        .single()

                    if (createError) throw createError

                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser))
                    setState({ user: newUser, isLoading: false, error: null })
                }
            } catch (error) {
                // Fallback: create local user
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

    // Update user profile
    const updateProfile = useCallback(async (data: {
        firstName: string
        lastName?: string
        email?: string
        timezone: string
    }): Promise<boolean> => {
        if (!state.user) return false

        try {
            const { data: updatedUser, error } = await supabase
                .from('users')
                .update({
                    first_name: data.firstName,
                    last_name: data.lastName || null,
                    email: data.email || null,
                    timezone: data.timezone,
                })
                .eq('user_id', state.user.user_id)
                .select()
                .single()

            if (error) throw error

            // Update local state
            setState(prev => ({
                ...prev,
                user: updatedUser,
            }))
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser))
            return true
        } catch (error) {
            // Fallback: update locally
            const updatedUser = {
                ...state.user,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                timezone: data.timezone,
            }
            setState(prev => ({
                ...prev,
                user: updatedUser,
            }))
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser))
            return true
        }
    }, [state.user])

    return {
        ...state,
        updateProfile,
    }
}

