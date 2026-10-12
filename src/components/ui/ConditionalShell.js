'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BugReportButton from './BugReportButton'

const PUBLIC_PATHS = ['/sign', '/book', '/login']

export default function ConditionalShell({ children }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isPublic) {
    return (
      <div style={{ background: '#F5F0E8', minHeight: '100vh' }}>
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar — hidden on md+, where the sidebar is always visible */}
      <div
        className="md:hidden fixed top-0 inset-x-0 h-14 flex items-center justify-between px-4 z-30"
        style={{ background: '#2C4A7C' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white text-2xl leading-none p-1"
          aria-label="פתח תפריט"
        >
          ☰
        </button>
        <div className="font-bold tracking-wide" style={{ color: '#B8860B' }}>מיאל</div>
        <BugReportButton variant="inline" />
      </div>

      <main
        className="flex-1 md:mr-64 p-4 pt-20 md:p-8 min-h-screen w-full"
        style={{ background: '#F5F0E8' }}
      >
        {children}
      </main>
      <BugReportButton />
    </div>
  )
}
