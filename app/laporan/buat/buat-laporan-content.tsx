'use client'

import FivoraLogo from '@/components/branding/fivora-logo'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  FileText,
  ArrowUpRight,
  Building2,
  Check,
  Droplets,
  Ellipsis,
  ImagePlus,
  Wrench,
  Zap,
} from 'lucide-react'

import FacilityPicker from '@/components/reports/facility-picker'
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
  { value: 'peralatan', label: 'Peralatan', icon: Wrench },
  { value: 'listrik', label: 'Listrik', icon: Zap },
  { value: 'kebersihan', label: 'Kebersihan', icon: Droplets },
  { value: 'bangunan', label: 'Bangunan', icon: Building2 },
  { value: 'lainnya', label: 'Lainnya', icon: Ellipsis },
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

  function removePhoto() {
    setPhoto(null)
    setPreview('')
    setErrorMessage('')
    setSuccessMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
        'Deskripsi kerusakan harus berisi 10 sampai 5000 karakter.'
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

  const formUnavailable =
    Boolean(facilitiesError) || facilities.length === 0

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.navigation}>
          <Link href="/" className={styles.brand}>
            <FivoraLogo />
          </Link>

          <Link href="/laporan" className={styles.historyButton}>
  <FileText size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>Riwayat laporan</span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </header>

        <div className={styles.workspace}>
          <section className={styles.introduction}>
            <p className={styles.eyebrow}>
              LAYANAN FASILITAS KAMPUS
            </p>

            <h1>
              Ada yang perlu
              <br />
              <span>diperbaiki?</span>
            </h1>

            <p className={styles.introText}>
              Beri tahu kami kondisi fasilitas yang kamu temukan.
              Laporanmu membantu petugas menentukan penanganannya.
            </p>

            <div className={styles.campus}>
              <Image
                src="/wp.png"
                alt="Kawasan kampus"
                fill
                sizes="(max-width: 900px) 100vw, 460px"
                className={styles.campusImage}
              />

              <div className={styles.campusCaption}>
                <span>
                  Perkembangan penanganan dapat dilihat melalui riwayat laporan.
                </span>
              </div>
            </div>
          </section>

          <section
            className={styles.formPanel}
            aria-labelledby="report-form-title"
          >
            <div className={styles.formHeading}>
              <div>
                <p className={styles.formEyebrow}>FORM PENGAJUAN</p>
                <h2 id="report-form-title">Laporan kerusakan</h2>
              </div>

              <span className={styles.formMark} aria-hidden="true">
                <Wrench size={22} strokeWidth={1.5} />
              </span>
            </div>

            {facilitiesError && (
              <div className={styles.error} role="alert">
                {facilitiesError}
              </div>
            )}

            {!facilitiesError && facilities.length === 0 && (
              <p className={styles.empty}>
                Belum ada fasilitas yang dapat dipilih.
              </p>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <FacilityPicker
                facilities={facilities}
                value={facility}
                onChange={setFacility}
                disabled={loading || formUnavailable}
              />

              <fieldset className={styles.categoryField}>
                <legend>Kategori kerusakan</legend>

                <div className={styles.categoryOptions}>
                  {categories.map((item) => {
                    const Icon = item.icon

                    return (
                      <label
                        key={item.value}
                        className={styles.categoryOption}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={item.value}
                          checked={category === item.value}
                          onChange={() => setCategory(item.value)}
                          disabled={loading || formUnavailable}
                        />

                        <span className={styles.categoryTile}>
                          <Icon
                            size={19}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <label className={styles.field}>
                <span>Bagaimana kondisi kerusakannya?</span>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Contoh: Lampu di bagian belakang ruang A101 berkedip sejak pagi."
                  rows={4}
                  maxLength={5000}
                  disabled={loading || formUnavailable}
                  aria-describedby="description-help"
                />

                <span className={styles.fieldHelp} id="description-help">
                  <span>Minimal 10 karakter</span>
                  <span>{description.trim().length} / 5000</span>
                </span>
              </label>

              <div className={styles.photoField}>
                <p className={styles.fieldTitle}>Foto kondisi fasilitas</p>

                <label
                  className={`${styles.uploadArea} ${
                    photo ? styles.uploadFilled : ''
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handlePhotoChange}
                    disabled={loading || formUnavailable}
                    aria-label="Pilih atau ganti foto kerusakan"
                    aria-describedby="photo-help"
                  />

                  {photo && preview ? (
                    <Image
                      src={preview}
                      alt="Pratinjau foto kerusakan yang dipilih"
                      width={76}
                      height={76}
                      unoptimized
                      className={styles.photoThumbnail}
                    />
                  ) : (
                    <span className={styles.uploadIcon}>
                      <ImagePlus
                        size={24}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                  )}

                  <span className={styles.uploadText}>
                    <span className={styles.uploadTitle}>
                      {photo ? photo.name : 'Pilih foto kerusakan'}
                    </span>
                    <span id="photo-help">
                      {photo
                        ? 'Klik untuk mengganti foto'
                        : 'JPG atau PNG, maksimal 2 MB'}
                    </span>
                  </span>

                  <span className={styles.uploadAction} aria-hidden="true">
                    {photo ? <Check size={18} /> : <ArrowUpRight size={18} />}
                  </span>
                </label>

                {photo && preview && (
                  <figure className={styles.photoPreview}>
                    <figcaption className={styles.previewHeading}>
                      <span>Pratinjau foto</span>
                      <button
                        type="button"
                        className={styles.removePhoto}
                        onClick={removePhoto}
                        disabled={loading || formUnavailable}
                      >
                        Hapus foto
                      </button>
                    </figcaption>
                    <div className={styles.previewFrame}>
                      <Image
                        src={preview}
                        alt="Foto yang akan dikirim bersama laporan"
                        width={800}
                        height={600}
                        unoptimized
                        className={styles.previewPhoto}
                      />
                    </div>
                  </figure>
                )}
              </div>

              {errorMessage && (
                <div className={styles.error} role="alert">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className={styles.success} role="status">
                  <span>{successMessage}</span>
                  <Link href="/laporan">Lihat riwayat →</Link>
                </div>
              )}

              <div className={styles.formFooter}>
                <p>Semua kolom wajib diisi.</p>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading || formUnavailable}
                >
                  {loading ? 'Mengirim...' : 'Kirim laporan'}
                  <ArrowUpRight size={19} aria-hidden="true" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}