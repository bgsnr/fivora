// app/api/recap/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { calculateOccupancy, getDaysDifference } from '@/lib/occupancy';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  // Ambil parameter filter dari URL
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
  const location = searchParams.get('location') || 'all';
  const facilityId = searchParams.get('facilityId') || 'all';
  const format = searchParams.get('format') || 'csv'; // 'csv' atau 'excel'

  try {
    // 1. Fetch data master fasilitas
    let facilitiesQuery = supabase.from('facilities').select('*').order('name', { ascending: true });
    if (facilityId !== 'all') {
      facilitiesQuery = facilitiesQuery.eq('id', facilityId);
    }
    if (location !== 'all') {
      facilitiesQuery = facilitiesQuery.eq('location', location);
    }

    const { data: facilities, error: facError } = await facilitiesQuery;
    if (facError) throw facError;

    if (!facilities || facilities.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data fasilitas yang ditemukan.' }, { status: 404 });
    }

    // 2. Fetch reservasi disetujui (Approved) pada periode
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('facility_id, start_time, end_time')
      .in('status', ['disetujui', 'approved'])
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('end_time', `${endDate}T23:59:59`);

    if (resError) throw resError;

    // 3. Fetch laporan kerusakan valid ('diproses' atau 'selesai') pada periode (Point 21)
    const { data: reports, error: repError } = await supabase
      .from('reports')
      .select('facility_id')
      .in('status', ['diproses', 'selesai', 'in_progress', 'resolved'])
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (repError) throw repError;

    // 4. Kalkulasi data rekap
    const totalDays = getDaysDifference(startDate, endDate);

    const recapRows = facilities.map((fac) => {
      // Hitung slot terpakai (1 slot = 30 menit)
      const facReservations = (reservations || []).filter(
        (r) => String(r.facility_id) === String(fac.id)
      );

      let approvedSlotsCount = 0;
      facReservations.forEach((res) => {
        const start = new Date(res.start_time).getTime();
        const end = new Date(res.end_time).getTime();
        const durationMinutes = Math.max((end - start) / (1000 * 60), 0);
        approvedSlotsCount += Math.round(durationMinutes / 30);
      });

      const occ = calculateOccupancy({
        approvedSlotCount: approvedSlotsCount,
        totalDays: totalDays,
      });

      const validReportCount = (reports || []).filter(
        (rep) => String(rep.facility_id) === String(fac.id)
      ).length;

      return {
        id: fac.id,
        name: fac.name,
        type: fac.type || '-',
        location: fac.location || '-',
        approvedSlots: approvedSlotsCount,
        occupancyRate: occ.formattedPercentage,
        validReports: validReportCount,
      };
    });

    // 5. Generate Response sesuai format
    if (format === 'excel') {
      // Format HTML Table untuk Excel Compatible (.xls)
      let htmlTable = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"></head>
        <body>
          <table border="1">
            <thead>
              <tr style="background-color: #603ddb; color: #ffffff; font-weight: bold;">
                <th>ID Fasilitas</th>
                <th>Nama Fasilitas</th>
                <th>Tipe</th>
                <th>Lokasi</th>
                <th>Slot Terpakai (30 Menit)</th>
                <th>Okupansi (%)</th>
                <th>Frekuensi Kerusakan Valid</th>
              </tr>
            </thead>
            <tbody>
      `;

      recapRows.forEach((row) => {
        htmlTable += `
          <tr>
            <td>${row.id}</td>
            <td>${row.name}</td>
            <td>${row.type}</td>
            <td>${row.location}</td>
            <td>${row.approvedSlots}</td>
            <td>${row.occupancyRate}</td>
            <td>${row.validReports}</td>
          </tr>
        `;
      });

      htmlTable += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      return new NextResponse(htmlTable, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="Rekap_Fasilitas_${startDate}_sd_${endDate}.xls"`,
        },
      });
    }

    // Default Format: CSV
    const headers = [
      'ID Fasilitas',
      'Nama Fasilitas',
      'Tipe',
      'Lokasi',
      'Slot Terpakai (30 Menit)',
      'Okupansi (%)',
      'Frekuensi Kerusakan Valid',
    ];

    const csvLines = [
      headers.join(','),
      ...recapRows.map((r) =>
        [
          r.id,
          `"${r.name.replace(/"/g, '""')}"`,
          `"${r.type.replace(/"/g, '""')}"`,
          `"${r.location.replace(/"/g, '""')}"`,
          r.approvedSlots,
          `"${r.occupancyRate}"`,
          r.validReports,
        ].join(',')
      ),
    ].join('\n');

    return new NextResponse(csvLines, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Rekap_Fasilitas_${startDate}_sd_${endDate}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating recap export:', error);
    return NextResponse.json(
      { error: 'Gagal mengekspor data rekapitulasi: ' + error.message },
      { status: 500 }
    );
  }
}