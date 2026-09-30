'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Facility, FacilityStatus } from '@/types/facility';
import styles from './adminFasilitas.module.css';

interface PendingReservation {
  id: number;
  user_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function AdminFacilitiesPage() {
  const supabase = createClient();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State Modal Penonaktifan (Aturan 13)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [checkingReservations, setCheckingReservations] = useState<boolean>(false);

  // Fetch Semua Fasilitas (Termasuk Nonaktif)
  const fetchFacilities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching facilities:', error);
    } else {
      setFacilities(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFacilities();
  }, [supabase]);

  // Handle Klik Menonaktifkan Fasilitas (Pengecekan Aturan 13)
  const handleInitiateDeactivate = async (facility: Facility) => {
    setSelectedFacility(facility);
    setCheckingReservations(true);
    setIsModalOpen(true);

    const nowIso = new Date().toISOString();

    // Cek apakah ada reservasi mendatang yang masih 'menunggu' atau 'disetujui'
    const { data, error } = await supabase
      .from('reservations')
      .select('id, user_name, start_time, end_time, status')
      .eq('facility_id', facility.id)
      .in('status', ['menunggu', 'pending', 'disetujui', 'approved'])
      .gte('end_time', nowIso);

    if (error) {
      console.error('Error checking reservations:', error);
    } else {
      setPendingReservations(data || []);
    }
    setCheckingReservations(false);
  };

  // Konfirmasi Eksekusi Menonaktifkan
  const confirmDeactivate = async () => {
    if (!selectedFacility) return;

    const { error } = await supabase
      .from('facilities')
      .update({ status: 'nonaktif', updated_at: new Date().toISOString() })
      .eq('id', selectedFacility.id);

    if (error) {
      alert('Gagal menonaktifkan fasilitas: ' + error.message);
    } else {
      setIsModalOpen(false);
      setSelectedFacility(null);
      fetchFacilities();
    }
  };

  // Handle Mengaktifkan Kembali Fasilitas
  const handleActivate = async (id: number) => {
    const { error } = await supabase
      .from('facilities')
      .update({ status: 'aktif', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert('Gagal mengaktifkan fasilitas: ' + error.message);
    } else {
      fetchFacilities();
    }
  };

  // Render Helper Badge Status
  const renderBadge = (status: FacilityStatus) => {
    if (status === 'nonaktif' || status === 'inactive') {
      return <span className={styles.badgeInactive}>NONAKTIF</span>;
    }
    if (status === 'dalam_perbaikan' || status === 'under_maintenance') {
      return <span className={styles.badgeMaintenance}>DALAM PERBAIKAN</span>;
    }
    return <span className={styles.badgeActive}>AKTIF</span>;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MANAJEMEN DATA MASTER</p>
          <h1 className={styles.title}>Kelola Fasilitas Kampus</h1>
          <p className={styles.subtitle}>
            Tambah, ubah, atau nonaktifkan fasilitas. Pengaturan fasilitas memengaruhi akses pemesanan.
          </p>
        </div>
        <Link href="/admin/fasilitas/tambah" className={styles.createButton}>
          + Tambah Fasilitas Baru
        </Link>
      </div>

      {/* State Loading */}
      {loading ? (
        <div className={styles.loadingState}>Memuat data fasilitas...</div>
      ) : facilities.length === 0 ? (
        <div className={styles.emptyState}>Belum ada data fasilitas. Silakan tambah fasilitas baru.</div>
      ) : (
        /* Tabel Fasilitas */
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Fasilitas</th>
                  <th>Tipe</th>
                  <th>Lokasi</th>
                  <th>Kapasitas</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((fac) => {
                  const isInactive = fac.status === 'nonaktif' || fac.status === 'inactive';
                  return (
                    <tr key={fac.id}>
                      <td>#{fac.id}</td>
                      <td className={styles.facilityName}>{fac.name}</td>
                      <td>{fac.type || '-'}</td>
                      <td>{fac.location || '-'}</td>
                      <td>{fac.capacity ? `${fac.capacity} Orang` : '-'}</td>
                      <td>{renderBadge(fac.status)}</td>
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/admin/fasilitas/${fac.id}/edit`}
                            className={styles.editButton}
                          >
                            Edit
                          </Link>

                          {isInactive ? (
                            <button
                              onClick={() => handleActivate(fac.id)}
                              className={styles.activateButton}
                            >
                              Aktifkan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleInitiateDeactivate(fac)}
                              className={styles.toggleButton}
                            >
                              Nonaktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Menonaktifkan Fasilitas (Aturan 13) */}
      {isModalOpen && selectedFacility && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Konfirmasi Nonaktifkan Fasilitas</h2>
              <p>Fasilitas: <strong>{selectedFacility.name}</strong></p>
            </div>

            {checkingReservations ? (
              <div className={styles.loadingState}>Memeriksa reservasi mendatang...</div>
            ) : pendingReservations.length > 0 ? (
              /* Warning jika masih ada reservasi mendatang yang aktif */
              <div>
                <div className={styles.warningBox}>
                  <strong>Perhatian:</strong> Fasilitas ini masih memiliki{' '}
                  {pendingReservations.length} reservasi mendatang yang belum diselesaikan oleh petugas.
                </div>
                <div className={styles.reservationList}>
                  {pendingReservations.map((res) => (
                    <div key={res.id} className={styles.reservationItem}>
                      <div>
                        <strong>Pemesan:</strong> {res.user_name}
                      </div>
                      <div>
                        <strong>Waktu:</strong>{' '}
                        {new Date(res.start_time).toLocaleString('id-ID')}
                      </div>
                      <div>
                        <strong>Status:</strong> {res.status}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: '#756c92', marginTop: '12px' }}>
                  Petugas harus memproses atau membatalkan reservasi ini terlebih dahulu sebelum fasilitas dinonaktifkan.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#756c92', marginTop: '14px' }}>
                Apakah Anda yakin ingin menonaktifkan fasilitas ini? Fasilitas yang nonaktif tidak akan muncul pada pemesanan publik.
              </p>
            )}

            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFacility(null);
                }}
                className={styles.cancelModalButton}
              >
                Batal
              </button>

              {/* Tombol eksekusi hanya aktif jika tidak ada reservasi terpending */}
              <button
                onClick={confirmDeactivate}
                disabled={pendingReservations.length > 0}
                className={styles.confirmDeactivateButton}
                style={{
                  opacity: pendingReservations.length > 0 ? 0.5 : 1,
                  cursor: pendingReservations.length > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Ya, Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}