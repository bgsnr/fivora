import { DAILY_TOTAL_SLOTS } from './availability';

interface CalculateOccupancyInput {
  approvedSlotCount: number;
  totalDays: number;
  facilityCount?: number;
}

interface OccupancyResult {
  occupancyPercentage: number;
  formattedPercentage: string;
  totalOperationalSlots: number;
  approvedSlotCount: number;
  hasData: boolean;
}

/**
 * Menghitung okupansi berdasarkan jumlah slot operasional standar.
 * Satu hari = 26 slot, masing-masing berdurasi 30 menit.
 */
export function calculateOccupancy({
  approvedSlotCount,
  totalDays,
  facilityCount = 1,
}: CalculateOccupancyInput): OccupancyResult {
  const validTotalDays =
    Number.isFinite(totalDays) && totalDays > 0
      ? Math.floor(totalDays)
      : 0;

  const validFacilityCount =
    Number.isFinite(facilityCount) && facilityCount > 0
      ? Math.floor(facilityCount)
      : 0;

  const validApprovedSlotCount =
    Number.isFinite(approvedSlotCount) && approvedSlotCount > 0
      ? approvedSlotCount
      : 0;

  const totalOperationalSlots =
    DAILY_TOTAL_SLOTS * validTotalDays * validFacilityCount;

  if (totalOperationalSlots <= 0) {
    return {
      occupancyPercentage: 0,
      formattedPercentage: 'Tidak ada data',
      totalOperationalSlots: 0,
      approvedSlotCount: validApprovedSlotCount,
      hasData: false,
    };
  }

  const occupancyPercentage =
    (validApprovedSlotCount / totalOperationalSlots) * 100;

  return {
    occupancyPercentage,
    formattedPercentage: `${occupancyPercentage.toFixed(1)}%`,
    totalOperationalSlots,
    approvedSlotCount: validApprovedSlotCount,
    hasData: true,
  };
}

/**
 * Menghitung jumlah hari kalender secara inklusif.
 * Contoh: 2026-10-01 sampai 2026-10-03 = 3 hari.
 * Menghasilkan 0 jika tanggal tidak valid atau rentang terbalik.
 */
export function getDaysDifference(
  startDateStr: string,
  endDateStr: string,
): number {
  function parseDateOnly(value: string): number | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      return null;
    }

    return date.getTime();
  }

  const startTime = parseDateOnly(startDateStr);
  const endTime = parseDateOnly(endDateStr);

  if (startTime === null || endTime === null || startTime > endTime) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((endTime - startTime) / millisecondsPerDay) + 1;
}