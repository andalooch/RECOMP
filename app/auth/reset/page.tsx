'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts the token in the URL hash — onAuthStateChange picks it up
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password || password !== confirm) {
      setMessage({ text: "Passwords don't match.", ok: false })
      return
    }
    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', ok: false })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMessage({ text: error.message, ok: false })
    else {
      setMessage({ text: 'Password updated! Redirecting...', ok: true })
      setTimeout(() => { window.location.href = '/' }, 1500)
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#0a0a0a', border: '1px solid #222',
    borderRadius: 8, padding: '13px 14px', color: '#ccc',
    fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none',
    boxSizing: 'border-box'
  }

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&family=DM+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, letterSpacing: 5, background: 'linear-gradient(90deg,#e8ff47,#47c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>RECOMP</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 2.5, marginTop: 4 }}>RESET PASSWORD</div>
        </div>

        {!ready ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 20, height: 20, border: '2px solid #1e1e1e', borderTop: '2px solid #e8ff47', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }}/>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#2a2a2a' }}>Verifying reset link...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" type="password" style={inp}/>
            <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" type="password" onKeyDown={e => e.key === 'Enter' && handleReset()} style={{ ...inp, marginBottom: 6 }}/>

            {message && (
              <div style={{ padding: '10px 12px', background: message.ok ? '#0a1a0a' : '#1a0a0a', border: `1px solid ${message.ok ? '#1a3a1a' : '#3a1a1a'}`, borderRadius: 8, fontFamily: "'DM Mono',monospace", fontSize: 10, color: message.ok ? '#4aff7a' : '#ff6b6b' }}>
                {message.text}
              </div>
            )}

            <button onClick={handleReset} disabled={loading || !password || !confirm} style={{ padding: '14px', background: loading || !password || !confirm ? '#141414' : '#e8ff47', border: 'none', borderRadius: 10, color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2.5, cursor: loading || !password || !confirm ? 'default' : 'pointer' }}>
              {loading ? 'UPDATING...' : 'SET NEW PASSWORD'}
            </button>

            <button onClick={() => { window.location.href = '/auth' }} style={{ background: 'none', border: 'none', color: '#2a2a2a', fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer', marginTop: 4 }}>← Back to login</button>
          </div>
        )}
      </div>
    </div>
  )
}

