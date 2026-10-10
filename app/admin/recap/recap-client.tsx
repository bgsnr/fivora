'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import type { Facility } from '@/types/facility'
import {
  calculateOccupancy,
  getDaysDifference,
} from '@/lib/occupancy'

import styles from './recap.module.css'

// Mengubah tanggal menjadi format YYYY-MM-DD berdasarkan WIB.
function getWibDateString(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Gagal membaca tanggal WIB.')
  }

  return `${year}-${month}-${day}`
}

// Menambah atau mengurangi tanggal tanpa terpengaruh zona waktu.
function addCalendarDays(
  dateString: string,
  amount: number
): string {
  const date = new Date(`${dateString}T00:00:00.000Z`)

  date.setUTCDate(date.getUTCDate() + amount)

  return date.toISOString().slice(0, 10)
}

// Menambah atau mengurangi tahun kalender.
// Contoh: 29 Februari disesuaikan menjadi 28 Februari
// jika tahun tujuan bukan tahun kabisat.
function addCalendarYears(
  dateString: string,
  amount: number
): string {
  const [year, month, day] = dateString.split('-').map(Number)

  const targetYear = year + amount

  const lastDayOfMonth = new Date(
    Date.UTC(targetYear, month, 0)
  ).getUTCDate()

  const targetDay = Math.min(day, lastDayOfMonth)

  return `${targetYear}-${String(month).padStart(2, '0')}-${String(
    targetDay
  ).padStart(2, '0')}`
}

