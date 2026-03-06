'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const todayStr = () => new Date().toISOString().slice(0, 10)

type Profile = { id: string; name: string; cal_goal: number; protein_goal: number; carbs_goal: number; fat_goal: number; weight_lb: number; goal_weight_lb: number; age: number }
type FoodItem = { id: string; meal: string; name: string; calories: number; protein: number; carbs: number; fat: number; portion_note?: string }
type Exercise = { id: string; name: string; sets: { weight: string; reps: string }[] }
type WorkoutSession = { id: string; workout_name: string; rating: number; cals_burned: number; analysis: string; exercises: Exercise[] }
type WeightLog = { logged_date: string; weight_lb: number }

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min((value / goal) * 100, 100)
  const over = value > goal
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: 10, marginBottom: 3 }}>
        <span style={{ color: over ? '#ff6b6b' : '#555', letterSpacing: 1 }}>{label.toUpperCase()}</span>
        <span style={{ color: over ? '#ff6b6b' : color }}>{value}<span style={{ color: '#252525' }}>/{goal}{label === 'Cal' ? '' : 'g'}</span></span>
      </div>
      <div style={{ background: '#141414', borderRadius: 3, height: 5 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: over ? '#ff6b6b' : color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function muscleColor(n: string) {
  n = (n || '').toLowerCase()
  if (n.includes('press') || n.includes('delt') || n.includes('shoulder') || n.includes('lateral') || n.includes('raise')) return '#ff9f47'
  if (n.includes('pull') || n.includes('row') || n.includes('back') || n.includes('lat')) return '#47c8ff'
  if (n.includes('chest') || n.includes('fly') || n.includes('pec') || n.includes('incline') || n.includes('bench')) return '#c447ff'
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('deadlift')) return '#ff6b6b'
  if (n.includes('curl') || n.includes('bicep')) return '#e8ff47'
  if (n.includes('tricep') || n.includes('skull') || n.includes('overhead') || n.includes('extension') || n.includes('dip')) return '#aaffaa'
  return '#888'
}

function muscleGroup(n: string) {
  n = (n || '').toLowerCase()
  if (n.includes('incline') || n.includes('bench') || n.includes('chest') || n.includes('pec') || n.includes('fly')) return 'Chest'
  if (n.includes('delt') || n.includes('shoulder') || n.includes('lateral') || n.includes('raise')) return 'Shoulders'
  if (n.includes('press') && !n.includes('bench') && !n.includes('incline')) return 'Shoulders'
  if (n.includes('pull') || n.includes('row') || n.includes('back') || n.includes('lat')) return 'Back'
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('deadlift')) return 'Legs'
  if (n.includes('curl') || n.includes('bicep')) return 'Biceps'
  if (n.includes('tricep') || n.includes('skull') || n.includes('overhead') || n.includes('extension') || n.includes('dip')) return 'Triceps'
  return 'Other'
}

function ManualFoodModal({ meal, onAdd, onClose }: { meal: string; onAdd: (f: Omit<FoodItem, 'id'>) => void; onClose: () => void }) {
  const [f, setF] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const s: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #202020', borderRadius: 6, padding: '8px 10px', color: '#ccc', fontFamily: "'DM Mono',monospace", fontSize: 12, width: '100%', outline: 'none' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0c0c0c', border: '1px solid #1e1e1e', borderRadius: 16, padding: 24, width: 320 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#e8ff47', letterSpacing: 2, marginBottom: 14 }}>ADD TO {meal.toUpperCase()}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Food name *" style={s} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['Calories *', 'calories'], ['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fat (g)', 'fat']].map(([p, k]) => (
              <input key={k} value={(f as any)[k]} onChange={e => setF(prev => ({ ...prev, [k]: e.target.value }))} placeholder={p} type="number" style={s} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 9, background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 7, color: '#444', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer' }}>CANCEL</button>
          <button onClick={() => { if (f.name && f.calories) { onAdd({ meal, name: f.name, calories: +f.calories, protein: +f.protein || 0, carbs: +f.carbs || 0, fat: +f.fat || 0 }); onClose() } }}
            style={{ flex: 2, padding: 9, background: '#e8ff47', border: 'none', borderRadius: 7, color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1.5, cursor: 'pointer' }}>ADD</button>
        </div>
      </div>
    </div>
  )
}

