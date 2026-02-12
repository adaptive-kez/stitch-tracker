/**
 * Stitch Tracker API — Cloudflare Worker
 * Replaces direct Supabase access with D1 + KV
 */

export interface Env {
    DB: D1Database
    CACHE: KVNamespace
    ENVIRONMENT: string
    NOTIFICATION_WORKER_URL: string
    NOTIFICATION_SECRET: string
    BOT_TOKEN: string
}

// --- Telegram initData HMAC-SHA256 Validation ---
const encoder = new TextEncoder()

async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
}

function bufToHex(buf: ArrayBuffer): string {
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

interface InitDataValidation {
    valid: boolean
    userId?: string
    error?: string
}

async function validateInitData(initData: string, botToken: string): Promise<InitDataValidation> {
    if (!initData) return { valid: false, error: 'Missing initData' }

    try {
        const params = new URLSearchParams(initData)
        const hash = params.get('hash')
        if (!hash) return { valid: false, error: 'Missing hash in initData' }

        // Build data_check_string: sort params alphabetically (excluding hash)
        params.delete('hash')
        const dataCheckString = [...params.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n')

        // Derive secret key: HMAC-SHA256("WebAppData", botToken)
        const secretKey = await hmacSha256(encoder.encode('WebAppData'), botToken)

        // Compute hash: HMAC-SHA256(secretKey, dataCheckString)
        const computedHash = bufToHex(await hmacSha256(secretKey, dataCheckString))

        if (computedHash !== hash) {
            return { valid: false, error: 'Invalid hash' }
        }

        // Check auth_date freshness (5 minutes)
        const authDate = parseInt(params.get('auth_date') || '0')
        const now = Math.floor(Date.now() / 1000)
        if (now - authDate > 300) {
            return { valid: false, error: 'initData expired (>5 min)' }
        }

        // Extract user_id from user JSON
        const userJson = params.get('user')
        if (!userJson) return { valid: false, error: 'Missing user in initData' }

        const user = JSON.parse(userJson)
        if (!user.id) return { valid: false, error: 'Missing user.id in initData' }

        return { valid: true, userId: String(user.id) }
    } catch (e) {
        return { valid: false, error: `Validation error: ${(e as Error).message}` }
    }
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://stitch-tracker.pages.dev',
    'http://localhost:5173', // Vite dev
    'http://localhost:4173', // Vite preview
]

function getCorsHeaders(request: Request) {
    const origin = request.headers.get('Origin') || ''
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ''
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data, X-User-Id',
    }
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

function error(message: string, status = 400): Response {
    return json({ error: message }, status)
}

function uuid(): string {
    return crypto.randomUUID()
}

// Authenticate user: validate initData in production, allow X-User-Id in dev
async function getAuthenticatedUserId(request: Request, env: Env): Promise<InitDataValidation> {
    // Try initData first (production flow)
    const initData = request.headers.get('X-Telegram-Init-Data')
    if (initData) {
        return validateInitData(initData, env.BOT_TOKEN)
    }

    // Dev fallback: allow X-User-Id header only in non-production
    if (env.ENVIRONMENT !== 'production') {
        const userId = request.headers.get('X-User-Id')
        if (userId) return { valid: true, userId }
    }

    return { valid: false, error: 'Missing authentication (X-Telegram-Init-Data header required)' }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const corsHeaders = getCorsHeaders(request)

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders })
        }

        const url = new URL(request.url)
        const path = url.pathname
        const method = request.method

        // Helper to add CORS headers to any response
        const withCors = (response: Response): Response => {
            const newHeaders = new Headers(response.headers)
            for (const [key, value] of Object.entries(corsHeaders)) {
                newHeaders.set(key, value)
            }
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            })
        }

        // --- Authentication & Rate Limiting ---
        let userId: string | null = null

        if (path !== '/api/health') {
            const auth = await getAuthenticatedUserId(request, env)
            if (!auth.valid) {
                return withCors(error(auth.error || 'Unauthorized', 401))
            }
            userId = auth.userId!

            // Rate limiting (using authenticated userId)
            const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE'
            const bucket = isWrite ? 'w' : 'r'
            const limit = isWrite ? 20 : 60
            const minute = Math.floor(Date.now() / 60000)
            const rateKey = `rate:${userId}:${bucket}:${minute}`

            const current = parseInt(await env.CACHE.get(rateKey) || '0')
            if (current >= limit) {
                return withCors(error(`Rate limit exceeded (${limit}/${bucket === 'w' ? 'writes' : 'reads'} per minute)`, 429))
            }
            env.CACHE.put(rateKey, String(current + 1), { expirationTtl: 60 })
        }

        const response = await (async (): Promise<Response> => {
            try {
                // --- TASKS ---
                if (path === '/api/tasks') {
                    if (!userId) return error('Unauthorized', 401)

                    if (method === 'GET') {
                        const rows = await env.DB.prepare(
                            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC'
                        ).bind(userId).all()
                        return json(rows.results)
                    }

                    if (method === 'POST') {
                        const body = await request.json() as Record<string, unknown>
                        const tasks = Array.isArray(body) ? body : [body]
                        const results = []

                        for (const task of tasks) {
                            const id = uuid()
                            await env.DB.prepare(`
              INSERT INTO tasks (id, user_id, title, date, is_completed, is_important, has_notification, notification_time, timezone, recurrence_rule)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                                id,
                                userId,
                                task.title,
                                task.date || new Date().toISOString().split('T')[0],
                                task.is_completed ? 1 : 0,
                                task.is_important ? 1 : 0,
                                task.has_notification ? 1 : 0,
                                task.notification_time || null,
                                task.timezone || 'UTC',
                                task.recurrence_rule ? JSON.stringify(task.recurrence_rule) : null,
                            ).run()

                            results.push({ ...task, id, user_id: userId })
                        }
                        return json(results, 201)
                    }

                    if (method === 'DELETE') {
                        const { id, ids } = await request.json() as { id?: string; ids?: string[] }
                        if (ids && ids.length > 0) {
                            // Batch delete
                            const placeholders = ids.map(() => '?').join(',')
                            await env.DB.prepare(
                                `DELETE FROM tasks WHERE id IN (${placeholders}) AND user_id = ?`
                            ).bind(...ids, userId).run()
                        } else if (id) {
                            await env.DB.prepare(
                                'DELETE FROM tasks WHERE id = ? AND user_id = ?'
                            ).bind(id, userId).run()
                        }
                        return json({ success: true })
                    }
                }

                // --- TASKS UPDATE (toggle, etc.) ---
                if (path.startsWith('/api/tasks/') && method === 'PUT') {
                    if (!userId) return error('Unauthorized', 401)
                    const taskId = path.split('/api/tasks/')[1]
                    const body = await request.json() as Record<string, unknown>

                    const sets: string[] = []
                    const values: unknown[] = []

                    if ('is_completed' in body) {
                        sets.push('is_completed = ?')
                        values.push(body.is_completed ? 1 : 0)
                    }
                    if ('title' in body) {
                        sets.push('title = ?')
                        values.push(body.title)
                    }
                    if ('is_important' in body) {
                        sets.push('is_important = ?')
                        values.push(body.is_important ? 1 : 0)
                    }

                    sets.push("updated_at = datetime('now')")
                    values.push(taskId, userId)

                    await env.DB.prepare(
                        `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
                    ).bind(...values).run()

                    return json({ success: true })
                }

                // --- HABITS ---
                if (path === '/api/habits') {
                    if (!userId) return error('Unauthorized', 401)

                    if (method === 'GET') {
                        const rows = await env.DB.prepare(
                            'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC'
                        ).bind(userId).all()
                        return json(rows.results)
                    }

                    if (method === 'POST') {
                        const body = await request.json() as Record<string, unknown>
                        const id = uuid()
                        await env.DB.prepare(`
            INSERT INTO habits (id, user_id, title, icon, color, start_date, end_date, has_notification, notification_time, timezone, recurrence_rule)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
                            id,
                            userId,
                            body.title,
                            body.icon || '⭐',
                            body.color || '#6366f1',
                            body.start_date || null,
                            body.end_date || null,
                            body.has_notification ? 1 : 0,
                            body.notification_time || null,
                            body.timezone || 'UTC',
                            body.recurrence_rule ? JSON.stringify(body.recurrence_rule) : null,
                        ).run()

                        return json({ ...body, id, user_id: userId }, 201)
                    }

                    if (method === 'DELETE') {
                        const { id } = await request.json() as { id: string }
                        await env.DB.prepare(
                            'DELETE FROM habits WHERE id = ? AND user_id = ?'
                        ).bind(id, userId).run()
                        return json({ success: true })
                    }
                }

                // --- HABIT LOGS ---
                if (path === '/api/habit-logs') {
                    if (!userId) return error('Unauthorized', 401)

                    if (method === 'GET') {
                        const rows = await env.DB.prepare(
                            'SELECT * FROM habit_logs WHERE user_id = ? ORDER BY completed_at DESC'
                        ).bind(userId).all()
                        return json(rows.results)
                    }

                    if (method === 'POST') {
                        const body = await request.json() as Record<string, unknown>
                        const id = uuid()
                        await env.DB.prepare(`
            INSERT INTO habit_logs (id, habit_id, user_id, completed_at)
            VALUES (?, ?, ?, ?)
          `).bind(
                            id,
                            body.habit_id,
                            userId,
                            body.completed_at || new Date().toISOString().split('T')[0],
                        ).run()
                        return json({ ...body, id, user_id: userId }, 201)
                    }

                    if (method === 'DELETE') {
                        const { habit_id, completed_at } = await request.json() as { habit_id: string; completed_at: string }
                        await env.DB.prepare(
                            'DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND completed_at = ?'
                        ).bind(habit_id, userId, completed_at).run()
                        return json({ success: true })
                    }
                }

                // --- JOURNAL ---
                if (path === '/api/journal') {
                    if (!userId) return error('Unauthorized', 401)

                    if (method === 'GET') {
                        const rows = await env.DB.prepare(
                            'SELECT * FROM journal WHERE user_id = ? ORDER BY created_at DESC'
                        ).bind(userId).all()
                        return json(rows.results)
                    }

                    if (method === 'POST') {
                        const body = await request.json() as Record<string, unknown>
                        const id = uuid()
                        await env.DB.prepare(`
            INSERT INTO journal (id, user_id, type, content, date)
            VALUES (?, ?, ?, ?, ?)
          `).bind(
                            id,
                            userId,
                            body.type,
                            body.content,
                            body.date || new Date().toISOString().split('T')[0],
                        ).run()
                        return json({ ...body, id, user_id: userId }, 201)
                    }

                    if (method === 'DELETE') {
                        const { id } = await request.json() as { id: string }
                        await env.DB.prepare(
                            'DELETE FROM journal WHERE id = ? AND user_id = ?'
                        ).bind(id, userId).run()
                        return json({ success: true })
                    }
                }

                // --- GOALS ---
                if (path === '/api/goals') {
                    if (!userId) return error('Unauthorized', 401)

                    if (method === 'GET') {
                        const rows = await env.DB.prepare(
                            'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC'
                        ).bind(userId).all()
                        return json(rows.results)
                    }

                    if (method === 'POST') {
                        const body = await request.json() as Record<string, unknown>
                        const id = uuid()
                        await env.DB.prepare(`
            INSERT INTO goals (id, user_id, title, description, year, deadline)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
                            id,
                            userId,
                            body.title,
                            body.description || null,
                            body.year || new Date().getFullYear(),
                            body.deadline || null,
                        ).run()
                        return json({ ...body, id, user_id: userId }, 201)
                    }

                    if (method === 'DELETE') {
                        const { id } = await request.json() as { id: string }
                        await env.DB.prepare(
                            'DELETE FROM goals WHERE id = ? AND user_id = ?'
                        ).bind(id, userId).run()
                        return json({ success: true })
                    }
                }

                // --- GOALS UPDATE ---
                if (path.startsWith('/api/goals/') && method === 'PUT') {
                    if (!userId) return error('Unauthorized', 401)
                    const goalId = path.split('/api/goals/')[1]
                    const body = await request.json() as Record<string, unknown>

                    const sets: string[] = []
                    const values: unknown[] = []

                    if ('is_completed' in body) {
                        sets.push('is_completed = ?')
                        values.push(body.is_completed ? 1 : 0)
                    }
                    if ('title' in body) {
                        sets.push('title = ?')
                        values.push(body.title)
                    }
                    if ('progress' in body) {
                        sets.push('progress = ?')
                        values.push(body.progress)
                    }

                    values.push(goalId, userId)

                    await env.DB.prepare(
                        `UPDATE goals SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
                    ).bind(...values).run()

                    return json({ success: true })
                }

                // --- PROFILE (with KV cache) ---
                if (path === '/api/profile') {
                    if (!userId) return error('Unauthorized', 401)

                    if (method === 'GET') {
                        // Try KV cache first
                        const cached = await env.CACHE.get(`profile:${userId}`, 'json')
                        if (cached) return json(cached)

                        const row = await env.DB.prepare(
                            'SELECT * FROM users WHERE user_id = ?'
                        ).bind(userId).first()

                        if (row) {
                            // Cache for 1 hour
                            await env.CACHE.put(`profile:${userId}`, JSON.stringify(row), { expirationTtl: 3600 })
                        }
                        return json(row || null)
                    }

                    if (method === 'PUT' || method === 'POST') {
                        const body = await request.json() as Record<string, unknown>

                        // Upsert: try update, if no rows affected, insert
                        const existing = await env.DB.prepare(
                            'SELECT id FROM users WHERE user_id = ?'
                        ).bind(userId).first()

                        if (existing) {
                            const sets: string[] = []
                            const values: unknown[] = []
                            const fields = ['username', 'first_name', 'last_name', 'avatar_url', 'email', 'timezone',
                                'subscription_status', 'morning_summary_time', 'evening_summary_time', 'summaries_enabled']

                            for (const field of fields) {
                                if (field in body) {
                                    sets.push(`${field} = ?`)
                                    if (field === 'summaries_enabled') {
                                        values.push(body[field] ? 1 : 0)
                                    } else {
                                        values.push(body[field])
                                    }
                                }
                            }

                            sets.push("updated_at = datetime('now')")
                            values.push(userId)

                            if (sets.length > 1) {
                                await env.DB.prepare(
                                    `UPDATE users SET ${sets.join(', ')} WHERE user_id = ?`
                                ).bind(...values).run()
                            }
                        } else {
                            const id = uuid()
                            await env.DB.prepare(`
              INSERT INTO users (id, user_id, username, first_name, last_name, avatar_url, timezone)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                                id,
                                userId,
                                body.username || null,
                                body.first_name || null,
                                body.last_name || null,
                                body.avatar_url || null,
                                body.timezone || 'UTC',
                            ).run()
                        }

                        // Invalidate KV cache
                        await env.CACHE.delete(`profile:${userId}`)

                        const updated = await env.DB.prepare(
                            'SELECT * FROM users WHERE user_id = ?'
                        ).bind(userId).first()
                        return json(updated)
                    }
                }

                // --- NOTIFICATIONS ---
                if (path === '/api/notifications') {
                    if (!userId) return error('Unauthorized', 401)

                    if (method === 'POST') {
                        const body = await request.json() as Record<string, unknown>
                        const id = uuid()
                        await env.DB.prepare(`
            INSERT INTO scheduled_notifications (id, user_id, entity_type, entity_id, message, scheduled_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
                            id,
                            userId,
                            body.entity_type,
                            body.entity_id || null,
                            body.message || null,
                            body.scheduled_at,
                        ).run()
                        return json({ id }, 201)
                    }
                }

                // --- NOTIFY PROXY (secured) ---
                if (path === '/api/notify/send' || path === '/api/notify/schedule') {
                    if (!userId) return error('Unauthorized', 401)

                    const body = await request.json() as Record<string, unknown>

                    // Enforce: chatId must match authenticated user
                    if (String(body.chatId) !== String(userId)) {
                        return error('chatId must match authenticated user', 403)
                    }

                    const endpoint = path === '/api/notify/send' ? '/send' : '/schedule'
                    const proxyResponse = await fetch(`${env.NOTIFICATION_WORKER_URL}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${env.NOTIFICATION_SECRET}`,
                        },
                        body: JSON.stringify(body),
                    })

                    const result = await proxyResponse.json()
                    return json(result, proxyResponse.status)
                }

                // --- HEALTH CHECK ---
                if (path === '/api/health') {
                    return json({ status: 'ok', environment: env.ENVIRONMENT })
                }

                return error('Not found', 404)
            } catch (err) {
                console.error('Worker error:', err)
                return error((err as Error).message || 'Internal Server Error', 500)
            }
        })()

        return withCors(response)
    },
}

