'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // Auto-redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = '/'
      else setCheckingSession(false)
    })
    // Listen for auth state changes (handles OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/'
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleEmail = async () => {
    if (!email || !password) return
    setLoading(true)
    setMessage(null)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      })
      if (error) setMessage({ text: error.message, ok: false })
      else setMessage({ text: 'Account created! Signing you in...', ok: true })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ text: error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message, ok: false })
      }
      // success handled by onAuthStateChange → redirect
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setMessage({ text: error.message, ok: false }); setGoogleLoading(false) }
  }

  const handleForgotPassword = async () => {
    if (!email) { setMessage({ text: 'Enter your email above first.', ok: false }); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`
    })
    if (error) setMessage({ text: error.message, ok: false })
    else setMessage({ text: 'Password reset link sent — check your email.', ok: true })
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#0a0a0a', border: '1px solid #222',
    borderRadius: 8, padding: '13px 14px', color: '#ccc',
    fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s'
  }

  if (checkingSession) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 20, height: 20, border: '2px solid #1e1e1e', borderTop: '2px solid #e8ff47', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&family=DM+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus{border-color:#333!important}`}</style>

      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, letterSpacing: 5, background: 'linear-gradient(90deg,#e8ff47,#47c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>RECOMP</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 2.5, marginTop: 4 }}>TRACK · TRAIN · TRANSFORM</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#0c0c0c', border: '1px solid #1a1a1a', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMessage(null) }} style={{ flex: 1, padding: '10px', background: mode === m ? '#1a1a1a' : 'transparent', border: 'none', borderRadius: 7, color: mode === m ? '#e8ff47' : '#2a2a2a', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s' }}>
              {m === 'login' ? 'LOG IN' : 'SIGN UP'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {mode === 'signup' && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp}/>
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" style={inp}/>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onKeyDown={e => e.key === 'Enter' && handleEmail()} style={inp}/>
        </div>

        {/* Forgot password */}
        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <button onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#333', fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer', letterSpacing: 0.5 }}>Forgot password?</button>
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{ marginBottom: 14, padding: '10px 12px', background: message.ok ? '#0a1a0a' : '#1a0a0a', border: `1px solid ${message.ok ? '#1a3a1a' : '#3a1a1a'}`, borderRadius: 8, fontFamily: "'DM Mono',monospace", fontSize: 10, color: message.ok ? '#4aff7a' : '#ff6b6b', lineHeight: 1.5 }}>
            {message.text}
          </div>
        )}

        {/* Primary CTA */}
        <button onClick={handleEmail} disabled={loading || !email || !password} style={{ width: '100%', padding: '14px', background: loading || !email || !password ? '#141414' : '#e8ff47', border: 'none', borderRadius: 10, color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2.5, cursor: loading || !email || !password ? 'default' : 'pointer', marginBottom: 12, transition: 'background 0.2s' }}>
          {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, border: '2px solid #333', borderTop: '2px solid #080808', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}/> {mode === 'login' ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}</span> : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#141414' }}/>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#1e1e1e' }}>OR</div>
          <div style={{ flex: 1, height: 1, background: '#141414' }}/>
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={googleLoading} style={{ width: '100%', padding: '13px', background: '#0c0c0c', border: '1px solid #1e1e1e', borderRadius: 10, color: '#888', fontFamily: "'DM Mono',monospace", fontSize: 12, cursor: googleLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'border-color 0.2s' }}>
          {googleLoading ? (
            <span style={{ width: 14, height: 14, border: '2px solid #333', borderTop: '2px solid #888', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}/>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          )}
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 28, fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#1a1a1a', letterSpacing: 1 }}>
          YOUR DATA IS PRIVATE · ENCRYPTED · YOURS
        </div>
      </div>
    </div>
  )
}

