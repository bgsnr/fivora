import 'server-only'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

console.log('SUPABASE ADMIN CHECK:', {
  url: supabaseUrl,
  hasSecretKey: !!supabaseSecretKey,
  keyPrefix: supabaseSecretKey?.slice(0, 10),
})

export const supabaseAdmin = createClient(
  supabaseUrl!,
  supabaseSecretKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)