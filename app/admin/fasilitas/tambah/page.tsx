'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'

import styles from '../adminFasilitas.module.css'

const formWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '680px',
  margin: '0 auto',
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: '18px',
}

const formStyle: React.CSSProperties = {
  marginTop: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '17px',
}

const fieldWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#010736',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '42px',
  padding: '0 14px',
  borderRadius: '999px',
  border: '1px solid #d8dfea',
  outline: 'none',
  fontSize: '12px',
  background: '#ffffff',
  color: '#010736',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '16px',
  border: '1px solid #d8dfea',
  outline: 'none',
  fontSize: '12px',
  background: '#ffffff',
  color: '#010736',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  resize: 'vertical',
  minHeight: '95px',
}

const submitRowStyle: React.CSSProperties = {
  marginTop: '8px',
  paddingTop: '18px',
  borderTop: '1px solid #e7ebf1',
}

export default function CreateFacilityPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [type, setType] = useState('Ruang Kelas')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('aktif')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    setSubmitting(true)
    setErrorMessage(null)

    // Validasi sederhana
    if (!name.trim()) {
      setErrorMessage(
        'Nama fasilitas wajib diisi.'
      )
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('facilities')
      .insert([
        {
          name: name.trim(),
          type,
          location: location.trim(),
          capacity:
            capacity === ''
              ? null
              : Number(capacity),
          description: description.trim(),
          status,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) {
      console.error(
        'Error creating facility:',
        error
      )

      setErrorMessage(
        'Gagal menambahkan fasilitas: ' +
          error.message
      )

      setSubmitting(false)
    } else {
      router.push('/admin/fasilitas')
      router.refresh()
    }
  }

  return (
    <div className={styles.container}>
      {/* Wrapper Form Tengah */}
      <div
        style={formWrapperStyle}
      >
        {/* Tombol Kembali */}
        <Link
          href="/admin/fasilitas"
          className={styles.editButton}
          style={backLinkStyle}
        >
          ← Kembali ke Kelola Fasilitas
        </Link>

        {/* Form Card */}
        <div
          className={styles.tableCard}
          style={{
            width: '100%',
            padding: '30px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div>
              <p className={styles.eyebrow}>
                DATA MASTER FASILITAS
              </p>

              <h2>Tambah Fasilitas Baru</h2>

              <p>
                Isi formulir di bawah ini untuk
                menambahkan data master fasilitas kampus.
              </p>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className={styles.warningBox}>
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={formStyle}
          >
            {/* Nama Fasilitas */}
            <div
              style={fieldWrapperStyle}
            >
              <label
                style={fieldLabelStyle}
              >
                Nama Fasilitas{' '}
                <span
                  style={{ color: '#c53c50' }}
                >
                  *
                </span>
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Contoh: Ruang D201, Lapangan Basket"
                style={inputStyle}
              />
            </div>

            {/* Tipe Fasilitas */}
            <div
              style={fieldWrapperStyle}
            >
              <label
                style={fieldLabelStyle}
              >
                Tipe Fasilitas
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value)
                }
                style={inputStyle}
              >
                <option value="Ruang Kelas">
                  Ruang Kelas
                </option>

                <option value="Aula">
                  Aula
                </option>

                <option value="Laboratorium">
                  Laboratorium
                </option>

                <option value="Peralatan">
                  Peralatan
                </option>

                <option value="Lapangan">
                  Lapangan
                </option>
              </select>
            </div>

            {/* Lokasi */}
            <div
              style={fieldWrapperStyle}
            >
              <label
                style={fieldLabelStyle}
              >
                Lokasi
              </label>

              <input
                type="text"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                placeholder="Contoh: Gedung B Lantai 2"
                style={inputStyle}
              />
            </div>

            {/* Kapasitas */}
            <div
              style={fieldWrapperStyle}
            >
              <label
                style={fieldLabelStyle}
              >
                Kapasitas (Orang)
              </label>

              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) =>
                  setCapacity(
                    e.target.value === ''
                      ? ''
                      : Number(
                          e.target.value
                        )
                  )
                }
                placeholder="Contoh: 40"
                style={inputStyle}
              />
            </div>

            {/* Deskripsi */}
            <div
              style={fieldWrapperStyle}
            >
              <label
                style={fieldLabelStyle}
              >
                Deskripsi / Fasilitas Pendukung
              </label>

              <textarea
                rows={4}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Contoh: Dilengkapi dengan Proyektor, AC, dan Sound System."
                style={textareaStyle}
              />
            </div>

            {/* Status Awal */}
            <div
              style={fieldWrapperStyle}
            >
              <label
                style={fieldLabelStyle}
              >
                Status Fasilitas
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                style={inputStyle}
              >
                <option value="aktif">
                  Aktif
                </option>

                <option value="nonaktif">
                  Nonaktif
                </option>
              </select>
            </div>

            {/* Submit Button */}
            <div
              className={styles.modalActions}
              style={submitRowStyle}
            >
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/fasilitas'
                  )
                }
                className={
                  styles.cancelModalButton
                }
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={
                  styles.createButton
                }
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {submitting
                  ? 'Menyimpan...'
                  : 'Simpan Fasilitas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}