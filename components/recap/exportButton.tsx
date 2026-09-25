// components/recap/ExportButton.tsx
'use client';

import React from 'react';
import styles from '@/app/admin/recap/recap.module.css';

interface ExportButtonProps {
  startDate: string;
  endDate: string;
  location?: string;
  facilityId?: string;
  format?: 'csv' | 'excel';
  disabled?: boolean;
}

export default function ExportButton({
  startDate,
  endDate,
  location = 'all',
  facilityId = 'all',
  format = 'csv',
  disabled = false,
}: ExportButtonProps) {
  const handleExport = () => {
    if (disabled) return;

    // Memanggil API route yang telah kita buat di /api/recap/export
    const exportUrl = `/api/recap/export?startDate=${startDate}&endDate=${endDate}&location=${location}&facilityId=${facilityId}&format=${format}`;
    
    // Memicu download di browser
    window.open(exportUrl, '_blank');
  };

  const label = format === 'excel' ? '📊 Ekspor Excel' : '📄 Ekspor CSV';

  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      className={styles.exportButton}
      type="button"
    >
      {label}
    </button>
  );
}