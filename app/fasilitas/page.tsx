'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import FilterDropdown from '@/components/facilities/filter-dropdown';
import { matchesFacilityLocation } from '@/lib/facility-search';

import type { Facility, FacilityStatus } from '@/types/facility';

import {
  FACILITY_CATEGORIES,
  FACILITY_CAPACITY_NOTE,
  getFacilityCategory,
  formatFacilityCapacity,
} from '@/lib/facility-categories';

import styles from './fasilitas.module.css';

interface ApprovedReservation {
  facility_id: Facility['id'];
  start_time: string;
  end_time: string;
}

const supabase = createClient();

// Mengambil tanggal lokal komputer.
const getTodayLocal = (): string => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Mengubah jumlah menit menjadi format HH:mm.
const formatTime = (minutes: number): string => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');

  return `${hours}:${mins}`;
};

// Mengecek apakah seluruh slot fasilitas sudah terisi hari ini.
function isFacilityFullyBookedToday(
  facilityId: Facility['id'],
  reservations: ApprovedReservation[]
): boolean {
  const facilityReservations = reservations.filter(
    (reservation) =>
      String(reservation.facility_id) === String(facilityId)
  );

  if (facilityReservations.length === 0) {
    return false;
  }

  const startMinutes = 7 * 60;
  const endMinutes = 20 * 60;

  for (
    let currentMinutes = startMinutes;
    currentMinutes < endMinutes;
    currentMinutes += 30
  ) {
    const slotStart = formatTime(currentMinutes);
    const slotEnd = formatTime(currentMinutes + 30);

    const isBooked = facilityReservations.some((reservation) => {
      const reservationStart = reservation.start_time.slice(0, 5);
      const reservationEnd = reservation.end_time.slice(0, 5);

      return (
        slotStart < reservationEnd &&
        slotEnd > reservationStart
      );
    });

    // Masih ada slot kosong, berarti belum terisi penuh.
    if (!isBooked) {
      return false;
    }
  }

  return true;
}

