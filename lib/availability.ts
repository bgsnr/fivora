import { TimeSlot } from '@/types/facility';

export const OPERATIONAL_START_HOUR = 7;  // 07.00 WIB
export const OPERATIONAL_END_HOUR = 20;   // 20.00 WIB
export const SLOT_DURATION_MINUTES = 30;  // Slot 30 menit
export const DAILY_TOTAL_SLOTS = 26;      // Total 26 slot operasional standar per hari

interface ApprovedReservationTime {
  start_time: string;
  end_time: string;
}

/**
 * Membentuk array berisi 26 slot waktu (07.00 - 20.00 WIB)
 * dan mengecek ketersediaannya berdasarkan reservasi disetujui / status perbaikan.
 */
export function generateDailyTimeSlots(
  facilityStatus: string,
  approvedReservations: ApprovedReservationTime[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = OPERATIONAL_START_HOUR * 60;
  const endMinutes = OPERATIONAL_END_HOUR * 60;

  const isUnderMaintenance =
    facilityStatus === 'dalam_perbaikan' || facilityStatus === 'under_maintenance';

  let currentMinutes = startMinutes;

  while (currentMinutes < endMinutes) {
    const startH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const startM = String(currentMinutes % 60).padStart(2, '0');

    const nextMinutes = currentMinutes + SLOT_DURATION_MINUTES;
    const endH = String(Math.floor(nextMinutes / 60)).padStart(2, '0');
    const endM = String(nextMinutes % 60).padStart(2, '0');

    const startTimeStr = `${startH}:${startM}`;
    const endTimeStr = `${endH}:${endM}`;

    // Cek apakah slot ini bentrok dengan reservasi yang disetujui (Aturan 7)
    // Bentrok jika (StartA < EndB) AND (EndA > StartB)
    const isBooked = approvedReservations.some((res) => {
      const resStart = new Date(res.start_time).toTimeString().substring(0, 5);
      const resEnd = new Date(res.end_time).toTimeString().substring(0, 5);

      return startTimeStr < resEnd && endTimeStr > resStart;
    });

    let isAvailable = true;
    let reason = 'Tersedia';

    if (isUnderMaintenance) {
      isAvailable = false;
      reason = 'Dalam Perbaikan';
    } else if (isBooked) {
      isAvailable = false;
      reason = 'Tidak Tersedia';
    }

    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      isAvailable,
      reason,
    });

    currentMinutes = nextMinutes;
  }

  return slots;
}