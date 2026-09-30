import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import sharp from 'sharp'

import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const MAX_DESCRIPTION_LENGTH = 5000
const BUCKET = 'report-photos'

const CATEGORIES = new Set([
  'peralatan',
  'listrik',
  'kebersihan',
  'bangunan',
  'lainnya',
])

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return fail('Silakan login terlebih dahulu.', 401)
    }

    if (
      currentUser.role !== 'pengguna' ||
      currentUser.status !== 'aktif'
    ) {
      return fail(
        'Hanya akun pengguna aktif yang dapat mengirim laporan.',
        403
      )
    }

    let formData: FormData

    try {
      formData = await request.formData()
    } catch {
      return fail('Data formulir tidak dapat dibaca.', 400)
    }

    const facilityValue = formData.get('facility_id')
    const categoryValue = formData.get('category')
    const descriptionValue = formData.get('description')
    const photo = formData.get('photo')

    if (
      typeof facilityValue !== 'string' ||
      !/^[1-9]\d{0,18}$/.test(facilityValue) ||
      BigInt(facilityValue) > BigInt('9223372036854775807')
    ) {
      return fail('Pilih fasilitas yang valid.', 400)
    }

    if (
      typeof categoryValue !== 'string' ||
      !CATEGORIES.has(categoryValue)
    ) {
      return fail('Pilih kategori kerusakan yang valid.', 400)
    }

    if (typeof descriptionValue !== 'string') {
      return fail('Deskripsi kerusakan wajib diisi.', 400)
    }

    const description = descriptionValue.trim()

    if (
      description.length < 10 ||
      description.length > MAX_DESCRIPTION_LENGTH
    ) {
      return fail(
        'Deskripsi kerusakan harus berisi 10–5000 karakter.',
        400
      )
    }

    if (!(photo instanceof File) || photo.size === 0) {
      return fail('Foto kerusakan wajib diunggah.', 400)
    }

    if (!['image/jpeg', 'image/png'].includes(photo.type)) {
      return fail('Foto harus berformat JPG, JPEG, atau PNG.', 400)
    }

    if (photo.size > MAX_PHOTO_SIZE) {
      return fail('Ukuran foto maksimal 2 MB.', 400)
    }

    const supabase = await createClient()

    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', facilityValue)
      .maybeSingle()

    if (facilityError) {
      console.error('Gagal memeriksa fasilitas:', facilityError)
      return fail('Fasilitas belum dapat diperiksa. Coba lagi.', 500)
    }

    if (!facility) {
      return fail('Fasilitas tidak ditemukan.', 400)
    }

    let imageBuffer: Buffer
    let extension: string
    let contentType: string

    try {
      const inputBuffer = Buffer.from(await photo.arrayBuffer())

      const image = sharp(inputBuffer, {
        limitInputPixels: 25_000_000,
      })

      const metadata = await image.metadata()

      if (
        metadata.format !== 'jpeg' &&
        metadata.format !== 'png'
      ) {
        return fail('Isi file harus berupa gambar JPG atau PNG.', 400)
      }

      if (
        (metadata.format === 'jpeg' && photo.type !== 'image/jpeg') ||
        (metadata.format === 'png' && photo.type !== 'image/png')
      ) {
        return fail('Format foto tidak sesuai dengan isi file.', 400)
      }

      if ((metadata.pages ?? 1) > 1) {
        return fail('Gunakan foto biasa, bukan gambar animasi.', 400)
      }

      if (metadata.format === 'jpeg') {
        imageBuffer = await image.rotate().jpeg({ quality: 90 }).toBuffer()
        extension = 'jpg'
        contentType = 'image/jpeg'
      } else {
        imageBuffer = await image.rotate().png().toBuffer()
        extension = 'png'
        contentType = 'image/png'
      }
    } catch {
      return fail(
        'Foto tidak dapat dibaca atau resolusinya terlalu besar. Gunakan foto lain dengan maksimal 25 megapiksel.',
        400
      )
    }

    if (imageBuffer.length > MAX_PHOTO_SIZE) {
      return fail(
        'Ukuran foto setelah diproses melebihi 2 MB. Perkecil foto lalu coba lagi.',
        400
      )
    }

    const photoPath =
      `${currentUser.id}/${randomUUID()}.${extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(photoPath, imageBuffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Gagal mengunggah foto laporan:', uploadError)
      return fail(
        'Foto gagal diunggah. Laporan belum tersimpan. Coba lagi.',
        500
      )
    }

    const { error: insertError } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id: currentUser.id,
        facility_id: facilityValue,
        category: categoryValue,
        description,
        photo_path: photoPath,
        status: 'baru',
      })

    if (insertError) {
      console.error('Gagal menyimpan laporan:', insertError)

      const { error: cleanupError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([photoPath])

      if (cleanupError) {
        console.error('Gagal membersihkan foto laporan:', cleanupError)
      }

      return fail('Laporan gagal disimpan. Silakan coba lagi.', 500)
    }

    return NextResponse.json(
      { message: 'Laporan berhasil dikirim.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Kesalahan pengiriman laporan:', error)
    return fail('Terjadi kesalahan saat mengirim laporan.', 500)
  }
}