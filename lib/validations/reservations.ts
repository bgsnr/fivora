import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/

/**
 * Skema Zod untuk Validasi Input Reservasi (Chapter 1 & 6)
 * Digunakan bersama di client-side (form) dan server-side (Server Action).
 */
export const reservationInputSchema = z
  .object({
    facilityId: z.union([
      z.string().min(1, 'Fasilitas wajib dipilih'),
      z.number({ message: 'Fasilitas wajib dipilih' }),
    ]),
    reservationDate: z
      .string()
      .min(1, 'Tanggal reservasi wajib diisi')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    startTime: z
      .string()
      .min(1, 'Waktu mulai wajib dipilih')
      .regex(timeRegex, 'Format jam mulai tidak valid (HH:mm)'),
    endTime: z
      .string()
      .min(1, 'Waktu selesai wajib dipilih')
      .regex(timeRegex, 'Format jam selesai tidak valid (HH:mm)'),
    purpose: z
      .string()
      .trim()
      .min(5, 'Tujuan penggunaan terlalu singkat (minimal 5 karakter)'),
  })
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(':').map(Number)
      const startMin = sh * 60 + sm
      return startMin % 30 === 0
    },
    {
      message: 'Waktu mulai harus kelipatan 30 menit (contoh: 08:00, 08:30)',
      path: ['startTime'],
    }
  )
  .refine(
    (data) => {
      const [eh, em] = data.endTime.split(':').map(Number)
      const endMin = eh * 60 + em
      return endMin % 30 === 0
    },
    {
      message: 'Waktu selesai harus kelipatan 30 menit (contoh: 09:00, 09:30)',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(':').map(Number)
      const startMin = sh * 60 + sm
      return startMin >= 7 * 60 && startMin < 20 * 60
    },
    {
      message: 'Waktu mulai harus berada dalam jam operasional (07:00–20:00 WIB)',
      path: ['startTime'],
    }
  )
  .refine(
    (data) => {
      const [eh, em] = data.endTime.split(':').map(Number)
      const endMin = eh * 60 + em
      return endMin > 7 * 60 && endMin <= 20 * 60
    },
    {
      message: 'Waktu selesai harus berada dalam jam operasional (07:00–20:00 WIB)',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(':').map(Number)
      const [eh, em] = data.endTime.split(':').map(Number)
      return eh * 60 + em > sh * 60 + sm
    },
    {
      message: 'Waktu selesai harus lebih besar dari waktu mulai',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(':').map(Number)
      const [eh, em] = data.endTime.split(':').map(Number)
      return eh * 60 + em - (sh * 60 + sm) >= 30
    },
    {
      message: 'Durasi reservasi minimal adalah 30 menit',
      path: ['endTime'],
    }
  )

export type ReservationInput = z.infer<typeof reservationInputSchema>
