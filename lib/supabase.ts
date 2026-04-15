import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton simple pour éviter le warning "Multiple GoTrueClient instances"
let cachedClient: any = undefined

export const supabase = (() => {
  // Côté navigateur : réutilise la même instance
  if (typeof window !== 'undefined' && cachedClient) return cachedClient
  
  const client = createClient(supabaseUrl, supabaseAnonKey)
  
  // Côté navigateur : cache l'instance
  if (typeof window !== 'undefined') cachedClient = client
  
  return client
})()