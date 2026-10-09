import { NextRequest, NextResponse } from 'next/server';

import {
  createClient as createServerClient,
} from '@/lib/supabase/server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  calculateOccupancy,
  getDaysDifference,
} from '@/lib/occupancy';

const TIME_ZONE = 'Asia/Jakarta';

// Mengambil tanggal kalender berdasarkan WIB.
function getWibDateString(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Gagal membaca tanggal WIB.');
  }

  return `${year}-${month}-${day}`;
}

// Memvalidasi tanggal dalam format YYYY-MM-DD.
function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

// Menambah hari kalender tanpa bergantung pada zona waktu komputer.
function addDays(dateString: string, amount: number): string {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

// PostgreSQL start_time dan end_time bertipe TIME, bukan timestamp.
function timeToMinutes(value: string): number | null {
  const parts = value.split(':');

  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2] ?? 0);

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
    return null;
  }

  return hours * 60 + minutes + seconds / 60;
}

// Mengamankan nilai teks untuk HTML yang dibuka di Excel.
function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

// Mengamankan nilai teks pada CSV.
function escapeCsv(value: string | number): string {
  const text = String(value);

  const safeText =
    typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)
      ? `'${text}`
      : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Periksa autentikasi pengguna.
    const authClient = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kamu belum login.' },
        { status: 401 }
      );
    }

    // 2. Hanya admin aktif yang boleh mengekspor rekap.
    const {
      data: currentUser,
      error: currentUserError,
    } = await authClient
      .from('users')
      .select('role, status')
      .eq('auth_user_id', user.id)
      .single();

    if (
      currentUserError ||
      !currentUser ||
      currentUser.role !== 'admin' ||
      currentUser.status !== 'aktif'
    ) {
      return NextResponse.json(
        { error: 'Akses hanya untuk administrator aktif.' },
        { status: 403 }
      );
    }

    // 3. Ambil parameter filter.
    const { searchParams } = new URL(request.url);

    const today = getWibDateString(new Date());

    const startDate = searchParams.get('startDate') || today;
    const endDate = searchParams.get('endDate') || today;
    const location = searchParams.get('location') || 'all';
    const facilityId = searchParams.get('facilityId') || 'all';
    const format = searchParams.get('format') || 'csv';

    if (
      !isValidDateString(startDate) ||
      !isValidDateString(endDate)
    ) {
      return NextResponse.json(
        { error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Tanggal mulai tidak boleh setelah tanggal selesai.' },
        { status: 400 }
      );
    }

    if (endDate > today) {
      return NextResponse.json(
        { error: 'Tanggal selesai tidak boleh melewati hari ini (WIB).' },
        { status: 400 }
      );
    }

    if (facilityId !== 'all' && !/^\d+$/.test(facilityId)) {
      return NextResponse.json(
        { error: 'ID fasilitas tidak valid.' },
        { status: 400 }
      );
    }

    if (format !== 'csv' && format !== 'excel') {
      return NextResponse.json(
        { error: 'Format ekspor harus csv atau excel.' },
        { status: 400 }
      );
    }

    // Gunakan service-role client hanya setelah autentikasi lolos.
    const supabase = supabaseAdmin;

    // Batas ini digunakan untuk kolom timestamptz, seperti reports.created_at.
    const periodStart = `${startDate}T00:00:00+07:00`;

    const periodEndExclusive =
      `${addDays(endDate, 1)}T00:00:00+07:00`;

    // 4. Ambil fasilitas sesuai filter.
    let facilitiesQuery = supabase
      .from('facilities')
      .select('*')
      .order('name', { ascending: true });

    if (facilityId !== 'all') {
      facilitiesQuery = facilitiesQuery.eq(
        'id',
        Number(facilityId)
      );
    }

    if (location !== 'all') {
      facilitiesQuery = facilitiesQuery.eq('location', location);
    }

    const {
      data: facilities,
      error: facilityError,
    } = await facilitiesQuery;

    if (facilityError) {
      throw facilityError;
    }

    if (!facilities || facilities.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada fasilitas yang cocok dengan filter.' },
        { status: 404 }
      );
    }

    const facilityIds = facilities.map((facility) => facility.id);

    // 5. Ambil reservasi yang disetujui.
    // reservation_date bertipe DATE, sedangkan jamnya bertipe TIME.
    const {
      data: reservations,
      error: reservationError,
    } = await supabase
      .from('reservations')
      .select(
        'facility_id, reservation_date, start_time, end_time'
      )
      .in('facility_id', facilityIds)
      .in('status', ['disetujui', 'approved'])
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate);

    if (reservationError) {
      throw reservationError;
    }

    // 6. Ambil laporan valid berdasarkan tanggal pengajuan.
    const {
      data: reports,
      error: reportError,
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
      .lt('created_at', periodEndExclusive);

    if (reportError) {
      throw reportError;
    }

    // 7. Hitung slot terpakai per fasilitas.
    const slotsByFacility = new Map<string, number>();

    for (const reservation of reservations || []) {
      const startMinutes = timeToMinutes(reservation.start_time);
      const endMinutes = timeToMinutes(reservation.end_time);

      if (
        startMinutes === null ||
        endMinutes === null ||
        endMinutes <= startMinutes
      ) {
        continue;
      }

      const durationMinutes = endMinutes - startMinutes;

      // Satu slot adalah 30 menit.
      const slotCount = Math.round(durationMinutes / 30);
      const key = String(reservation.facility_id);

      slotsByFacility.set(
        key,
        (slotsByFacility.get(key) || 0) + slotCount
      );
    }

    // 8. Hitung laporan valid per fasilitas.
    const reportsByFacility = new Map<string, number>();

    for (const report of reports || []) {
      const key = String(report.facility_id);

      reportsByFacility.set(
        key,
        (reportsByFacility.get(key) || 0) + 1
      );
    }

    // 9. Hitung okupansi dengan penyebut sesuai tanggal fasilitas tercatat.
    const recapRows = facilities.map((facility) => {
      const key = String(facility.id);

      const approvedSlotsCount = slotsByFacility.get(key) || 0;
      const validReportCount = reportsByFacility.get(key) || 0;

      const createdAt = facility.created_at
        ? new Date(facility.created_at)
        : null;

      const facilityCreatedDate =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? getWibDateString(createdAt)
          : startDate;

      const effectiveStartDate =
        facilityCreatedDate > startDate
          ? facilityCreatedDate
          : startDate;

      const eligibleDays =
        effectiveStartDate > endDate
          ? 0
          : getDaysDifference(effectiveStartDate, endDate);

      const occupancy = calculateOccupancy({
        approvedSlotCount: approvedSlotsCount,
        totalDays: eligibleDays,
      });

      return {
        id: facility.id,
        name: facility.name,
        type: facility.type || '-',
        location: facility.location || '-',
        approvedSlots: approvedSlotsCount,
        occupancyRate: occupancy.formattedPercentage,
        validReports: validReportCount,
      };
    });

    const filename = `Rekap_Fasilitas_${startDate}_sd_${endDate}`;

    // 10. Ekspor Excel-compatible.
    if (format === 'excel') {
      const tableRows = recapRows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.id)}</td>
              <td>${escapeHtml(row.name)}</td>
              <td>${escapeHtml(row.type)}</td>
              <td>${escapeHtml(row.location)}</td>
              <td>${escapeHtml(row.approvedSlots)}</td>
              <td>${escapeHtml(row.occupancyRate)}</td>
              <td>${escapeHtml(row.validReports)}</td>
            </tr>
          `
        )
        .join('');

      const htmlTable = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"></head>
          <body>
            <table border="1">
              <thead>
                <tr>
                  <th>ID Fasilitas</th>
                  <th>Nama Fasilitas</th>
                  <th>Tipe</th>
                  <th>Lokasi</th>
                  <th>Slot Terpakai (30 Menit)</th>
                  <th>Okupansi (%)</th>
                  <th>Frekuensi Kerusakan Valid</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </body>
        </html>
      `;

      return new NextResponse(htmlTable, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition':
            `attachment; filename="${filename}.xls"`,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // 11. Ekspor CSV.
    const headers = [
      'ID Fasilitas',
      'Nama Fasilitas',
      'Tipe',
      'Lokasi',
      'Slot Terpakai (30 Menit)',
      'Okupansi (%)',
      'Frekuensi Kerusakan Valid',
    ];

    const csvRows = recapRows.map((row) =>
      [
        row.id,
        escapeCsv(row.name),
        escapeCsv(row.type),
        escapeCsv(row.location),
        row.approvedSlots,
        escapeCsv(row.occupancyRate),
        row.validReports,
      ].join(',')
    );

    const csvContent = [
      headers.join(','),
      ...csvRows,
    ].join('\r\n');

    return new NextResponse(`\uFEFF${csvContent}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          `attachment; filename="${filename}.csv"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('Error generating recap export:', error);

    return NextResponse.json(
      { error: 'Gagal mengekspor data rekapitulasi.' },
      { status: 500 }
    );
  }
}