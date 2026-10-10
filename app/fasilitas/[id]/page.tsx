
'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';
import type { Facility, TimeSlot } from '@/types/facility';

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
  badgeChecking:
    'px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-extrabold',
  infoGrid:
    'grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 p-4 rounded-xl bg-[#fcf1d0] border border-[#22396f26]',
  infoItem: 'flex flex-col gap-1',
  infoLabel: 'text-[#22396f] text-[11px] font-semibold',
  infoValue: 'text-[#010736] text-[13px] font-bold',
  description: 'mt-4 text-[#22396f] text-xs leading-relaxed',
  ctaRow: 'mt-5 pt-4 border-t border-[#22396f26]',
  ctaButton:
    'inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#010736] text-[#fcf1d0] text-[13px] font-bold no-underline transition hover:bg-[#22396f] hover:-translate-y-px',
  ctaButtonDisabled:
    'inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#22396f40] bg-slate-100 text-slate-400 text-[13px] font-bold cursor-not-allowed',
  ctaNote:
    'm-0 mt-2 text-amber-700 text-[11px] font-semibold',
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
};

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

const getTodayLocal = (): string => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Supaya client Supabase dibuat sekali.
const supabase = createClient();

export default function FacilityDetailPage({
  params,
}: DetailPageProps) {
  const resolvedParams = use(params);
  const facilityId = resolvedParams.id;

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] =
    useState<string>(getTodayLocal());

  const [approvedReservations, setApprovedReservations] = useState<
    { start_time: string; end_time: string }[]
  >([]);

  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // 1. Mengambil detail fasilitas.
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

        setError(
          'Fasilitas tidak ditemukan atau gagal memuat data.'
        );
      } else {
        setFacility(data);
      }

      setLoading(false);
    }

    void fetchFacilityDetail();
  }, [facilityId]);

  // 2. Mengambil reservasi yang disetujui pada tanggal pilihan.
  useEffect(() => {
    async function fetchReservations() {
      if (!facilityId) {
        return;
      }

      setLoadingSlots(true);

      const { data, error } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('facility_id', facilityId)
        .eq('reservation_date', selectedDate)
        .in('status', ['disetujui', 'approved']);

      if (error) {
        console.error('Error fetching slots:', error);
        setApprovedReservations([]);
      } else {
        setApprovedReservations(data || []);
      }

      setLoadingSlots(false);
    }

    void fetchReservations();
  }, [facilityId, selectedDate]);

  // 3. Membuat slot 30 menit dari pukul 07.00 sampai 20.00.
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];

    const startHour = 7;
    const endHour = 20;

    let currentMinutes = startHour * 60;
    const maxMinutes = endHour * 60;

    const isInactive =
      facility?.status === 'nonaktif' ||
      facility?.status === 'inactive';

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

      // Mengecek apakah slot bertabrakan dengan reservasi disetujui.
      const isBooked = approvedReservations.some((reservation) => {
        const reservationStart = reservation.start_time.slice(0, 5);
        const reservationEnd = reservation.end_time.slice(0, 5);

        return (
          startTimeStr < reservationEnd &&
          endTimeStr > reservationStart
        );
      });

      let isAvailable = true;
      let reason = 'Tersedia';

      // Urutan status: nonaktif, perbaikan, lalu reservasi.
      if (isInactive) {
        isAvailable = false;
        reason = 'Tidak Tersedia';
      } else if (isUnderMaintenance) {
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

  // Loading detail fasilitas.
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          Memuat detail fasilitas...
        </div>
      </div>
    );
  }

  // Error detail fasilitas.
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

  // Status fasilitas.
  const isInactive =
    facility.status === 'nonaktif' ||
    facility.status === 'inactive';

  const isMaintenance =
    facility.status === 'dalam_perbaikan' ||
    facility.status === 'under_maintenance';

  // Mengecek apakah seluruh slot hari yang dipilih sudah terisi.
  const isFullyBooked =
    !isInactive &&
    !isMaintenance &&
    !loadingSlots &&
    timeSlots.length > 0 &&
    timeSlots.every((slot) => !slot.isAvailable);

  const isFacilityActive =
    facility.status === 'aktif' ||
    facility.status === 'active';

  return (
    <div className={styles.container}>
      {/* Tombol kembali */}
      <Link
        href="/fasilitas"
        className={styles.backButton}
      >
        ← Kembali ke Katalog Fasilitas
      </Link>

      {/* Informasi utama fasilitas */}
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

          {isInactive ? (
            <span className={styles.badgeUnavailable}>
              TIDAK TERSEDIA
            </span>
          ) : isMaintenance ? (
            <span className={styles.badgeMaintenance}>
              DALAM PERBAIKAN
            </span>
          ) : loadingSlots ? (
            <span className={styles.badgeChecking}>
              MEMERIKSA...
            </span>
          ) : isFullyBooked ? (
            <span className={styles.badgeUnavailable}>
              TERISI
            </span>
          ) : (
            <span className={styles.badgeActive}>
              TERSEDIA
            </span>
          )}
        </div>

        {/* Informasi atribut */}
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

        {/* Tombol reservasi */}
        <div className={styles.ctaRow}>
          {isFacilityActive ? (
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
                  isInactive
                    ? 'Fasilitas sedang nonaktif'
                    : isMaintenance
                      ? 'Fasilitas sedang dalam perbaikan'
                      : 'Fasilitas tidak dapat dipesan'
                }
                className={styles.ctaButtonDisabled}
              >
                Pesan Fasilitas Ini
              </button>

              <p className={styles.ctaNote}>
                {isInactive
                  ? 'Fasilitas sedang nonaktif dan tidak menerima reservasi.'
                  : isMaintenance
                    ? 'Fasilitas sedang dalam perbaikan dan belum dapat dipesan.'
                    : 'Fasilitas tidak dapat dipesan saat ini.'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Jadwal dan ketersediaan */}
      <div className={styles.scheduleSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Jadwal & Ketersediaan Slot
          </h2>

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
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              className={styles.dateInput}
            />
          </div>
        </div>

        {/* Keterangan warna */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dotAvailable} />
            <span>Tersedia</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.dotBooked} />
            <span>Tidak Tersedia</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.dotMaintenance} />
            <span>Dalam Perbaikan</span>
          </div>
        </div>

        {/* Slot waktu */}
        {loadingSlots ? (
          <div className={styles.loadingState}>
            Memeriksa ketersediaan slot waktu...
          </div>
        ) : (
          <div className={styles.slotGrid}>
            {timeSlots.map((slot, index) => {
              let cardStyle = styles.slotCardAvailable;

              if (slot.reason === 'Dalam Perbaikan') {
                cardStyle = styles.slotCardMaintenance;
              } else if (!slot.isAvailable) {
                cardStyle = styles.slotCardBooked;
              }

              return (
                <div
                  key={index}
                  className={cardStyle}
                >
                  <div className={styles.slotTime}>
                    {slot.startTime} - {slot.endTime}
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