import { DAILY_TOTAL_SLOTS } from './availability';

interface CalculateOccupancyInput {
  approvedSlotCount: number; // Total slot terisi dari reservasi disetujui
  totalDays: number;         // Rentang jumlah hari periode rekap yang dipilih
  facilityCount?: number;    // Jumlah fasilitas (jika perhitungan per lokasi)
}

interface OccupancyResult {
  occupancyPercentage: number;
  formattedPercentage: string;
  totalOperationalSlots: number;
  approvedSlotCount: number;
  hasData: boolean;
}

/**
 * Menghitung persentase okupansi fasilitas berdasarkan periode tanggal yang dipilih Admin (Point 20).
 */
export function calculateOccupancy({
  approvedSlotCount,
  totalDays,
  facilityCount = 1,
}: CalculateOccupancyInput): OccupancyResult {
  // Total slot operasional standar = 26 slot * total hari * total fasilitas
  const totalOperationalSlots = DAILY_TOTAL_SLOTS * totalDays * facilityCount;

  // Jika tidak ada slot operasional pada periode tersebut (Point 20)
  if (totalOperationalSlots <= 0 || totalDays <= 0) {
    return {
      occupancyPercentage: 0,
      formattedPercentage: 'Tidak ada data',
      totalOperationalSlots: 0,
      approvedSlotCount: 0,
      hasData: false,
    };
  }

  // Hitung persentase okupansi
  const rawPercentage = (approvedSlotCount / totalOperationalSlots) * 100;
  const occupancyPercentage = Math.min(Math.max(rawPercentage, 0), 100);

  return {
    occupancyPercentage,
    formattedPercentage: `${occupancyPercentage.toFixed(1)}%`,
    totalOperationalSlots,
    approvedSlotCount,
    hasData: true,
  };
}

/**
 * Menghitung jumlah hari antara dua tanggal (inclusive)
 */
export function getDaysDifference(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Normalisasi ke UTC/Awal Hari untuk menghindari selisih jam
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 agar inclusive

  return diffDays > 0 ? diffDays : 0;
}