// components/facilities/DeactivateConfirmModal.tsx
'use client';

import { Facility } from '@/types/facility';

interface PendingReservation {
  id: number;
  user_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface DeactivateConfirmModalProps {
  isOpen: boolean;
  facility: Facility | null;
  pendingReservations: PendingReservation[];
  checking: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeactivateConfirmModal({
  isOpen,
  facility,
  pendingReservations,
  checking,
  onClose,
  onConfirm,
}: DeactivateConfirmModalProps) {
  if (!isOpen || !facility) return null;

  const hasPending = pendingReservations.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(39, 20, 78, 0.48)' }}>
      <div style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '26px', borderRadius: '19px', background: '#ffffff', border: '1px solid #e3daf6', boxShadow: '0 25px 80px rgba(67, 40, 130, 0.2)' }}>
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ margin: 0, color: '#21164f', fontSize: '20px', fontWeight: 800 }}>Konfirmasi Nonaktifkan Fasilitas</h2>
          <p style={{ margin: '6px 0 0', color: '#827995', fontSize: '12px' }}>
            Fasilitas: <strong>{facility.name}</strong>
          </p>
        </div>

        {checking ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#756c92', fontSize: '12px' }}>
            Memeriksa reservasi mendatang yang aktif...
          </div>
        ) : hasPending ? (
          <div>
            <div style={{ padding: '12px', borderRadius: '10px', background: '#fff1f3', border: '1px solid #efb7bf', color: '#c53c50', fontSize: '12px' }}>
              <strong>Perhatian:</strong> Fasilitas ini masih memiliki {pendingReservations.length} reservasi mendatang yang belum diselesaikan.
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {pendingReservations.map((res) => (
                <div key={res.id} style={{ padding: '10px', borderRadius: '8px', background: '#fbf9ff', border: '1px solid #eee8f7', fontSize: '11px', color: '#21164f' }}>
                  <div><strong>Pemesan:</strong> {res.user_name}</div>
                  <div><strong>Waktu:</strong> {new Date(res.start_time).toLocaleString('id-ID')}</div>
                  <div><strong>Status:</strong> {res.status}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: '#756c92', marginTop: '12px' }}>
              Petugas harus menyelesaikan atau membatalkan seluruh reservasi ini terlebih dahulu sebelum fasilitas dapat dinonaktifkan.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#756c92', marginTop: '12px' }}>
            Apakah Anda yakin ingin menonaktifkan fasilitas ini? Fasilitas yang nonaktif tidak akan ditampilkan pada katalog pemesanan publik.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ddd6f1', background: '#ffffff', color: '#756c92', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={hasPending || checking}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '0',
              background: '#c53c50',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: hasPending || checking ? 'not-allowed' : 'pointer',
              opacity: hasPending || checking ? 0.5 : 1,
            }}
          >
            Ya, Nonaktifkan
          </button>
        </div>
      </div>
    </div>
  );
}