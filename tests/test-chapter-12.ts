import {
  getFacilitySlotAvailability,
  getUpcomingActiveReservationsForFacility,
  handleFacilityMaintenance,
} from '../lib/integration'
import { isFacilityBookable } from '../lib/conflict-engine'
import { createReservation, updateReservationStatus, getReservationById } from '../lib/actions/reservations'

async function runChapter12Tests() {
  console.log('=== RUNNING CHAPTER 12 TESTS: CROSS-MODULE INTEGRATION ===\n')

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

  // 1. AC 2: isFacilityBookable mengembalikan hasil benar untuk kombinasi status
  assert(
    isFacilityBookable('aktif') === true &&
      isFacilityBookable('nonaktif') === false &&
      isFacilityBookable('dalam_perbaikan') === false,
    'Chapter 12 AC 2: isFacilityBookable benar untuk status aktif, nonaktif, dan dalam perbaikan'
  )

  // 2. AC 3: Tampilan ketersediaan publik (Eve) konsisten dengan lock slot
  // Fasilitas 2 pada 2026-10-02 memiliki jadwal disetujui 10:00-12:00 dan 13:00-15:00
  const availability = await getFacilitySlotAvailability(2, '2026-10-02')
  assert(
    availability.length === 26,
    `Integrasi Eve: Tepat 26 slot operasional dikembalikan (didapat: ${availability.length})`
  )

  // Slot 10:00 - 10:30 harus terisi (booked)
  const slot1000 = availability.find((s) => s.startTime === '10:00')
  assert(
    slot1000?.isBooked === true && slot1000?.available === false,
    'Chapter 12 AC 3: Slot 10:00-10:30 terdeteksi terisi oleh reservasi disetujui'
  )

  // Slot 12:00 - 12:30 harus tersedia (available)
  const slot1200 = availability.find((s) => s.startTime === '12:00')
  assert(
    slot1200?.isBooked === false,
    'Chapter 12 AC 3: Slot 12:00-12:30 tersedia konsisten dengan deteksi bentrok'
  )

  // 3. Integrasi Eve/Admin: getUpcomingActiveReservationsForFacility
  const upcomingActive = await getUpcomingActiveReservationsForFacility(1)
  assert(
    upcomingActive.length > 0 &&
      upcomingActive.every((r) => r.facility_id === 1 && ['menunggu', 'disetujui'].includes(r.status)),
    'Integrasi Admin: Menyediakan daftar reservasi mendatang sebelum admin menonaktifkan fasilitas'
  )

  // 4. AC 4: Integrasi Arin - Penanganan saat fasilitas ditandai "dalam perbaikan"
  const testDate = '2026-12-28'
  const pendingRes = await createReservation({
    user_id: 6,
    facility_id: 5,
    reservation_date: testDate,
    start_time: '08:00:00',
    end_time: '10:00:00',
    purpose: 'Setup pending untuk uji perbaikan',
  })
  const approvedRes = await createReservation({
    user_id: 5,
    facility_id: 5,
    reservation_date: testDate,
    start_time: '13:00:00',
    end_time: '15:00:00',
    purpose: 'Setup approved untuk uji perbaikan',
  })
  await updateReservationStatus(approvedRes.id, 'disetujui', { processed_by: 8 })

  // Eksekusi penanganan perbaikan fasilitas (misal proyektor rusak)
  const maintenanceResult = await handleFacilityMaintenance(
    5,
    8,
    'Lensa optik proyektor retak dan kabel terbakar'
  )

  assert(
    maintenanceResult.rejectedPendingCount >= 1 &&
      maintenanceResult.cancelledApprovedCount >= 1,
    'Chapter 12 AC 4: handleFacilityMaintenance memproses pengajuan pending dan approved'
  )

  const checkPending = await getReservationById(pendingRes.id)
  assert(
    checkPending?.status === 'ditolak' &&
      checkPending.rejection_reason === 'fasilitas dalam perbaikan',
    'Chapter 12 AC 4: Pending otomatis ditolak dengan alasan "fasilitas dalam perbaikan"'
  )

  const checkApproved = await getReservationById(approvedRes.id)
  assert(
    checkApproved?.status === 'dibatalkan' &&
      checkApproved.rejection_reason?.includes('Fasilitas dalam perbaikan: Lensa optik proyektor retak'),
    'Chapter 12 AC 4: Reservasi disetujui dibatalkan darurat dengan alasan kerusakan fasilitas'
  )

  console.log(`\n=== HASIL: ${passed}/${total} TESTS CHAPTER 12 BERHASIL ===`)
}

runChapter12Tests().catch((err) => {
  console.error('Error running Chapter 12 tests:', err)
  process.exit(1)
})
