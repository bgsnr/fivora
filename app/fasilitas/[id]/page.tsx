'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';
import { Facility, TimeSlot } from '@/types/facility';

const styles = {
  container:
    'min-h-screen box-border px-4 py-6 pb-10 sm:px-8 sm:py-8 sm:pb-14 bg-white text-[#010736]',
  backButton:
    'inline-flex items-center gap-1.5 mb-5 text-[#010736] text-xs font-bold no-underline transition-colors hover:text-[#22396f] hover:underline',
  facilityCard:
    'box-border p-6 border border-[#22396f40] rounded-2xl bg-white shadow-[0_4px_20px_rgba(1,7,54,0.06)]',
  header:
    'flex items-start justify-between gap-4',
  eyebrow:
    'm-0 mb-1.5 text-[#22396f] text-[9px] font-extrabold tracking-[0.16em] uppercase',
  title:
    'm-0 text-[#010736] text-2xl font-extrabold tracking-tight',
  badgeActive:
    'px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold',
  badgeMaintenance:
    'px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[10px] font-extrabold',
  badgeUnavailable:
    'px-2.5 py-1 rounded-full bg-red-50 border border-red-300 text-red-600 text-[10px] font-extrabold',
  infoGrid:
    'grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 p-4 rounded-xl bg-[#fcf1d0] border border-[#22396f26]',
  infoItem: 'flex flex-col gap-1',
  infoLabel: 'text-[#22396f] text-[11px] font-semibold',
  infoValue: 'text-[#010736] text-[13px] font-bold',
  description: 'mt-4 text-[#22396f] text-xs leading-relaxed',
  ctaRow:
    'mt-5 pt-4 border-t border-[#22396f26]',
  ctaButton:
    'inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#010736] text-[#fcf1d0] text-[13px] font-bold no-underline transition hover:bg-[#22396f] hover:-translate-y-px',
  ctaButtonDisabled:
    'inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#22396f40] bg-slate-100 text-slate-400 text-[13px] font-bold cursor-not-allowed',
  ctaNote: 'm-0 mt-2 text-amber-700 text-[11px] font-semibold',
  scheduleSection: 'mt-8',
  sectionHeader:
    'flex flex-col items-start gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between',
  sectionTitle: 'm-0 text-[#010736] text-xl font-bold',
  datePickerBox:
    'flex items-center gap-2 px-3.5 py-2 border border-[#22396f40] rounded-xl bg-white',
  dateInput:
    'border-0 outline-none bg-transparent text-[#010736] font-bold text-xs cursor-pointer',
  legend:
    'flex flex-wrap gap-4 mb-4 px-4 py-3 rounded-xl bg-white border border-[#22396f40]',
  legendItem:
    'flex items-center gap-2 text-[11px] text-[#22396f] font-semibold',
  dotAvailable:
    'w-2.5 h-2.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-700',
  dotBooked:
    'w-2.5 h-2.5 rounded-full bg-red-50 border-[1.5px] border-red-600',
  dotMaintenance:
    'w-2.5 h-2.5 rounded-full bg-amber-50 border-[1.5px] border-amber-700',
  slotGrid:
    'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
  slotCardAvailable:
    'flex flex-col justify-between box-border p-3.5 rounded-xl min-h-[72px] border border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:-translate-y-0.5 hover:shadow-md',
  slotCardBooked:
    'flex flex-col justify-between box-border p-3.5 rounded-xl min-h-[72px] border border-red-300 bg-red-50 text-red-600 transition hover:-translate-y-0.5 hover:shadow-md',
  slotCardMaintenance:
    'flex flex-col justify-between box-border p-3.5 rounded-xl min-h-[72px] border border-amber-300 bg-amber-50 text-amber-700 transition hover:-translate-y-0.5 hover:shadow-md',
  slotTime: 'text-[13px] font-extrabold',
  slotStatus:
    'text-[10px] font-bold uppercase tracking-wide',
  loadingState:
    'p-10 text-center text-[#22396f] text-[13px]',
  errorState:
    'p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-600 text-xs',
}

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

        {/* CTA Reservasi */}
        <div className={styles.ctaRow}>
          {facility.status === 'aktif' ||
          facility.status === 'active' ? (
            <Link
              href={`/reservations/new?facility_id=${facilityId}`}
              className={styles.ctaButton}
            >
              Pesan Fasilitas Ini
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled
                title={
                  facility.status === 'dalam_perbaikan' ||
                  facility.status === 'under_maintenance'
                    ? 'Fasilitas sedang dalam perbaikan'
                    : 'Fasilitas tidak aktif'
                }
                className={styles.ctaButtonDisabled}
              >
                Pesan Fasilitas Ini
              </button>

              <p className={styles.ctaNote}>
                {facility.status === 'dalam_perbaikan' ||
                facility.status === 'under_maintenance'
                  ? 'Fasilitas sedang dalam perbaikan dan belum dapat dipesan.'
                  : 'Fasilitas sedang nonaktif dan tidak menerima reservasi.'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Section Jadwal */}
      <div className={styles.scheduleSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Jadwal & Ketersediaan Slot
          </h2>

          {/* Filter Tanggal */}
          <div className={styles.datePickerBox}>
            <label
              htmlFor="scheduleDate"
              className="text-[#0d1c42] text-[11px] font-bold"
            >
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