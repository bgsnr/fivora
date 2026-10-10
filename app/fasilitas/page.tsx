// app/fasilitas/page.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import FilterDropdown from '@/components/facilities/filter-dropdown';
import { matchesFacilityLocation } from '@/lib/facility-search';

import { Facility, FacilityStatus } from '@/types/facility';
import {
  FACILITY_CATEGORIES,
  FACILITY_CAPACITY_NOTE,
  getFacilityCategory,
  formatFacilityCapacity,
} from '@/lib/facility-categories';

import styles from './fasilitas.module.css';

export default function CatalogFacilitiesPage() {
  const supabase = createClient();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk filter & pencarian (US 2)
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [locationSearch, setLocationSearch] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [minCapacity, setMinCapacity] = useState<number | ''>('');

  // Fetch data fasilitas dari Supabase
  useEffect(() => {
    async function fetchFacilities() {
      setLoading(true);
      setError(null);

      // Hanya mengambil fasilitas yang aktif atau dalam perbaikan
      // Fasilitas nonaktif tidak ditampilkan di daftar publik (Aturan 13)
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .neq('status', 'nonaktif')
        .neq('status', 'inactive')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching facilities:', error);
        setError('Gagal memuat data fasilitas. Silakan coba lagi.');
      } else {
        setFacilities(data || []);
      }

      setLoading(false);
    }

    fetchFacilities();
  }, [supabase]);

  // Opsi unik untuk dropdown Tipe dan Lokasi
  const uniqueTypes = useMemo(() => {
    const types = new Set(facilities.map((f) => getFacilityCategory(f.type)));
    return FACILITY_CATEGORIES.filter((type) => types.has(type));
  }, [facilities]);

  const uniqueLocations = useMemo(() => {
    const locations = facilities
      .map((f) => f.location?.trim())
      .filter((l): l is string => Boolean(l));

    return Array.from(new Set(locations)).sort((a, b) => a.localeCompare(b, 'id'));
  }, [facilities]);

  // Filter fasilitas di client side
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description &&
          f.description.toLowerCase().includes(search.toLowerCase()));

      const matchesType =
        selectedType === 'all' || getFacilityCategory(f.type) === selectedType;

      const matchesLocation = exactLocation
        ? f.location?.trim() === exactLocation
        : matchesFacilityLocation(f.location, locationSearch);

      const matchesCapacity =
        minCapacity === '' ||
        (f.capacity !== null && f.capacity >= Number(minCapacity));

      return (
        matchesSearch &&
        matchesType &&
        matchesLocation &&
        matchesCapacity
      );
    });
  }, [facilities, search, selectedType, locationSearch, exactLocation, minCapacity]);

  // Helper Badge Status
  const renderStatusBadge = (status: FacilityStatus) => {
    if (
      status === 'dalam_perbaikan' ||
      status === 'under_maintenance'
    ) {
      return (
        <span className={styles.badgeMaintenance}>
          DALAM PERBAIKAN
        </span>
      );
    }

    return (
      <span className={styles.badgeActive}>
        TERSEDIA
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        <ArrowLeft size={17} aria-hidden="true" />
        Kembali ke halaman utama
      </Link>
      {/* Header */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>
          KATALOG & JADWAL FASILITAS
        </p>

        <h1 className={styles.title}>
          Fasilitas Kampus
        </h1>

        <p className={styles.subtitle}>
          Cari dan cek ketersediaan ruang kelas, laboratorium, aula, alat,
          dan lapangan kampus.
        </p>
        <p className={styles.dataNote}>{FACILITY_CAPACITY_NOTE}</p>
      </div>

      {/* Card Filter & Pencarian */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Input Pencarian Nama */}
          <div className={styles.filterGroup}>
            <label htmlFor="search">
              Cari Fasilitas
            </label>

            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kata kunci nama atau deskripsi..."
              className={styles.filterInput}
            />
          </div>

          {/* Filter Tipe */}
          <FilterDropdown
            id="type"
            label="Tipe Fasilitas"
            value={selectedType}
            options={[
              { value: 'all', label: 'Semua Tipe' },
              ...uniqueTypes.map((type) => ({ value: type, label: type })),
            ]}
            onChange={setSelectedType}
          />

          {/* Pencarian lokasi dengan saran dari data fasilitas */}
          <FilterDropdown
            id="location"
            label="Lokasi"
            value={locationSearch}
            options={[
              { value: '', label: 'Semua Lokasi' },
              ...uniqueLocations.map((loc) => ({ value: loc, label: loc })),
            ]}
            onChange={(value) => { setLocationSearch(value); setExactLocation(value); }}
            onSearch={(value) => { setLocationSearch(value); setExactLocation(''); }}
          />

          {/* Filter Kapasitas */}
          <div className={styles.filterGroup}>
            <label htmlFor="capacity">
              Kapasitas Minimal
            </label>

            <input
              type="number"
              id="capacity"
              min="0"
              value={minCapacity}
              onChange={(e) =>
                setMinCapacity(
                  e.target.value === ''
                    ? ''
                    : Number(e.target.value)
                )
              }
              placeholder="Kapasitas minimum..."
              className={styles.filterInput}
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        {(search ||
          selectedType !== 'all' ||
          locationSearch ||
          minCapacity !== '') && (
          <div className={styles.filterAction}>
            <button
              onClick={() => {
                setSearch('');
                setSelectedType('all');
                setLocationSearch('');
                setExactLocation('');
                setMinCapacity('');
              }}
              className={styles.resetButton}
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* State Loading */}
      {loading && (
        <div className={styles.loadingState}>
          Memuat data fasilitas...
        </div>
      )}

      {/* State Error */}
      {error && (
        <div className={styles.errorState}>
          {error}
        </div>
      )}

      {/* State Kosong */}
      {!loading &&
        !error &&
        filteredFacilities.length === 0 && (
          <div className={styles.emptyState}>
            <h3>
              Fasilitas Tidak Ditemukan
            </h3>

            <p>
              Coba ubah kata kunci pencarian atau pilihan filter Anda.
            </p>
          </div>
        )}

      {/* Grid Fasilitas */}
      {!loading &&
        !error &&
        filteredFacilities.length > 0 && (
          <div className={styles.facilityGrid}>
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className={styles.facilityCard}
              >
                <div>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.facilityName}>
                      {facility.name}
                    </h2>

                    {renderStatusBadge(facility.status)}
                  </div>

                  <div className={styles.cardDetails}>
                    <p>
                      Tipe:{' '}
                      <strong>
                        {getFacilityCategory(facility.type)}
                      </strong>
                    </p>

                    <p>
                      Lokasi:{' '}
                      <strong>
                        {facility.location || '-'}
                      </strong>
                    </p>

                    <p>
                      Kapasitas:{' '}
                      <strong>
                        {formatFacilityCapacity(facility)}
                      </strong>
                    </p>
                  </div>

                  {facility.description && (
                    <p className={styles.description}>
                      {facility.description}
                    </p>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <Link
                    href={`/fasilitas/${facility.id}`}
                    className={styles.actionButton}
                  >
                    Cek Jadwal & Ketersediaan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
