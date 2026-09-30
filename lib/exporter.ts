export interface ExportRecapItem {
  facilityId: number;
  facilityName: string;
  type: string;
  location: string;
  approvedSlotsCount: number;
  occupancyPercentage: string;
  validReportCount: number;
}

export interface ExportOptions {
  filename?: string;
  startDate: string;
  endDate: string;
}

/**
 * Memicu pengunduhan file CSV dari array data rekapitulasi
 */
export function exportToCSV(data: ExportRecapItem[], options: ExportOptions): void {
  if (!data || data.length === 0) {
    alert('Tidak ada data rekapitulasi untuk diekspor.');
    return;
  }

  const headers = [
    'ID Fasilitas',
    'Nama Fasilitas',
    'Tipe',
    'Lokasi',
    'Slot Terpakai (30 Menit)',
    'Persentase Okupansi',
    'Frekuensi Kerusakan Valid',
  ];

  const rows = data.map((item) => [
    item.facilityId,
    `"${item.facilityName.replace(/"/g, '""')}"`,
    `"${(item.type || '-').replace(/"/g, '""')}"`,
    `"${(item.location || '-').replace(/"/g, '""')}"`,
    item.approvedSlotsCount,
    `"${item.occupancyPercentage}"`,
    item.validReportCount,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const defaultFilename = `Rekap_Fasilitas_${options.startDate}_sd_${options.endDate}.csv`;

  link.setAttribute('href', encodedUri);
  link.setAttribute('download', options.filename || defaultFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Memicu pengunduhan file Excel Compatible (.xls) dari array data rekapitulasi
 */
export function exportToExcel(data: ExportRecapItem[], options: ExportOptions): void {
  if (!data || data.length === 0) {
    alert('Tidak ada data rekapitulasi untuk diekspor.');
    return;
  }

  let htmlTable = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Rekap Okupansi & Kerusakan</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      <h3>Laporan Rekapitulasi Fasilitas Kampus (${options.startDate} s.d. ${options.endDate})</h3>
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr style="background-color: #603ddb; color: #ffffff; font-weight: bold;">
            <th>ID Fasilitas</th>
            <th>Nama Fasilitas</th>
            <th>Tipe</th>
            <th>Lokasi</th>
            <th>Slot Terpakai (30 Menit)</th>
            <th>Persentase Okupansi</th>
            <th>Frekuensi Kerusakan Valid</th>
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach((item) => {
    htmlTable += `
      <tr>
        <td style="text-align: center;">${item.facilityId}</td>
        <td>${item.facilityName}</td>
        <td>${item.type || '-'}</td>
        <td>${item.location || '-'}</td>
        <td style="text-align: right;">${item.approvedSlotsCount}</td>
        <td style="text-align: right;">${item.occupancyPercentage}</td>
        <td style="text-align: right;">${item.validReportCount}</td>
      </tr>
    `;
  });

  htmlTable += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const defaultFilename = `Rekap_Fasilitas_${options.startDate}_sd_${options.endDate}.xls`;

  link.href = url;
  link.download = options.filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Memicu jendela cetak/PDF browser untuk mencetak laporan rekapitulasi
 */
export function exportToPrint(): void {
  window.print();
}