import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    return supabaseUrl !== '' && supabaseAnonKey !== ''
}

// Create a dummy client that won't throw errors
const createDummyClient = (): SupabaseClient => {
    // This creates a client with a fake URL that will fail gracefully
    // We use a placeholder URL structure that's valid but won't connect
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
}

// Export the supabase client - use real one if configured, dummy otherwise
export const supabase: SupabaseClient = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createDummyClient()
