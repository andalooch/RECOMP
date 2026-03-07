'use client'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const features = [
    { icon: '⚡', title: 'AI Food Logging', body: 'Dictate your meals. Claude parses macros instantly — no barcode scanning, no databases.' },
    { icon: '🏋️', title: 'Workout Grading', body: 'Log your session and get an AI-powered grade with per-exercise coaching notes.' },
    { icon: '📉', title: 'Weight Tracking', body: 'Running log with change deltas, progress bar, and goal achievement badges.' },
    { icon: '🎯', title: 'Smart Macros', body: 'Targets calculated from your stats, goal type, and pace. Recomp, cut, or build.' },
  ]

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#ccc', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.25s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.4s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.55s ease both; }
        .cta-btn:hover { background: #f5ff70 !important; transform: translateY(-1px); }
        .cta-btn { transition: all 0.15s ease; }
        .feat-card:hover { border-color: #e8ff4733 !important; background: #0e0e0e !important; }
        .feat-card { transition: all 0.2s ease; }
        .secondary-btn:hover { border-color: #444 !important; color: #888 !important; }
        .secondary-btn { transition: all 0.15s ease; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: scrollY > 40 ? '#080808ee' : 'transparent', backdropFilter: scrollY > 40 ? 'blur(12px)' : 'none', borderBottom: scrollY > 40 ? '1px solid #111' : '1px solid transparent', transition: 'all 0.3s' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 4, background: 'linear-gradient(90deg,#e8ff47,#47c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RECOMP</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/auth" style={{ textDecoration: 'none' }}>
            <button className="secondary-btn" style={{ padding: '8px 18px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: '#555', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer', letterSpacing: 0.5 }}>LOG IN</button>
          </a>
          <a href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
            <button className="cta-btn" style={{ padding: '8px 18px', background: '#e8ff47', border: 'none', borderRadius: 8, color: '#080808', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer', fontWeight: 600, letterSpacing: 0.5 }}>START FREE</button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, #e8ff4708 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translate(-50%,-50%)', width: 400, height: 400, background: 'radial-gradient(circle, #47c8ff06 0%, transparent 70%)', pointerEvents: 'none' }}/>

        <div className="fade-up-1" style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#e8ff47', letterSpacing: 3, marginBottom: 20, textTransform: 'uppercase' as const }}>AI-powered body recomposition</div>

        <h1 className="fade-up-2" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(56px, 12vw, 96px)', letterSpacing: 6, lineHeight: 0.95, marginBottom: 24, background: 'linear-gradient(180deg, #ffffff 0%, #888888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TRACK.<br/>TRAIN.<br/>TRANSFORM.
        </h1>

        <p className="fade-up-3" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: '#444', maxWidth: 420, lineHeight: 1.7, marginBottom: 36 }}>
          Log food by talking. Grade your workouts with AI. Watch your body change one check-in at a time.
        </p>

        <div className="fade-up-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
          <a href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
            <button className="cta-btn" style={{ padding: '15px 36px', background: '#e8ff47', border: 'none', borderRadius: 10, color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 3, cursor: 'pointer' }}>GET STARTED FREE</button>
          </a>
          <a href="/auth" style={{ textDecoration: 'none' }}>
            <button className="secondary-btn" style={{ padding: '15px 36px', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 10, color: '#333', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 3, cursor: 'pointer' }}>LOG IN</button>
          </a>
        </div>

        {/* Stats strip */}
        <div className="fade-up-4" style={{ display: 'flex', gap: 40, marginTop: 64, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
          {[['AI-PARSED', 'Meals'], ['INSTANT', 'Workout grades'], ['ZERO', 'Manual entry']].map(([n, l]) => (
            <div key={n} style={{ textAlign: 'center' as const }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#e8ff47', letterSpacing: 2, lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 1, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 2, textAlign: 'center' as const, marginBottom: 48, textTransform: 'uppercase' as const }}>Everything you need</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {features.map(f => (
            <div key={f.title} className="feat-card" style={{ background: '#0a0a0a', border: '1px solid #111', borderRadius: 14, padding: '24px' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#888', letterSpacing: 2, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#333', lineHeight: 1.65 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section style={{ padding: '80px 24px 120px', textAlign: 'center' as const }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(32px, 6vw, 52px)', letterSpacing: 4, color: '#1a1a1a', marginBottom: 24 }}>READY TO RECOMP?</div>
        <a href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
          <button className="cta-btn" style={{ padding: '16px 44px', background: '#e8ff47', border: 'none', borderRadius: 10, color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 3, cursor: 'pointer' }}>START FOR FREE</button>
        </a>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#1a1a1a', marginTop: 16, letterSpacing: 1 }}>NO CREDIT CARD · NO ADS · YOUR DATA IS YOURS</div>
      </section>
    </div>
  )
}

