import {
  checkFacilityConflict,
  checkUserDoubleBooking,
  autoRejectConflictingPendingReservations,
  isFacilityBookable,
} from '../lib/conflict-engine'
import { createReservation, getReservationById, updateReservationStatus } from '../lib/actions/reservations'
import { supabaseAdmin } from '../lib/supabase/admin'

/**
 * Tanggal N hari ke depan dalam WIB, format YYYY-MM-DD.
 * Test cleans up tanggal tersebut sehingga aman dijalankan berulang.
 */
function futureWIBDate(daysAhead: number): string {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000) // UTC -> WIB
  now.setUTCDate(now.getUTCDate() + daysAhead)
  return now.toISOString().slice(0, 10)
}

async function runChapter5Tests() {
  console.log('=== RUNNING CHAPTER 5 TESTS: CONFLICT ENGINE ===\n')

  let passed = 0
  let total = 0

  function assert(condition: boolean, testName: string, detail?: string) {
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

  // 1. isFacilityBookable
  assert(isFacilityBookable('aktif') === true, 'isFacilityBookable(aktif) bernilai true')
  assert(isFacilityBookable('dalam_perbaikan') === false, 'isFacilityBookable(dalam_perbaikan) bernilai false')
  assert(isFacilityBookable('nonaktif') === false, 'isFacilityBookable(nonaktif) bernilai false')

  // 2. Acceptance Criteria 1: Dua reservasi 'menunggu' untuk slot sama/beririsan bisa ada di DB
  // Tanggal dihitung relatif terhadap hari ini + dibersihkan dulu agar test
  // idempotent (run sebelumnya tidak meninggalkan jadwal 'disetujui' yang
  // bentrok dan memicu constraint EXCLUDE).
  const testDate = futureWIBDate(35)
  await supabaseAdmin
    .from('reservations')
    .delete()
    .in('facility_id', [1, 2])
    .eq('reservation_date', testDate)

  const pendingA = await createReservation({
    user_id: 6,
    facility_id: 1,
    reservation_date: testDate,
    start_time: '08:00:00',
    end_time: '10:00:00',
    purpose: 'Test AC1 Pengajuan A (menunggu)',
  })
  const pendingB = await createReservation({
    user_id: 5,
    facility_id: 1,
    reservation_date: testDate,
    start_time: '09:00:00',
    end_time: '11:00:00',
    purpose: 'Test AC1 Pengajuan B (menunggu beririsan)',
  })

  assert(
    pendingA.status === 'menunggu' && pendingB.status === 'menunggu',
    'AC 1: Dua reservasi berstatus "menunggu" pada slot/fasilitas yang beririsan bisa bersamaan ada di DB'
  )

  // 3. Pending TIDAK memblokir checkFacilityConflict
  const conflictBeforeApproval = await checkFacilityConflict(
    1,
    testDate,
    '08:30:00',
    '09:30:00'
  )
  assert(
    conflictBeforeApproval.length === 0,
    'Aturan 1: Reservasi "menunggu" tidak memblokir/mengunci slot (checkFacilityConflict kosong)'
  )

  // 4. Simulasi Approve Pengajuan A oleh petugas (user 8)
  const approvedA = await updateReservationStatus(pendingA.id, 'disetujui', {
    processed_by: 8,
  })
  assert(approvedA.status === 'disetujui', 'Pengajuan A berhasil disetujui')

  // 5. Acceptance Criteria 3: Auto-reject reservasi pending lain yang bentrok
  const autoRejected = await autoRejectConflictingPendingReservations({
    id: approvedA.id,
    facility_id: approvedA.facility_id,
    reservation_date: approvedA.reservation_date,
    start_time: approvedA.start_time,
    end_time: approvedA.end_time,
    processed_by: 8,
  })

  assert(
    autoRejected.length >= 1 && autoRejected.some((r) => r.id === pendingB.id),
    'AC 3: autoRejectConflictingPendingReservations menemukan dan menolak pengajuan B'
  )

  const refreshedPendingB = await getReservationById(pendingB.id)
  assert(
    refreshedPendingB?.status === 'ditolak' &&
      refreshedPendingB.rejection_reason === 'jadwal telah terisi',
    'AC 3: Status pengajuan B di DB otomatis berubah jadi "ditolak" dengan alasan "jadwal telah terisi"'
  )

  // 6. Acceptance Criteria 2: Percobaan approve reservasi yang bentrok dengan reservasi 'disetujui' ditolak sistem
  const conflictAfterApproval = await checkFacilityConflict(
    1,
    testDate,
    '08:30:00',
    '09:30:00'
  )
  assert(
    conflictAfterApproval.length === 1 && conflictAfterApproval[0].id === approvedA.id,
    'AC 2: checkFacilityConflict mendeteksi bentrok dengan reservasi yang sudah "disetujui"'
  )

  // 7. Acceptance Criteria 4: Larangan double-booking pengguna lintas fasilitas
  // User 6 sudah punya reservasi approved (08:00-10:00) pada testDate di Fasilitas 1.
  // User 6 mencoba reservasi di Fasilitas 2 untuk jam 09:30-10:30 pada testDate.
  const crossFacilityDoubleBooking = await checkUserDoubleBooking(
    6,
    testDate,
    '09:30:00',
    '10:30:00'
  )
  assert(
    crossFacilityDoubleBooking.length >= 1 &&
      crossFacilityDoubleBooking.some((r) => r.id === approvedA.id),
    'AC 4: checkUserDoubleBooking mencegah pengguna memesan fasilitas berbeda di waktu yang bertabrakan'
  )

  // Cek jika waktu tidak bertabrakan (10:00-11:00 bersinggungan di batas) -> tidak dianggap double booking
  const noCrossDoubleBooking = await checkUserDoubleBooking(
    6,
    testDate,
    '10:00:00',
    '11:00:00'
  )
  assert(
    noCrossDoubleBooking.length === 0,
    'AC 4: Bersinggungan tepat di batas jam (10:00) tidak dianggap bentrok double-booking'
  )

  // 8. Bersihkan data pengujian
  await supabaseAdmin
    .from('reservations')
    .delete()
    .in('facility_id', [1, 2])
    .eq('reservation_date', testDate)

  console.log(`\n=== HASIL: ${passed}/${total} TESTS CONFLICT ENGINE BERHASIL ===`)
}

runChapter5Tests().catch((err) => {
  console.error('Error running Chapter 5 tests:', err)
  process.exit(1)
})
