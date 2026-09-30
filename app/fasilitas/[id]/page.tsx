// app/fasilitas/[id]/page.tsx
'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Facility, TimeSlot } from '@/types/facility';
import styles from './detail-fasilitas.module.css';

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FacilityDetailPage({ params }: DetailPageProps) {
  // Unwrap params menggunakan `use()` Hook di Next.js 15
  const resolvedParams = use(params);
  const facilityId = resolvedParams.id;

  const supabase = createClient();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State Tanggal untuk Cek Ketersediaan (Default: Hari ini Format YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [approvedReservations, setApprovedReservations] = useState<
    { start_time: string; end_time: string }[]
  >([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // 1. Fetch Detail Fasilitas
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
        console.error('Error fetching facility detail:', error);
        setError('Fasilitas tidak ditemukan atau gagal memuat data.');
      } else {
        setFacility(data);
      }
      setLoading(false);
    }

    fetchFacilityDetail();
  }, [facilityId, supabase]);

  // 2. Fetch Reservasi Disetujui pada Tanggal Terpilih (Sesuai Aturan 1 & 6)
  useEffect(() => {
    async function fetchReservations() {
      if (!facilityId) return;
      setLoadingSlots(true);

      // Hanya reservasi berstatus 'disetujui' / 'approved' yang mengunci slot (Aturan 6)
      const { data, error } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('facility_id', facilityId)
        .in('status', ['disetujui', 'approved'])
        .gte('start_time', `${selectedDate}T00:00:00`)
        .lte('end_time', `${selectedDate}T23:59:59`);

      if (error) {
        console.error('Error fetching slots:', error);
      } else {
        setApprovedReservations(data || []);
      }
      setLoadingSlots(false);
    }

    fetchReservations();
  }, [facilityId, selectedDate, supabase]);

  // 3. Generate 26 Slot Waktu (07.00 - 20.00 WIB, Kelipatan 30 Menit)
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    const startHour = 7; // Jam 07:00 WIB
    const endHour = 20; // Jam 20:00 WIB

    let currentMinutes = startHour * 60;
    const maxMinutes = endHour * 60;

    const isUnderMaintenance =
      facility?.status === 'dalam_perbaikan' || facility?.status === 'under_maintenance';

    while (currentMinutes < maxMinutes) {
      const startH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
      const startM = String(currentMinutes % 60).padStart(2, '0');

      const nextMinutes = currentMinutes + 30;
      const endH = String(Math.floor(nextMinutes / 60)).padStart(2, '0');
      const endM = String(nextMinutes % 60).padStart(2, '0');

      const startTimeStr = `${startH}:${startM}`;
      const endTimeStr = `${endH}:${endM}`;

      // Pengecekan bentrok dengan reservasi yang disetujui (Aturan 7)
      const isBooked = approvedReservations.some((res) => {
        // Ambil format jam HH:mm dari timestamp ISO DB
        const resStart = new Date(res.start_time).toTimeString().substring(0, 5);
        const resEnd = new Date(res.end_time).toTimeString().substring(0, 5);

        // Bentrok jika rentang overlap: (StartA < EndB) AND (EndA > StartB)
        return startTimeStr < resEnd && endTimeStr > resStart;
      });

      let isAvailable = true;
      let reason = 'Tersedia';

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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Memuat detail fasilitas...</div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className={styles.container}>
        <Link href="/fasilitas" className={styles.backButton}>
          ← Kembali ke Katalog
        </Link>
        <div className={styles.errorState}>{error || 'Fasilitas tidak ditemukan.'}</div>
      </div>
    );
  }

  const isMaintenance =
    facility.status === 'dalam_perbaikan' || facility.status === 'under_maintenance';

  return (
    <div className={styles.container}>
      {/* Tombol Kembali */}
      <Link href="/fasilitas" className={styles.backButton}>
        ← Kembali ke Katalog Fasilitas
      </Link>

      {/* Card Info Utama Fasilitas */}
      <div className={styles.facilityCard}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>DETAIL FASILITAS</p>
            <h1 className={styles.title}>{facility.name}</h1>
          </div>
          {isMaintenance ? (
            <span className={styles.badgeMaintenance}>DALAM PERBAIKAN</span>
          ) : (
            <span className={styles.badgeActive}>TERSEDIA</span>
          )}
        </div>

        {/* Info Atribut */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tipe Fasilitas</span>
            <span className={styles.infoValue}>{facility.type || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Lokasi</span>
            <span className={styles.infoValue}>{facility.location || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Kapasitas</span>
            <span className={styles.infoValue}>
              {facility.capacity ? `${facility.capacity} Orang` : '-'}
            </span>
          </div>
        </div>

        {facility.description && (
          <p className={styles.description}>{facility.description}</p>
        )}
      </div>

      {/* Section Jadwal & Slot Ketersediaan (US 1) */}
      <div className={styles.scheduleSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Jadwal & Ketersediaan Slot</h2>

          {/* Filter Tanggal */}
          <div className={styles.datePickerBox}>
            <label htmlFor="scheduleDate">Pilih Tanggal:</label>
            <input
              type="date"
              id="scheduleDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>

        {/* Keterangan Warna */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dotAvailable}></span>
            <span>Tersedia</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotBooked}></span>
            <span>Tidak Tersedia (Terisi)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotMaintenance}></span>
            <span>Dalam Perbaikan</span>
          </div>
        </div>

        {/* Loading Slot */}
        {loadingSlots ? (
          <div className={styles.loadingState}>Memeriksa ketersediaan slot waktu...</div>
        ) : (
          /* Grid 26 Slot Waktu (07.00 - 20.00 WIB) */
          <div className={styles.slotGrid}>
            {timeSlots.map((slot, idx) => {
              let cardStyle = styles.slotCardAvailable;
              if (slot.reason === 'Dalam Perbaikan') {
                cardStyle = styles.slotCardMaintenance;
              } else if (!slot.isAvailable) {
                cardStyle = styles.slotCardBooked;
              }

              return (
                <div key={idx} className={cardStyle}>
                  <div className={styles.slotTime}>
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div className={styles.slotStatus}>{slot.reason}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}