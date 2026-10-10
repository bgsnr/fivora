type RpcResult = { data: unknown; error: { message: string } | null }

export type RetentionDependencies = {
  token: string | undefined
  rpc: (name: string, args?: Record<string, unknown>) => Promise<RpcResult>
  removePhotos: (paths: string[]) => Promise<{ error: { message: string } | null }>
  now?: () => number
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid cleanup response')
  }
  return value as Record<string, unknown>
}

function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Invalid cleanup count')
  }
  return value
}

async function matchesToken(candidate: string, expected: string): Promise<boolean> {
  if (!candidate || candidate.length > 128) return false
  const encoder = new TextEncoder()
  const hashes = await Promise.all([candidate, expected].map((value) =>
    crypto.subtle.digest('SHA-256', encoder.encode(value))
  ))
  const first = new Uint8Array(hashes[0])
  const second = new Uint8Array(hashes[1])
  let difference = 0
  for (let index = 0; index < first.length; index += 1) {
    difference |= first[index] ^ second[index]
  }
  return difference === 0
}

function response(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
  })
}

export function createRetentionHandler(deps: RetentionDependencies) {
  return async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return response({ error: 'Method not allowed' }, 405)
    }
    if (!deps.token || deps.token.length < 32) {
      return response({ error: 'Retention configuration is incomplete' }, 503)
    }
    if (!await matchesToken(request.headers.get('x-fivora-retention-token') ?? '', deps.token)) {
      return response({ error: 'Unauthorized' }, 401)
    }

    let dryRun = true
    try {
      const input = await request.text()
      if (input.length > 512) return response({ error: 'Request too large' }, 413)
      if (input.trim()) {
        const body = record(JSON.parse(input))
        if (body.dry_run !== undefined && typeof body.dry_run !== 'boolean') {
          return response({ error: 'dry_run must be a boolean' }, 400)
        }
        dryRun = body.dry_run !== false
      }
    } catch {
      return response({ error: 'Invalid JSON' }, 400)
    }

    try {
      const preview = await deps.rpc('fivora_retention_preview')
      if (preview.error) throw new Error('Cannot read retention state')
      const state = record(preview.data)
      if (dryRun) return response({ dry_run: true, ...state })
      if (state.enabled !== true) {
        return response({ error: 'Retention has not been activated', enabled: false }, 409)
      }

      const now = deps.now ?? Date.now
      const deadline = now() + 40_000
      let reportsDeleted = 0
      let reservationsDeleted = 0
      let photosDeleted = 0
      let storageFailed = false

      // Jumlah batch dibatasi agar fungsi selesai dalam satu pemanggilan.
      for (let batch = 0; batch < 5 && now() < deadline; batch += 1) {
        const result = await deps.rpc('fivora_purge_expired_data', { p_limit: 100 })
        if (result.error) throw new Error('Database cleanup failed')
        const removed = record(result.data)
        if (removed.enabled !== true || removed.busy === true) break
        const reports = count(removed.reports_deleted)
        const reservations = count(removed.reservations_deleted)
        reportsDeleted += reports
        reservationsDeleted += reservations
        if (reports < 100 && reservations < 100) break
      }

      for (let batch = 0; batch < 10 && now() < deadline; batch += 1) {
        const claimed = await deps.rpc('fivora_claim_retention_photos', { p_limit: 100 })
        if (claimed.error || !Array.isArray(claimed.data)) throw new Error('Photo queue failed')
        if (claimed.data.length === 0) break
        const entries = claimed.data.map(record)
        const token = entries[0].lease_token
        if (typeof token !== 'string' || entries.some((entry) =>
          typeof entry.photo_path !== 'string' || !entry.photo_path || entry.lease_token !== token
        )) throw new Error('Invalid photo lease')
        const paths = entries.map((entry) => entry.photo_path as string)
        const deleted = await deps.removePhotos(paths)
        if (deleted.error) {
          // Tidak menghapus antrean. Lease akan kedaluwarsa dan dicoba lagi oleh cron.
          storageFailed = true
          break
        }
        const acknowledged = await deps.rpc('fivora_ack_retention_photos', {
          p_paths: paths,
          p_token: token,
        })
        if (acknowledged.error) throw new Error('Photo acknowledgement failed')
        photosDeleted += count(acknowledged.data)
      }

      return response({
        dry_run: false,
        reports_deleted: reportsDeleted,
        reservations_deleted: reservationsDeleted,
        photos_deleted: photosDeleted,
        storage_retry_needed: storageFailed,
      }, storageFailed ? 503 : 200)
    } catch (error) {
      console.error('Retention cleanup:', error instanceof Error ? error.message : 'Unexpected failure')
      return response({ error: 'Cleanup failed. Unfinished photo tasks will be retried.' }, 500)
    }
  }
}
