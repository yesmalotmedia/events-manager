'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NewTourButton() {
  const pathname = usePathname()
  // הצג רק בעמודי סיורים
  if (!pathname.startsWith('/tours')) return null

  return (
    <Link
      href="/tours/new"
      className="fixed bottom-6 right-4 md:bottom-8 md:right-72 z-40 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg transition-all hover:scale-105"
      style={{ background: '#B8860B' }}
    >
      <span className="text-lg leading-none">+</span>
      סיור חדש
    </Link>
  )
}
