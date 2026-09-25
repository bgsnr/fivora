import { Facility } from './facility';

/**
 * Filter parameter yang digunakan oleh Admin untuk halaman dan ekspor rekap (US 17, Point 20-21)
 */
export interface RecapFilterParams {
  startDate: string;            // Format: YYYY-MM-DD
  endDate: string;              // Format: YYYY-MM-DD
  location?: string;            // Filter lokasi spesifik atau 'all'
  facilityId?: string | number; // Filter fasilitas spesifik atau 'all'
  format?: 'csv' | 'excel';     // Format ekspor
}

/**
 * Representasi item rekapitulasi gabungan per fasilitas
 */
export interface FacilityRecapItem {
  facility: Facility;
  approvedSlotsCount: number;   // Total slot terpakai dari reservasi disetujui (1 slot = 30 menit)
  occupancyPercentage: number;  // Nilai numerik persentase okupansi
  formattedOccupancy: string;  // Teks terformat, misal: "75.0%" atau "Tidak ada data"
  validReportCount: number;     // Jumlah laporan kerusakan valid ('diproses' / 'selesai')
  hasData: boolean;             // Flag penanda apakah terdapat slot operasional pada periode terkait
}

/**
 * Hasil perhitungan kalkulasi okupansi (lib/utils/occupancy.ts)
 */
export interface OccupancyResult {
  occupancyPercentage: number;
  formattedPercentage: string;
  totalOperationalSlots: number;
  approvedSlotCount: number;
  hasData: boolean;
}

/**
 * Interface ringkas untuk item tabel okupansi (components/recap/OccupancyTable.tsx)
 */
export interface OccupancyTableItem {
  facilityId: number;
  facilityName: string;
  type: string;
  location: string;
  approvedSlotsCount: number;
  formattedOccupancy: string;
  occupancyPercentage: number;
}

/**
 * Interface ringkas untuk item tabel frekuensi kerusakan (components/recap/DamageFrequencyTable.tsx)
 */
export interface DamageFrequencyTableItem {
  facilityId: number;
  facilityName: string;
  type: string;
  location: string;
  validReportCount: number;
}

/**
 * Data DTO untuk kebutuhan pemrosesan ekspor file (lib/utils/exporter.ts)
 */
export interface ExportRecapItem {
  facilityId: number;
  facilityName: string;
  type: string;
  location: string;
  approvedSlotsCount: number;
  occupancyPercentage: string;
  validReportCount: number;
}