import { useState, useEffect } from 'react'
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
                // Check if user exists in Supabase
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('user_id', userId)
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
                            avatar_url: telegramUser.photo_url || undefined,
                        })
                        .eq('user_id', userId)
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
                            user_id: userId,
                            username: telegramUser.username || undefined,
                            first_name: telegramUser.first_name,
                            last_name: telegramUser.last_name || undefined,
                            avatar_url: telegramUser.photo_url || undefined,
                        })
                        .select()
                        .single()

                    if (createError) throw createError

                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser))
                    setState({ user: newUser, isLoading: false, error: null })
                }
            } catch (error) {
                console.error('Error with user:', error)

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

    return state
}
