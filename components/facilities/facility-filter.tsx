'use client';

import styles from './facilityFilter.module.css';

interface FacilityFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  minCapacity: number | '';
  onCapacityChange: (value: number | '') => void;
  availableTypes: string[];
  availableLocations: string[];
  onReset: () => void;
}

export default function FacilityFilter({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedLocation,
  onLocationChange,
  minCapacity,
  onCapacityChange,
  availableTypes,
  availableLocations,
  onReset,
}: FacilityFilterProps) {
  const isFiltered =
    search !== '' ||
    selectedType !== 'all' ||
    selectedLocation !== 'all' ||
    minCapacity !== '';

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterGrid}>
        {/* Input Pencarian Nama / Deskripsi */}
        <div className={styles.filterGroup}>
          <label htmlFor="searchFilter">Cari Fasilitas</label>
          <input
            type="text"
            id="searchFilter"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Kata kunci nama/deskripsi..."
            className={styles.filterInput}
          />
        </div>

        {/* Filter Tipe Fasilitas */}
        <div className={styles.filterGroup}>
          <label htmlFor="typeFilter">Tipe Fasilitas</label>
          <select
            id="typeFilter"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Semua Tipe</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Kapasitas Minimal */}
        <div className={styles.filterGroup}>
          <label htmlFor="capacityFilter">Kapasitas Minimal</label>
          <input
            type="number"
            id="capacityFilter"
            min="0"
            value={minCapacity}
            onChange={(e) =>
              onCapacityChange(
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            placeholder="Kapasitas minimum..."
            className={styles.filterInput}
          />
        </div>
      </div>

      {/* Tombol Reset Filter */}
      {isFiltered && (
        <div className={styles.filterAction}>
          <button onClick={onReset} className={styles.resetButton}>
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}