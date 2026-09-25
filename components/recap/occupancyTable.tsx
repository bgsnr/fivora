import React from 'react';
import styles from '@/app/admin/recap/recap.module.css';

export interface OccupancyTableItem {
  facilityId: number;
  facilityName: string;
  type: string;
  location: string;
  approvedSlotsCount: number;
  formattedOccupancy: string;
  occupancyPercentage: number;
}

interface OccupancyTableProps {
  data: OccupancyTableItem[];
  loading?: boolean;
}

export default function OccupancyTable({ data, loading = false }: OccupancyTableProps) {
  if (loading) {
    return <div className={styles.loadingState}>Memuat data rekapitulasi okupansi...</div>;
  }

  if (data.length === 0) {
    return <div className={styles.emptyState}>Tidak ada data okupansi untuk periode ini.</div>;
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Fasilitas</th>
              <th>Tipe</th>
              <th>Lokasi</th>
              <th>Slot Terpakai (30 Menit)</th>
              <th>Persentase Okupansi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.facilityId}>
                <td className={styles.facilityName}>{item.facilityName}</td>
                <td>{item.type || '-'}</td>
                <td>{item.location || '-'}</td>
                <td>
                  <strong>{item.approvedSlotsCount}</strong> slot
                </td>
                <td>
                  <span
                    className={
                      item.occupancyPercentage > 0
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }
                  >
                    {item.formattedOccupancy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}