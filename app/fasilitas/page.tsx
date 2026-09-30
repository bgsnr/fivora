// app/fasilitas/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Facility, FacilityStatus } from '@/types/facility';
import styles from './fasilitas.module.css';

export default function CatalogFacilitiesPage() {
  const supabase = createClient();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk filter & pencarian (US 2)
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
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
    const types = facilities.map((f) => f.type).filter((t): t is string => Boolean(t));
    return Array.from(new Set(types));
  }, [facilities]);

  const uniqueLocations = useMemo(() => {
    const locations = facilities.map((f) => f.location).filter((l): l is string => Boolean(l));
    return Array.from(new Set(locations));
  }, [facilities]);

  // Filter fasilitas di client side
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

      const matchesType = selectedType === 'all' || f.type === selectedType;
      const matchesLocation = selectedLocation === 'all' || f.location === selectedLocation;
      const matchesCapacity =
        minCapacity === '' || (f.capacity !== null && f.capacity >= Number(minCapacity));

      return matchesSearch && matchesType && matchesLocation && matchesCapacity;
    });
  }, [facilities, search, selectedType, selectedLocation, minCapacity]);

  // Helper Badge Status
  const renderStatusBadge = (status: FacilityStatus) => {
    if (status === 'dalam_perbaikan' || status === 'under_maintenance') {
      return <span className={styles.badgeMaintenance}>DALAM PERBAIKAN</span>;
    }
    return <span className={styles.badgeActive}>TERSEDIA</span>;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>KATALOG & JADWAL FASILITAS</p>
        <h1 className={styles.title}>Fasilitas Kampus</h1>
        <p className={styles.subtitle}>
          Cari dan cek ketersediaan ruang kelas, laboratorium, aula, alat, dan lapangan kampus.
        </p>
      </div>

      {/* Card Filter & Pencarian */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Input Pencarian Nama */}
          <div className={styles.filterGroup}>
            <label htmlFor="search">Cari Fasilitas</label>
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
          <div className={styles.filterGroup}>
            <label htmlFor="type">Tipe Fasilitas</label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Semua Tipe</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Lokasi */}
          <div className={styles.filterGroup}>
            <label htmlFor="location">Lokasi</label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Semua Lokasi</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kapasitas */}
          <div className={styles.filterGroup}>
            <label htmlFor="capacity">Kapasitas Minimal</label>
            <input
              type="number"
              id="capacity"
              min="0"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Kapasitas minimum..."
              className={styles.filterInput}
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        {(search || selectedType !== 'all' || selectedLocation !== 'all' || minCapacity !== '') && (
          <div className={styles.filterAction}>
            <button
              onClick={() => {
                setSearch('');
                setSelectedType('all');
                setSelectedLocation('all');
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
      {loading && <div className={styles.loadingState}>Memuat data fasilitas...</div>}

      {/* State Error */}
      {error && <div className={styles.errorState}>{error}</div>}

      {/* State Kosong */}
      {!loading && !error && filteredFacilities.length === 0 && (
        <div className={styles.emptyState}>
          <h3>Fasilitas Tidak Ditemukan</h3>
          <p>Coba ubah kata kunci pencarian atau pilihan filter Anda.</p>
        </div>
      )}

      {/* Grid Fasilitas */}
      {!loading && !error && filteredFacilities.length > 0 && (
        <div className={styles.facilityGrid}>
          {filteredFacilities.map((facility) => (
            <div key={facility.id} className={styles.facilityCard}>
              <div>
                <div className={styles.cardHeader}>
                  <h2 className={styles.facilityName}>{facility.name}</h2>
                  {renderStatusBadge(facility.status)}
                </div>

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

                {facility.description && (
                  <p className={styles.description}>{facility.description}</p>
                )}
              </div>

              <div className={styles.cardFooter}>
                <Link href={`/fasilitas/${facility.id}`} className={styles.actionButton}>
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