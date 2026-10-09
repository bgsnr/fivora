export const facilityTypes = [
  'Ruang Kelas', 'Aula', 'Laboratorium', 'Peralatan', 'Lapangan',
] as const

const allowedTypes = new Set<string>([
  ...facilityTypes,
  'ruang_kelas', 'aula', 'laboratorium', 'alat', 'peralatan', 'lapangan',
])

export type FacilityMasterInput = {
  name: string
  type: string
  location: string
  capacity: string | number | null
  description: string
}

export type ValidFacilityMaster = {
  name: string
  type: string
  location: string | null
  capacity: number | null
  description: string | null
}

type ValidationResult =
  | { success: true; data: ValidFacilityMaster }
  | { success: false; error: string }

export function validateFacilityMaster(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { success: false, error: 'Data fasilitas tidak valid.' }
  }
  const input = value as Record<string, unknown>
  const fields = ['name', 'type', 'location', 'capacity', 'description']
  if (Object.keys(input).some((key) => !fields.includes(key))) {
    return { success: false, error: 'Edit data fasilitas tidak boleh mengubah status.' }
  }
  if (['name', 'type', 'location', 'description'].some((key) => typeof input[key] !== 'string')) {
    return { success: false, error: 'Data fasilitas tidak valid.' }
  }
  const name = (input.name as string).trim()
  const type = (input.type as string).trim()
  const location = (input.location as string).trim()
  const description = (input.description as string).trim()
  if (!name || name.length > 255) {
    return { success: false, error: 'Nama fasilitas wajib diisi, maksimal 255 karakter.' }
  }
  if (!allowedTypes.has(type)) {
    return { success: false, error: 'Pilih tipe fasilitas yang tersedia.' }
  }
  if (location.length > 255) {
    return { success: false, error: 'Lokasi maksimal 255 karakter.' }
  }
  if (description.length > 5000) {
    return { success: false, error: 'Deskripsi maksimal 5000 karakter.' }
  }
  const rawCapacity = input.capacity
  let capacity: number | null = null
  if (rawCapacity !== null && rawCapacity !== '') {
    if (
      (typeof rawCapacity !== 'number' && typeof rawCapacity !== 'string') ||
      (typeof rawCapacity === 'string' && !/^\d+$/.test(rawCapacity))
    ) {
      return { success: false, error: 'Kapasitas harus berupa bilangan bulat nol atau lebih.' }
    }
    capacity = Number(rawCapacity)
    if (!Number.isInteger(capacity) || capacity < 0 || capacity > 2147483647) {
      return { success: false, error: 'Kapasitas harus berupa bilangan bulat antara 0 dan 2147483647.' }
    }
  }
  return { success: true, data: {
    name, type, location: location || null, capacity, description: description || null,
  } }
}

export function validFacilityId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function validFacilityVersion(value: unknown): value is string | null {
  return value === null || (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  )
}
