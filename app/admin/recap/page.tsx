'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Facility } from '@/types/facility';
import { calculateOccupancy, getDaysDifference } from '@/lib/occupancy';
import styles from './recap.module.css';

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

  // State Filter Periode & Lokasi/Fasilitas (Point 20-21)
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [recapData, setRecapData] = useState<FacilityRecapItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Daftar Fasilitas
  useEffect(() => {
    async function fetchFacilities() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching facilities:', error);
      } else {
        setFacilities(data || []);
      }
    }
    fetchFacilities();
  }, [supabase]);

  // Fetch & Hitung Rekap Okupansi + Frekuensi Kerusakan
  useEffect(() => {
    async function calculateRecap() {
      if (facilities.length === 0) return;
      setLoading(true);

      const totalDays = getDaysDifference(startDate, endDate);

      // Fetch semua reservasi 'disetujui' dalam rentang tanggal
      const { data: reservationsData, error: resError } = await supabase
        .from('reservations')
        .select('facility_id, start_time, end_time')
        .in('status', ['disetujui', 'approved'])
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('end_time', `${endDate}T23:59:59`);

      // Fetch semua laporan kerusakan valid ('diproses' atau 'selesai') (Point 21)
      const { data: reportsData, error: repError } = await supabase
        .from('reports')
        .select('facility_id')
        .in('status', ['diproses', 'selesai', 'in_progress', 'resolved'])
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (resError || repError) {
        console.error('Error fetching recap data:', resError || repError);
        setLoading(false);
        return;
      }

      // Kalkulasi per fasilitas
      const items: FacilityRecapItem[] = facilities.map((fac) => {
        const facReservations = (reservationsData || []).filter(
          (r) => String(r.facility_id) === String(fac.id)
        );

        let approvedSlotsCount = 0;
        facReservations.forEach((res) => {
          const start = new Date(res.start_time).getTime();
          const end = new Date(res.end_time).getTime();
          const durationMinutes = Math.max((end - start) / (1000 * 60), 0);
          approvedSlotsCount += Math.round(durationMinutes / 30);
        });

        const occ = calculateOccupancy({
          approvedSlotCount: approvedSlotsCount,
          totalDays: totalDays,
        });

        const validReportCount = (reportsData || []).filter(
          (rep) => String(rep.facility_id) === String(fac.id)
        ).length;

        return {
          facility: fac,
          approvedSlotsCount,
          occupancyPercentage: occ.occupancyPercentage,
          formattedOccupancy: occ.formattedPercentage,
          validReportCount,
          hasData: occ.hasData,
        };
      });

      setRecapData(items);
      setLoading(false);
    }

    calculateRecap();
  }, [facilities, startDate, endDate, supabase]);

  const uniqueLocations = useMemo(() => {
    const locs = facilities.map((f) => f.location).filter((l): l is string => Boolean(l));
    return Array.from(new Set(locs));
  }, [facilities]);

  const filteredRecap = useMemo(() => {
    return recapData.filter((item) => {
      const matchLoc =
        selectedLocation === 'all' || item.facility.location === selectedLocation;
      const matchFac =
        selectedFacilityId === 'all' || String(item.facility.id) === selectedFacilityId;

      return matchLoc && matchFac;
    });
  }, [recapData, selectedLocation, selectedFacilityId]);

  // Ekspor CSV
  const handleExportCSV = () => {
    if (filteredRecap.length === 0) return;

    const headers = [
      'ID Fasilitas',
      'Nama Fasilitas',
      'Tipe',
      'Lokasi',
      'Slot Terpakai (Disetujui)',
      'Okupansi (%)',
      'Frekuensi Kerusakan Valid',
    ];

    const rows = filteredRecap.map((item) => [
      item.facility.id,
      `"${item.facility.name}"`,
      `"${item.facility.type || '-'}"`,
      `"${item.facility.location || '-'}"`,
      item.approvedSlotsCount,
      `"${item.formattedOccupancy}"`,
      item.validReportCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Fasilitas_${startDate}_s.d_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>REKAPITULASI & LAPORAN</p>
          <h1 className={styles.title}>Rekap Okupansi & Kerusakan</h1>
          <p className={styles.subtitle}>
            Analisis penggunaan slot fasilitas dan tingkat frekuensi kerusakan valid berdasarkan periode tanggal.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || filteredRecap.length === 0}
          className={styles.exportButton}
        >
          📄 Ekspor CSV
        </button>
      </div>

      {/* Filter Card */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Tanggal Mulai */}
          <div className={styles.filterGroup}>
            <label>Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          {/* Tanggal Selesai */}
          <div className={styles.filterGroup}>
            <label>Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          {/* Filter Lokasi */}
          <div className={styles.filterGroup}>
            <label>Lokasi</label>
            <select
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

          {/* Filter Fasilitas */}
          <div className={styles.filterGroup}>
            <label>Fasilitas Spesifik</label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Semua Fasilitas</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className={styles.noteText}>
          * Perhitungan okupansi menggunakan <strong>26 slot operasional (30 menit/slot) per hari</strong>.
        </p>
      </div>

      {/* Tabel Data */}
      {loading ? (
        <div className={styles.loadingState}>Menghitung rekapitulasi data...</div>
      ) : filteredRecap.length === 0 ? (
        <div className={styles.emptyState}>Tidak ada data rekapitulasi pada periode ini.</div>
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
                    <td className={styles.facilityName}>{item.facility.name}</td>
                    <td>{item.facility.location || '-'}</td>
                    <td>{item.facility.type || '-'}</td>
                    <td>
                      <strong>{item.approvedSlotsCount}</strong> slot
                    </td>
                    <td>
                      <span
                        className={
                          item.occupancyPercentage > 0
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