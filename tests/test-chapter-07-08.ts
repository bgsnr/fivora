import { canUserCancelReservation } from '../lib/validations/reservation-time'
import { submitReservation, cancelReservationForUser } from '../lib/reservation-service'
import { getReservationById } from '../lib/actions/reservations'

async function runChapter7And8Tests() {
  console.log('=== RUNNING CHAPTER 7 & 8 TESTS: RIWAYAT & PEMBATALAN ===\n')

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

  // Skenario Jadwal: 2026-11-20 10:00:00 WIB
  const testReservation = {
    user_id: 6,
    status: 'disetujui' as const,
    reservation_date: '2026-11-20',
    start_time: '10:00:00',
  }

  // 1. Boundary Case: Tepat 3 jam sebelum start_time (07:00:00 WIB)
  // 10:00:00 WIB - 07:00:00 WIB = tepat 180 menit
  const nowExactly3Hours = new Date('2026-11-20T00:00:00Z') // 00:00 UTC = 07:00 WIB
  const checkExactly3Hours = canUserCancelReservation(
    testReservation,
    6,
    nowExactly3Hours
  )
  assert(
    checkExactly3Hours.allowed === true,
    'Chapter 8 AC 1: Pembatalan tepat 3 jam sebelum waktu mulai berhasil (boundary case)',
    checkExactly3Hours.reason
  )

  // 2. Boundary Case: 2 jam 59 menit sebelum start_time (07:01:00 WIB)
  // 10:00:00 WIB - 07:01:00 WIB = 179 menit (kurang dari 3 jam)
  const now2h59m = new Date('2026-11-20T00:01:00Z') // 00:01 UTC = 07:01 WIB
  const check2h59m = canUserCancelReservation(testReservation, 6, now2h59m)
  assert(
    check2h59m.allowed === false &&
      check2h59m.reason?.includes('paling lambat 3 jam sebelum waktu mulai'),
    'Chapter 8 AC 2: Pembatalan 2 jam 59 menit sebelum waktu mulai ditolak',
    check2h59m.reason
  )

  // 3. Waktu sudah lewat start_time
  const nowPast = new Date('2026-11-20T03:30:00Z') // 10:30 WIB
  const checkPast = canUserCancelReservation(testReservation, 6, nowPast)
  assert(
    checkPast.allowed === false && checkPast.reason?.includes('telah terlewati'),
    'Chapter 8: Pembatalan setelah waktu mulai lewat ditolak'
  )

  // 4. Pembatalan untuk reservasi milik pengguna lain ditolak
  const checkOtherUser = canUserCancelReservation(
    testReservation,
    5, // user yang berbeda
    nowExactly3Hours
  )
  assert(
    checkOtherUser.allowed === false &&
      checkOtherUser.reason?.includes('milik Anda sendiri'),
    'Chapter 8 AC 4: Percobaan membatalkan reservasi milik user lain ditolak',
    checkOtherUser.reason
  )

  // 5. Pembatalan Nyata via Server Action & Pembuktian Data Tidak Dihapus di DB (AC 3)
  const createForCancel = await submitReservation(
    {
      facility_id: 1,
      reservation_date: '2026-12-05',
      start_time: '14:00',
      end_time: '16:00',
      purpose: 'Uji Coba Pembatalan Pengguna Chapter 8',
    },
    6
  )
  assert(createForCancel.success === true, 'Setup reservasi baru untuk test pembatalan berhasil')

  const resId = createForCancel.data!.id

  // Coba batalkan sebagai user 5 (bukan pemilik)
  const cancelByWrongUser = await cancelReservationForUser(
    resId,
    'Mencoba membatalkan tanpa hak',
    5
  )
  assert(
    cancelByWrongUser.success === false &&
      cancelByWrongUser.error?.includes('milik Anda sendiri'),
    'Server Action: User lain tidak bisa membatalkan reservasi orang lain'
  )

  // Batalkan sebagai user 6 (pemilik)
  const cancelSuccess = await cancelReservationForUser(
    resId,
    'Acara dialihkan ke tanggal lain',
    6
  )
  assert(
    cancelSuccess.success === true && cancelSuccess.data?.status === 'dibatalkan',
    'Server Action: Pemilik berhasil membatalkan reservasinya sendiri'
  )

  // Verifikasi ke database: baris TIDAK dihapus, status adalah 'dibatalkan'
  const recordInDb = await getReservationById(resId)
  assert(
    recordInDb !== null &&
      recordInDb.status === 'dibatalkan' &&
      recordInDb.rejection_reason === 'Acara dialihkan ke tanggal lain',
    'Chapter 8 AC 3: Reservasi yang dibatalkan tetap tersimpan di database dengan status "dibatalkan"'
  )

  console.log(`\n=== HASIL: ${passed}/${total} TESTS CHAPTER 7 & 8 BERHASIL ===`)
}

runChapter7And8Tests().catch((err) => {
  console.error('Error running Chapter 7 & 8 tests:', err)
  process.exit(1)
})
