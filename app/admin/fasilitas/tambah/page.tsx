// app/admin/fasilitas/tambah/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../adminFasilitas.module.css';

export default function CreateFacilityPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [type, setType] = useState('Ruang Kelas');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('aktif');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    // Validasi Sederhana
    if (!name.trim()) {
      setErrorMessage('Nama fasilitas wajib diisi.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('facilities').insert([
      {
        name,
        type,
        location,
        capacity: capacity === '' ? null : Number(capacity),
        description,
        status,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error creating facility:', error);
      setErrorMessage('Gagal menambahkan fasilitas: ' + error.message);
      setSubmitting(false);
    } else {
      router.push('/admin/fasilitas');
      router.refresh();
    }
  };

  return (
    <div className={styles.container}>
      {/* Tombol Kembali */}
      <Link href="/admin/fasilitas" className={styles.editButton} style={{ display: 'inline-block', marginBottom: '20px' }}>
        ← Kembali ke Kelola Fasilitas
      </Link>

      <div className={styles.tableCard} style={{ maxWidth: '640px', padding: '28px' }}>
        <div className={styles.modalHeader}>
          <h2>Tambah Fasilitas Baru</h2>
          <p>Isi formulir di bawah ini untuk menambahkan data master fasilitas kampus.</p>
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
              placeholder="Contoh: Ruang D201, Lapangan Basket"
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
              placeholder="Contoh: Gedung B Lantai 2"
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
              placeholder="Contoh: 40"
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
              placeholder="Contoh: Dilengkapi dengan Proyektor, AC, dan Sound System."
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

          {/* Status Awal */}
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
              {submitting ? 'Menyimpan...' : 'Simpan Fasilitas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}