export default function CatalogFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const [approvedReservations, setApprovedReservations] = useState<
    ApprovedReservation[]
  >([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State pencarian dan filter.
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [locationSearch, setLocationSearch] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [minCapacity, setMinCapacity] = useState<number | ''>('');

  // Mengambil semua fasilitas, termasuk yang nonaktif.
  useEffect(() => {
    async function fetchFacilities() {
      setLoading(true);
      setError(null);

      const today = getTodayLocal();

      const [facilitiesResult, reservationsResult] =
        await Promise.all([
          supabase
            .from('facilities')
            .select('*')
            .order('name', { ascending: true }),

          supabase
            .from('reservations')
            .select('facility_id, start_time, end_time')
            .eq('reservation_date', today)
            .in('status', ['disetujui', 'approved']),
        ]);

      if (facilitiesResult.error) {
        console.error(
          'Error fetching facilities:',
          facilitiesResult.error
        );

        setError('Gagal memuat data fasilitas. Silakan coba lagi.');
        setFacilities([]);
      } else {
        // Fasilitas nonaktif tetap terlihat di katalog.
        setFacilities(facilitiesResult.data || []);
      }

      if (reservationsResult.error) {
        console.error(
          'Error fetching approved reservations:',
          reservationsResult.error
        );

        setApprovedReservations([]);
      } else {
        setApprovedReservations(reservationsResult.data || []);
      }

      setLoading(false);
    }

    void fetchFacilities();
  }, []);

  // Opsi kategori fasilitas.
  const uniqueTypes = useMemo(() => {
    const types = new Set(
      facilities.map((facility) =>
        getFacilityCategory(facility.type)
      )
    );

    return FACILITY_CATEGORIES.filter((type) =>
      types.has(type)
    );
  }, [facilities]);

  // Opsi lokasi yang tersedia.
  const uniqueLocations = useMemo(() => {
    const locations = facilities
      .map((facility) => facility.location?.trim())
      .filter(
        (location): location is string => Boolean(location)
      );

    return Array.from(new Set(locations)).sort((a, b) =>
      a.localeCompare(b, 'id')
    );
  }, [facilities]);

  // Filter nama, deskripsi, kategori, lokasi, dan kapasitas.
  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        facility.name.toLowerCase().includes(normalizedSearch) ||
        Boolean(
          facility.description
            ?.toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesType =
        selectedType === 'all' ||
        getFacilityCategory(facility.type) === selectedType;

      const matchesLocation = exactLocation
        ? facility.location?.trim() === exactLocation
        : matchesFacilityLocation(
            facility.location,
            locationSearch
          );

      const matchesCapacity =
        minCapacity === '' ||
        (facility.capacity !== null &&
          facility.capacity >= Number(minCapacity));

      return (
        matchesSearch &&
        matchesType &&
        matchesLocation &&
        matchesCapacity
      );
    });
  }, [
    facilities,
    search,
    selectedType,
    locationSearch,
    exactLocation,
    minCapacity,
  ]);

  // Menentukan badge status fasilitas.
  const renderStatusBadge = (
    status: FacilityStatus,
    isFullyBooked: boolean
  ) => {
    // Status nonaktif memiliki prioritas paling tinggi.
    if (status === 'nonaktif' || status === 'inactive') {
      return (
        <span className={styles.badgeUnavailable}>
          TIDAK TERSEDIA
        </span>
      );
    }

    // Fasilitas sedang diperbaiki.
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

    // Fasilitas aktif, tetapi semua slot hari ini terisi.
    if (isFullyBooked) {
      return (
        <span
          className={styles.badgeOccupied}
          title="Semua slot hari ini sudah terisi reservasi yang disetujui."
        >
          TERISI
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
      {/* Tombol kembali */}
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
          Cari dan cek ketersediaan ruang kelas, laboratorium,
          aula, alat, dan lapangan kampus.
        </p>

        <p className={styles.dataNote}>
          {FACILITY_CAPACITY_NOTE}
        </p>
      </div>

      {/* Filter dan pencarian */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Pencarian nama atau deskripsi */}
          <div className={styles.filterGroup}>
            <label htmlFor="search">
              Cari Fasilitas
            </label>

            <input
              type="text"
              id="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Kata kunci nama atau deskripsi..."
              className={styles.filterInput}
            />
          </div>

          {/* Filter kategori */}
          <FilterDropdown
            id="type"
            label="Tipe Fasilitas"
            value={selectedType}
            options={[
              { value: 'all', label: 'Semua Tipe' },
              ...uniqueTypes.map((type) => ({
                value: type,
                label: type,
              })),
            ]}
            onChange={setSelectedType}
          />

          {/* Filter dan pencarian lokasi */}
          <FilterDropdown
            id="location"
            label="Lokasi"
            value={locationSearch}
            options={[
              { value: '', label: 'Semua Lokasi' },
              ...uniqueLocations.map((location) => ({
                value: location,
                label: location,
              })),
            ]}
            onChange={(value) => {
              setLocationSearch(value);
              setExactLocation(value);
            }}
            onSearch={(value) => {
              setLocationSearch(value);
              setExactLocation('');
            }}
          />

          {/* Filter kapasitas */}
          <div className={styles.filterGroup}>
            <label htmlFor="capacity">
              Kapasitas Minimal
            </label>

            <input
              type="number"
              id="capacity"
              min="0"
              value={minCapacity}
              onChange={(event) =>
                setMinCapacity(
                  event.target.value === ''
                    ? ''
                    : Number(event.target.value)
                )
              }
              placeholder="Kapasitas minimum..."
              className={styles.filterInput}
            />
          </div>
        </div>

        {/* Reset filter */}
        {(search ||
          selectedType !== 'all' ||
          locationSearch ||
          minCapacity !== '') && (
          <div className={styles.filterAction}>
            <button
              type="button"
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

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          Memuat data fasilitas...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.errorState}>
          {error}
        </div>
      )}

      {/* Data kosong */}
      {!loading &&
        !error &&
        filteredFacilities.length === 0 && (
          <div className={styles.emptyState}>
            <h3>Fasilitas Tidak Ditemukan</h3>
            <p>
              Coba ubah kata kunci pencarian atau pilihan filter Anda.
            </p>
          </div>
        )}

      {/* Kartu fasilitas */}
      {!loading &&
        !error &&
        filteredFacilities.length > 0 && (
          <div className={styles.facilityGrid}>
            {filteredFacilities.map((facility) => {
              const fullyBooked = isFacilityFullyBookedToday(
                facility.id,
                approvedReservations
              );

              return (
                <div
                  key={facility.id}
                  className={styles.facilityCard}
                >
                  <div>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.facilityName}>
                        {facility.name}
                      </h2>

                      {renderStatusBadge(
                        facility.status,
                        fullyBooked
                      )}
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

                  {/* Tombol detail */}
                  <div className={styles.cardFooter}>
                    <Link
                      href={`/fasilitas/${facility.id}`}
                      className={styles.actionButton}
                    >
                      Cek Jadwal & Ketersediaan
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}