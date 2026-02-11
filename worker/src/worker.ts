/**
 * Stitch Tracker API — Cloudflare Worker
 * Replaces direct Supabase access with D1 + KV
 */

export interface Env {
    DB: D1Database
    CACHE: KVNamespace
    ENVIRONMENT: string
}

// CORS headers for Telegram WebApp
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

function error(message: string, status = 400): Response {
    return json({ error: message }, status)
}

function uuid(): string {
    return crypto.randomUUID()
}

// Extract user_id from header (set by frontend)
function getUserId(request: Request): string | null {
    return request.headers.get('X-User-Id')
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders })
        }

        const url = new URL(request.url)
        const path = url.pathname
        const method = request.method

        try {
            // --- TASKS ---
            if (path === '/api/tasks') {
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)

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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)
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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)

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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)

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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)

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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)

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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)
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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)

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
                const userId = getUserId(request)
                if (!userId) return error('Missing X-User-Id header', 401)

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

            // --- HEALTH CHECK ---
            if (path === '/api/health') {
                return json({ status: 'ok', environment: env.ENVIRONMENT })
            }

            return error('Not found', 404)
        } catch (err) {
            console.error('Worker error:', err)
            return error((err as Error).message || 'Internal Server Error', 500)
        }
    },
}
