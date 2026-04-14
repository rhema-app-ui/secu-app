import { createClient } from '@supabase/supabase-js'

// ✅ Lecture des variables d'environnement (Next.js les injecte automatiquement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Variables Supabase manquantes dans .env.local')
}

// ✅ Export du client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)