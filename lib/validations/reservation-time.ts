import type { ReservationStatus } from '@/types/reservation'

/**
 * Chapter 4 — Aturan Waktu & Slot Reservasi
 * Validasi operasional waktu, slot kelipatan 30 menit, dan penentuan status tampilan.
 * Semua perhitungan waktu didasarkan pada Waktu Indonesia Barat (WIB / UTC+7).
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface DisplayStatusResult {
  status: ReservationStatus
  isPast: boolean
  label: string
}

/**
 * Mengambil tanggal dan waktu saat ini dalam format WIB (Asia/Jakarta, UTC+7).
 */
export function getWIBDateTime(date: Date = new Date()): {
  dateStr: string // YYYY-MM-DD
  timeStr: string // HH:mm:ss
  totalMinutes: number
} {
  const formatterDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const formatterTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const dateStr = formatterDate.format(date) // e.g. "2026-09-24"
  const timeStr = formatterTime.format(date) // e.g. "23:15:00"

  const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10))
  const totalMinutes = hours * 60 + minutes

  return { dateStr, timeStr, totalMinutes }
}

/**
 * Mengubah string waktu 'HH:mm' atau 'HH:mm:ss' menjadi total menit dari jam 00:00.
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length < 2) {
    throw new Error(`Format waktu tidak valid: ${timeStr}`)
  }
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  return hours * 60 + minutes
}

/**
 * Menghitung slot paling awal yang valid untuk pengajuan di hari yang sama:
 * 'start_time' wajib lebih besar dari waktu pengajuan, dibulatkan ke kelipatan 30 menit berikutnya.
 * Contoh: 10:10 -> 10:30; 12:00 -> 12:30; 10:30 -> 11:00.
 */
export function getNextAvailableSlotMinutes(timeStr: string): number {
  const parts = timeStr.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0

  const totalMinutes = hours * 60 + minutes + (seconds > 0 ? 0.1 : 0)
  return Math.floor(totalMinutes / 30 + 1) * 30
}

/**
 * Mengubah total menit menjadi string waktu 'HH:mm'.
 */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Validasi 1-8: Memeriksa aturan waktu dan slot reservasi
 */
export function validateReservationTimeRules(
  date: string,
  startTime: string,
  endTime: string,
  submittedAt: Date = new Date()
): ValidationResult {
  // Format tanggal harus YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: 'Format tanggal reservasi tidak valid (gunakan YYYY-MM-DD)' }
  }

  // Aturan 8 & 7: Waktu referensi pengajuan dalam WIB
  const wibNow = getWIBDateTime(submittedAt)

  // Tanggal reservasi tidak boleh di masa lalu
  if (date < wibNow.dateStr) {
    return { valid: false, error: 'Tanggal reservasi tidak boleh di masa lalu' }
  }

  let startMinutes: number
  let endMinutes: number
  try {
    startMinutes = parseTimeToMinutes(startTime)
    endMinutes = parseTimeToMinutes(endTime)
  } catch {
    return { valid: false, error: 'Format jam mulai atau selesai tidak valid (gunakan HH:mm)' }
  }

  // Aturan 2: Kelipatan 30 menit
  if (startMinutes % 30 !== 0) {
    return { valid: false, error: 'Waktu mulai harus kelipatan 30 menit (contoh: 08:00, 08:30)' }
  }
  if (endMinutes % 30 !== 0) {
    return { valid: false, error: 'Waktu selesai harus kelipatan 30 menit (contoh: 08:30, 09:00)' }
  }

  // Aturan 1: Jam operasional 07:00–20:00 (420 menit s/d 1200 menit)
  const OPERATIONAL_START = 7 * 60 // 07:00
  const OPERATIONAL_END = 20 * 60 // 20:00

  if (startMinutes < OPERATIONAL_START || startMinutes >= OPERATIONAL_END) {
    return {
      valid: false,
      error: 'Waktu mulai harus berada dalam jam operasional (07:00–20:00 WIB)',
    }
  }

  if (endMinutes <= OPERATIONAL_START || endMinutes > OPERATIONAL_END) {
    return {
      valid: false,
      error: 'Waktu selesai harus berada dalam jam operasional (07:00–20:00 WIB)',
    }
  }

  // Aturan 3: Durasi minimal 30 menit
  if (endMinutes <= startMinutes) {
    return { valid: false, error: 'Waktu selesai harus lebih besar dari waktu mulai' }
  }
  if (endMinutes - startMinutes < 30) {
    return { valid: false, error: 'Durasi reservasi minimal adalah 30 menit' }
  }

  // Aturan 6: Pengajuan untuk hari yang sama
  if (date === wibNow.dateStr) {
    const minAllowedSlotMinutes = getNextAvailableSlotMinutes(wibNow.timeStr)

    if (startMinutes < minAllowedSlotMinutes) {
      const minTimeString = formatMinutesToTime(minAllowedSlotMinutes)
      return {
        valid: false,
        error: `Untuk reservasi hari ini, waktu mulai paling awal yang dapat dipilih adalah ${minTimeString} WIB`,
      }
    }
  }

  return { valid: true }
}

