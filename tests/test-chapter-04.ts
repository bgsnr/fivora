import {
  validateReservationTimeRules,
  isReservationExpiredForApproval,
  getDisplayStatusLabel,
  getNextAvailableSlotMinutes,
  formatMinutesToTime,
} from '../lib/validations/reservation-time'

async function runChapter4Tests() {
  console.log('=== RUNNING CHAPTER 4 TESTS ===\n')

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

  // 1. Aturan Jam Operasional (07:00–20:00)
  const opEarly = validateReservationTimeRules('2026-10-10', '06:30', '08:00')
  assert(!opEarly.valid, 'Aturan 1: Jam mulai < 07:00 ditolak (06:30-08:00)', opEarly.error)

  const opLate = validateReservationTimeRules('2026-10-10', '19:00', '20:30')
  assert(!opLate.valid, 'Aturan 1: Jam selesai > 20:00 ditolak (19:00-20:30)', opLate.error)

  const opValid = validateReservationTimeRules('2026-10-10', '07:00', '20:00')
  assert(opValid.valid, 'Aturan 1 & 5: Rentang penuh jam operasional 07:00-20:00 diizinkan')

  // 2. Aturan Kelipatan 30 Menit
  const non30Start = validateReservationTimeRules('2026-10-10', '08:15', '09:00')
  assert(!non30Start.valid, 'Aturan 2: Jam mulai bukan kelipatan 30 menit ditolak (08:15)', non30Start.error)

  const non30End = validateReservationTimeRules('2026-10-10', '08:00', '09:45')
  assert(!non30End.valid, 'Aturan 2: Jam selesai bukan kelipatan 30 menit ditolak (09:45)', non30End.error)

  // 3. Aturan Durasi Minimal 30 Menit
  const zeroDuration = validateReservationTimeRules('2026-10-10', '08:00', '08:00')
  assert(!zeroDuration.valid, 'Aturan 3: Durasi 0 menit ditolak', zeroDuration.error)

  const reversedTime = validateReservationTimeRules('2026-10-10', '09:00', '08:30')
  assert(!reversedTime.valid, 'Aturan 3: Jam selesai < jam mulai ditolak', reversedTime.error)

  const min30Valid = validateReservationTimeRules('2026-10-10', '08:00', '08:30')
  assert(min30Valid.valid, 'Aturan 3: Durasi tepat 30 menit diizinkan (08:00-08:30)')

  // 4. Tanggal Masa Lalu
  const pastDate = validateReservationTimeRules('2020-01-01', '08:00', '09:00')
  assert(!pastDate.valid, 'Aturan 4/7: Tanggal di masa lalu ditolak', pastDate.error)

  // 5. Kasus Tepi Pengajuan Hari yang Sama (Aturan 6)
  // Simulasi waktu sekarang: 2026-10-01 jam 10:10 WIB (UTC = 03:10)
  const fakeNow1010 = new Date('2026-10-01T03:10:00Z')
  const slot1010 = formatMinutesToTime(getNextAvailableSlotMinutes('10:10:00'))
  assert(
    slot1010 === '10:30',
    `Kasus Tepi 1: Pengajuan jam 10.10 menghasilkan slot paling awal 10.30 (didapat: ${slot1010})`
  )

  const sameDayInvalid = validateReservationTimeRules('2026-10-01', '10:00', '11:00', fakeNow1010)
  assert(
    !sameDayInvalid.valid,
    'Kasus Tepi 1: Pengajuan jam 10.10 menolak slot 10.00-11.00',
    sameDayInvalid.error
  )

  const sameDayValid = validateReservationTimeRules('2026-10-01', '10:30', '11:30', fakeNow1010)
  assert(sameDayValid.valid, 'Kasus Tepi 1: Pengajuan jam 10.10 menerima slot 10.30-11.30')

  // Simulasi waktu tepat 12:00:00 WIB (UTC = 05:00:00)
  const fakeNow1200 = new Date('2026-10-01T05:00:00Z')
  const slot1200 = formatMinutesToTime(getNextAvailableSlotMinutes('12:00:00'))
  assert(
    slot1200 === '12:30',
    `Kasus Tepi 2: Pengajuan tepat jam 12.00 menghasilkan slot paling awal 12.30 (didapat: ${slot1200})`
  )

  const sameDay1200Invalid = validateReservationTimeRules('2026-10-01', '12:00', '13:00', fakeNow1200)
  assert(
    !sameDay1200Invalid.valid,
    'Kasus Tepi 2: Pengajuan tepat jam 12.00 menolak slot mulai 12.00',
    sameDay1200Invalid.error
  )

  const sameDay1200Valid = validateReservationTimeRules('2026-10-01', '12:30', '13:30', fakeNow1200)
  assert(sameDay1200Valid.valid, 'Kasus Tepi 2: Pengajuan tepat jam 12.00 menerima slot mulai 12.30')

  // 6. Aturan 9: Auto-reject / check waktu mulai terlewati untuk approval
  const expiredApproval = isReservationExpiredForApproval(
    { reservation_date: '2026-10-01', start_time: '08:00:00' },
    fakeNow1010 // jam 10.10 WIB
  )
  assert(
    expiredApproval === true,
    'Aturan 9: Reservasi yang start_time-nya sudah lewat (08:00 pada jam 10:10) dinyatakan expired untuk approval'
  )

  const activeApproval = isReservationExpiredForApproval(
    { reservation_date: '2026-10-01', start_time: '14:00:00' },
    fakeNow1010 // jam 10.10 WIB
  )
  assert(
    activeApproval === false,
    'Aturan 9: Reservasi mendatang (14:00 pada jam 10:10) belum expired'
  )

  // 7. Aturan 10: Label tampilan "sudah berlalu"
  const displayPast = getDisplayStatusLabel(
    { status: 'disetujui', reservation_date: '2026-10-01', end_time: '10:00:00' },
    fakeNow1010 // jam 10:10 WIB (sudah lewat dari 10:00)
  )
  assert(
    displayPast.status === 'disetujui' &&
      displayPast.isPast === true &&
      displayPast.label === 'Disetujui (Sudah Berlalu)',
    'Aturan 10: Reservasi disetujui yang lewat end_time tetap berstatus "disetujui" dengan label "(Sudah Berlalu)"'
  )

  const displayUpcoming = getDisplayStatusLabel(
    { status: 'disetujui', reservation_date: '2026-10-01', end_time: '12:00:00' },
    fakeNow1010 // jam 10:10 WIB
  )
  assert(
    displayUpcoming.status === 'disetujui' &&
      displayUpcoming.isPast === false &&
      displayUpcoming.label === 'Disetujui',
    'Aturan 10: Reservasi disetujui masa depan menampilkan label "Disetujui"'
  )

  // 8. Aturan 11: Status final (ditolak & dibatalkan) tidak berubah
  const displayRejected = getDisplayStatusLabel(
    { status: 'ditolak', reservation_date: '2020-01-01', end_time: '08:00:00' },
    fakeNow1010
  )
  assert(
    displayRejected.status === 'ditolak' && displayRejected.label === 'Ditolak',
    'Aturan 11: Status ditolak tetap berlabel Ditolak meski jadwal sudah lama lewat'
  )

  console.log(`\n=== HASIL: ${passed}/${total} TESTS BERHASIL ===`)
}

runChapter4Tests().catch((err) => {
  console.error('Error running Chapter 4 tests:', err)
  process.exit(1)
})
