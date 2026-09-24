// components/facilities/AvailabilityGrid.tsx
import { TimeSlot } from '@/types/facility';
import styles from './AvailabilityGrid.module.css';

interface AvailabilityGridProps {
  slots: TimeSlot[];
  loading?: boolean;
}

export default function AvailabilityGrid({ slots, loading = false }: AvailabilityGridProps) {
  if (loading) {
    return (
      <div className={styles.loadingState}>
        Memeriksa ketersediaan slot waktu...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Keterangan Warna Status */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.dotAvailable}></span>
          <span>Tersedia</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dotBooked}></span>
          <span>Tidak Tersedia (Terisi)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dotMaintenance}></span>
          <span>Dalam Perbaikan</span>
        </div>
      </div>

      {/* Grid Slot Waktu 30 Menit */}
      <div className={styles.slotGrid}>
        {slots.map((slot, index) => {
          let slotStyle = `${styles.slotCard} ${styles.slotAvailable}`;

          if (slot.reason === 'Dalam Perbaikan') {
            slotStyle = `${styles.slotCard} ${styles.slotMaintenance}`;
          } else if (!slot.isAvailable) {
            slotStyle = `${styles.slotCard} ${styles.slotBooked}`;
          }

          return (
            <div key={index} className={slotStyle}>
              <span className={styles.slotTime}>
                {slot.startTime} - {slot.endTime}
              </span>
              <span className={styles.slotStatus}>
                {slot.reason}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}