import { submitReservation } from '../lib/reservation-service'

async function runChapter6Tests() {
  console.log('=== RUNNING CHAPTER 6 TESTS: AJUKAN RESERVASI ===\n')

  let passed = 0
  let total = 0

  function assert(condition: boolean | undefined, testName: string, detail?: string) {
    total++
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`)
      if (detail) console.error(`       Detail: ${detail}`)
      process.exitCode = 1
    }
  }

  // 1. Pengajuan Sukses (Valid)
  const randomDay = Math.floor(Math.random() * 20) + 10
  const dynamicDate = `2026-11-${String(randomDay).padStart(2, '0')}`

  const validRes = await submitReservation(
    {
      facility_id: 1,
      reservation_date: dynamicDate,
      start_time: '08:00',
      end_time: '10:00',
      purpose: 'Kuliah Pengganti Sistem Operasi Semester Gasal',
    },
    6
  )
  assert(
    validRes.success === true && validRes.data?.status === 'menunggu',
    'AC 1: Pengguna dapat mengajukan reservasi valid dan tersimpan berstatus "menunggu"',
    validRes.error
  )

  // 2. Pengajuan Ditolak: Tujuan kosong / terlalu singkat
  const shortPurpose = await submitReservation(
    {
      facility_id: 1,
      reservation_date: '2026-11-15',
      start_time: '13:00',
      end_time: '14:00',
      purpose: 'abc',
    },
    6
  )
  assert(
    shortPurpose.success === false && shortPurpose.error?.includes('terlalu singkat'),
    'AC 2: Pengajuan ditolak jika tujuan penggunaan kurang dari 5 karakter',
    shortPurpose.error
  )

  // 3. Pengajuan Ditolak: Jam operasional / kelipatan 30 menit (Server-Side Validation)
  const invalidTime = await submitReservation(
    {
      facility_id: 1,
      reservation_date: '2026-11-15',
      start_time: '08:15',
      end_time: '09:00',
      purpose: 'Pertemuan Rutin Asisten Lab',
    },
    6
  )
  assert(
    invalidTime.success === false && invalidTime.error?.includes('kelipatan 30 menit'),
    'AC 2 & 3: Validasi server Chapter 4 aktif menolak slot non-30 menit',
    invalidTime.error
  )

  // 4. Pengajuan Ditolak: Fasilitas dalam perbaikan (Fasilitas 4: Lapangan Futsal)
  const repairFacility = await submitReservation(
    {
      facility_id: 4,
      reservation_date: '2026-11-15',
      start_time: '08:00',
      end_time: '10:00',
      purpose: 'Turnamen Futsal Antar Mahasiswa',
    },
    6
  )
  assert(
    repairFacility.success === false && repairFacility.error?.includes('dalam perbaikan'),
    'AC 2: Pengajuan pada fasilitas dalam perbaikan ditolak server',
    repairFacility.error
  )

  // 5. Pengajuan Ditolak: Jadwal bentrok dengan reservasi disetujui (Fasilitas 2 tgl 2026-10-02 ada jadwal disetujui 10:00-12:00)
  const conflictFacility = await submitReservation(
    {
      facility_id: 2,
      reservation_date: '2026-10-02',
      start_time: '10:30',
      end_time: '12:30',
      purpose: 'Praktikum Komputer Tambahan',
    },
    5 // user arini
  )
  assert(
    conflictFacility.success === false && conflictFacility.error?.includes('telah terisi oleh reservasi lain'),
    'AC 2: Pengajuan bentrok dengan reservasi "disetujui" ditolak server',
    conflictFacility.error
  )

  // 6. Pengajuan Ditolak: Double-booking pengguna lintas fasilitas (User 6 sudah ada jadwal disetujui 10:00-12:00 di Fasilitas 2)
  const doubleBooking = await submitReservation(
    {
      facility_id: 3, // coba pesan Aula di jam yang sama
      reservation_date: '2026-10-02',
      start_time: '11:00',
      end_time: '13:00',
      purpose: 'Persiapan Acara Seminar',
    },
    6
  )
  assert(
    doubleBooking.success === false && doubleBooking.error?.includes('Anda sudah memiliki reservasi aktif'),
    'AC 2: Pengajuan double-booking pengguna lintas fasilitas ditolak server',
    doubleBooking.error
  )

  console.log(`\n=== HASIL: ${passed}/${total} TESTS CHAPTER 6 BERHASIL ===`)
}

runChapter6Tests().catch((err) => {
  console.error('Error running Chapter 6 tests:', err)
  process.exit(1)
})
