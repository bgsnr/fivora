'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import styles from './buat-laporan.module.css'

type Facility = {
  id: string
  name: string
  location: string | null
}

type Props = {
  facilities: Facility[]
  facilitiesError: string
}

const categories = [
  { value: 'peralatan', label: 'Peralatan' },
  { value: 'listrik', label: 'Listrik' },
  { value: 'kebersihan', label: 'Kebersihan' },
  { value: 'bangunan', label: 'Bangunan' },
  { value: 'lainnya', label: 'Lainnya' },
]

export default function BuatLaporanContent({
  facilities,
  facilitiesError,
}: Props) {
  const [facility, setFacility] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

    useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage('')
    setSuccessMessage('')
    setPreview('')
    setPhoto(null)

    const selectedPhoto = event.target.files?.[0]

    if (!selectedPhoto) {
      return
    }

    if (!['image/jpeg', 'image/png'].includes(selectedPhoto.type)) {
      setErrorMessage('Foto harus berformat JPG, JPEG, atau PNG.')
      event.target.value = ''
      return
    }

    if (selectedPhoto.size === 0) {
      setErrorMessage('File foto kosong. Pilih foto lain.')
      event.target.value = ''
      return
    }

    if (selectedPhoto.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran foto maksimal 2 MB.')
      event.target.value = ''
      return
    }

    setPhoto(selectedPhoto)
    setPreview(URL.createObjectURL(selectedPhoto))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    if (!facility) {
      setErrorMessage('Pilih fasilitas yang ingin dilaporkan.')
      return
    }

    if (!category) {
      setErrorMessage('Pilih kategori kerusakan.')
      return
    }

    const cleanDescription = description.trim()

    if (
      cleanDescription.length < 10 ||
      cleanDescription.length > 5000
    ) {
      setErrorMessage(
        'Deskripsi kerusakan harus berisi 10–5000 karakter.'
      )
      return
    }

    if (!photo) {
      setErrorMessage('Foto kerusakan wajib diunggah.')
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('facility_id', facility)
      formData.append('category', category)
      formData.append('description', cleanDescription)
      formData.append('photo', photo)

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)

        setErrorMessage(
          typeof result?.error === 'string'
            ? result.error
            : 'Laporan gagal dikirim. Silakan coba lagi.'
        )
        return
      }

      setSuccessMessage('Laporan berhasil dikirim.')
      setFacility('')
      setCategory('')
      setDescription('')
      setPhoto(null)
      setPreview('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      setErrorMessage(
        'Koneksi terputus. Pengiriman belum dapat dipastikan. Periksa koneksi sebelum mencoba lagi.'
      )
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const formUnavailable = Boolean(facilitiesError) || facilities.length === 0

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>FIVORA</p>

        <h1>Laporkan Kerusakan Fasilitas</h1>

        <p className={styles.description}>
          Isi informasi kerusakan agar dapat segera diperiksa oleh petugas.
        </p>

        {facilitiesError && (
          <div className={styles.error} role="alert">
            {facilitiesError}
          </div>
        )}

        {!facilitiesError && facilities.length === 0 && (
          <p>Belum ada fasilitas yang dapat dipilih.</p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Fasilitas</span>

            <select
              value={facility}
              onChange={(event) => setFacility(event.target.value)}
              disabled={loading || formUnavailable}
            >
              <option value="">Pilih fasilitas</option>

              {facilities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.location ? ` — ${item.location}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Kategori Kerusakan</span>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={loading}
            >
              <option value="">Pilih kategori</option>

              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Deskripsi Kerusakan</span>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan kondisi kerusakan yang ditemukan"
              rows={5}
              maxLength={5000}
              disabled={loading}
            />

            <small>
              {description.trim().length}/5000 karakter. Minimal 10 karakter.
            </small>
          </label>

          <label className={styles.field}>
            <span>Foto Kerusakan</span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handlePhotoChange}
              disabled={loading}
            />

            <small>Format JPG, JPEG, atau PNG. Maksimal 2 MB.</small>
          </label>

          {photo && preview && (
            <div className={styles.preview}>
              <p>Pratinjau foto</p>

              <Image
                src={preview}
                alt="Pratinjau kerusakan"
                width={800}
                height={500}
                unoptimized
              />
            </div>
          )}

          {errorMessage && (
            <div className={styles.error} role="alert">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className={styles.success} role="status">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || formUnavailable}
          >
            {loading ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </section>
    </main>
  )
}