import { supabaseAdmin } from '../lib/supabase/admin'

async function runChapter2Tests() {
  console.log('=== RUNNING CHAPTER 2 TESTS: DATABASE SCHEMA & EXCLUDE CONSTRAINT ===\n')

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

  const testDate = '2026-12-30'

  // Clean up any leftovers from previous test runs
  await supabaseAdmin.from('reservations').delete().eq('reservation_date', testDate)

  try {
    // Test 1: Dua reservasi 'menunggu' yang bertabrakan HARUS DIIZINKAN masuk DB
    const { data: pending1, error: err1 } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: 6,
        facility_id: 1,
        reservation_date: testDate,
        start_time: '08:00:00',
        end_time: '10:00:00',
        purpose: 'Chapter 2 Test Pending 1',
        status: 'menunggu',
      })
      .select()
      .single()

    const { data: pending2, error: err2 } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: 5,
        facility_id: 1,
        reservation_date: testDate,
        start_time: '09:00:00',
        end_time: '11:00:00',
        purpose: 'Chapter 2 Test Pending 2 (overlapping)',
        status: 'menunggu',
      })
      .select()
      .single()

    assert(
      !err1 && !err2 && pending1?.id && pending2?.id,
      'AC 2a: Dua reservasi "menunggu" yang bertabrakan diizinkan masuk ke database (antrean FIFO)'
    )

    // Test 2: Reservasi 'disetujui' pertama berhasil
    const { data: approved1, error: errApp1 } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: 6,
        facility_id: 1,
        reservation_date: testDate,
        start_time: '14:00:00',
        end_time: '16:00:00',
        purpose: 'Chapter 2 Test Approved 1',
        status: 'disetujui',
      })
      .select()
      .single()

    assert(
      !errApp1 && approved1?.id,
      'AC 2b: Reservasi "disetujui" pertama berhasil disimpan'
    )

    // Test 3: Reservasi 'disetujui' kedua yang tumpang tindih HARUS DITOLAK oleh EXCLUDE constraint DB
    const { data: approved2, error: errApp2 } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: 5,
        facility_id: 1,
        reservation_date: testDate,
        start_time: '15:00:00',
        end_time: '17:00:00',
        purpose: 'Chapter 2 Test Approved 2 (conflicting)',
        status: 'disetujui',
      })
      .select()
      .single()

    const isExclusionError =
      errApp2 !== null &&
      (errApp2.message.includes('exclusion') ||
        errApp2.message.includes('no_overlapping_approved_reservations') ||
        errApp2.code === '23P01')

    assert(
      isExclusionError && !approved2,
      'AC 2c: Constraint EXCLUDE berhasil mencegah insert reservasi "disetujui" yang bertabrakan',
      errApp2?.message
    )

    // Test 4: Verifikasi kolom-kolom tabel reservations
    const { data: sampleRes, error: sampleErr } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .limit(1)
      .single()

    const requiredColumns = [
      'id',
      'user_id',
      'facility_id',
      'reservation_date',
      'start_time',
      'end_time',
      'purpose',
      'status',
      'rejection_reason',
      'processed_by',
      'processed_at',
      'created_at',
    ]

    const allColumnsExist =
      !sampleErr &&
      sampleRes &&
      requiredColumns.every((col) => Object.prototype.hasOwnProperty.call(sampleRes, col))

    assert(
      allColumnsExist,
      'AC 1: Tabel reservations memiliki seluruh kolom wajib sesuai AGENTS.md & Chapter 2'
    )
  } finally {
    // Cleanup
    await supabaseAdmin.from('reservations').delete().eq('reservation_date', testDate)
  }

  console.log(`\n=== HASIL: ${passed}/${total} TESTS BERHASIL ===`)
  if (passed !== total) {
    process.exit(1)
  }
}

runChapter2Tests().catch((err) => {
  console.error('Error running Chapter 2 tests:', err)
  process.exit(1)
})
