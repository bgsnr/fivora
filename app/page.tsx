import { redirect } from 'next/navigation'
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { FacilityShowcase } from '@/components/landing/facility-showcase'
import { getLandingFacilities } from '@/lib/actions/live-data'
import { Workflow } from "@/components/landing/workflow"
import { OperatingHours } from "@/components/landing/operating-hours"
import { Footer } from "@/components/landing/footer"
import { getCurrentUser } from "@/lib/auth"

export default async function Home() {
  const user = await getCurrentUser()

   // Admin langsung ke dashboard admin
  if (user?.role === 'admin' && user.status === 'aktif') {
    redirect('/admin')
  }

  // Petugas langsung ke halaman petugas
  if (user?.role === 'petugas' && user.status === 'aktif') {
    redirect('/petugas')
  }

  const catalog = await getLandingFacilities()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      {/* Navigasi atas */}
      <Navbar
        user={
          user
            ? { name: user.name, email: user.email, role: user.role }
            : null
        }
      />

      {/* Konten landing page */}
      <main className="flex-1">
        <Hero user={user} />
        <FacilityShowcase
          facilities={catalog.success ? catalog.facilities : []}
          loadError={catalog.success ? '' : catalog.error}
        />
        <Workflow />
        <OperatingHours user={user} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}