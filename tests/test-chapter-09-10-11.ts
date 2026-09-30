import {
  submitReservation,
  approveReservation,
  rejectReservation,
  emergencyCancelByStaff,
} from '../lib/reservation-service'
import {
  getPendingReservationsQueueSortedByCreatedAt,
  getReservationById,
} from '../lib/actions/reservations'

async function runChapter91011Tests() {
  console.log('=== RUNNING CHAPTER 9, 10, 11 TESTS: PETUGAS WORKFLOW ===\n')

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

  // 1. Chapter 9: Antrean FIFO (Pengurutan created_at ascending)
  const queue = await getPendingReservationsQueueSortedByCreatedAt()
  const isSorted = queue.every(
    (item, idx, arr) =>
      idx === 0 || new Date(arr[idx - 1].created_at).getTime() <= new Date(item.created_at).getTime()
  )
  assert(
    isSorted,
    'Chapter 9 AC 2: Antrean petugas terurut created_at ASCENDING (FIFO)'
  )

  // 2. Chapter 10: Reject tanpa alasan ditolak sistem
  const testRes1 = await submitReservation(
    {
      facility_id: 1,
      reservation_date: '2026-12-15',
      start_time: '08:00',
      end_time: '09:00',
      purpose: 'Uji Coba Reject Reservasi Chapter 10',
    },
    6
  )
  assert(testRes1.success === true, 'Setup reservasi uji coba reject')

  const res1Id = testRes1.data!.id

  const rejectEmpty = await rejectReservation(res1Id, '', 8)
  assert(
    rejectEmpty.success === false && rejectEmpty.error?.includes('wajib diisi'),
    'Chapter 10 AC 5: Penolakan tanpa alasan ditolak oleh sistem',
    rejectEmpty.error
  )

  // Reject dengan alasan berhasil
  const rejectValid = await rejectReservation(
    res1Id,
    'Ruangan dialihkan untuk ujian sertifikasi kampus',
    8
  )
  assert(
    rejectValid.success === true &&
      rejectValid.data?.status === 'ditolak' &&
      rejectValid.data?.rejection_reason === 'Ruangan dialihkan untuk ujian sertifikasi kampus' &&
      Number(rejectValid.data?.processed_by) === 8,
    'Chapter 10: Petugas berhasil menolak reservasi dengan alasan dan mencatat processed_by'
  )

  // 3. Chapter 10: Re-check bentrok saat approve (Percobaan approve reservasi yang bentrok dengan reservasi 'disetujui' lain ditolak)
  // Fasilitas 2 pada 2026-10-02 sudah ada jadwal disetujui 10:00-12:00
  const conflictingPending = await submitReservation(
    {
      facility_id: 2,
      reservation_date: '2026-10-02',
      start_time: '11:00',
      end_time: '13:00',
      purpose: 'Uji Coba Konflik saat Approve',
    },
    5
  )
  // Update paksa status ke 'menunggu' jika lolos atau buat via DB
  let conflictId = conflictingPending.data?.id
  if (!conflictId) {
    // Buat langsung di model untuk menyimulasikan pending yang masuk sebelum reservasi lain diapprove
    const { createReservation } = await import('../lib/actions/reservations')
    const manualPending = await createReservation({
      user_id: 5,
      facility_id: 2,
      reservation_date: '2026-10-02',
      start_time: '11:00:00',
      end_time: '13:00:00',
      purpose: 'Simulasi race condition pending',
    })
    conflictId = manualPending.id
  }

  const approveConflicted = await approveReservation(conflictId, 8)
  assert(
    approveConflicted.success === false &&
      approveConflicted.error?.includes('telah terisi oleh reservasi lain'),
    'Chapter 10 AC 3: Approve reservasi yang bentrok dengan reservasi disetujui lain ditolak sistem',
    approveConflicted.error
  )

  // 4. Chapter 10: Approve valid & Auto-reject reservasi pending lain yang bentrok
  const testDate = '2026-12-20'
  const { createReservation } = await import('../lib/actions/reservations')
  const pending1 = await createReservation({
    user_id: 6,
    facility_id: 1,
    reservation_date: testDate,
    start_time: '08:00:00',
    end_time: '10:00:00',
    purpose: 'Pengajuan Pertama (Akan diapprove)',
  })
  const pending2 = await createReservation({
    user_id: 5,
    facility_id: 1,
    reservation_date: testDate,
    start_time: '09:00:00',
    end_time: '11:00:00',
    purpose: 'Pengajuan Kedua (Akan otomatis ditolak)',
  })

  const approveValid = await approveReservation(pending1.id, 8)
  assert(
    approveValid.success === true &&
      approveValid.data?.status === 'disetujui' &&
      Number(approveValid.data?.processed_by) === 8 &&
      approveValid.data?.processed_at !== null,
    'Chapter 10 AC 1: Approve reservasi yang valid berhasil, mengisi processed_by & processed_at',
    JSON.stringify(approveValid)
  )

  const refreshedPending2 = await getReservationById(pending2.id)
  assert(
    refreshedPending2?.status === 'ditolak' &&
      refreshedPending2.rejection_reason === 'jadwal telah terisi',
    'Chapter 10 AC 4: Setelah reservasi disetujui, pending yang bentrok otomatis ditolak dengan alasan "jadwal telah terisi"',
    JSON.stringify(refreshedPending2)
  )

  // 5. Chapter 11: Cancel Darurat Petugas
  // Coba cancel tanpa alasan -> ditolak
  const cancelStaffNoReason = await emergencyCancelByStaff(pending1.id, 8, '')
  assert(
    cancelStaffNoReason.success === false &&
      cancelStaffNoReason.error?.includes('wajib diisi'),
    'Chapter 11 AC 2: Percobaan cancel darurat tanpa alasan ditolak'
  )

  // Coba cancel reservasi berstatus selain 'disetujui' (misal pending2 yang sudah 'ditolak')
  const cancelStaffOnRejected = await emergencyCancelByStaff(
    pending2.id,
    8,
    'Alasan sembarang'
  )
  assert(
    cancelStaffOnRejected.success === false &&
      cancelStaffOnRejected.error?.includes('Hanya reservasi berstatus "disetujui"'),
    'Chapter 11 AC 3: Percobaan cancel darurat pada reservasi selain "disetujui" ditolak'
  )

  // Cancel darurat sukses pada reservasi disetujui (pending1)
  const cancelStaffSuccess = await emergencyCancelByStaff(
    pending1.id,
    8,
    'Plafon ruangan mengalami kerusakan dan bocor mendadak'
  )
  assert(
    cancelStaffSuccess.success === true &&
      cancelStaffSuccess.data?.status === 'dibatalkan' &&
      cancelStaffSuccess.data?.rejection_reason === 'Plafon ruangan mengalami kerusakan dan bocor mendadak',
    'Chapter 11 AC 1 & 4: Petugas berhasil melakukan cancel darurat, status menjadi dibatalkan dan riwayat tetap tersimpan'
  )

  console.log(`\n=== HASIL: ${passed}/${total} TESTS CHAPTER 9, 10, 11 BERHASIL ===`)
}

runChapter91011Tests().catch((err) => {
  console.error('Error running Chapter 9, 10, 11 tests:', err)
  process.exit(1)
})
