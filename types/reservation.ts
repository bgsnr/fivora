export type ReservationStatus = 'menunggu' | 'disetujui' | 'ditolak' | 'dibatalkan'

export interface Reservation {
  id: string | number
  user_id: string | number
  facility_id: string | number
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
  status: ReservationStatus
  rejection_reason: string | null
  processed_by: string | number | null
  processed_at: string | null
  created_at: string
  users?: {
    id: string | number
    name: string
    email: string
    role?: string
  }
  facilities?: {
    id: string | number
    name: string
    type?: string
    location?: string
    status?: string
  }
}

export interface NewReservationInput {
  user_id: string | number
  facility_id: string | number
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
  status?: ReservationStatus
}

export type CreateReservationInput = NewReservationInput

export interface UpdateReservationStatusMeta {
  rejection_reason?: string | null
  processed_by?: string | number | null
  processed_at?: string | null
}
