// app/admin/fasilitas/[id]/edit/page.tsx

'use client'

import { useEffect, useState, use } from 'react'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'

import styles from '../../adminFasilitas.module.css'

interface EditPageProps {
  params: Promise<{ id: string }>
}

const supabase = createClient()

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

/* Normalisasi status lama (versi Inggris) ke nilai kanonik */
function normalizeFacilityStatus(
  status: string | null | undefined
): string {
  if (status === 'active') return 'aktif'
  if (status === 'inactive') return 'nonaktif'
  if (status === 'under_maintenance')
    return 'dalam_perbaikan'

  return status || 'aktif'
}

export default function EditFacilityPage({
  params,
}: EditPageProps) {
  const resolvedParams = use(params)
  const facilityId = resolvedParams.id

  const router = useRouter()

  const [name, setName] = useState('')
  const [type, setType] = useState('Ruang Kelas')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('aktif')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  /* Fetch Data Fasilitas Berdasarkan ID */
  useEffect(() => {
    async function fetchFacility() {
      setLoading(true)
      setErrorMessage(null)

      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', facilityId)
        .single()

      if (error || !data) {
        console.error(
          'Error fetching facility:',
          error
        )

        setErrorMessage(
          'Gagal mengambil data fasilitas.'
        )
      } else {
        setName(data.name || '')
        setType(data.type || 'Ruang Kelas')
        setLocation(data.location || '')
        setCapacity(
          data.capacity !== null
            ? data.capacity
            : ''
        )
        setDescription(data.description || '')
        setStatus(
          normalizeFacilityStatus(data.status)
        )
      }

      setLoading(false)
    }

    fetchFacility()
  }, [facilityId])

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    setSubmitting(true)
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage(
        'Nama fasilitas wajib diisi.'
      )
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('facilities')
      .update({
        name: name.trim(),
        type,
        location: location.trim(),
        capacity:
          capacity === ''
            ? null
            : Number(capacity),
        description: description.trim(),
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facilityId)

    if (error) {
      console.error(
        'Error updating facility:',
        error
      )

      setErrorMessage(
        'Gagal memperbarui fasilitas: ' +
          error.message
      )

      setSubmitting(false)
    } else {
      router.push('/admin/fasilitas')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div
          style={formWrapperStyle}
        >
          <div className={styles.loadingState}>
            Memuat data fasilitas...
          </div>
        </div>
      </div>
    )
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

              <h2>Edit Data Fasilitas</h2>

              <p>
                Ubah rincian informasi data master
                fasilitas #{facilityId}.
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
                  style={{
                    color: '#c53c50',
                  }}
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

            {/* Status */}
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
                disabled={
                  status === 'dalam_perbaikan'
                }
                style={inputStyle}
              >
                <option value="aktif">
                  Aktif
                </option>

                <option value="nonaktif">
                  Nonaktif
                </option>

                {status === 'dalam_perbaikan' && (
                  <option value="dalam_perbaikan" disabled>
                    Dalam Perbaikan (Dikelola oleh Petugas)
                  </option>
                )}
              </select>

              {status === 'dalam_perbaikan' && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: '#b45309',
                  }}
                >
                  Status perbaikan hanya dapat diubah
                  oleh petugas melalui modul laporan.
                </p>
              )}
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
                  ? 'Memperbarui...'
                  : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}