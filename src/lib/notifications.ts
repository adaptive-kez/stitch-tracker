/**
 * Notification Service for Stitch Tracker
 * Sends notifications via Cloudflare Worker -> Telegram Bot API
 */

const WORKER_URL = 'https://stitch-tracker-notifications.stitch-tracker-api.workers.dev'

export interface NotificationPayload {
    chatId: number | string
    message: string
    type?: 'task' | 'habit' | 'goal'
    title?: string
}

export interface ScheduledNotification extends NotificationPayload {
    scheduledTime: string // ISO datetime
}

/**
 * Send immediate notification
 */
export async function sendNotification(
    payload: NotificationPayload
): Promise<{ success: boolean; messageId?: number; error?: string }> {
    try {
        const response = await fetch(`${WORKER_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        return await response.json()
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

/**
 * Schedule notification for later
 */
export async function scheduleNotification(
    payload: ScheduledNotification
): Promise<{ success: boolean; scheduled?: boolean; error?: string }> {
    try {
        const response = await fetch(`${WORKER_URL}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
