import {
  createReservation,
  getReservationById,
  getReservationsByUser,
  getReservationsByFacilityAndDate,
  getPendingReservationsQueueSortedByCreatedAt,
  updateReservationStatus,
  getOverlappingReservations,
  getUserReservationsOverlapping,
} from '../lib/actions/reservations'

async function runChapter3Tests() {
  console.log('=== RUNNING CHAPTER 3 TESTS ===\n')

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passedTests++
    } else {
      console.error(`[FAIL] ${testName}`)
      if (detail) console.error(`       Detail: ${detail}`)
      process.exitCode = 1
    }
  }

  // 1. getReservationById
  const res3 = await getReservationById(3)
  assert(
    res3 !== null && res3.id === 3 && res3.status === 'disetujui',
    'Fungsi 2: getReservationById(3) mengembalikan data yang benar',
    JSON.stringify(res3)
  )

  // 2. getReservationsByUser
  const user6Reservations = await getReservationsByUser(6)
  assert(
    user6Reservations.length > 0 && user6Reservations.every((r) => r.user_id === 6),
    'Fungsi 3: getReservationsByUser(6) mengembalikan riwayat user 6'
  )

  // 3. getReservationsByFacilityAndDate
  const facility1Reservations = await getReservationsByFacilityAndDate(1, '2026-10-01')
  assert(
    facility1Reservations.length >= 2,
    'Fungsi 4: getReservationsByFacilityAndDate(1, 2026-10-01) mengembalikan reservasi fasilitas 1'
  )

  // 4. getPendingReservationsQueueSortedByCreatedAt
  const queue = await getPendingReservationsQueueSortedByCreatedAt()
  const isSorted = queue.every(
    (item, idx, arr) =>
      idx === 0 || new Date(arr[idx - 1].created_at).getTime() <= new Date(item.created_at).getTime()
  )
  assert(
    queue.length > 0 && isSorted && queue.every((r) => r.status === 'menunggu'),
    'Fungsi 5: getPendingReservationsQueueSortedByCreatedAt() mengembalikan antrean berurutan FIFO'
  )

  // 5. Test Kasus Irisan Waktu (getOverlappingReservations) pada Fasilitas 2 tgl 2026-10-02 (ada jadwal 10:00-12:00 dan 13:00-15:00)
  // Skenario A: Bentrok penuh (10:30-11:30 di dalam 10:00-12:00)
  const overlapFull = await getOverlappingReservations(
    2,
    '2026-10-02',
    '10:30:00',
    '11:30:00',
    'disetujui'
  )
  assert(
    overlapFull.length === 1 && overlapFull[0].id === 3,
    'Fungsi 7 - Skenario A: Bentrok penuh (10:30-11:30 vs 10:00-12:00) terdeteksi',
    `Found: ${overlapFull.length} items`
  )

  // Skenario B: Bentrok sebagian (09:00-10:30 beririsan dengan 10:00-12:00)
  const overlapPartial = await getOverlappingReservations(
    2,
    '2026-10-02',
    '09:00:00',
    '10:30:00',
    'disetujui'
  )
  assert(
    overlapPartial.length === 1 && overlapPartial[0].id === 3,
    'Fungsi 7 - Skenario B: Bentrok sebagian (09:00-10:30 vs 10:00-12:00) terdeteksi',
    `Found: ${overlapPartial.length} items`
  )

  // Skenario C: Tidak bentrok, bersinggungan tepat di batas jam (08:00-10:00)
  const noOverlapBorder1 = await getOverlappingReservations(
    2,
    '2026-10-02',
    '08:00:00',
    '10:00:00',
    'disetujui'
  )
  assert(
    noOverlapBorder1.length === 0,
    'Fungsi 7 - Skenario C: Tidak bentrok bersinggungan tepat di batas jam awal (08:00-10:00 vs 10:00-12:00)',
    `Found: ${noOverlapBorder1.length} items (expected 0)`
  )

  // Skenario D: Tidak bentrok di antara dua slot (12:00-13:00)
  const noOverlapBetween = await getOverlappingReservations(
    2,
    '2026-10-02',
    '12:00:00',
    '13:00:00',
    'disetujui'
  )
  assert(
    noOverlapBetween.length === 0,
    'Fungsi 7 - Skenario D: Tidak bentrok di antara dua jadwal terisi (12:00-13:00 vs [10-12] & [13-15])',
    `Found: ${noOverlapBetween.length} items (expected 0)`
  )

  // 6. getUserReservationsOverlapping
  const userOverlap = await getUserReservationsOverlapping(6, '2026-10-02', '11:00:00', '12:30:00')
  assert(
    userOverlap.length >= 1 && userOverlap.some((r) => r.id === 3),
    'Fungsi 8: getUserReservationsOverlapping mendeteksi reservasi user yang beririsan'
  )

  // 7. createReservation
  const created = await createReservation({
    user_id: 6,
    facility_id: 1,
    reservation_date: '2026-10-25',
    start_time: '08:00:00',
    end_time: '09:00:00',
    purpose: 'Uji coba CRUD Model Chapter 3',
  })
  assert(
    created.id > 0 && created.status === 'menunggu',
    'Fungsi 1: createReservation berhasil menambahkan data dengan status default menunggu'
  )

  // 8. updateReservationStatus
  const updated = await updateReservationStatus(created.id, 'dibatalkan', {
    rejection_reason: 'Dibatalkan dalam pengujian otomatis',
  })
  assert(
    updated.status === 'dibatalkan' && updated.rejection_reason === 'Dibatalkan dalam pengujian otomatis',
    'Fungsi 6: updateReservationStatus berhasil mengubah status dan metadata'
  )

  console.log(`\n=== HASIL: ${passedTests}/${totalTests} TESTS BERHASIL ===`)
}

runChapter3Tests().catch((err) => {
  console.error('Error running tests:', err)
  process.exit(1)
})
