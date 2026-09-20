import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { FacilityShowcase } from "@/components/landing/facility-showcase"
import { Features } from "@/components/landing/features"
import { Workflow } from "@/components/landing/workflow"
import { OperatingHours } from "@/components/landing/operating-hours"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero />
        <FacilityShowcase />
        <Features />
        <Workflow />
        <OperatingHours />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