function WeightModal({ current, onSave, onClose }: { current: number; onSave: (w: number) => void; onClose: () => void }) {
  const [val, setVal] = useState(String(current))
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0c0c0c', border: '1px solid #1e1e1e', borderRadius: 16, padding: 24, width: 280 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#e8ff47', letterSpacing: 2, marginBottom: 14 }}>LOG WEIGHT</div>
        <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="Weight (lbs)"
          style={{ width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, padding: '12px 14px', color: '#ccc', fontFamily: "'DM Mono',monospace", fontSize: 16, outline: 'none', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 9, background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 7, color: '#444', fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: 'pointer' }}>CANCEL</button>
          <button onClick={() => { if (val) { onSave(+val); onClose() } }}
            style={{ flex: 2, padding: 9, background: '#e8ff47', border: 'none', borderRadius: 7, color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1.5, cursor: 'pointer' }}>SAVE</button>
        </div>
      </div>
    </div>
  )
}

export default function TrackerPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState<'food' | 'workout' | 'progress'>('food')
  const [activeDate, setActiveDate] = useState(todayStr())
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatStatus, setChatStatus] = useState<{ type: 'ok' | 'err' | 'loading'; text: string } | null>(null)
  const [manualMeal, setManualMeal] = useState<string | null>(null)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      if (!s) router.push('/auth')
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load profile
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
    }
    load()
  }, [])

  // Load day data
  const loadDay = useCallback(async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: food }, { data: sessions }] = await Promise.all([
      supabase.from('food_logs').select('*').eq('user_id', user.id).eq('logged_date', date),
      supabase.from('workout_sessions').select('*, exercises(*)').eq('user_id', user.id).eq('logged_date', date),
    ])

    setFoodItems(food || [])
    if (sessions && sessions.length > 0) {
      const s = sessions[0]
      setSession({ id: s.id, workout_name: s.workout_name, rating: s.rating, cals_burned: s.cals_burned, analysis: s.analysis, exercises: s.exercises || [] })
    } else {
      setSession(null)
    }
  }, [])

  // Load weight history
  const loadWeights = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_date', { ascending: true }).limit(60)
    setWeightLogs(data || [])
  }, [])

  useEffect(() => { loadDay(activeDate) }, [activeDate, loadDay])
  useEffect(() => { if (tab === 'progress') loadWeights() }, [tab, loadWeights])

  const shiftDate = (dir: number) => {
    const d = new Date(activeDate + 'T12:00:00')
    d.setDate(d.getDate() + dir)
    setActiveDate(d.toISOString().slice(0, 10))
  }

  const isToday = activeDate === todayStr()
  const dateLabel = () => new Date(activeDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  // Totals
  const totals = foodItems.reduce((a, f) => ({ calories: a.calories + f.calories, protein: a.protein + f.protein, carbs: a.carbs + f.carbs, fat: a.fat + f.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  const goals = { calories: profile?.cal_goal || 2800, protein: profile?.protein_goal || 215, carbs: profile?.carbs_goal || 270, fat: profile?.fat_goal || 75 }
  const calLeft = goals.calories - totals.calories

  // Add food manually
  const addFoodManual = async (item: Omit<FoodItem, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('food_logs').insert({ user_id: user.id, logged_date: activeDate, ...item }).select().single()
    if (data) { setFoodItems(prev => [...prev, data]); showToast(`✓ ${item.name} added`) }
  }

  const removeFood = async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id)
    setFoodItems(prev => prev.filter(f => f.id !== id))
  }

  // Log weight
  const logWeight = async (weight: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('weight_logs').upsert({ user_id: user.id, logged_date: activeDate, weight_lb: weight })
    if (profile) { await supabase.from('profiles').update({ weight_lb: weight }).eq('id', user.id); setProfile(p => p ? { ...p, weight_lb: weight } : p) }
    loadWeights()
    showToast(`✓ ${weight}lb logged`)
  }

  // AI parse & log
  const handleChat = async () => {
    if (!chatInput.trim() || chatStatus?.type === 'loading') return
    const msg = chatInput.trim()
    setChatInput('')
    setChatStatus({ type: 'loading', text: 'Analyzing…' })

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: msg, userGoals: goals }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Parse failed')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      if (result.type === 'food') {
        const items = result.items || []
        const inserts = items.map((item: any) => ({ user_id: user.id, logged_date: activeDate, meal: result.meal || 'Snacks', name: item.name, calories: item.calories, protein: item.protein || 0, carbs: item.carbs || 0, fat: item.fat || 0, portion_note: item.portionNote }))
        const { data } = await supabase.from('food_logs').insert(inserts).select()
        if (data) setFoodItems(prev => [...prev, ...data])
        setChatStatus({ type: 'ok', text: result.summary || `✓ ${items.length} items logged` })
        setTab('food')
      } else if (result.type === 'workout') {
        const { data: sess } = await supabase.from('workout_sessions').insert({ user_id: user.id, logged_date: activeDate, workout_name: result.workoutName, rating: result.rating, cals_burned: result.calsBurned, analysis: result.analysis }).select().single()
        if (sess && result.exercises?.length) {
          const exInserts = result.exercises.map((ex: any) => ({ session_id: sess.id, user_id: user.id, name: ex.name, sets: ex.sets || [] }))
          const { data: exData } = await supabase.from('exercises').insert(exInserts).select()
          setSession({ id: sess.id, workout_name: sess.workout_name, rating: sess.rating, cals_burned: sess.cals_burned, analysis: sess.analysis, exercises: exData || [] })
        }
        setChatStatus({ type: 'ok', text: result.summary || '✓ Workout logged' })
        setTab('workout')
      }
    } catch (e: any) {
      setChatStatus({ type: 'err', text: e.message || 'Error' })
    }
    setTimeout(() => setChatStatus(null), 7000)
    inputRef.current?.focus()
  }

  const byMuscle: Record<string, Exercise[]> = {}
  ;(session?.exercises || []).forEach(ex => { const g = muscleGroup(ex.name); if (!byMuscle[g]) byMuscle[g] = []; byMuscle[g].push(ex) })

  const signOut = async () => { await supabase.auth.signOut(); router.push('/auth') }

  if (!profile) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#e8ff47', letterSpacing: 4 }}>LOADING...</div>
    </div>
  )

  return (
    <div style={{ background: '#080808', minHeight: '100vh', maxWidth: 480, margin: '0 auto', color: '#eee', fontFamily: "'DM Sans',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#e8ff47', color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 2, padding: '7px 18px', borderRadius: 30, zIndex: 400, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Manual modals */}
      {manualMeal && <ManualFoodModal meal={manualMeal} onAdd={addFoodManual} onClose={() => setManualMeal(null)} />}
      {showWeightModal && <WeightModal current={profile.weight_lb} onSave={logWeight} onClose={() => setShowWeightModal(false)} />}

      {/* Header */}
      <div style={{ background: '#080808', borderBottom: '1px solid #0f0f0f', padding: '16px 14px 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 3, background: 'linear-gradient(90deg,#e8ff47,#47c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>RECOMP</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#2a2a2a', letterSpacing: 1.5, marginTop: 1 }}>
              {profile.weight_lb}lb → {profile.goal_weight_lb}lb
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[[totals.calories, 'CAL', '#e8ff47'], [`${totals.protein}g`, 'PRO', '#47c8ff'], [session?.exercises?.length || 0, 'EX', '#ff9f47'], [session?.cals_burned || '—', 'BURN', '#ff6b6b']].map(([v, l, c]: any) => (
              <div key={l} style={{ background: '#0c0c0c', border: '1px solid #141414', borderRadius: 7, padding: '5px 7px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#2a2a2a', letterSpacing: 0.5 }}>{l}</div>
              </div>
            ))}
            <button onClick={signOut} title="Sign out" style={{ background: '#0c0c0c', border: '1px solid #141414', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', color: '#2a2a2a', fontSize: 13 }}>↩</button>
          </div>
        </div>

        {/* Date nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => shiftDate(-1)} style={{ background: 'none', border: '1px solid #181818', borderRadius: 5, color: '#3a3a3a', cursor: 'pointer', padding: '3px 10px', fontSize: 14 }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>{dateLabel()}</div>
            {isToday && <div style={{ fontSize: 8, color: '#e8ff47', fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}>TODAY</div>}
          </div>
          <button onClick={() => shiftDate(1)} disabled={isToday} style={{ background: 'none', border: '1px solid #181818', borderRadius: 5, color: isToday ? '#181818' : '#3a3a3a', cursor: isToday ? 'default' : 'pointer', padding: '3px 10px', fontSize: 14 }}>›</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {[['food', '🍽 NUTRITION', '#e8ff47'], ['workout', '💪 TRAINING', '#47c8ff'], ['progress', '📈 PROGRESS', '#4aff7a']].map(([key, label, color]: any) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${color}` : '2px solid transparent', color: tab === key ? color : '#2a2a2a', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: 1.5, padding: '7px 0 9px', cursor: 'pointer', transition: 'all 0.2s' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: 12, paddingBottom: tab === 'food' ? 130 : 40 }}>

        {/* ── NUTRITION TAB ── */}
        {tab === 'food' && (
          <>
            <div style={{ margin: '0 14px 12px', background: '#0c0c0c', border: '1px solid #181818', borderRadius: 14, padding: '13px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1.5 }}>TODAY'S MACROS</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: calLeft < 0 ? '#ff6b6b' : '#e8ff47', lineHeight: 1 }}>{Math.abs(calLeft)}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3a3a3a', letterSpacing: 1 }}>{calLeft < 0 ? 'OVER' : 'CAL LEFT'}</div>
                </div>
              </div>
              <MacroBar label="Cal" value={totals.calories} goal={goals.calories} color="#e8ff47" />
              <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="#47c8ff" />
              <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color="#ff9f47" />
              <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color="#c447ff" />
            </div>

            {MEALS.map(meal => {
              const foods = foodItems.filter(f => f.meal === meal)
              const mc = foods.reduce((s, f) => s + f.calories, 0)
              const mp = foods.reduce((s, f) => s + f.protein, 0)
              return (
                <div key={meal} style={{ margin: '0 14px 9px', background: '#0c0c0c', border: '1px solid #181818', borderRadius: 11, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px 8px' }}>
                    <div>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, color: '#bbb' }}>{meal.toUpperCase()}</span>
                      {foods.length > 0 && <span style={{ marginLeft: 7, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#333' }}>{mc} kcal · {mp}g pro</span>}
                    </div>
                    <button onClick={() => setManualMeal(meal)} style={{ background: '#141414', border: '1px solid #222', borderRadius: 5, color: '#444', fontFamily: "'DM Mono',monospace", fontSize: 10, padding: '3px 9px', cursor: 'pointer' }}>+ manual</button>
                  </div>
                  {foods.length === 0
                    ? <div style={{ padding: '2px 13px 10px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#1a1a1a' }}>Type below ↓ to log with AI</div>
                    : <div style={{ borderTop: '1px solid #111' }}>
                      {foods.map(f => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 13px', borderBottom: '1px solid #0e0e0e' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#333', marginTop: 2 }}>
                              <span style={{ color: '#e8ff47' }}>{f.calories}cal</span>
                              {f.protein > 0 && <span> · <span style={{ color: '#47c8ff' }}>{f.protein}p</span></span>}
                              {f.carbs > 0 && <span> · <span style={{ color: '#ff9f47' }}>{f.carbs}c</span></span>}
                              {f.fat > 0 && <span> · <span style={{ color: '#c447ff' }}>{f.fat}f</span></span>}
                              {f.portion_note && <span style={{ color: '#2a3a2a' }}> · ~est</span>}
                            </div>
                          </div>
                          <button onClick={() => removeFood(f.id)} style={{ background: 'none', border: 'none', color: '#222', cursor: 'pointer', fontSize: 15, padding: '0 3px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  }
                </div>
              )
            })}

            <div style={{ margin: '8px 14px 0', background: '#0c0c0c', border: '1px solid #181818', borderRadius: 10, padding: '10px 13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center' }}>
                {[['CAL', totals.calories, '#e8ff47'], ['PRO', `${totals.protein}g`, '#47c8ff'], ['CARB', `${totals.carbs}g`, '#ff9f47'], ['FAT', `${totals.fat}g`, '#c447ff']].map(([l, v, c]) => (
                  <div key={l}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: c, lineHeight: 1 }}>{v}</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#2a2a2a', letterSpacing: 0.5, marginTop: 2 }}>{l}</div></div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TRAINING TAB ── */}
        {tab === 'workout' && (
          <>
            <div style={{ margin: '0 14px 12px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {[['EX', session?.exercises?.length || 0, '#47c8ff'], ['SETS', (session?.exercises || []).reduce((s, e) => s + e.sets.length, 0), '#ff9f47'], ['VOL', (() => { const v = (session?.exercises || []).reduce((s, e) => s + e.sets.reduce((s2, set) => s2 + (set.weight === 'BW' ? 208 : +set.weight || 0) * (+set.reps || 0), 0), 0); return v > 0 ? `${Math.round(v / 1000)}k` : '0' })(), '#c447ff'], ['BURN', session?.cals_burned || '—', '#ff6b6b']].map(([l, v, c]: any) => (
                <div key={l} style={{ background: '#0c0c0c', border: '1px solid #181818', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: c, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#2a2a2a', letterSpacing: 0.5, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            {session?.analysis && (
              <div style={{ margin: '0 14px 12px', background: '#0c0c0c', border: '1px solid #1a2e1a', borderRadius: 14, padding: '13px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#4aff7a', letterSpacing: 2 }}>⚡ {(session.workout_name || 'WORKOUT').toUpperCase()}</div>
                  {session.rating && <div style={{ background: '#111', borderRadius: 6, padding: '3px 10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#e8ff47' }}>{session.rating}/10</div>}
                </div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7 }}>{session.analysis}</div>
                {session.cals_burned > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, background: '#111', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: '#ff6b6b', lineHeight: 1 }}>{session.cals_burned}</div>
                    <div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>EST. CALORIES BURNED</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#2a2a2a' }}>resistance training</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!session && (
              <div style={{ margin: '0 14px 12px', background: '#0c0c0c', border: '1px dashed #181818', borderRadius: 12, padding: '30px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#1e1e1e', letterSpacing: 2, marginBottom: 8 }}>NO WORKOUT LOGGED</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#222', lineHeight: 1.8 }}>Type your workout below ↓<br />e.g. "bench 4x8 @ 185, rows 3x12 @ 120"</div>
              </div>
            )}

            {Object.entries(byMuscle).map(([group, exercises]) => (
              <div key={group} style={{ margin: '0 14px 10px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#333', letterSpacing: 2, marginBottom: 5, paddingLeft: 2 }}>{group.toUpperCase()}</div>
                {exercises.map(w => {
                  const sets = w.sets || []
                  const vol = sets.reduce((s, set) => s + (set.weight === 'BW' ? 208 : +set.weight || 0) * (+set.reps || 0), 0)
                  const nonBW = sets.filter(s => s.weight !== 'BW')
                  const maxW = nonBW.length > 0 ? Math.max(...nonBW.map(s => +s.weight || 0)) : 'BW'
                  return (
                    <div key={w.id} style={{ marginBottom: 7, background: '#0c0c0c', border: '1px solid #181818', borderRadius: 11, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px 7px', borderBottom: '1px solid #111' }}>
                        <div style={{ width: 3, height: 14, background: muscleColor(w.name), borderRadius: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1.5, color: '#bbb' }}>{w.name.toUpperCase()}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#2e2e2e', marginTop: 1 }}>{sets.length} sets · max {maxW}{maxW !== 'BW' ? 'lb' : ''} · {vol.toLocaleString()} vol</div>
                        </div>
                      </div>
                      <div style={{ padding: '5px 13px 9px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr 1fr 1fr', gap: 3, marginBottom: 3 }}>
                          {['', 'WEIGHT', 'REPS', 'VOL'].map((h, i) => (<div key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#2a2a2a', letterSpacing: 1 }}>{h}</div>))}
                        </div>
                        {sets.map((set, i) => {
                          const w2 = set.weight === 'BW' ? 208 : (+set.weight || 0)
                          const sv = w2 * (+set.reps || 0)
                          return (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 1fr 1fr', gap: 3, padding: '3px 0', borderTop: '1px solid #0e0e0e' }}>
                              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#2a2a2a' }}>{i + 1}</div>
                              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#999' }}>{set.weight}{set.weight !== 'BW' ? 'lb' : ''}</div>
                              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#999' }}>{set.reps}</div>
                              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#3a3a3a' }}>{sv > 0 ? sv.toLocaleString() : '—'}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}

        {/* ── PROGRESS TAB ── */}
        {tab === 'progress' && (
          <div style={{ padding: '0 14px' }}>
            {/* Weight card */}
            <div style={{ background: '#0c0c0c', border: '1px solid #181818', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1.5 }}>CURRENT WEIGHT</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#e8ff47', lineHeight: 1 }}>{profile.weight_lb}<span style={{ fontSize: 14, color: '#333', marginLeft: 4 }}>lb</span></div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#2a2a2a', marginTop: 2 }}>Goal: {profile.goal_weight_lb}lb · {(profile.weight_lb - profile.goal_weight_lb).toFixed(1)}lb to go</div>
                </div>
                <button onClick={() => setShowWeightModal(true)}
                  style={{ background: '#e8ff47', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#080808', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 1.5, cursor: 'pointer' }}>
                  LOG TODAY
                </button>
              </div>

              {weightLogs.length > 1 && (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={weightLogs.map(w => ({ date: w.logged_date.slice(5), weight: w.weight_lb }))}>
                    <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#333', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ background: '#0c0c0c', border: '1px solid #222', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 11 }} labelStyle={{ color: '#555' }} itemStyle={{ color: '#e8ff47' }} />
                    <Line type="monotone" dataKey="weight" stroke="#e8ff47" strokeWidth={2} dot={{ fill: '#e8ff47', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {weightLogs.length <= 1 && (
                <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#1a1a1a' }}>Log your weight daily to see your progress chart</div>
              )}
            </div>

            {/* Weekly summary */}
            <div style={{ background: '#0c0c0c', border: '1px solid #181818', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1.5, marginBottom: 10 }}>THIS WEEK AT A GLANCE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[
                  ['AVG CAL', `${Math.round(totals.calories)}`, '#e8ff47'],
                  ['AVG PRO', `${Math.round(totals.protein)}g`, '#47c8ff'],
                  ['WORKOUTS', session ? '1+' : '0', '#4aff7a'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: '#111', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: c, lineHeight: 1 }}>{v}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#2a2a2a', letterSpacing: 0.5, marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro goals */}
            <div style={{ background: '#0c0c0c', border: '1px solid #181818', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1.5, marginBottom: 10 }}>DAILY TARGETS</div>
              <MacroBar label="Cal" value={totals.calories} goal={goals.calories} color="#e8ff47" />
              <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="#47c8ff" />
              <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color="#ff9f47" />
              <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color="#c447ff" />
            </div>
          </div>
        )}
      </div>

      {/* Chat bar — only on food/workout tabs */}
      {(tab === 'food' || tab === 'workout') && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 50, background: 'linear-gradient(transparent, #080808 28%)', padding: '16px 14px 14px' }}>
          {chatStatus && (
            <div style={{ marginBottom: 8, background: chatStatus.type === 'ok' ? '#0a1a0a' : chatStatus.type === 'err' ? '#1a0808' : '#080a1a', border: `1px solid ${chatStatus.type === 'ok' ? '#1e3a1e' : chatStatus.type === 'err' ? '#4a1a1a' : '#1a1a4a'}`, borderRadius: 10, padding: '9px 13px', fontSize: 11, color: chatStatus.type === 'ok' ? '#6aff8a' : chatStatus.type === 'err' ? '#ff8a6a' : '#6a8aff', fontFamily: "'DM Mono',monospace", lineHeight: 1.5, wordBreak: 'break-word' }}>
              {chatStatus.text}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#0e0e0e', border: '1px solid #222', borderRadius: 16, padding: '10px 10px 10px 14px', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>
            <textarea ref={inputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat() } }}
              placeholder={tab === 'food' ? '"4 eggs 3 egg whites mission low carb wrap"' : '"bench 4x8 @ 185, rows 3x12 @ 120"'}
              disabled={chatStatus?.type === 'loading'} rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#bbb', fontFamily: "'DM Sans',sans-serif", fontSize: 12, resize: 'none', lineHeight: 1.5, maxHeight: 90, overflowY: 'auto' }} />
            <button onClick={handleChat} disabled={chatStatus?.type === 'loading' || !chatInput.trim()}
              style={{ background: chatStatus?.type === 'loading' ? '#1a1a1a' : !chatInput.trim() ? '#141414' : '#e8ff47', border: 'none', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
              {chatStatus?.type === 'loading'
                ? <div style={{ width: 14, height: 14, border: '2px solid #333', borderTop: '2px solid #aaa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={chatInput.trim() ? '#080808' : '#333'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
