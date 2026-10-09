'use client'

import FacilityBrandHeader from '@/components/branding/facility-brand-header'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createFacilityAdminAction, updateFacilityAdminAction } from '@/lib/actions/admin-facilities'
import { facilityTypes, validateFacilityMaster } from '@/lib/validations/facilities'
import type { Facility } from '@/types/facility'
import styles from './admin-management.module.css'

type Props = { facility?: Facility }
const typeLabels: Record<string, string> = {
  ruang_kelas: 'Ruang Kelas', aula: 'Aula', laboratorium: 'Laboratorium',
  alat: 'Peralatan', peralatan: 'Peralatan', lapangan: 'Lapangan',
}
const statusLabels: Record<string, string> = {
  aktif: 'Aktif', nonaktif: 'Nonaktif', dalam_perbaikan: 'Dalam perbaikan',
  active: 'Aktif', inactive: 'Nonaktif', under_maintenance: 'Dalam perbaikan',
}

export default function AdminFacilityForm({ facility }: Props) {
  const router = useRouter()
  const fieldId = useId()
  const submittingRef = useRef(false)
  const [name, setName] = useState(facility?.name ?? '')
  const [type, setType] = useState(facility ? facility.type ?? '' : 'Ruang Kelas')
  const [location, setLocation] = useState(facility?.location ?? '')
  const [capacity, setCapacity] = useState(facility?.capacity == null ? '' : String(facility.capacity))
  const [description, setDescription] = useState(facility?.description ?? '')
  const [initialStatus, setInitialStatus] = useState('aktif')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsReload, setNeedsReload] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const editing = !!facility
  const disabled = loading || needsReload || uncertain

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || disabled) return
    setError('')
    const input = { name, type, location, capacity, description }
    const validation = validateFacilityMaster(input)
    if (!validation.success) { setError(validation.error); return }
    submittingRef.current = true
    setLoading(true)
    try {
      const result = facility
        ? await updateFacilityAdminAction(facility.id, input, facility.updated_at ?? null)
        : await createFacilityAdminAction(input, initialStatus)
      if (!result.success) {
        setError(result.error ?? 'Perubahan gagal disimpan.')
        if (result.needsReload) {
          if (editing) setNeedsReload(true)
          else setUncertain(true)
        }
        return
      }
      setUncertain(true)
      router.push('/admin/fasilitas')
      router.refresh()
    } catch {
      setError('Hasil penyimpanan belum dapat dipastikan. Periksa daftar fasilitas sebelum mencoba lagi.')
      setUncertain(true)
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <main className={styles.formPage}>
      <FacilityBrandHeader />
      <Link href="/admin/fasilitas" className={styles.backLink}>← Kembali ke Kelola Fasilitas</Link>
      <section className={styles.formCard}>
        <header className={styles.formHeader}>
          <p className={styles.eyebrow}>DATA MASTER FASILITAS</p>
          <h1>{editing ? 'Edit Data Fasilitas' : 'Tambah Fasilitas Baru'}</h1>
          <p>{editing ? `Ubah rincian fasilitas #${facility.id}. Status dikelola dari daftar fasilitas.` : 'Isi informasi fasilitas yang akan ditambahkan.'}</p>
        </header>
        <form onSubmit={handleSubmit}>
          <fieldset className={styles.fields} disabled={disabled}>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-name`}>Nama fasilitas <span aria-hidden="true">*</span></label>
              <input id={`${fieldId}-name`} required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Ruang D201" />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-type`}>Tipe fasilitas <span aria-hidden="true">*</span></label>
              <select id={`${fieldId}-type`} required value={type} onChange={(event) => setType(event.target.value)}>
                <option value="">Pilih tipe fasilitas</option>
                {type && !facilityTypes.some((value) => value === type) && <option value={type}>{typeLabels[type] ?? `${type} (data lama)`}</option>}
                {facilityTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-location`}>Lokasi</label>
              <input id={`${fieldId}-location`} maxLength={255} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Contoh: Gedung B Lantai 2" />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-capacity`}>Kapasitas (orang)</label>
              <input id={`${fieldId}-capacity`} type="number" min={0} max={2147483647} step={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="Contoh: 40" />
              <small>Boleh dikosongkan jika tidak berlaku untuk fasilitas ini.</small>
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-description`}>Deskripsi / fasilitas pendukung</label>
              <textarea id={`${fieldId}-description`} rows={4} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Contoh: Dilengkapi proyektor, AC, dan sound system." />
            </div>
            {!editing && <div className={styles.field}>
              <label htmlFor={`${fieldId}-status`}>Status awal</label>
              <select id={`${fieldId}-status`} value={initialStatus} onChange={(event) => setInitialStatus(event.target.value)}>
                <option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option>
              </select>
            </div>}
          </fieldset>
          {facility && <div className={styles.statusInfo}>
            <span>Status fasilitas saat data dimuat</span>
            <strong>{statusLabels[facility.status] ?? 'Tidak diketahui'}</strong>
            <p>Mengedit informasi tidak mengubah status fasilitas. Aktifkan atau nonaktifkan melalui halaman Kelola Fasilitas; perbaikan ditangani petugas melalui laporan.</p>
          </div>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.formActions}>
            <Link href="/admin/fasilitas" className={styles.secondaryButton}>{uncertain ? 'Periksa daftar fasilitas' : 'Batal'}</Link>
            {needsReload ? <button type="button" className={styles.primaryButton} onClick={() => window.location.reload()}>Muat ulang halaman</button> :
              <button type="submit" className={styles.primaryButton} disabled={disabled}>{loading ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Fasilitas'}</button>}
          </div>
        </form>
      </section>
    </main>
  )
}
