// app/admin/fasilitas/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../../adminFasilitas.module.css';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditFacilityPage({ params }: EditPageProps) {
  const resolvedParams = use(params);
  const facilityId = resolvedParams.id;

  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [type, setType] = useState('Ruang Kelas');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('aktif');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Data Fasilitas Berdasarkan ID
  useEffect(() => {
    async function fetchFacility() {
      setLoading(true);
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', facilityId)
        .single();

      if (error || !data) {
        setErrorMessage('Gagal mengambil data fasilitas.');
      } else {
        setName(data.name || '');
        setType(data.type || 'Ruang Kelas');
        setLocation(data.location || '');
        setCapacity(data.capacity !== null ? data.capacity : '');
        setDescription(data.description || '');
        setStatus(data.status || 'aktif');
      }
      setLoading(false);
    }

    fetchFacility();
  }, [facilityId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama fasilitas wajib diisi.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('facilities')
      .update({
        name,
        type,
        location,
        capacity: capacity === '' ? null : Number(capacity),
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facilityId);

    if (error) {
      console.error('Error updating facility:', error);
      setErrorMessage('Gagal memperbarui fasilitas: ' + error.message);
      setSubmitting(false);
    } else {
      router.push('/admin/fasilitas');
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Memuat data fasilitas...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Tombol Kembali */}
      <Link href="/admin/fasilitas" className={styles.editButton} style={{ display: 'inline-block', marginBottom: '20px' }}>
        ← Kembali ke Kelola Fasilitas
      </Link>

      <div className={styles.tableCard} style={{ maxWidth: '640px', padding: '28px' }}>
        <div className={styles.modalHeader}>
          <h2>Edit Data Fasilitas</h2>
          <p>Ubah rincian informasi data master fasilitas #{facilityId}.</p>
        </div>

        {errorMessage && <div className={styles.warningBox}>{errorMessage}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Nama Fasilitas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#21164f' }}>
              Nama Fasilitas <span style={{ color: '#c53c50' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid #ddd6f1',
                outline: 'none',
                fontSize: '12px',
              }}
            />
          </div>

          {/* Tipe Fasilitas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#21164f' }}>Tipe Fasilitas</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid #ddd6f1',
                outline: 'none',
                fontSize: '12px',
                background: '#fff',
              }}
            >
              <option value="Ruang Kelas">Ruang Kelas</option>
              <option value="Aula">Aula</option>
              <option value="Laboratorium">Laboratorium</option>
              <option value="Alat">Alat</option>
              <option value="Lapangan">Lapangan</option>
            </select>
          </div>

          {/* Lokasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#21164f' }}>Lokasi</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid #ddd6f1',
                outline: 'none',
                fontSize: '12px',
              }}
            />
          </div>

          {/* Kapasitas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#21164f' }}>Kapasitas (Orang)</label>
            <input
              type="number"
              min="0"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid #ddd6f1',
                outline: 'none',
                fontSize: '12px',
              }}
            />
          </div>

          {/* Deskripsi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#21164f' }}>Deskripsi / Fasilitas Pendukung</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #ddd6f1',
                outline: 'none',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#21164f' }}>Status Fasilitas</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid #ddd6f1',
                outline: 'none',
                fontSize: '12px',
                background: '#fff',
              }}
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="dalam_perbaikan">Dalam Perbaikan</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className={styles.modalActions} style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => router.push('/admin/fasilitas')}
              className={styles.cancelModalButton}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={styles.createButton}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Memperbarui...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}