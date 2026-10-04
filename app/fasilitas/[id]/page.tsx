'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';
import { Facility, TimeSlot } from '@/types/facility';

import styles from './detail-fasilitas.module.css';

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

// Supaya tanggal mengikuti tanggal lokal komputer / WIB
const getTodayLocal = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Buat client sekali saja
const supabase = createClient();

export default function FacilityDetailPage({
  params,
}: DetailPageProps) {
  // Unwrap params menggunakan use() Hook di Next.js
  const resolvedParams = use(params);
  const facilityId = resolvedParams.id;

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tanggal default hari ini
  const [selectedDate, setSelectedDate] =
    useState<string>(getTodayLocal());

  const [approvedReservations, setApprovedReservations] = useState<
    { start_time: string; end_time: string }[]
  >([]);

  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // ==========================================
  // 1. Fetch Detail Fasilitas
  // ==========================================
  useEffect(() => {
    async function fetchFacilityDetail() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', facilityId)
        .single();

      if (error || !data) {
        console.error(
          'Error fetching facility detail:',
          error
        );

        setError(
          'Fasilitas tidak ditemukan atau gagal memuat data.'
        );
      } else {
        setFacility(data);
      }

      setLoading(false);
    }

    fetchFacilityDetail();
  }, [facilityId]);

  // ==========================================
  // 2. Fetch Reservasi yang Disetujui
  // pada tanggal yang dipilih
  // ==========================================
  useEffect(() => {
    async function fetchReservations() {
      if (!facilityId) return;

      setLoadingSlots(true);

      const { data, error } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('facility_id', facilityId)
        .eq('reservation_date', selectedDate)
        .in('status', ['disetujui', 'approved']);

      if (error) {
        console.error(
          'Error fetching slots:',
          error
        );

        setApprovedReservations([]);
      } else {
        setApprovedReservations(data || []);
      }

      setLoadingSlots(false);
    }

    fetchReservations();
  }, [facilityId, selectedDate]);

  // ==========================================
  // 3. Generate Slot 30 Menit
  // 07.00 - 20.00
  // ==========================================
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];

    const startHour = 7;
    const endHour = 20;

    let currentMinutes = startHour * 60;
    const maxMinutes = endHour * 60;

    const isUnderMaintenance =
      facility?.status === 'dalam_perbaikan' ||
      facility?.status === 'under_maintenance';

    while (currentMinutes < maxMinutes) {
      const startH = String(
        Math.floor(currentMinutes / 60)
      ).padStart(2, '0');

      const startM = String(
        currentMinutes % 60
      ).padStart(2, '0');

      const nextMinutes = currentMinutes + 30;

      const endH = String(
        Math.floor(nextMinutes / 60)
      ).padStart(2, '0');

      const endM = String(
        nextMinutes % 60
      ).padStart(2, '0');

      const startTimeStr = `${startH}:${startM}`;
      const endTimeStr = `${endH}:${endM}`;

      // Cek apakah slot bentrok dengan
      // reservasi yang sudah disetujui
      const isBooked = approvedReservations.some(
        (res) => {
          // Karena kolom database bertipe TIME,
          // cukup ambil HH:mm
          const resStart = res.start_time.slice(0, 5);
          const resEnd = res.end_time.slice(0, 5);

          // Cek overlap:
          // Start A < End B
          // dan End A > Start B
          return (
            startTimeStr < resEnd &&
            endTimeStr > resStart
          );
        }
      );

      let isAvailable = true;
      let reason = 'Tersedia';

      // Maintenance memiliki prioritas paling tinggi
      if (isUnderMaintenance) {
        isAvailable = false;
        reason = 'Dalam Perbaikan';
      } else if (isBooked) {
        isAvailable = false;
        reason = 'Tidak Tersedia';
      }

      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAvailable,
        reason,
      });

      currentMinutes = nextMinutes;
    }

    return slots;
  }, [facility, approvedReservations]);

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          Memuat detail fasilitas...
        </div>
      </div>
    );
  }

  // ==========================================
  // Error
  // ==========================================
  if (error || !facility) {
    return (
      <div className={styles.container}>
        <Link
          href="/fasilitas"
          className={styles.backButton}
        >
          ← Kembali ke Katalog
        </Link>

        <div className={styles.errorState}>
          {error || 'Fasilitas tidak ditemukan.'}
        </div>
      </div>
    );
  }

  // ==========================================
  // Status Fasilitas
  // ==========================================
  const isMaintenance =
    facility.status === 'dalam_perbaikan' ||
    facility.status === 'under_maintenance';

  // ==========================================
  // Apakah semua slot sudah terisi?
  //
  // Hanya dicek kalau:
  // - bukan maintenance
  // - data slot sudah selesai dimuat
  // - ada slot
  // - semua slot tidak tersedia
  // ==========================================
  const isFullyBooked =
    !isMaintenance &&
    !loadingSlots &&
    timeSlots.length > 0 &&
    timeSlots.every(
      (slot) => !slot.isAvailable
    );

  return (
    <div className={styles.container}>
      {/* Tombol Kembali */}
      <Link
        href="/fasilitas"
        className={styles.backButton}
      >
        ← Kembali ke Katalog Fasilitas
      </Link>

      {/* Card Info Utama Fasilitas */}
      <div className={styles.facilityCard}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              DETAIL FASILITAS
            </p>

            <h1 className={styles.title}>
              {facility.name}
            </h1>
          </div>

          {isMaintenance ? (
            <span className={styles.badgeMaintenance}>
              DALAM PERBAIKAN
            </span>
          ) : isFullyBooked ? (
            <span className={styles.badgeUnavailable}>
              TIDAK TERSEDIA
            </span>
          ) : (
            <span className={styles.badgeActive}>
              TERSEDIA
            </span>
          )}
        </div>

        {/* Info Atribut */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              Tipe Fasilitas
            </span>

            <span className={styles.infoValue}>
              {facility.type || '-'}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              Lokasi
            </span>

            <span className={styles.infoValue}>
              {facility.location || '-'}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              Kapasitas
            </span>

            <span className={styles.infoValue}>
              {facility.capacity
                ? `${facility.capacity} Orang`
                : '-'}
            </span>
          </div>
        </div>

        {facility.description && (
          <p className={styles.description}>
            {facility.description}
          </p>
        )}
      </div>

      {/* Section Jadwal */}
      <div className={styles.scheduleSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Jadwal & Ketersediaan Slot
          </h2>

          {/* Filter Tanggal */}
          <div className={styles.datePickerBox}>
            <label htmlFor="scheduleDate">
              Pilih Tanggal:
            </label>

            <input
              type="date"
              id="scheduleDate"
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(e.target.value)
              }
              className={styles.dateInput}
            />
          </div>
        </div>

        {/* Keterangan Warna */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span
              className={styles.dotAvailable}
            />
            <span>Tersedia</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.dotBooked} />
            <span>Tidak Tersedia</span>
          </div>

          <div className={styles.legendItem}>
            <span
              className={styles.dotMaintenance}
            />
            <span>Dalam Perbaikan</span>
          </div>
        </div>

        {/* Loading Slot */}
        {loadingSlots ? (
          <div className={styles.loadingState}>
            Memeriksa ketersediaan slot waktu...
          </div>
        ) : (
          <div className={styles.slotGrid}>
            {timeSlots.map((slot, idx) => {
              let cardStyle =
                styles.slotCardAvailable;

              if (
                slot.reason ===
                'Dalam Perbaikan'
              ) {
                cardStyle =
                  styles.slotCardMaintenance;
              } else if (!slot.isAvailable) {
                cardStyle =
                  styles.slotCardBooked;
              }

              return (
                <div
                  key={idx}
                  className={cardStyle}
                >
                  <div className={styles.slotTime}>
                    {slot.startTime} -{' '}
                    {slot.endTime}
                  </div>

                  <div className={styles.slotStatus}>
                    {slot.reason}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}