// Mengubah YYYY-MM-DD menjadi tanggal lokal tanpa pergeseran hari.
function parseDateString(dateString: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

// Mengubah tanggal lokal menjadi YYYY-MM-DD.
function formatCalendarDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Format tanggal untuk ditampilkan kepada pengguna.
function formatDateLabel(dateString: string): string {
  const date = parseDateString(dateString)

  if (!date) {
    return dateString
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// Mengubah TIME PostgreSQL menjadi menit.
function timeToMinutes(value: string): number | null {
  const parts = value.split(':')

  if (parts.length < 2 || parts.length > 3) {
    return null
  }

  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  const seconds = Number(parts[2] ?? 0)

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
    return null
  }

  return hours * 60 + minutes + seconds / 60
}

// Helper CSV untuk menangani tanda kutip dan formula spreadsheet.
function escapeCsvCell(value: string | number): string {
  const text = String(value)
  const trimmed = text.trim()

  const safeText =
    typeof value === 'string' &&
    trimmed.length > 1 &&
    /^[=+\-@]/.test(trimmed)
      ? `'${text}`
      : text

  return `"${safeText.replace(/"/g, '""')}"`
}

// Mengunduh file yang dibuat di browser.
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

interface FacilityRecapItem {
  facility: Facility
  approvedSlotsCount: number
  occupancyPercentage: number
  formattedOccupancy: string
  validReportCount: number
  hasData: boolean
}

type SearchOption = {
  value: string
  label: string
}

export default function AdminRecapPage() {
  // Supabase client dibuat sekali agar useEffect tidak berjalan
  // ulang hanya karena objek client berubah setiap render.
  const supabase = useMemo(() => createClient(), [])

  const todayWib = getWibDateString(new Date())

  // Batas paling awal tanggal mulai: satu tahun sebelum hari ini.
  const minStartDate = addCalendarYears(todayWib, -1)

  // Filter periode berdasarkan tanggal kalender WIB.
  const [startDate, setStartDate] = useState<string>(() =>
    addCalendarDays(getWibDateString(new Date()), -7)
  )

  const [endDate, setEndDate] = useState<string>(() =>
    getWibDateString(new Date())
  )

  const [selectedLocation, setSelectedLocation] =
    useState<string>('all')

  const [selectedFacilityId, setSelectedFacilityId] =
    useState<string>('all')

  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilitiesLoaded, setFacilitiesLoaded] = useState(false)
  const [recapData, setRecapData] = useState<FacilityRecapItem[]>([])
  const [loading, setLoading] = useState(true)

  // Mengambil data fasilitas.
  useEffect(() => {
    let cancelled = false

    async function fetchFacilities() {
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .order('name', { ascending: true })

        if (cancelled) return

        if (error) {
          console.error('FACILITY QUERY ERROR:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          })

          setFacilities([])
          setFacilitiesLoaded(true)
          setLoading(false)
          return
        }

        setFacilities(data || [])
        setFacilitiesLoaded(true)
      } catch (error) {
        if (cancelled) return

        console.error('FACILITY FETCH ERROR:', error)
        setFacilities([])
        setFacilitiesLoaded(true)
        setLoading(false)
      }
    }

    fetchFacilities()

    return () => {
      cancelled = true
    }
  }, [supabase])

  // Menghitung okupansi serta frekuensi laporan kerusakan valid.
  useEffect(() => {
    let cancelled = false

    async function calculateRecap() {
      if (!facilitiesLoaded) return

      if (
        !startDate ||
        !endDate ||
        startDate < minStartDate ||
        startDate > todayWib ||
        endDate < startDate ||
        endDate > todayWib
      ) {
        setRecapData([])
        setLoading(false)
        return
      }

      if (facilities.length === 0) {
        setRecapData([])
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // Batas waktu WIB untuk kolom created_at laporan.
        const periodStart = `${startDate}T00:00:00+07:00`

        const periodEndExclusive =
          `${addCalendarDays(endDate, 1)}T00:00:00+07:00`

        const facilityIds = facilities.map(
          (facility) => facility.id
        )

        // reservation_date bertipe DATE, sedangkan start_time
        // dan end_time bertipe TIME.
        const {
          data: reservationsData,
          error: resError,
        } = await supabase
          .from('reservations')
          .select(`
            facility_id,
            reservation_date,
            start_time,
            end_time
          `)
          .in('facility_id', facilityIds)
          .in('status', ['disetujui', 'approved'])
          .gte('reservation_date', startDate)
          .lte('reservation_date', endDate)

        // Laporan dihitung berdasarkan tanggal pengajuan.
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
          .lt('created_at', periodEndExclusive)

        if (cancelled) return

        if (resError || repError) {
          if (resError) {
            console.error(
              'RESERVATION QUERY ERROR:',
              JSON.stringify(resError, null, 2)
            )
          }

          if (repError) {
            console.error('REPORT QUERY ERROR:', {
              message: repError.message,
              code: repError.code,
              details: repError.details,
              hint: repError.hint,
            })
          }

          setRecapData([])
          return
        }

        // Hitung rekap masing-masing fasilitas.
        const items: FacilityRecapItem[] = facilities.map(
          (facility) => {
            const facilityReservations = (
              reservationsData || []
            ).filter(
              (reservation) =>
                String(reservation.facility_id) ===
                String(facility.id)
            )

            let approvedSlotsCount = 0

            for (const reservation of facilityReservations) {
              const startMinutes = timeToMinutes(
                reservation.start_time
              )

              const endMinutes = timeToMinutes(
                reservation.end_time
              )

              if (
                startMinutes === null ||
                endMinutes === null ||
                endMinutes <= startMinutes
              ) {
                continue
              }

              const durationMinutes =
                endMinutes - startMinutes

              approvedSlotsCount += Math.round(
                durationMinutes / 30
              )
            }

            // Okupansi dihitung dari SELURUH rentang tanggal pilihan.
            // Tanggal facility.created_at tidak digunakan sebagai batas.
            const totalDays = getDaysDifference(
              startDate,
              endDate
            )

            const occupancy = calculateOccupancy({
              approvedSlotCount: approvedSlotsCount,
              totalDays,
            })

            const validReportCount = (
              reportsData || []
            ).filter(
              (report) =>
                String(report.facility_id) ===
                String(facility.id)
            ).length

            return {
              facility,
              approvedSlotsCount,
              occupancyPercentage:
                occupancy.occupancyPercentage,
              formattedOccupancy:
                occupancy.formattedPercentage,
              validReportCount,
              hasData: occupancy.hasData,
            }
          }
        )

        if (!cancelled) {
          setRecapData(items)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('GAGAL MENGHITUNG REKAP:', error)
          setRecapData([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    calculateRecap()

    return () => {
      cancelled = true
    }
  }, [
    facilities,
    facilitiesLoaded,
    startDate,
    endDate,
    minStartDate,
    todayWib,
    supabase,
  ])

  // Daftar lokasi unik.
  const uniqueLocations = useMemo(() => {
    const locations = facilities
      .map((facility) => facility.location)
      .filter(
        (location): location is string =>
          Boolean(location)
      )

    return Array.from(new Set(locations)).sort(
      (a, b) => a.localeCompare(b, 'id')
    )
  }, [facilities])

  // Opsi dropdown lokasi.
  const locationOptions = useMemo<SearchOption[]>(() => [
    {
      value: 'all',
      label: 'Semua Lokasi',
    },
    ...uniqueLocations.map((location) => ({
      value: location,
      label: location,
    })),
  ], [uniqueLocations])

  // Fasilitas menyesuaikan lokasi yang dipilih.
  const facilitiesForLocation = useMemo(() => {
    return facilities.filter(
      (facility) =>
        selectedLocation === 'all' ||
        facility.location === selectedLocation
    )
  }, [facilities, selectedLocation])

  // Opsi dropdown fasilitas.
  const facilityOptions = useMemo<SearchOption[]>(() => [
    {
      value: 'all',
      label: 'Semua Fasilitas',
    },
    ...facilitiesForLocation.map((facility) => ({
      value: String(facility.id),
      label: facility.name,
    })),
  ], [facilitiesForLocation])

  // Terapkan filter lokasi dan fasilitas ke tabel.
  const filteredRecap = useMemo(() => {
    return recapData.filter((item) => {
      const matchesLocation =
        selectedLocation === 'all' ||
        item.facility.location === selectedLocation

      const matchesFacility =
        selectedFacilityId === 'all' ||
        String(item.facility.id) === selectedFacilityId

      return matchesLocation && matchesFacility
    })
  }, [recapData, selectedLocation, selectedFacilityId])

  // Nonaktifkan ekspor jika periode tidak valid atau data kosong.
  const exportDisabled =
    loading ||
    !startDate ||
    !endDate ||
    startDate < minStartDate ||
    startDate > todayWib ||
    startDate > endDate ||
    endDate > todayWib ||
    filteredRecap.length === 0

  const exportFileBase =
    `Rekap_Okupansi_Kerusakan_${startDate}_sd_${endDate}`

  // Kolom yang digunakan untuk semua format ekspor.
  const exportHeaders = [
    'ID Fasilitas',
    'Nama Fasilitas',
    'Lokasi',
    'Tipe',
    'Slot Terpakai (30 Menit)',
    'Okupansi (%)',
    'Frekuensi Kerusakan Valid',
  ]

  // Semua format ekspor menggunakan filteredRecap yang sama.
  function getExportRows(): (string | number)[][] {
    return filteredRecap.map((item) => [
      item.facility.id,
      item.facility.name,
      item.facility.location || '-',
      item.facility.type || '-',
      item.approvedSlotsCount,
      item.formattedOccupancy,
      item.validReportCount,
    ])
  }

  // EKSPOR CSV
  function handleExportCSV() {
    if (exportDisabled) return

    const rows = getExportRows()

    const csvContent = [
      exportHeaders,
      ...rows,
    ]
      .map((row) =>
        row.map(escapeCsvCell).join(',')
      )
      .join('\r\n')

    const blob = new Blob(
      [`\uFEFF${csvContent}`],
      {
        type: 'text/csv;charset=utf-8;',
      }
    )

    downloadBlob(blob, `${exportFileBase}.csv`)
  }

  // EKSPOR EXCEL .XLSX
  function handleExportExcel() {
    if (exportDisabled) return

    const worksheet = XLSX.utils.aoa_to_sheet([
      exportHeaders,
      ...getExportRows(),
    ])

    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 30 },
      { wch: 24 },
      { wch: 20 },
      { wch: 25 },
      { wch: 18 },
      { wch: 30 },
    ]

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Rekap Fasilitas'
    )

    XLSX.writeFile(
      workbook,
      `${exportFileBase}.xlsx`
    )
  }

  // EKSPOR PDF
  function handleExportPDF() {
    if (exportDisabled) return

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const locationLabel =
      locationOptions.find(
        (option) => option.value === selectedLocation
      )?.label ?? 'Semua Lokasi'

    const facilityLabel =
      facilityOptions.find(
        (option) => option.value === selectedFacilityId
      )?.label ?? 'Semua Fasilitas'

    pdf.setFontSize(16)
    pdf.text(
      'Rekap Okupansi dan Kerusakan Fasilitas',
      14,
      16
    )

    pdf.setFontSize(10)
    pdf.text(
      `Periode: ${startDate} sampai ${endDate}`,
      14,
      24
    )
    pdf.text(`Lokasi: ${locationLabel}`, 14, 30)
    pdf.text(`Fasilitas: ${facilityLabel}`, 14, 36)
    pdf.text(
      `Jumlah fasilitas: ${filteredRecap.length}`,
      14,
      42
    )

    autoTable(pdf, {
      startY: 48,
      head: [exportHeaders],
      body: getExportRows().map((row) =>
        row.map((value) => String(value))
      ),
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [1, 7, 54],
        textColor: 255,
        fontStyle: 'bold',
      },
      margin: {
        top: 12,
        right: 10,
        bottom: 12,
        left: 10,
      },
    })

    pdf.save(`${exportFileBase}.pdf`)
  }

  // Jika lokasi berubah, reset filter fasilitas.
  function handleLocationChange(value: string) {
    setSelectedLocation(value)
    setSelectedFacilityId('all')
  }

  // Ketika tanggal mulai diganti, pastikan tanggal selesai
  // tidak berada sebelum tanggal mulai.
  function handleStartDateChange(value: string) {
    setStartDate(value)

    if (endDate < value) {
      setEndDate(value)
    }
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
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

        {/* Tiga tombol ekspor */}
        <div className={styles.exportActions}>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exportDisabled}
            className={styles.exportButton}
          >
            Ekspor CSV
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportDisabled}
            className={styles.exportButton}
          >
            Ekspor Excel
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exportDisabled}
            className={styles.exportButton}
          >
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label htmlFor="start-date">
              Tanggal Mulai
            </label>

            <DatePicker
              id="start-date"
              value={startDate}
              min={minStartDate}
              max={todayWib}
              today={todayWib}
              placeholder="Pilih tanggal mulai"
              onChange={handleStartDateChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="end-date">
              Tanggal Selesai
            </label>

            <DatePicker
              id="end-date"
              value={endDate}
              min={startDate || minStartDate}
              max={todayWib}
              today={todayWib}
              placeholder="Pilih tanggal selesai"
              onChange={setEndDate}
            />
          </div>

          {/* Dropdown lokasi yang bisa dicari */}
          <div className={styles.filterGroup}>
            <label htmlFor="location-filter">
              Lokasi
            </label>

            <SearchableDropdown
              id="location-filter"
              value={selectedLocation}
              options={locationOptions}
              placeholder="Cari lokasi..."
              disabled={!facilitiesLoaded}
              onChange={handleLocationChange}
            />
          </div>

          {/* Dropdown fasilitas yang bisa dicari */}
          <div className={styles.filterGroup}>
            <label htmlFor="facility-filter">
              Fasilitas Spesifik
            </label>

            <SearchableDropdown
              id="facility-filter"
              value={selectedFacilityId}
              options={facilityOptions}
              placeholder="Cari fasilitas..."
              disabled={
                !facilitiesLoaded ||
                facilitiesForLocation.length === 0
              }
              onChange={setSelectedFacilityId}
            />
          </div>
        </div>

        <p className={styles.noteText}>
          * Okupansi dihitung berdasarkan seluruh rentang tanggal
          yang dipilih, menggunakan{' '}
          <strong>
            26 slot operasional (30 menit per slot) per hari
          </strong>
          . Perhitungan tidak bergantung pada tanggal fasilitas
          dimasukkan ke sistem.
        </p>
      </div>

      {/* TABEL REKAP */}
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
                          item.hasData &&
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
  )
}

