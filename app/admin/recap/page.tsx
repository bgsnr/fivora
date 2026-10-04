'use client'

import { useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

import { Facility } from '@/types/facility'

import {
  calculateOccupancy,
  getDaysDifference,
} from '@/lib/occupancy'

import styles from './recap.module.css'

interface FacilityRecapItem {
  facility: Facility
  approvedSlotsCount: number
  occupancyPercentage: number
  formattedOccupancy: string
  validReportCount: number
  hasData: boolean
}

const supabase = createClient()

function getTodayLocal() {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function timeToMinutes(time: string) {
  const [hours = 0, minutes = 0] = time
    .split(':')
    .map(Number)

  return hours * 60 + minutes
}

export default function AdminRecapPage() {
  /* State Filter Periode & Lokasi/Fasilitas */
  const [startDate, setStartDate] = useState<string>(
    getDateDaysAgo(7)
  )

  const [endDate, setEndDate] = useState<string>(
    getTodayLocal()
  )

  const [selectedLocation, setSelectedLocation] =
    useState<string>('all')

  const [selectedFacilityId, setSelectedFacilityId] =
    useState<string>('all')

  const [facilities, setFacilities] = useState<Facility[]>(
    []
  )

  const [recapData, setRecapData] = useState<
    FacilityRecapItem[]
  >([])

  const [loading, setLoading] = useState<boolean>(true)

  /* Fetch Daftar Fasilitas */
  useEffect(() => {
    async function fetchFacilities() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error(
          'Error fetching facilities:',
          error
        )
        return
      }

      setFacilities(data || [])
    }

    fetchFacilities()
  }, [])

  /* Fetch & Hitung Rekap Okupansi + Frekuensi Kerusakan */
  useEffect(() => {
    async function calculateRecap() {
      if (facilities.length === 0) {
        setRecapData([])
        setLoading(false)
        return
      }

      if (startDate > endDate) {
        setRecapData([])
        setLoading(false)
        return
      }

      setLoading(true)

      const totalDays = getDaysDifference(
        startDate,
        endDate
      )

      /*
       * Ambil reservasi yang sudah disetujui.
       *
       * reservation_date = kolom DATE
       * start_time       = kolom TIME
       * end_time         = kolom TIME
       */
      const {
        data: reservationsData,
        error: resError,
      } = await supabase
        .from('reservations')
        .select(
          'facility_id, reservation_date, start_time, end_time'
        )
        .in('status', ['disetujui', 'approved'])
        .gte('reservation_date', startDate)
        .lte('reservation_date', endDate)

      /*
       * Ambil laporan kerusakan valid.
       * created_at bertipe timestamp, jadi filter tanggal
       * dengan format ISO masih aman di sini.
       */
      const {
        data: reportsData,
        error: repError,
      } = await supabase
        .from('reports')
        .select('facility_id')
        .in('status', [
          'diproses',
          'selesai',
          'in_progress',
          'resolved',
        ])
        .gte(
          'created_at',
          `${startDate}T00:00:00+07:00`
        )
        .lte(
          'created_at',
          `${endDate}T23:59:59+07:00`
        )

      if (resError || repError) {
        console.error(
          'Error fetching recap data:',
          resError || repError
        )

        setLoading(false)
        return
      }

      /* Kalkulasi per fasilitas */
      const items: FacilityRecapItem[] =
        facilities.map((fac) => {
          const facReservations =
            reservationsData?.filter(
              (reservation) =>
                String(reservation.facility_id) ===
                String(fac.id)
            ) ?? []

          let approvedSlotsCount = 0

          facReservations.forEach((reservation) => {
            const start = timeToMinutes(
              reservation.start_time
            )

            const end = timeToMinutes(
              reservation.end_time
            )

            const durationMinutes = Math.max(
              end - start,
              0
            )

            const slotCount = Math.round(
              durationMinutes / 30
            )

            approvedSlotsCount += slotCount
          })

          const occ = calculateOccupancy({
            approvedSlotCount:
              approvedSlotsCount,
            totalDays,
          })

          const validReportCount =
            reportsData?.filter(
              (report) =>
                String(report.facility_id) ===
                String(fac.id)
            ).length ?? 0

          return {
            facility: fac,
            approvedSlotsCount,
            occupancyPercentage:
              occ.occupancyPercentage,
            formattedOccupancy:
              occ.formattedPercentage,
            validReportCount,
            hasData: occ.hasData,
          }
        })

      setRecapData(items)
      setLoading(false)
    }

    calculateRecap()
  }, [facilities, startDate, endDate])

  const uniqueLocations = useMemo(() => {
    const locs = facilities
      .map((facility) => facility.location)
      .filter(
        (location): location is string =>
          Boolean(location)
      )

    return Array.from(new Set(locs))
  }, [facilities])

  const filteredRecap = useMemo(() => {
    return recapData.filter((item) => {
      const matchLoc =
        selectedLocation === 'all' ||
        item.facility.location === selectedLocation

      const matchFac =
        selectedFacilityId === 'all' ||
        String(item.facility.id) ===
          selectedFacilityId

      return matchLoc && matchFac
    })
  }, [
    recapData,
    selectedLocation,
    selectedFacilityId,
  ])

  /* Ekspor CSV */
  const handleExportCSV = () => {
    if (filteredRecap.length === 0) {
      return
    }

    const headers = [
      'ID Fasilitas',
      'Nama Fasilitas',
      'Tipe',
      'Lokasi',
      'Slot Terpakai (Disetujui)',
      'Okupansi (%)',
      'Frekuensi Kerusakan Valid',
    ]

    const rows = filteredRecap.map((item) => [
      item.facility.id,
      `"${item.facility.name}"`,
      `"${item.facility.type || '-'}"`,
      `"${item.facility.location || '-'}"`,
      item.approvedSlotsCount,
      `"${item.formattedOccupancy}"`,
      item.validReportCount,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n')

    const encodedUri = encodeURI(csvContent)

    const link = document.createElement('a')

    link.setAttribute('href', encodedUri)

    link.setAttribute(
      'download',
      `Rekap_Fasilitas_${startDate}_s.d_${endDate}.csv`
    )

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
  }

  /* Ekspor Excel via API Route */
  const handleExportExcel = () => {
    if (filteredRecap.length === 0) return
    const params = new URLSearchParams({
      format: 'excel',
      startDate,
      endDate,
      location: selectedLocation,
      facilityId: selectedFacilityId,
    })
    window.location.href = `/api/recap/export?${params.toString()}`
  }

  /* Cetak / Simpan ke PDF via Browser Print */
  const handlePrintPDF = () => {
    if (filteredRecap.length === 0) return
    window.print()
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            REKAPITULASI & LAPORAN
          </p>

          <h1 className={styles.title}>
            Rekap Okupansi & Kerusakan
          </h1>

          <p className={styles.subtitle}>
            Analisis penggunaan slot fasilitas dan tingkat
            frekuensi kerusakan valid berdasarkan periode tanggal.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            disabled={loading || filteredRecap.length === 0}
            className={styles.exportButton}
          >
            📄 Ekspor CSV
          </button>

          <button
            onClick={handleExportExcel}
            disabled={loading || filteredRecap.length === 0}
            className={styles.exportButton}
            style={{ background: '#167d52' }}
          >
            📊 Ekspor Excel
          </button>

          <button
            onClick={handlePrintPDF}
            disabled={loading || filteredRecap.length === 0}
            className={styles.exportButton}
            style={{ background: '#22396f' }}
          >
            🖨️ Cetak / PDF
          </button>
        </div>
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
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className={styles.filterInput}
            />
          </div>

          {/* Tanggal Selesai */}
          <div className={styles.filterGroup}>
            <label>Tanggal Selesai</label>

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className={styles.filterInput}
            />
          </div>

          {/* Filter Lokasi */}
          <div className={styles.filterGroup}>
            <label>Lokasi</label>

            <select
              value={selectedLocation}
              onChange={(event) =>
                setSelectedLocation(
                  event.target.value
                )
              }
              className={styles.filterSelect}
            >
              <option value="all">
                Semua Lokasi
              </option>

              {uniqueLocations.map((location) => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Fasilitas */}
          <div className={styles.filterGroup}>
            <label>Fasilitas Spesifik</label>

            <select
              value={selectedFacilityId}
              onChange={(event) =>
                setSelectedFacilityId(
                  event.target.value
                )
              }
              className={styles.filterSelect}
            >
              <option value="all">
                Semua Fasilitas
              </option>

              {facilities.map((facility) => (
                <option
                  key={facility.id}
                  value={facility.id}
                >
                  {facility.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className={styles.noteText}>
          * Perhitungan okupansi menggunakan{' '}
          <strong>
            26 slot operasional (30 menit/slot) per hari
          </strong>
          .
        </p>

        {startDate > endDate && (
          <p
            className={styles.noteText}
            style={{
              color: '#c53c50',
              marginTop: '8px',
            }}
          >
            Tanggal mulai tidak boleh lebih besar dari
            tanggal selesai.
          </p>
        )}
      </div>

      {/* Tabel Data */}
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
                    <td
                      className={
                        styles.facilityName
                      }
                    >
                      {item.facility.name}
                    </td>

                    <td>
                      {item.facility.location || '-'}
                    </td>

                    <td>
                      {item.facility.type || '-'}
                    </td>

                    <td>
                      <strong>
                        {item.approvedSlotsCount}
                      </strong>{' '}
                      slot
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
                        {item.validReportCount}{' '}
                        Laporan Valid
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
  )
}