'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const handleEmail = async () => {
    if (!email || !password) return
    setLoading(true); setMessage(null)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      if (error) setMessage({ text: error.message, ok: false })
      else setMessage({ text: 'Check your email to confirm your account!', ok: true })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ text: error.message, ok: false })
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setOauthLoading(true); setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setMessage({ text: error.message, ok: false }); setOauthLoading(false) }
  }

  const handleForgot = async () => {
    if (!email) { setMessage({ text: 'Enter your email first', ok: false }); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` })
    if (error) setMessage({ text: error.message, ok: false })
    else setMessage({ text: 'Password reset email sent!', ok: true })
  }

  const inp: React.CSSProperties = { width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, padding: '12px 14px', color: '#ccc', fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 4, background: 'linear-gradient(90deg,#e8ff47,#47c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>RECOMP</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 2, marginTop: 6 }}>AI-POWERED FITNESS TRACKER</div>
        </div>

        {/* Google Sign In */}
        <button onClick={handleGoogle} disabled={oauthLoading || loading}
          style={{ width: '100%', padding: '13px 16px', background: '#131313', border: '1px solid #2a2a2a', borderRadius: 10, cursor: oauthLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, opacity: loading ? 0.4 : 1, transition: 'all 0.2s' }}>
          {oauthLoading
            ? <div style={{ width: 16, height: 16, border: '2px solid #333', borderTop: '2px solid #4aff7a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.614z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          }
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#ccc' }}>
            {oauthLoading ? 'Signing in...' : 'Sign in with Google'}
          </span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 1 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
        </div>

        {/* Email/password tabs */}
        <div style={{ display: 'flex', marginBottom: 16, background: '#0c0c0c', borderRadius: 10, padding: 3 }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '9px 0', background: mode === m ? '#e8ff47' : 'transparent', border: 'none', borderRadius: 8, color: mode === m ? '#080808' : '#333', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s' }}>
              {m === 'login' ? 'LOG IN' : 'SIGN UP'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'signup' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inp} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={inp} onKeyDown={e => e.key === 'Enter' && handleEmail()} />
        </div>

        {mode === 'login' && (
          <button onClick={handleForgot} style={{ background: 'none', border: 'none', color: '#2a2a2a', fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: 'pointer', marginTop: 8, padding: 0 }}>
            Forgot password?
          </button>
        )}

        {message && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: message.ok ? '#0a1a0a' : '#1a0808', border: `1px solid ${message.ok ? '#1e3a1e' : '#4a1a1a'}`, borderRadius: 8, fontSize: 11, color: message.ok ? '#6aff8a' : '#ff8a6a', fontFamily: "'DM Mono', monospace" }}>
            {message.text}
          </div>
        )}

        <button onClick={handleEmail} disabled={loading || !email || !password}
          style={{ width: '100%', marginTop: 14, padding: 14, background: !email || !password ? '#141414' : '#e8ff47', border: 'none', borderRadius: 10, color: '#080808', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: !email || !password ? 'default' : 'pointer', transition: 'background 0.2s' }}>
          {loading ? '...' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
        </button>

        <div style={{ marginTop: 24, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#181818', lineHeight: 1.9 }}>
          Track food and workouts with AI<br />Natural language · Voice · Photo
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
