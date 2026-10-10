import { createClient } from 'npm:@supabase/supabase-js@2.116.0'
import { createRetentionHandler } from './handler.ts'

function getServiceKey(): string | undefined {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (keys) {
    try {
      const parsed = JSON.parse(keys)
      if (typeof parsed.default === 'string') return parsed.default
    } catch {
      // Proyek yang memakai kunci lama menggunakan variabel di bawah.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

const url = Deno.env.get('SUPABASE_URL')
const key = getServiceKey()
const client = url && key ? createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
}) : null

const handler = createRetentionHandler({
  token: Deno.env.get('FIVORA_RETENTION_TOKEN'),
  rpc: async (name, args) => {
    if (!client) return { data: null, error: { message: 'Missing Supabase configuration' } }
    const { data, error } = await client.rpc(name, args)
    return { data, error }
  },
  removePhotos: async (paths) => {
    if (!client) return { error: { message: 'Missing Supabase configuration' } }
    const { error } = await client.storage.from('report-photos').remove(paths)
    return { error }
  },
})

Deno.serve(handler)
