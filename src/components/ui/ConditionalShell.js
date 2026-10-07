'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BugReportButton from './BugReportButton'

const PUBLIC_PATHS = ['/sign', '/book', '/login']

export default function ConditionalShell({ children }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (isPublic) {
    return (
      <div style={{ background: '#F5F0E8', minHeight: '100vh' }}>
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 p-8 min-h-screen" style={{ background: '#F5F0E8' }}>
        {children}
      </main>
      <BugReportButton />
    </div>
  )
}