/* KALENDER CUSTOM */
function DatePicker({
  id,
  value,
  min,
  max,
  today,
  placeholder,
  onChange,
}: {
  id: string
  value: string
  min: string
  max: string
  today: string
  placeholder: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const initialDate =
      parseDateString(value) ??
      parseDateString(max) ??
      new Date()

    return new Date(
      initialDate.getFullYear(),
      initialDate.getMonth(),
      1
    )
  })

  const pickerRef = useRef<HTMLDivElement>(null)

  const minDate = parseDateString(min)
  const maxDate = parseDateString(max)

  const minMonthIndex = minDate
    ? minDate.getFullYear() * 12 + minDate.getMonth()
    : Number.NEGATIVE_INFINITY

  const maxMonthIndex = maxDate
    ? maxDate.getFullYear() * 12 + maxDate.getMonth()
    : Number.POSITIVE_INFINITY

  const visibleMonthIndex =
    visibleMonth.getFullYear() * 12 +
    visibleMonth.getMonth()

  const canGoPrevious = visibleMonthIndex > minMonthIndex
  const canGoNext = visibleMonthIndex < maxMonthIndex

  const selectedLabel = value
    ? formatDateLabel(value)
    : placeholder

  const monthLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth)

  const weekdays = [
    'Sen',
    'Sel',
    'Rab',
    'Kam',
    'Jum',
    'Sab',
    'Min',
  ]

  // Kalender enam baris dengan awal minggu pada hari Senin.
  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1
    )

    const mondayOffset = (firstDay.getDay() + 6) % 7

    const gridStart = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth(),
      1 - mondayOffset
    )

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index
      )

      const dateString = formatCalendarDate(date)

      return {
        dateString,
        dayNumber: date.getDate(),
        isCurrentMonth:
          date.getMonth() === visibleMonth.getMonth(),
        isSelected: dateString === value,
        isToday: dateString === today,
        isDisabled: dateString < min || dateString > max,
        accessibleLabel: formatDateLabel(dateString),
      }
    })
  }, [visibleMonth, value, min, max, today])

  // Menutup kalender jika pengguna mengeklik di luar komponen.
  useEffect(() => {
    if (!isOpen) return

    function handleOutsideClick(event: PointerEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsideClick
      )
    }
  }, [isOpen])

  function openCalendar() {
    const selectedDate =
      parseDateString(value) ??
      parseDateString(max) ??
      new Date()

    setVisibleMonth(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      )
    )

    setIsOpen(true)
  }

  function toggleCalendar() {
    if (isOpen) {
      setIsOpen(false)
    } else {
      openCalendar()
    }
  }

  function changeMonth(amount: number) {
    setVisibleMonth(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + amount,
        1
      )
    )
  }

  function handleDateSelect(dateString: string) {
    if (dateString < min || dateString > max) {
      return
    }

    onChange(dateString)
    setIsOpen(false)
  }

  return (
    <div
      className={styles.datePicker}
      ref={pickerRef}
    >
      <button
        id={id}
        type="button"
        className={`${styles.filterInput} ${styles.datePickerTrigger}`}
        aria-label={placeholder}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${id}-calendar`}
        onClick={toggleCalendar}
      >
        <span className={styles.datePickerTriggerLabel}>
          <CalendarDays
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>{selectedLabel}</span>
        </span>

        <ChevronDown
          size={16}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={`${id}-calendar`}
          className={styles.datePickerPopover}
          role="dialog"
          aria-label={placeholder}
        >
          <div className={styles.datePickerHeader}>
            <button
              type="button"
              className={styles.datePickerNavButton}
              aria-label="Bulan sebelumnya"
              disabled={!canGoPrevious}
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft
                size={18}
                aria-hidden="true"
              />
            </button>

            <span className={styles.datePickerMonthLabel}>
              {monthLabel}
            </span>

            <button
              type="button"
              className={styles.datePickerNavButton}
              aria-label="Bulan berikutnya"
              disabled={!canGoNext}
              onClick={() => changeMonth(1)}
            >
              <ChevronRight
                size={18}
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            className={styles.datePickerWeekdays}
            aria-hidden="true"
          >
            {weekdays.map((weekday) => (
              <span
                key={weekday}
                className={styles.datePickerWeekday}
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className={styles.datePickerGrid}>
            {calendarDays.map((day) => {
              const dayClasses = [
                styles.datePickerDay,
                !day.isCurrentMonth
                  ? styles.datePickerDayOutside
                  : '',
                day.isToday
                  ? styles.datePickerDayToday
                  : '',
                day.isSelected
                  ? styles.datePickerDaySelected
                  : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={day.dateString}
                  type="button"
                  className={dayClasses}
                  aria-label={`Pilih ${day.accessibleLabel}`}
                  aria-pressed={day.isSelected}
                  disabled={day.isDisabled}
                  onClick={() =>
                    handleDateSelect(day.dateString)
                  }
                >
                  {day.dayNumber}
                </button>
              )
            })}
          </div>

          <div className={styles.datePickerFooter}>
            <span>
              {`Rentang: ${formatDateLabel(min)} – ${formatDateLabel(max)}`}
            </span>

            <button
              type="button"
              className={styles.datePickerTodayButton}
              disabled={today < min || today > max}
              onClick={() => handleDateSelect(today)}
            >
              Hari ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* DROPDOWN PENCARIAN */
function SearchableDropdown({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
}: {
  id: string
  value: string
  options: SearchOption[]
  placeholder: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const selectedLabel =
    options.find(
      (option) => option.value === value
    )?.label ?? ''

  const filteredOptions = options.filter((option) =>
    option.label
      .toLocaleLowerCase('id-ID')
      .includes(
        searchText.trim().toLocaleLowerCase('id-ID')
      )
  )

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setSearchText(event.target.value)
    setIsOpen(true)
  }

  function closeDropdown() {
    setIsOpen(false)
    setSearchText('')
  }

  return (
    <div className={styles.searchableDropdown}>
      <div className={styles.searchableControl}>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-label={placeholder}
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          aria-autocomplete="list"
          autoComplete="off"
          value={isOpen ? searchText : selectedLabel}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.filterInput} ${styles.searchableInput}`}
          onFocus={() => {
            setIsOpen(true)
            setSearchText('')
          }}
          onChange={handleInputChange}
          onBlur={closeDropdown}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              closeDropdown()
              event.currentTarget.blur()
            }

            if (
              event.key === 'Enter' &&
              filteredOptions.length > 0
            ) {
              event.preventDefault()

              const exactMatch = filteredOptions.find(
                (option) =>
                  option.label.toLocaleLowerCase('id-ID') ===
                  searchText.trim().toLocaleLowerCase('id-ID')
              )

              const option =
                exactMatch ?? filteredOptions[0]

              onChange(option.value)
              closeDropdown()
              event.currentTarget.blur()
            }
          }}
        />

        <button
          type="button"
          className={styles.searchableToggle}
          aria-label={
            isOpen ? 'Tutup pilihan' : 'Buka pilihan'
          }
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (isOpen) {
              closeDropdown()
            } else {
              setIsOpen(true)
              setSearchText('')
            }
          }}
        >
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>
      </div>

      {isOpen && !disabled && (
        <div
          id={`${id}-options`}
          className={styles.searchableOptions}
          role="listbox"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={`${styles.searchOption} ${
                  value === option.value
                    ? styles.searchOptionSelected
                    : ''
                }`}
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={() => {
                  onChange(option.value)
                  closeDropdown()
                }}
              >
                <span>{option.label}</span>

                {value === option.value && (
                  <span aria-hidden="true">✓</span>
                )}
              </button>
            ))
          ) : (
            <p className={styles.searchNoResults}>
              Tidak ada pilihan yang cocok.
            </p>
          )}
        </div>
      )}
    </div>
  )
}