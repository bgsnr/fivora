// components/facilities/FacilityCard.tsx
import Link from 'next/link';
import { Facility, FacilityStatus } from '@/types/facility';
import styles from './facilityCard.module.css';

interface FacilityCardProps {
  facility: Facility;
  showActionButton?: boolean;
  actionHref?: string;
  actionText?: string;
}

export default function FacilityCard({
  facility,
  showActionButton = true,
  actionHref,
  actionText = 'Cek Jadwal & Ketersediaan',
}: FacilityCardProps) {
  // Helper render badge status berdasarkan tipe status
  const renderStatusBadge = (status: FacilityStatus) => {
    if (status === 'dalam_perbaikan' || status === 'under_maintenance') {
      return <span className={styles.badgeMaintenance}>DALAM PERBAIKAN</span>;
    }
    if (status === 'nonaktif' || status === 'inactive') {
      return <span className={styles.badgeInactive}>NONAKTIF</span>;
    }
    return <span className={styles.badgeActive}>TERSEDIA</span>;
  };

  const targetHref = actionHref || `/fasilitas/${facility.id}`;

  return (
    <div className={styles.facilityCard}>
      <div>
        {/* Header Kartu: Nama & Badge Status */}
        <div className={styles.cardHeader}>
          <h3 className={styles.facilityName}>{facility.name}</h3>
          {renderStatusBadge(facility.status)}
        </div>

        {/* Informasi Utama */}
        <div className={styles.cardDetails}>
          <p>
            Tipe: <strong>{facility.type || '-'}</strong>
          </p>
          <p>
            Lokasi: <strong>{facility.location || '-'}</strong>
          </p>
          <p>
            Kapasitas:{' '}
            <strong>{facility.capacity ? `${facility.capacity} Orang` : '-'}</strong>
          </p>
        </div>

        {/* Deskripsi Singkat */}
        {facility.description && (
          <p className={styles.description}>{facility.description}</p>
        )}
      </div>

      {/* Tombol Aksi */}
      {showActionButton && (
        <div className={styles.cardFooter}>
          <Link href={targetHref} className={styles.actionButton}>
            {actionText}
          </Link>
        </div>
      )}
    </div>
  );
}