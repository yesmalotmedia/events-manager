'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const links = [
  { href: '/',               label: 'לוח בקרה',   icon: '◈', new: null },
  { href: '/tours',          label: 'סיורים',      icon: '🗺', new: '/tours/new' },
  { href: '/suppliers',      label: 'ספקים',       icon: '👥', new: '/suppliers/new' },
  { href: '/accounting',     label: 'חשבונאות',    icon: '💰', new: null },
]

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop — mobile only, shown while the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-screen flex flex-col z-50 w-64 transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg,#1c3054 0%,#2C4A7C 60%,#243d68 100%)' }}
      >
        <div className="px-6 py-8 shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div className="text-xl font-bold tracking-wide" style={{ color: '#B8860B' }}>מיאל</div>
            <div className="text-xs mt-1" style={{ color: '#adc5e5' }}>אומן בסמטאות • רוח צפת</div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-2xl leading-none"
            style={{ color: '#adc5e5' }}
            aria-label="סגור תפריט"
          >
            ✕
          </button>
        </div>

        <div className="mx-6 h-px shrink-0" style={{ background: 'linear-gradient(90deg,transparent,#B8860B,transparent)' }} />

        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {links.map(link => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <div key={link.href} className="flex items-center gap-1">
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                  style={active ? { background: '#B8860B', color: '#1c3054' } : { color: '#d5e2f2' }}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
                {link.new && (
                  <Link
                    href={link.new}
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all shrink-0"
                    style={{ color: '#B8860B', border: '1px solid rgba(184,134,11,0.4)' }}
                    title={`חדש`}
                  >
                    +
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        <div className="px-3 pb-4 shrink-0 space-y-2">
          <Link href="/book" target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full"
            style={{ color: '#B8860B', border: '1px solid rgba(184,134,11,0.3)' }}>
            <span>🔗</span>
            קישור ללקוח
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-right"
            style={{ color: '#adc5e5' }}
          >
            <span>🚪</span>
            יציאה
          </button>
        </div>

        <div className="px-6 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-xs" style={{ color: '#7aa3d4' }}>גרסה 1.0</div>
        </div>
      </aside>
    </>
  )
}
