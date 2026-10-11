export const FACILITY_CATEGORIES = [
  'Ruang Kelas', 'Laboratorium', 'Aula', 'Lapangan', 'Lainnya',
] as const

export type FacilityCategory = (typeof FACILITY_CATEGORIES)[number]

function typeKey(type: string | null | undefined): string {
  return (type ?? '').trim().toLowerCase().replace(/[\s_/-]+/g, '_')
}

const equipmentTypes = new Set(['alat', 'alat_lab', 'peralatan', 'peralatan_lab', 'perlengkapan', 'equipment'])

export function isEquipmentFacility(
  type: string | null | undefined,
  name = '',
): boolean {
  const key = typeKey(type)
  return equipmentTypes.has(key) || (
    key === 'lainnya' && /^proyektor\b/i.test(name.trim())
  )
}

export function normalizeFacilityType(
  type: string | null | undefined,
): FacilityCategory | null {
  const key = typeKey(type)
  if (isEquipmentFacility(type)) return 'Lainnya'
  if (['ruang', 'ruangan', 'kelas', 'ruang_kelas', 'ruang_kuliah', 'ruangan_kuliah', 'classroom', 'class'].includes(key)) return 'Ruang Kelas'
  if (['lab', 'laboratorium', 'laboratory'].includes(key)) return 'Laboratorium'
  if (['aula', 'auditorium'].includes(key)) return 'Aula'
  if (['lapangan', 'lapangan_olahraga', 'lapangan_futsal', 'lapangan_basket', 'lapangan_voli', 'lapangan_badminton', 'field'].includes(key)) return 'Lapangan'
  if (['lainnya', 'other', 'others'].includes(key)) return 'Lainnya'
  return null
}

export function getFacilityCategory(type: string | null | undefined): FacilityCategory {
  return normalizeFacilityType(type) ?? 'Lainnya'
}

export function formatFacilityCapacity(
  facility: { capacity: number | null; type: string | null; name: string },
): string {
  if (facility.capacity === null) return 'Belum dicantumkan'
  const unit = isEquipmentFacility(facility.type, facility.name) ? 'unit' : 'orang'
  return `${facility.capacity.toLocaleString('id-ID')} ${unit}`
}
