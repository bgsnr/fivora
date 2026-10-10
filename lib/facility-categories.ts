export type FacilityCategory = 'Ruang Kelas' | 'Laboratorium' | 'Aula' | 'Lapangan' | 'Lainnya'

function typeKey(type: string | null | undefined): string {
  return (type ?? '').trim().toLowerCase().replace(/[\s_/-]+/g, '_')
}

const equipmentTypes = new Set(['alat', 'alat_lab', 'peralatan', 'peralatan_lab', 'perlengkapan', 'equipment'])

export function isEquipmentFacility(type: string | null | undefined): boolean {
  return equipmentTypes.has(typeKey(type))
}

export function getFacilityCategory(type: string | null | undefined): FacilityCategory {
  const key = typeKey(type)
  if (isEquipmentFacility(type)) return 'Lainnya'
  if (['ruang', 'ruangan', 'kelas', 'ruang_kelas', 'ruang_kuliah', 'ruangan_kuliah', 'classroom', 'class'].includes(key)) return 'Ruang Kelas'
  if (['lab', 'laboratorium', 'laboratory'].includes(key)) return 'Laboratorium'
  if (['aula', 'auditorium'].includes(key)) return 'Aula'
  if (['lapangan', 'lapangan_olahraga', 'lapangan_futsal', 'lapangan_basket', 'lapangan_voli', 'lapangan_badminton', 'field'].includes(key)) return 'Lapangan'
  return 'Lainnya'
}
