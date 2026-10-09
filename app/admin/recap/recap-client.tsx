'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Facility } from '@/types/facility';
import { calculateOccupancy, getDaysDifference } from '@/lib/occupancy';
import styles from './recap.module.css';

function getWibDateString(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Gagal membaca tanggal WIB.');
  }

  return `${year}-${month}-${day}`;
}

function addCalendarDays(dateString: string, amount: number): string {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

// Mengubah nilai TIME dari PostgreSQL menjadi menit.
function timeToMinutes(value: string): number | null {
  const parts = value.split(':');

  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2] ?? 0);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isFinite(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds >= 60
  ) {
    return null;
  }

  return hours * 60 + minutes + seconds / 60;
}

interface FacilityRecapItem {
  facility: Facility;
  approvedSlotsCount: number;
  occupancyPercentage: number;
  formattedOccupancy: string;
  validReportCount: number;
  hasData: boolean;
}

export default function AdminRecapPage() {
  const supabase = createClient();
  const todayWib = getWibDateString(new Date());

  // Filter periode menggunakan tanggal kalender WIB.
  const [startDate, setStartDate] = useState<string>(() =>
    addCalendarDays(getWibDateString(new Date()), -7)
  );

  const [endDate, setEndDate] = useState<string>(() =>
    getWibDateString(new Date())
  );

  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoaded, setFacilitiesLoaded] = useState(false);
  const [recapData, setRecapData] = useState<FacilityRecapItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil data fasilitas.
  useEffect(() => {
    let cancelled = false;

    async function fetchFacilities() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('FACILITY QUERY ERROR:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });

        setFacilities([]);
        setFacilitiesLoaded(true);
        setLoading(false);
        return;
      }

      setFacilities(data || []);
      setFacilitiesLoaded(true);
    }

    fetchFacilities();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Ambil dan hitung rekap okupansi serta frekuensi kerusakan.
  useEffect(() => {
    let cancelled = false;

    async function calculateRecap() {
      if (!facilitiesLoaded) return;

      // Validasi periode.
      if (!startDate || !endDate || startDate > endDate) {
        setRecapData([]);
        setLoading(false);
        return;
      }

      if (facilities.length === 0) {
        setRecapData([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Batas waktu WIB dipakai untuk kolom created_at.
        const periodStart = `${startDate}T00:00:00+07:00`;

        const periodEndExclusive =
          `${addCalendarDays(endDate, 1)}T00:00:00+07:00`;

        const facilityIds = facilities.map((facility) => facility.id);

        // reservation_date adalah kolom bertipe DATE.
        // start_time dan end_time adalah kolom bertipe TIME,
        // sehingga keduanya tidak boleh difilter memakai timestamp.
        const {
          data: reservationsData,
          error: resError,
        } = await supabase
          .from('reservations')
          .select('facility_id, reservation_date, start_time, end_time')
          .in('facility_id', facilityIds)
          .in('status', ['disetujui', 'approved'])
          .gte('reservation_date', startDate)
          .lte('reservation_date', endDate);

        // Laporan valid dihitung berdasarkan tanggal pengajuan.
        const {
          data: reportsData,
          error: repError,
        } = await supabase
          .from('reports')
          .select('facility_id')
          .in('facility_id', facilityIds)
          .in('status', [
            'diproses',
            'selesai',
            'in_progress',
            'resolved',
          ])
          .gte('created_at', periodStart)
          .lt('created_at', periodEndExclusive);

        if (cancelled) return;

        if (resError || repError) {
          if (resError) {
            console.error(
              'RESERVATION QUERY ERROR:',
              JSON.stringify(resError, null, 2)
            );
          }

          if (repError) {
            console.error('REPORT QUERY ERROR:', {
              message: repError.message,
              code: repError.code,
              details: repError.details,
              hint: repError.hint,
            });
          }

          setRecapData([]);
          return;
        }

        // Hitung rekap untuk setiap fasilitas.
        const items: FacilityRecapItem[] = facilities.map((facility) => {
          const facilityReservations = (reservationsData || []).filter(
            (reservation) =>
              String(reservation.facility_id) === String(facility.id)
          );

          let approvedSlotsCount = 0;

          for (const reservation of facilityReservations) {
            const startMinutes = timeToMinutes(reservation.start_time);
            const endMinutes = timeToMinutes(reservation.end_time);

            // Abaikan durasi yang tidak valid.
            if (
              startMinutes === null ||
              endMinutes === null ||
              endMinutes <= startMinutes
            ) {
              continue;
            }

            const durationMinutes = endMinutes - startMinutes;

            // Satu slot operasional = 30 menit.
            approvedSlotsCount += Math.round(durationMinutes / 30);
          }

          // Penyebut dimulai dari tanggal fasilitas tercatat,
          // atau tanggal mulai periode jika tanggalnya lebih akhir.
          const facilityCreatedDate = getWibDateString(
            facility.created_at
          );

          const effectiveStartDate =
            facilityCreatedDate > startDate
              ? facilityCreatedDate
              : startDate;

          const eligibleDays =
            effectiveStartDate > endDate
              ? 0
              : getDaysDifference(effectiveStartDate, endDate);

          const occupancy = calculateOccupancy({
            approvedSlotCount: approvedSlotsCount,
            totalDays: eligibleDays,
          });

          const validReportCount = (reportsData || []).filter(
            (report) =>
              String(report.facility_id) === String(facility.id)
          ).length;

          return {
            facility,
            approvedSlotsCount,
            occupancyPercentage: occupancy.occupancyPercentage,
            formattedOccupancy: occupancy.formattedPercentage,
            validReportCount,
            hasData: occupancy.hasData,
          };
        });

        if (!cancelled) {
          setRecapData(items);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Gagal menghitung rekap:', error);
          setRecapData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    calculateRecap();

    return () => {
      cancelled = true;
    };
  }, [facilities, facilitiesLoaded, startDate, endDate, supabase]);

  // Daftar lokasi unik.
  const uniqueLocations = useMemo(() => {
    const locations = facilities
      .map((facility) => facility.location)
      .filter((location): location is string => Boolean(location));

    return Array.from(new Set(locations));
  }, [facilities]);

  // Terapkan filter lokasi dan fasilitas pada tabel.
  const filteredRecap = useMemo(() => {
    return recapData.filter((item) => {
      const matchesLocation =
        selectedLocation === 'all' ||
        item.facility.location === selectedLocation;

      const matchesFacility =
        selectedFacilityId === 'all' ||
        String(item.facility.id) === selectedFacilityId;

      return matchesLocation && matchesFacility;
    });
  }, [recapData, selectedLocation, selectedFacilityId]);

  // Ekspor menggunakan API yang melakukan pemeriksaan hak akses admin.
  const handleExportCSV = () => {
    if (
      loading ||
      !startDate ||
      !endDate ||
      startDate > endDate ||
      filteredRecap.length === 0
    ) {
      return;
    }

    const params = new URLSearchParams({
      startDate,
      endDate,
      location: selectedLocation,
      facilityId: selectedFacilityId,
      format: 'csv',
    });

    const link = document.createElement('a');

    link.href = `/api/recap/export?${params.toString()}`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>REKAPITULASI & LAPORAN</p>

          <h1 className={styles.title}>
            Rekap Okupansi & Kerusakan
          </h1>

          <p className={styles.subtitle}>
            Analisis penggunaan slot fasilitas dan tingkat frekuensi
            kerusakan valid berdasarkan periode tanggal.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={
            loading ||
            filteredRecap.length === 0 ||
            !startDate ||
            !endDate ||
            startDate > endDate
          }
          className={styles.exportButton}
        >
          📄 Ekspor CSV
        </button>
      </div>

      {/* Filter */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label htmlFor="start-date">Tanggal Mulai</label>

            <input
              id="start-date"
              type="date"
              value={startDate}
              max={todayWib}
              onChange={(event) => setStartDate(event.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="end-date">Tanggal Selesai</label>

            <input
              id="end-date"
              type="date"
              value={endDate}
              min={startDate}
              max={todayWib}
              onChange={(event) => setEndDate(event.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="location-filter">Lokasi</label>

            <select
              id="location-filter"
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
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
            <label htmlFor="facility-filter">Fasilitas Spesifik</label>

            <select
              id="facility-filter"
              value={selectedFacilityId}
              onChange={(event) =>
                setSelectedFacilityId(event.target.value)
              }
              className={styles.filterSelect}
            >
              <option value="all">Semua Fasilitas</option>

              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className={styles.noteText}>
          * Okupansi dihitung menggunakan{' '}
          <strong>
            26 slot operasional (30 menit per slot) per hari
          </strong>
          . Hari sebelum fasilitas tercatat tidak masuk penyebut.
        </p>
      </div>

      {/* Tabel rekap */}
      {loading ? (
        <div className={styles.loadingState}>
          Menghitung rekapitulasi data...
        </div>
      ) : filteredRecap.length === 0 ? (
        <div className={styles.emptyState}>
          Tidak ada data rekapitulasi pada periode ini.
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fasilitas</th>
                  <th>Lokasi</th>
                  <th>Tipe</th>
                  <th>Slot Terpakai</th>
                  <th>% Okupansi</th>
                  <th>Frekuensi Kerusakan</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecap.map((item) => (
                  <tr key={item.facility.id}>
                    <td className={styles.facilityName}>
                      {item.facility.name}
                    </td>

                    <td>{item.facility.location || '-'}</td>

                    <td>{item.facility.type || '-'}</td>

                    <td>
                      <strong>{item.approvedSlotsCount}</strong> slot
                    </td>

                    <td>
                      <span
                        className={
                          item.hasData && item.occupancyPercentage > 0
                            ? styles.badgeActive
                            : styles.badgeInactive
                        }
                      >
                        {item.formattedOccupancy}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          item.validReportCount > 0
                            ? styles.reportHigh
                            : styles.reportNormal
                        }
                      >
                        {item.validReportCount} Laporan Valid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}