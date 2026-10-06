import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: 'Logout gagal. Silakan coba lagi.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Logout berhasil.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Logout gagal. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}