'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import styles from './buat-laporan.module.css'
import Image from 'next/image'

const facilities = [
  'Ruang Kelas A101',
  'Laboratorium Komputer 1',
  'Aula Fakultas',
  'Lapangan Basket',
]

const categories = [
  'Peralatan',
  'Listrik',
  'Kebersihan',
  'Bangunan',
  'Lainnya',
]

export default function BuatLaporanPage() {
  const [facility, setFacility] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage('')
    setSuccessMessage('')

    const selectedPhoto = event.target.files?.[0]

    if (!selectedPhoto) {
      setPhoto(null)
      setPreview('')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png']

    if (!allowedTypes.includes(selectedPhoto.type)) {
      setErrorMessage('Foto harus berformat JPG, JPEG, atau PNG.')
      event.target.value = ''
      setPhoto(null)
      setPreview('')
      return
    }

    if (selectedPhoto.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran foto maksimal 2 MB.')
      event.target.value = ''
      setPhoto(null)
      setPreview('')
      return
    }

    setPhoto(selectedPhoto)

    const reader = new FileReader()

    reader.onload = () => {
      setPreview(reader.result as string)
    }

    reader.readAsDataURL(selectedPhoto)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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

    if (description.trim().length < 10) {
      setErrorMessage('Deskripsi kerusakan minimal 10 karakter.')
      return
    }

    if (!photo) {
      setErrorMessage('Foto kerusakan wajib diunggah.')
      return
    }

    setSuccessMessage('Laporan berhasil dikirim.')
    setFacility('')
    setCategory('')
    setDescription('')
    setPhoto(null)
    setPreview('')
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>FIVORA</p>
        <h1>Laporkan Kerusakan Fasilitas</h1>
        <p className={styles.description}>
          Isi informasi kerusakan agar dapat segera diperiksa oleh petugas.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Fasilitas</span>
            <select
              value={facility}
              onChange={(event) => setFacility(event.target.value)}
            >
              <option value="">Pilih fasilitas</option>

              {facilities.map((facilityName) => (
                <option key={facilityName} value={facilityName}>
                  {facilityName}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Kategori Kerusakan</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Pilih kategori</option>

              {categories.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
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
            />
            <small>{description.trim().length} karakter</small>
          </label>

          <label className={styles.field}>
            <span>Foto Kerusakan</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handlePhotoChange}
            />
            <small>Format JPG, JPEG, atau PNG. Maksimal 2 MB.</small>
          </label>

          {preview && (
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

          <button type="submit" className={styles.submitButton}>
            Kirim Laporan
          </button>
        </form>
      </section>
    </main>
  )
}