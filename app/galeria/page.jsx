'use client'

import GallerySection from '@/components/sections/GallerySection'
import PageAccessGuard from '@/components/auth/PageAccessGuard'

export default function GaleriaPage() {
  return (
    <PageAccessGuard pageId="galeria">
      <div className="min-h-screen">
        <GallerySection />
      </div>
    </PageAccessGuard>
  )
}
