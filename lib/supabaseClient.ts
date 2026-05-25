import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

function initSupabase() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
      )
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return supabaseClient
}

export function getSupabase() {
  const client = initSupabase()
  if (!client) {
    throw new Error('Supabase client is only available on the client side')
  }
  return client
}

// Lazy-loaded supabase instance - only create when accessed
let cachedSupabase: ReturnType<typeof createClient> | null | undefined
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (cachedSupabase === undefined) {
      cachedSupabase = initSupabase()
    }
    if (!cachedSupabase) {
      throw new Error('Supabase client is only available on the client side')
    }
    return Reflect.get(cachedSupabase, prop)
  },
})
