
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import type { Facility, FacilityStatus } from '@/types/facility';

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

// Mengecek apakah semua slot fasilitas sudah dipesan hari ini.
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

    // Jika masih ada satu slot kosong, fasilitas belum terisi penuh.
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

  // State untuk filter dan pencarian.
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [minCapacity, setMinCapacity] = useState<number | ''>('');

  // Mengambil seluruh fasilitas dan reservasi hari ini.
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
        // Fasilitas nonaktif tetap ditampilkan di katalog.
        setFacilities(facilitiesResult.data || []);
      }

      if (reservationsResult.error) {
        console.error(
          'Error fetching approved reservations:',
          reservationsResult.error
        );

        setApprovedReservations([]);
      } else {
        setApprovedReservations(
          reservationsResult.data || []
        );
      }

      setLoading(false);
    }

    void fetchFacilities();
  }, []);

  // Opsi unik untuk dropdown tipe.
  const uniqueTypes = useMemo(() => {
    const types = facilities
      .map((facility) => facility.type)
      .filter((type): type is string => Boolean(type));

    return Array.from(new Set(types));
  }, [facilities]);

  // Opsi unik untuk dropdown lokasi.
  const uniqueLocations = useMemo(() => {
    const locations = facilities
      .map((facility) => facility.location)
      .filter((location): location is string => Boolean(location));

    return Array.from(new Set(locations));
  }, [facilities]);

  // Filter fasilitas di sisi client.
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
        facility.type === selectedType;

      const matchesLocation =
        selectedLocation === 'all' ||
        facility.location === selectedLocation;

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
    selectedLocation,
    minCapacity,
  ]);

  // Badge status fasilitas.
  const renderStatusBadge = (
    status: FacilityStatus,
    isFullyBooked: boolean
  ) => {
    // Status nonaktif memiliki prioritas tertinggi.
    if (status === 'nonaktif' || status === 'inactive') {
      return (
        <span className={styles.badgeUnavailable}>
          TIDAK TERSEDIA
        </span>
      );
    }

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
      </div>

      {/* Filter dan pencarian */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label htmlFor="search">
              Cari Fasilitas
            </label>

            <input
              type="text"
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kata kunci nama atau deskripsi..."
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="type">
              Tipe Fasilitas
            </label>

            <select
              id="type"
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value)
              }
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

          <div className={styles.filterGroup}>
            <label htmlFor="location">
              Lokasi
            </label>

            <select
              id="location"
              value={selectedLocation}
              onChange={(event) =>
                setSelectedLocation(event.target.value)
              }
              className={styles.filterSelect}
            >
              <option value="all">Semua Lokasi</option>

              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

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

        {(search ||
          selectedType !== 'all' ||
          selectedLocation !== 'all' ||
          minCapacity !== '') && (
          <div className={styles.filterAction}>
            <button
              type="button"
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

      {/* Grid fasilitas */}
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
                        <strong>{facility.type || '-'}</strong>
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
                          {facility.capacity
                            ? `${facility.capacity} Orang`
                            : '-'}
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
              );
            })}
          </div>
        )}
    </div>
  );
}