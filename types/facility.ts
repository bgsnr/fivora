/**
 * Status fasilitas berdasarkan ketentuan proyek:
 * - 'active' / 'aktif': Fasilitas dapat dipesan
 * - 'inactive' / 'nonaktif': Fasilitas ditarik oleh Admin
 * - 'under_maintenance' / 'dalam_perbaikan': Fasilitas sedang diperbaiki berdasarkan laporan petugas
 */
export type FacilityStatus = 'aktif' | 'nonaktif' | 'dalam_perbaikan' | 'active' | 'inactive' | 'under_maintenance';

/**
 * Interface sesuai dengan skema tabel database `facilities`
 */
export interface Facility {
  id: number;                   // int8 (Primary Key)
  name: string;                 // varchar
  type: string | null;          // varchar (misal: 'ruang_kelas', 'aula', 'laboratorium', 'alat', 'lapangan')
  location: string | null;      // varchar
  capacity: number | null;      // int4
  description: string | null;   // text
  status: FacilityStatus;       // varchar
  created_at: string;           // timestamptz (ISO string)
  updated_at?: string | null;   // timestamptz (ISO string)
}

/**
 * Interface untuk kriteria pencarian dan filter fasilitas oleh publik / admin (US 2)
 */
export interface FacilityFilterParams {
  search?: string;              // Pencarian kata kunci nama fasilitas
  type?: string;                // Filter berdasarkan tipe
  location?: string;            // Filter berdasarkan lokasi
  minCapacity?: number;         // Filter kapasitas minimal
  status?: FacilityStatus;      // Filter berdasarkan status
}

/**
 * Interface DTO (Data Transfer Object) untuk membuat atau mengedit fasilitas
 */
export type CreateFacilityInput = Omit<Facility, 'id' | 'created_at' | 'updated_at'>;
export type UpdateFacilityInput = Partial<CreateFacilityInput>;

/**
 * Interface untuk representasi slot ketersediaan (Availability per 30 menit, 07.00 - 20.00 WIB)
 */
export interface TimeSlot {
  startTime: string;            // Contoh: "07:00"
  endTime: string;              // Contoh: "07:30"
  isAvailable: boolean;         // true jika slot bisa dipesan
  reason?: string;              // Alasan jika tidak tersedia (misal: "Disetujui", "Dalam Perbaikan")
}