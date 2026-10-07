'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    if (res?.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('מייל או סיסמא שגויים')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F0E8' }}>
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: '#2C4A7C' }}>
            <span className="text-2xl">🎵</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#2C4A7C' }}>רוח צפת</h1>
          <p className="text-stone-500 text-sm mt-1">מיאל אומן — ניהול סיורים</p>
        </div>

        <div className="card p-8 space-y-5">
          <h2 className="font-semibold text-stone-800 text-center">כניסה למערכת</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">מייל</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">סיסמא</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white transition-colors"
              style={{ background: loading ? '#B8A48A' : '#2C4A7C' }}
            >
              {loading ? 'נכנס...' : 'כניסה'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
