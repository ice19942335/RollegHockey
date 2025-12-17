// Supabase Configuration
import { createClient } from '@supabase/supabase-js'

// Supabase project URL and anon key
const SUPABASE_URL = 'https://yekzgaaamijtnekkoxrr.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_TxQpmOg2Z74CQmP3X4f0Dw_THu35xlc'

// Development mode flag (for displaying debug info like tournament IDs)
export const IS_DEV_MODE = false

// Admin mode flag - set to true to enable admin functions like "Clear Database"
// You can set this via environment variable: VITE_ADMIN_ENABLED=true
export const IS_ADMIN_ENABLED = import.meta.env.VITE_ADMIN_ENABLED === 'true' || false

// IMPORTANT: create ONE Supabase client for the whole app.
// Realtime uses WebSocket connections; creating a new client per call will create multiple sockets.
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Creates and returns a Supabase client instance
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
  return supabaseClient
}

/**
 * Returns the Supabase project URL
 * @returns {string} Supabase URL
 */
export function getSupabaseUrl() {
  return SUPABASE_URL
}

/**
 * Returns the Supabase anon key
 * @returns {string} Supabase anon key
 */
export function getSupabaseAnonKey() {
  return SUPABASE_ANON_KEY
}
