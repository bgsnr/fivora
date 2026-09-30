import React from 'react';
import styles from '@/app/admin/recap/recap.module.css';

export interface DamageFrequencyTableItem {
  facilityId: number;
  facilityName: string;
  type: string;
  location: string;
  validReportCount: number;
}

interface DamageFrequencyTableProps {
  data: DamageFrequencyTableItem[];
  loading?: boolean;
}

export default function DamageFrequencyTable({
  data,
  loading = false,
}: DamageFrequencyTableProps) {
  if (loading) {
    return <div className={styles.loadingState}>Memuat data frekuensi kerusakan...</div>;
  }

  if (data.length === 0) {
    return <div className={styles.emptyState}>Tidak ada data laporan kerusakan untuk periode ini.</div>;
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
              <th>Frekuensi Laporan Valid</th>
              <th>Status Tingkat Kerusakan</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.facilityId}>
                <td className={styles.facilityName}>{item.facilityName}</td>
                <td>{item.type || '-'}</td>
                <td>{item.location || '-'}</td>
                <td>
                  <strong
                    className={
                      item.validReportCount > 0 ? styles.reportHigh : styles.reportNormal
                    }
                  >
                    {item.validReportCount} Laporan
                  </strong>
                </td>
                <td>
                  {item.validReportCount > 0 ? (
                    <span className={styles.badgeInactive}>Pernah Rusak Valid</span>
                  ) : (
                    <span className={styles.badgeActive}>Tidak Ada Laporan Valid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}