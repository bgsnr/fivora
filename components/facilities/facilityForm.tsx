'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  CreateFacilityInput,
  Facility,
} from '@/types/facility'

interface FacilityFormProps {
  initialValues?: Facility
  onSubmit: (data: CreateFacilityInput) => Promise<void>
  isEdit?: boolean
}

export default function FacilityForm({
  initialValues,
  onSubmit,
  isEdit = false,
}: FacilityFormProps) {
  const router = useRouter()

  const [name, setName] = useState(
    initialValues?.name || ''
  )

  const [type, setType] = useState(
    initialValues?.type || 'Ruang Kelas'
  )

  const [location, setLocation] = useState(
    initialValues?.location || ''
  )

  const [capacity, setCapacity] = useState<number | ''>(
    initialValues?.capacity ?? ''
  )

  const [description, setDescription] = useState(
    initialValues?.description || ''
  )

  const [status, setStatus] = useState(
    initialValues?.status || 'aktif'
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    setError(null)

    if (!name.trim()) {
      setError('Nama fasilitas tidak boleh kosong.')
      setSubmitting(false)
      return
    }

    try {
      await onSubmit({
        name,
        type,
        location,
        capacity: capacity === '' ? null : Number(capacity),
        description,
        status,
      })
    } catch (err: any) {
      setError(
        err.message || 'Gagal menyimpan data fasilitas.'
      )
      setSubmitting(false)
    }
  }

  const inputStyle = {
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #D8DFEA',
    outline: 'none',
    fontSize: '12px',
    color: '#010736',
    background: '#FFFFFF',
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#010736',
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {error && (
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: '#FFF1F3',
            border: '1px solid #EFB7BF',
            color: '#C53C50',
            fontSize: '12px',
          }}
        >
          {error}
        </div>
      )}

      {/* Nama Fasilitas */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <label style={labelStyle}>
          Nama Fasilitas{' '}
          <span style={{ color: '#C53C50' }}>
            *
          </span>
        </label>

        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Ruang D201 / Lapangan Basket"
          style={inputStyle}
        />
      </div>

      {/* Tipe Fasilitas */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <label style={labelStyle}>
          Tipe Fasilitas
        </label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
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
          <option value="Alat">
            Alat
          </option>
          <option value="Lapangan">
            Lapangan
          </option>
        </select>
      </div>

      {/* Lokasi */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <label style={labelStyle}>
          Lokasi
        </label>

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Contoh: Gedung B Lantai 2"
          style={inputStyle}
        />
      </div>

      {/* Kapasitas */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <label style={labelStyle}>
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
                : Number(e.target.value)
            )
          }
          placeholder="Contoh: 40"
          style={inputStyle}
        />
      </div>

      {/* Deskripsi */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <label style={labelStyle}>
          Deskripsi
        </label>

        <textarea
          rows={3}
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Fasilitas pendukung, misal: Proyektor, Sound System, AC..."
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid #D8DFEA',
            outline: 'none',
            fontSize: '12px',
            fontFamily: 'inherit',
            color: '#010736',
            background: '#FFFFFF',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Status */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <label style={labelStyle}>
          Status Fasilitas
        </label>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as any)
          }
          style={inputStyle}
        >
          <option value="aktif">
            Aktif
          </option>

          <option value="nonaktif">
            Nonaktif
          </option>

          {isEdit && (
            <option value="dalam_perbaikan">
              Dalam Perbaikan
            </option>
          )}
        </select>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '12px',
        }}
      >
        <button
          type="button"
          onClick={() =>
            router.push('/admin/fasilitas')
          }
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #D8DFEA',
            background: '#FFFFFF',
            color: '#52627D',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '0',
            background: '#010736',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: '700',
            cursor: submitting
              ? 'not-allowed'
              : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting
            ? 'Menyimpan...'
            : isEdit
              ? 'Simpan Perubahan'
              : 'Tambah Fasilitas'}
        </button>
      </div>
    </form>
  )
}