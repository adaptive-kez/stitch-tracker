/**
 * Notification Service for Stitch Tracker
 * Routes through main D1 Worker → Notification Worker (secured)
 */

import WebApp from '@twa-dev/sdk'

const API_URL = import.meta.env.VITE_API_URL || ''

export interface NotificationPayload {
    chatId: number | string
    message: string
    type?: 'task' | 'habit' | 'goal'
    title?: string
}

export interface ScheduledNotification extends NotificationPayload {
    scheduledTime: string // ISO datetime
}

function getAuthHeaders(chatId: number | string): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    const initData = WebApp.initData
    if (initData) {
        headers['X-Telegram-Init-Data'] = initData
    } else {
        headers['X-User-Id'] = String(chatId)
    }
    return headers
}

/**
 * Send immediate notification (proxied through main Worker)
 */
export async function sendNotification(
    payload: NotificationPayload
): Promise<{ success: boolean; messageId?: number; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/notify/send`, {
            method: 'POST',
            headers: getAuthHeaders(payload.chatId),
            body: JSON.stringify(payload),
        })

        return await response.json()
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

/**
 * Schedule notification for later (proxied through main Worker)
 */
export async function scheduleNotification(
    payload: ScheduledNotification
): Promise<{ success: boolean; scheduled?: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/notify/schedule`, {
            method: 'POST',
            headers: getAuthHeaders(payload.chatId),
            body: JSON.stringify(payload),
        })

        return await response.json()
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

/**
 * Test notification (sends a test message)
 */
export async function sendTestNotification(chatId: number | string): Promise<boolean> {
    const result = await sendNotification({
        chatId,
        message: '🎉 Уведомления работают!\n\nВы будете получать напоминания о задачах и привычках.',
        type: 'task',
    })
    return result.success
}