/**
 * Aturan 9: Memeriksa apakah reservasi sudah melewati waktu mulai sehingga kadaluarsa untuk disetujui.
 * Reservasi berstatus 'menunggu' yang start_time-nya sudah terlewati tidak boleh disetujui.
 */
export function isReservationExpiredForApproval(
  reservation: { reservation_date: string; start_time: string },
  now: Date = new Date()
): boolean {
  const wibNow = getWIBDateTime(now)

  if (reservation.reservation_date < wibNow.dateStr) {
    return true
  }

  if (reservation.reservation_date === wibNow.dateStr) {
    const reservationStartMinutes = parseTimeToMinutes(reservation.start_time)
    return wibNow.totalMinutes >= reservationStartMinutes
  }

  return false
}

/**
 * Aturan 10: Menentukan label status tampilan.
 * Reservasi 'disetujui' yang end_time-nya sudah lewat TIDAK mengubah status database,
 * namun menampilkan label "sudah berlalu".
 */
export function getDisplayStatusLabel(
  reservation: {
    status: ReservationStatus
    reservation_date: string
    end_time: string
  },
  now: Date = new Date()
): DisplayStatusResult {
  const wibNow = getWIBDateTime(now)

  let isPast = false

  if (reservation.reservation_date < wibNow.dateStr) {
    isPast = true
  } else if (reservation.reservation_date === wibNow.dateStr) {
    const endMinutes = parseTimeToMinutes(reservation.end_time)
    isPast = wibNow.totalMinutes >= endMinutes
  }

  let label: string
  switch (reservation.status) {
    case 'menunggu':
      label = isPast ? 'Menunggu (Waktu Terlewat)' : 'Menunggu Konfirmasi'
      break
    case 'disetujui':
      label = isPast ? 'Disetujui (Sudah Berlalu)' : 'Disetujui'
      break
    case 'ditolak':
      label = 'Ditolak'
      break
    case 'dibatalkan':
      label = 'Dibatalkan'
      break
    default:
      label = reservation.status
  }

  return {
    status: reservation.status,
    isPast,
    label,
  }
}

/**
 * Aturan Pembatalan oleh Pengguna (Chapter 8)
 * 1. Hanya reservasi milik sendiri
 * 2. Hanya status 'menunggu' atau 'disetujui'
 * 3. Batas waktu minimal 3 jam sebelum start_time (tepat 3 jam = 180 menit masih boleh)
 */
export function canUserCancelReservation(
  reservation: {
    user_id: number | string
    status: ReservationStatus
    reservation_date: string
    start_time: string
  },
  userId?: number | string,
  now: Date = new Date()
): { allowed: boolean; reason?: string } {
  // 1. Cek kepemilikan
  if (userId !== undefined && String(reservation.user_id) !== String(userId)) {
    return {
      allowed: false,
      reason: 'Anda hanya dapat membatalkan reservasi milik Anda sendiri',
    }
  }

  // 2. Cek status
  if (reservation.status === 'dibatalkan') {
    return {
      allowed: false,
      reason: 'Reservasi ini sudah dibatalkan sebelumnya',
    }
  }

  if (reservation.status === 'ditolak') {
    return {
      allowed: false,
      reason: 'Reservasi berstatus ditolak tidak dapat dibatalkan',
    }
  }

  if (reservation.status !== 'menunggu' && reservation.status !== 'disetujui') {
    return {
      allowed: false,
      reason: `Reservasi dengan status "${reservation.status}" tidak dapat dibatalkan`,
    }
  }

  // 3. Cek batas waktu 3 jam sebelum start_time
  const timeFormatted =
    reservation.start_time.length === 5
      ? `${reservation.start_time}:00`
      : reservation.start_time

  const reservationStartIso = `${reservation.reservation_date}T${timeFormatted}+07:00`
  const startTimeMs = new Date(reservationStartIso).getTime()
  const nowMs = now.getTime()
  const diffMs = startTimeMs - nowMs
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000 // 180 menit

  if (diffMs <= 0) {
    return {
      allowed: false,
      reason: 'Waktu mulai reservasi telah terlewati',
    }
  }

  // Tepat 3 jam masih boleh (diffMs >= THREE_HOURS_MS)
  if (diffMs < THREE_HOURS_MS) {
    return {
      allowed: false,
      reason:
        'Pembatalan hanya dapat dilakukan paling lambat 3 jam sebelum waktu mulai reservasi',
    }
  }

  return { allowed: true }
}
