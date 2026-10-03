'use client';

import React from 'react';
import styles from '@/app/admin/recap/recap.module.css';

interface RecapFilterProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  selectedFacilityId: string;
  onFacilityChange: (value: string) => void;
  locations: string[];
  facilities: { id: number; name: string }[];
}

export default function RecapFilter({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedLocation,
  onLocationChange,
  selectedFacilityId,
  onFacilityChange,
  locations,
  facilities,
}: RecapFilterProps) {
  return (
    <div className={styles.filterCard}>
      <div className={styles.filterGrid}>
        {/* Tanggal Mulai */}
        <div className={styles.filterGroup}>
          <label htmlFor="startDate">Tanggal Mulai</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        {/* Tanggal Selesai */}
        <div className={styles.filterGroup}>
          <label htmlFor="endDate">Tanggal Selesai</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        {/* Filter Lokasi */}
        <div className={styles.filterGroup}>
          <label htmlFor="locationFilter">Lokasi</label>
          <select
            id="locationFilter"
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Semua Lokasi</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Fasilitas Spesifik */}
        <div className={styles.filterGroup}>
          <label htmlFor="facilityFilter">Fasilitas Spesifik</label>
          <select
            id="facilityFilter"
            value={selectedFacilityId}
            onChange={(e) => onFacilityChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Semua Fasilitas</option>
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className={styles.noteText}>
        * Standar pembagi okupansi menggunakan <strong>26 slot operasional (30 menit/slot) per hari</strong>.
      </p>
    </div>
  );
}