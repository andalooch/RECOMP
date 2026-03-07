'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const MACRO_GOAL = { calories: 2800, protein: 215, carbs: 270, fat: 75 }
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

function todayKey() {
  const d = new Date(); d.setHours(12,0,0,0); return d.toISOString().slice(0,10)
}
function getPast7Days() {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-i)
    days.push(d.toISOString().slice(0,10))
  }
  return days
}
const WEEK = getPast7Days()

// ── Types ─────────────────────────────────────────────────────────────────
interface FoodItem { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; meal: string; logged_date: string; rating?: number; ai_analysis?: string }
interface Exercise { id: string; name: string; type: string; sets?: {weight:string;reps:string}[]; duration?: number; intensity?: string; calories?: number; notes?: string; location?: string; grade?: number; grade_note?: string }
interface WorkoutSession { id: string; workout_name: string; rating?: number; cals_burned?: number; analysis?: string; logged_date: string; exercises: Exercise[]; exercise_grades?: {name:string;score:number;note:string}[] }
interface SavedMeal { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; rating?: number }

// ── Helpers ───────────────────────────────────────────────────────────────
function getActivityType(name: string) {
  const n = (name||'').toLowerCase()
  const strengthKw = ['dumbbell','barbell','cable','hammer strength','machine','press','curl','extension','pulldown','pull down','pushdown','squat','lunge','deadlift','rdl','romanian','hip thrust','fly','flye','raise','face pull','dip','crunch','plank','ab ','abs','lat pull','chest','bench','incline','decline','seated','single arm','life fitness row','high row','low row','t-bar','cable row','db row','dumbbell row']
  if (strengthKw.some(k => n.includes(k))) return 'strength'
  if (n.includes('cycling')||n.includes('bike')||n.includes('spin')||n.includes('peloton')) return 'cycling'
  if (n.includes('hotworx')||n.includes('hot yoga')||n.includes('infrared')||n.includes('isometric')) return 'hotworx'
  if (n.includes('yoga')||n.includes('vinyasa')||n.includes('yin yoga')) return 'yoga'
  if (n.includes('pilates')) return 'pilates'
  if (n.includes('treadmill')||n.includes('jogging')||(n.includes('run')&&!n.includes('romanian'))) return 'run'
  if (n==='walk'||n.includes('walking')||n.includes('hike')) return 'walk'
  if (n.includes('swim')) return 'swim'
  if (n.includes('hiit')||n.includes('circuit')||n.includes('bootcamp')) return 'hiit'
  if (n==='rowing machine'||n.includes('rowing machine')) return 'rowing'
  if (n.includes('elliptical')||n.includes('stair climber')) return 'cardio_machine'
  if (n.includes('stretch')||n.includes('mobility')||n.includes('foam roll')) return 'mobility'
  return 'strength'
}
function activityIcon(type: string) {
  return ({cycling:'🚴',yoga:'🧘',run:'🏃',walk:'🚶',swim:'🏊',hiit:'⚡',pilates:'🤸',hotworx:'🔥',class:'🎯',rowing:'🚣',cardio_machine:'⚙️',mobility:'🙆',strength:'💪'} as any)[type]||'💪'
}
function activityAccentColor(type: string) {
  return ({cycling:'#47c8ff',yoga:'#c447ff',run:'#ff9f47',walk:'#4aff7a',swim:'#47c8ff',hiit:'#ff6b6b',pilates:'#c447ff',hotworx:'#ff6b6b',class:'#e8ff47',rowing:'#47c8ff',cardio_machine:'#ff9f47',mobility:'#4aff7a',strength:'#888'} as any)[type]||'#888'
}
function isCardioType(type: string) {
  return ['cycling','yoga','run','walk','swim','hiit','pilates','hotworx','class','rowing','cardio_machine','mobility'].includes(type)
}
function muscleColor(n: string) {
  n=(n||'').toLowerCase()
  if(n.includes('press')||n.includes('shoulder')||n.includes('lateral')||n.includes('raise'))return'#ff9f47'
  if(n.includes('pull')||n.includes('row')||n.includes('back')||n.includes('lat')||n.includes('deadlift')||n.includes('face pull'))return'#47c8ff'
  if(n.includes('chest')||n.includes('fly')||n.includes('pec')||n.includes('incline')||n.includes('bench'))return'#c447ff'
  if(n.includes('squat')||n.includes('leg')||n.includes('lunge')||n.includes('calf'))return'#ff6b6b'
  if(n.includes('curl')||n.includes('bicep'))return'#e8ff47'
  if(n.includes('tricep')||n.includes('skull')||n.includes('overhead')||n.includes('extension')||n.includes('rope')||n.includes('dip'))return'#aaffaa'
  return'#888'
}
function ratingColor(score?: number) {
  return !score?'#555':score>=8?'#4aff7a':score>=6?'#e8ff47':score>=4?'#ff9f47':'#ff6b6b'
}

// ── Macro Bar ─────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, color }: { label:string; value:number; goal:number; color:string }) {
  const pct = Math.min((value/goal)*100, 100), over = value > goal
  return (
    <div style={{marginBottom:9}}>
      <div style={{display:'flex',justifyContent:'space-between',fontFamily:"'DM Mono',monospace",fontSize:10,marginBottom:3}}>
        <span style={{color:over?'#ff6b6b':'#555',letterSpacing:1}}>{label.toUpperCase()}</span>
        <span style={{color:over?'#ff6b6b':color}}>{value}<span style={{color:'#252525'}}>/{goal}{label==='Cal'?'':'g'}</span></span>
      </div>
      <div style={{background:'#141414',borderRadius:3,height:5}}>
        <div style={{width:`${pct}%`,height:'100%',background:over?'#ff6b6b':color,borderRadius:3,transition:'width 0.5s'}}/>
      </div>
    </div>
  )
}

// ── Manual Add Modal ──────────────────────────────────────────────────────
function ManualModal({ meal, onAdd, onClose }: { meal:string; onAdd:(f:any)=>void; onClose:()=>void }) {
  const [f,setF] = useState({name:'',calories:'',protein:'',carbs:'',fat:''})
  const s: React.CSSProperties = {background:'#0a0a0a',border:'1px solid #202020',borderRadius:6,padding:'8px 10px',color:'#ccc',fontFamily:"'DM Mono',monospace",fontSize:12,width:'100%',outline:'none',boxSizing:'border-box'}
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.93)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,backdropFilter:'blur(8px)'}}>
      <div style={{background:'#0c0c0c',border:'1px solid #1e1e1e',borderRadius:16,padding:24,width:320}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:'#e8ff47',letterSpacing:2,marginBottom:14}}>ADD TO {meal.toUpperCase()}</div>
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="Food name *" style={s}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {[['Calories *','calories'],['Protein (g)','protein'],['Carbs (g)','carbs'],['Fat (g)','fat']].map(([p,k])=>(
              <input key={k} value={(f as any)[k]} onChange={e=>setF(prev=>({...prev,[k]:e.target.value}))} placeholder={p} type="number" style={s}/>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:14}}>
          <button onClick={onClose} style={{flex:1,padding:9,background:'transparent',border:'1px solid #1e1e1e',borderRadius:7,color:'#444',fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>CANCEL</button>
          <button onClick={()=>{if(f.name&&f.calories){onAdd({name:f.name,calories:+f.calories,protein:+f.protein||0,carbs:+f.carbs||0,fat:+f.fat||0});onClose();}}}
            style={{flex:2,padding:9,background:'#e8ff47',border:'none',borderRadius:7,color:'#080808',fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:1.5,cursor:'pointer'}}>ADD</button>
        </div>
      </div>
    </div>
  )
}

// ── Meal Rating Modal ─────────────────────────────────────────────────────
function MealRatingModal({ meal, onClose, onRated, forceRefresh }: { meal:any; onClose:()=>void; onRated:(r:{score:number;notes:string;itemScores:any[]})=>void; forceRefresh?:boolean }) {
  const [result, setResult] = useState<{mealScore:number;mealNotes:string;items:{name:string;score:number;note:string}[]}|null>(
    (!forceRefresh && meal.rating) ? {mealScore:meal.rating, mealNotes:meal.ai_analysis||'', items:meal.itemScores||[]} : null
  )
  const [loading, setLoading] = useState(forceRefresh || !meal.rating)

  useEffect(()=>{
    if (!forceRefresh && meal.rating) return
    const go = async () => {
      setLoading(true)
      setResult(null)
      try {
        const res = await fetch('/api/rate-meal', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ items: meal.items, mealName: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, goals: MACRO_GOAL })
        })
        const data = await res.json()
        setResult(data)
      } catch {
        setResult({ mealScore: 5, mealNotes: 'Unable to rate at this time.', items: [] })
      }
      setLoading(false)
    }
    go()
  }, [forceRefresh])

  const handleDone = () => {
    if (result) onRated({ score: result.mealScore, notes: result.mealNotes, itemScores: result.items })
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,backdropFilter:'blur(10px)'}}>
      <div style={{background:'#0c0c0c',border:'1px solid #1e1e1e',borderRadius:16,padding:24,width:340,maxWidth:'94vw',maxHeight:'85vh',overflowY:'auto'}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:'#e8ff47',letterSpacing:2,marginBottom:4}}>{meal.name.toUpperCase()} RATING</div>
        {loading ? (
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{width:24,height:24,border:'2px solid #1e1e1e',borderTop:'2px solid #e8ff47',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 12px'}}/>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'#333'}}>Rating each item...</div>
          </div>
        ) : result ? (
          <>
            {/* Per-item scores */}
            {result.items && result.items.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#2a2a2a',letterSpacing:1.5,marginBottom:8}}>ITEM BREAKDOWN</div>
                {result.items.map((item, i) => (
                  <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid #0e0e0e'}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:ratingColor(item.score),lineHeight:1,minWidth:28,textAlign:'center'}}>{item.score}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:'#888',fontWeight:600,marginBottom:2}}>{item.name}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#3a3a3a',lineHeight:1.5}}>{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Meal summary score */}
            <div style={{background:'#0a0f0a',border:'1px solid #1a3a1a',borderRadius:10,padding:'14px',textAlign:'center',marginBottom:14}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#2a2a2a',letterSpacing:1.5,marginBottom:4}}>MEAL SCORE</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:56,color:ratingColor(result.mealScore),lineHeight:1}}>{result.mealScore}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#2a2a2a',letterSpacing:1}}>/10</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'#444',lineHeight:1.6,marginTop:10,textAlign:'left'}}>{result.mealNotes}</div>
            </div>
          </>
        ) : null}
        <button onClick={handleDone} style={{width:'100%',padding:12,background:'#e8ff47',border:'none',borderRadius:10,color:'#080808',fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:2,cursor:'pointer'}}>DONE</button>
      </div>
    </div>
  )
}

// ── Activity Card ─────────────────────────────────────────────────────────
function ActivityCard({ w, onRemove, onSaveSets }: { w:Exercise; onRemove?:()=>void; onSaveSets?:(id:string, sets:{weight:string;reps:string}[])=>Promise<void> }) {
  const aType = w.type && w.type!=='strength' ? w.type : getActivityType(w.name)
  const isCardio = isCardioType(aType)
  const accentColor = isCardio ? activityAccentColor(aType) : muscleColor(w.name)
  const icon = activityIcon(aType)

  // For cardio stored via manual add, fields may be in sets[0]
  const cardioData = isCardio ? (w.sets?.[0] as any)||{} : {}
  const duration = w.duration || cardioData.duration
  const intensity = w.intensity || cardioData.intensity
  const calories = w.calories || cardioData.calories
  const notes = w.notes || cardioData.notes
  const location = w.location || cardioData.location

  if (isCardio) {
    const cd = (w.sets&&w.sets[0]) ? w.sets[0] as any : {}
    const dur = w.duration || cd.duration
    const inten = w.intensity || cd.intensity
    const cal = w.calories || cd.calories
    const loc = w.location || cd.location
    const note = w.notes || cd.notes
    return (
      <div style={{marginBottom:7,background:'#0c0c0c',border:`1px solid ${accentColor}22`,borderLeft:`3px solid ${accentColor}`,borderRadius:11,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 13px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:22,lineHeight:1}}>{icon}</div>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:1.5,color:'#bbb'}}>{w.name.toUpperCase()}</div>
              <div style={{display:'flex',gap:6,marginTop:5,flexWrap:'wrap'}}>
                {dur&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:accentColor,background:accentColor+'18',padding:'2px 7px',borderRadius:4}}>{dur} min</span>}
                {inten&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#555',background:'#141414',padding:'2px 7px',borderRadius:4}}>{inten}</span>}
                {cal&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#ff6b6b',background:'#ff6b6b15',padding:'2px 7px',borderRadius:4}}>{cal} cal</span>}
                {loc&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#333',background:'#111',padding:'2px 7px',borderRadius:4}}>{loc}</span>}
              </div>
              {note&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#2a2a2a',marginTop:5,lineHeight:1.5}}>{note}</div>}
            </div>
          </div>
          {onRemove&&<button onClick={onRemove} style={{background:'none',border:'none',color:'#222',cursor:'pointer',fontSize:14,padding:'0 3px',flexShrink:0}}>x</button>}
        </div>
      </div>
    )
  }

  const sets = w.sets||[]
  const [editSets, setEditSets] = useState(sets.map(s=>({weight:s.weight||'',reps:s.reps||''})))
  const [dirty, setDirty] = useState(false)

  const vol = editSets.reduce((s,set)=>{const w2=set.weight==='BW'?208:(+set.weight||0);return s+w2*(+set.reps||0);},0)
  const nonBW = editSets.filter(s=>s.weight!=='BW')
  const maxW = nonBW.length>0 ? Math.max(...nonBW.map(s=>+s.weight||0)) : 'BW'

  const updateSet = (i:number, field:'weight'|'reps', val:string) => {
    setEditSets(prev=>prev.map((s,j)=>j===i?{...s,[field]:val}:s))
    setDirty(true)
  }
  const addSet = () => {
    const last = editSets[editSets.length-1]
    setEditSets(prev=>[...prev,{weight:last?.weight||'',reps:last?.reps||''}])
    setDirty(true)
  }
  const removeSet = (i:number) => {
    setEditSets(prev=>prev.filter((_,j)=>j!==i))
    setDirty(true)
  }
  const saveEdits = async () => {
    if (onSaveSets) await onSaveSets(w.id, editSets)
    setDirty(false)
  }

  const iStyle: React.CSSProperties = {background:'transparent',border:'none',color:'#999',fontFamily:"'DM Mono',monospace",fontSize:11,width:'100%',outline:'none',padding:'1px 2px'}

  return (
    <div style={{marginBottom:7,background:'#0c0c0c',border:`1px solid ${dirty?'#2a2a1a':'#181818'}`,borderRadius:11,overflow:'hidden',transition:'border-color 0.2s'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 13px 7px',borderBottom:'1px solid #111'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:3,height:14,background:accentColor,borderRadius:2}}/>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1.5,color:'#bbb'}}>{w.name.toUpperCase()}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'#2e2e2e',marginTop:1}}>{editSets.length} sets · max {maxW}{maxW!=='BW'?'lb':''} · {vol.toLocaleString()} vol</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {w.grade && (
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:ratingColor(w.grade),lineHeight:1}}>{w.grade}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:'#2a2a2a',letterSpacing:0.5}}>/10</div>
            </div>
          )}
          {dirty && <button onClick={saveEdits} style={{background:'#e8ff4718',border:'1px solid #e8ff4744',borderRadius:4,color:'#e8ff47',fontFamily:"'DM Mono',monospace",fontSize:8,padding:'2px 7px',cursor:'pointer'}}>SAVE</button>}
          {onRemove&&<button onClick={onRemove} style={{background:'none',border:'none',color:'#222',cursor:'pointer',fontSize:14,padding:'0 3px'}}>x</button>}
        </div>
      </div>
      <div style={{padding:'5px 13px 9px'}}>
        <div style={{display:'grid',gridTemplateColumns:'18px 1fr 1fr 1fr 20px',gap:3,marginBottom:3}}>
          {['','WEIGHT','REPS','VOL',''].map((h,i)=>(<div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'#2a2a2a',letterSpacing:1}}>{h}</div>))}
        </div>
        {editSets.map((set,i)=>{
          const w2=set.weight==='BW'?208:(+set.weight||0)
          const sv=w2*(+set.reps||0)
          return (
            <div key={i} style={{display:'grid',gridTemplateColumns:'18px 1fr 1fr 1fr 20px',gap:3,padding:'3px 0',borderTop:'1px solid #0e0e0e',alignItems:'center'}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:'#2a2a2a'}}>{i+1}</div>
              <div style={{background:'#0a0a0a',borderRadius:4,border:'1px solid #141414',padding:'2px 4px'}}>
                <input value={set.weight} onChange={e=>updateSet(i,'weight',e.target.value)} style={iStyle} placeholder="wt"/>
              </div>
              <div style={{background:'#0a0a0a',borderRadius:4,border:'1px solid #141414',padding:'2px 4px'}}>
                <input value={set.reps} onChange={e=>updateSet(i,'reps',e.target.value)} type="number" style={iStyle} placeholder="reps"/>
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'#3a3a3a'}}>{sv>0?sv.toLocaleString():'—'}</div>
              <button onClick={()=>removeSet(i)} style={{background:'none',border:'none',color:'#1e1e1e',cursor:'pointer',fontSize:12,padding:0,lineHeight:1}}>x</button>
            </div>
          )
        })}
        <button onClick={addSet} style={{marginTop:6,background:'transparent',border:'1px solid #141414',borderRadius:4,color:'#2a2a2a',fontFamily:"'DM Mono',monospace",fontSize:8,padding:'3px 10px',cursor:'pointer',letterSpacing:0.5}}>+ SET</button>
        {w.grade_note && (
          <div style={{marginTop:8,padding:'7px 9px',background:'#0a0f0a',border:'1px solid #1a2a1a',borderRadius:6,fontFamily:"'DM Mono',monospace",fontSize:9,color:'#3a5a3a',lineHeight:1.5}}>{w.grade_note}</div>
        )}
      </div>
    </div>
  )
}

// ── Food Tab ──────────────────────────────────────────────────────────────
function FoodTab({ foods, activeDate, userId, onRefresh }: { foods:FoodItem[]; activeDate:string; userId:string; onRefresh:()=>void }) {
  const [modal, setModal] = useState<string|null>(null)
  const [ratingMeal, setRatingMeal] = useState<any|null>(null)
  const [forceRefresh, setForceRefresh] = useState(false)

  const openRating = (mealData: any, isReRate: boolean) => {
    setRatingMeal(mealData)
    setForceRefresh(isReRate)
  }

  const dayFoods = foods.filter(f => f.logged_date === activeDate)
  const meals = MEAL_SLOTS.reduce((a,m) => ({...a,[m]:dayFoods.filter(f=>f.meal===m)}), {} as Record<string,FoodItem[]>)
  const totals = dayFoods.reduce((a,f)=>({calories:a.calories+f.calories,protein:a.protein+(+f.protein||0),carbs:a.carbs+(+f.carbs||0),fat:a.fat+(+f.fat||0)}),{calories:0,protein:0,carbs:0,fat:0})
  const calLeft = MACRO_GOAL.calories - totals.calories

  const addFood = async (meal: string, food: any) => {
    await supabase.from('food_logs').insert({ user_id:userId, logged_date:activeDate, meal, name:food.name, calories:food.calories, protein:food.protein||0, carbs:food.carbs||0, fat:food.fat||0 })
    onRefresh()
  }
  const removeFood = async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id)
    onRefresh()
  }
  const saveRating = async (result: {score:number;notes:string;itemScores?:any[]}) => {
    if (!ratingMeal) return
    const slotFoods = meals[ratingMeal.slot]||[]
    for (const f of slotFoods) {
      const itemScore = result.itemScores?.find((s:any) => s.name.toLowerCase().trim() === f.name.toLowerCase().trim())
      await supabase.from('food_logs').update({
        rating: itemScore ? itemScore.score : result.score,
        ai_analysis: itemScore ? itemScore.note : result.notes
      }).eq('id', f.id)
    }
    onRefresh()
    setRatingMeal(null)
  }

  return (
    <div style={{paddingBottom:40}}>
      {ratingMeal && <MealRatingModal meal={{name:ratingMeal.name,items:ratingMeal.items,calories:ratingMeal.calories,protein:ratingMeal.protein,carbs:ratingMeal.carbs,fat:ratingMeal.fat,rating:ratingMeal.rating,ai_analysis:ratingMeal.ai_analysis,itemScores:ratingMeal.itemScores}} onClose={()=>setRatingMeal(null)} onRated={saveRating} forceRefresh={forceRefresh}/>}
      <div style={{margin:'0 14px 12px',background:'#0c0c0c',border:'1px solid #181818',borderRadius:14,padding:'13px 14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#3a3a3a',letterSpacing:1.5}}>DAILY MACROS</div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:calLeft<0?'#ff6b6b':'#e8ff47',lineHeight:1}}>{Math.abs(calLeft)}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#3a3a3a',letterSpacing:1}}>{calLeft<0?'OVER':'CAL LEFT'}</div>
          </div>
        </div>
        <MacroBar label="Cal" value={totals.calories} goal={MACRO_GOAL.calories} color="#e8ff47"/>
        <MacroBar label="Protein" value={Math.round(totals.protein)} goal={MACRO_GOAL.protein} color="#47c8ff"/>
        <MacroBar label="Carbs" value={Math.round(totals.carbs)} goal={MACRO_GOAL.carbs} color="#ff9f47"/>
        <MacroBar label="Fat" value={Math.round(totals.fat)} goal={MACRO_GOAL.fat} color="#c447ff"/>
      </div>

      {MEAL_SLOTS.map(meal => {
        const mFoods = meals[meal]||[]
        const mc = mFoods.reduce((s,f)=>s+f.calories,0)
        const mp = mFoods.reduce((s,f)=>s+(+f.protein||0),0)
        return (
          <div key={meal} style={{margin:'0 14px 9px',background:'#0c0c0c',border:'1px solid #181818',borderRadius:11,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px 8px'}}>
              <div>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:2,color:'#bbb'}}>{meal.toUpperCase()}</span>
                {mFoods.length>0&&<span style={{marginLeft:7,fontFamily:"'DM Mono',monospace",fontSize:9,color:'#333'}}>{mc} kcal · {Math.round(mp)}g pro</span>}
              </div>
              <div style={{display:'flex',gap:5}}>
                {mFoods.length>0&&(()=>{
                  const mealRating = mFoods[0]?.rating
                  const sc = ratingColor(mealRating)
                  const mc2 = mFoods.reduce((s,f)=>s+f.calories,0)
                  const mp2 = mFoods.reduce((s,f)=>s+(+f.protein||0),0)
                  const mcarbs = mFoods.reduce((s,f)=>s+(+f.carbs||0),0)
                  const mfat = mFoods.reduce((s,f)=>s+(+f.fat||0),0)
                  return <button onClick={()=>openRating({name:meal,items:mFoods,calories:mc2,protein:mp2,carbs:mcarbs,fat:mfat,rating:mealRating,ai_analysis:mFoods[0]?.ai_analysis,itemScores:mFoods.map(f=>({name:f.name,score:f.rating,note:f.ai_analysis})).filter(s=>s.score),slot:meal}, !!mealRating)}
                    style={{background:'#0a1a0a',border:`1px solid ${mealRating?'#1e4a1e':'#1e3a1e'}`,borderRadius:5,color:mealRating?sc:'#4aff7a',fontFamily:"'DM Mono',monospace",fontSize:9,padding:'3px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                    {mealRating&&<span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,lineHeight:1}}>{mealRating}</span>}
                    {mealRating?'re-rate':'rate'}
                  </button>
                })()}
                <button onClick={()=>setModal(meal)} style={{background:'#141414',border:'1px solid #222',borderRadius:5,color:'#444',fontFamily:"'DM Mono',monospace",fontSize:9,padding:'3px 8px',cursor:'pointer'}}>+add</button>
              </div>
            </div>
            {mFoods.length===0
              ?<div style={{padding:'2px 13px 10px',fontFamily:"'DM Mono',monospace",fontSize:9,color:'#1a1a1a'}}>Nothing logged</div>
              :<div style={{borderTop:'1px solid #111'}}>
                {mFoods.map(f=>(
                  <div key={f.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 13px',borderBottom:'1px solid #0e0e0e'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{fontSize:12,color:'#aaa',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
                        {f.rating && (
                          <span style={{background:ratingColor(f.rating)+'22',border:`1px solid ${ratingColor(f.rating)}44`,borderRadius:4,color:ratingColor(f.rating),fontFamily:"'Bebas Neue',sans-serif",fontSize:10,padding:'1px 5px',flexShrink:0,lineHeight:1.4}}>
                            {f.rating}
                          </span>
                        )}
                      </div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#333',marginTop:2}}>
                        <span style={{color:'#e8ff47'}}>{f.calories}cal</span>
                        {f.protein>0&&<span> · <span style={{color:'#47c8ff'}}>{f.protein}p</span></span>}
                        {f.carbs>0&&<span> · <span style={{color:'#ff9f47'}}>{f.carbs}c</span></span>}
                        {f.fat>0&&<span> · <span style={{color:'#c447ff'}}>{f.fat}f</span></span>}
                      </div>
                    </div>
                    <button onClick={()=>removeFood(f.id)} style={{background:'none',border:'none',color:'#222',cursor:'pointer',fontSize:14,padding:'0 3px',flexShrink:0}}>x</button>
                  </div>
                ))}
              </div>
            }
          </div>
        )
      })}

      <div style={{margin:'8px 14px 0',background:'#0c0c0c',border:'1px solid #181818',borderRadius:10,padding:'10px 13px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',textAlign:'center'}}>
          {[['CAL',String(totals.calories),'#e8ff47'],['PRO',`${Math.round(totals.protein)}g`,'#47c8ff'],['CARB',`${Math.round(totals.carbs)}g`,'#ff9f47'],['FAT',`${Math.round(totals.fat)}g`,'#c447ff']].map(([l,v,c])=>(
            <div key={l}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:c,lineHeight:1}}>{v}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'#2a2a2a',letterSpacing:0.5,marginTop:2}}>{l}</div></div>
          ))}
        </div>
      </div>
      {modal&&<ManualModal meal={modal} onAdd={f=>addFood(modal,f)} onClose={()=>setModal(null)}/>}
    </div>
  )
}

// ── Workout Tab ───────────────────────────────────────────────────────────
function WorkoutTab({ session, activeDate, userId, onRefresh }: { session:WorkoutSession|null; activeDate:string; userId:string; onRefresh:()=>void }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [addingExercise, setAddingExercise] = useState(false)
  const [newEx, setNewEx] = useState({ name:'', type:'strength', duration:'', intensity:'', calories:'', notes:'' })
  const [newSets, setNewSets] = useState([{weight:'',reps:''}])
  const [workoutName, setWorkoutName] = useState(session?.workout_name||'')
  const [calsBurned, setCalsBurned] = useState(session?.cals_burned||0)

  const runAnalysis = async () => {
    if (!session) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-workout', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ exercises: session.exercises, workoutName: session.workout_name, calsBurned: session.cals_burned })
      })
      const data = await res.json()
      const updates: any = { rating: data.rating, analysis: data.analysis, exercise_grades: data.exerciseGrades||[] }
      if (data.workoutName) {
        updates.workout_name = data.workoutName
        setWorkoutName(data.workoutName)
      }
      await supabase.from('workout_sessions').update(updates).eq('id', session.id)
      onRefresh()
    } catch {}
    setAnalyzing(false)
  }

  const addExercise = async () => {
    let sessionId = session?.id
    if (!sessionId) {
      const { data, error: sErr } = await supabase
        .from('workout_sessions')
        .insert({ user_id:userId, logged_date:activeDate, workout_name:workoutName||'Workout', cals_burned:calsBurned||0 })
        .select('id')
      if (sErr || !data || data.length === 0) { console.error('session create failed', sErr); return }
      sessionId = data[0].id
    }
    if (!sessionId) return
    const aType = getActivityType(newEx.name)
    const isCardio = isCardioType(aType)
    const insertData: any = {
      session_id: sessionId,
      user_id: userId,
      name: newEx.name,
      type: isCardio ? aType : 'strength',
    }
    if (isCardio) {
      insertData.sets = [{
        duration: newEx.duration||null,
        intensity: newEx.intensity||null,
        calories: newEx.calories||null,
        notes: newEx.notes||null
      }]
    } else {
      insertData.sets = newSets.filter(s => s.weight || s.reps)
    }
    const { error: exErr } = await supabase.from('exercises').insert(insertData)
    if (exErr) { console.error('exercise insert failed', exErr); return }
    setAddingExercise(false)
    setNewEx({ name:'', type:'strength', duration:'', intensity:'', calories:'', notes:'' })
    setNewSets([{weight:'',reps:''}])
    onRefresh()
  }

  const removeExercise = async (id: string) => {
    await supabase.from('exercises').delete().eq('id', id)
    if (session && session.exercises.length <= 1) {
      await supabase.from('workout_sessions').update({ rating: null, analysis: null }).eq('id', session.id)
    }
    onRefresh()
  }

  const saveSets = async (id: string, sets: {weight:string;reps:string}[]) => {
    await supabase.from('exercises').update({ sets }).eq('id', id)
    onRefresh()
  }

  const clearAnalysis = async () => {
    if (!session) return
    await supabase.from('workout_sessions').update({ rating: null, analysis: null }).eq('id', session.id)
    onRefresh()
  }

  const s: React.CSSProperties = {background:'#0a0a0a',border:'1px solid #202020',borderRadius:6,padding:'7px 10px',color:'#ccc',fontFamily:"'DM Mono',monospace",fontSize:11,width:'100%',outline:'none',boxSizing:'border-box'}
  const aType = getActivityType(newEx.name)
  const newIsCardio = isCardioType(aType)

  return (
    <div style={{padding:'0 14px 40px'}}>
      {/* Session header */}
      <div style={{background:'#0c0c0c',border:'1px solid #181818',borderRadius:14,padding:'13px 14px',marginBottom:10}}>
        <input value={workoutName} onChange={e=>setWorkoutName(e.target.value)} onBlur={async()=>{ if(session){ await supabase.from('workout_sessions').update({workout_name:workoutName}).eq('id',session.id); onRefresh() }}} placeholder="Workout name..." style={{background:'transparent',border:'none',color:'#bbb',fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,width:'100%',outline:'none'}}/>
        <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#333'}}>CALS BURNED:</div>
          <input type="number" value={calsBurned||''} onChange={e=>setCalsBurned(+e.target.value)} onBlur={async()=>{ if(session){ await supabase.from('workout_sessions').update({cals_burned:calsBurned}).eq('id',session.id); onRefresh() }}} placeholder="0" style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:4,color:'#ff6b6b',fontFamily:"'DM Mono',monospace",fontSize:11,padding:'3px 7px',width:70,outline:'none'}}/>
          {session?.rating && (
            <div style={{marginLeft:'auto',textAlign:'center'}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:ratingColor(session.rating),lineHeight:1}}>{session.rating}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'#2a2a2a',letterSpacing:1}}>/10</div>
            </div>
          )}
        </div>
      </div>

      {/* Exercises */}
      {session?.exercises?.map(ex => {
        const grade = session.exercise_grades?.find((g:any) => g.name.toLowerCase().trim() === ex.name.toLowerCase().trim())
        return <ActivityCard key={ex.id} w={{...ex, grade: grade?.score, grade_note: grade?.note}} onRemove={()=>removeExercise(ex.id)} onSaveSets={saveSets}/>
      })}

      {/* AI Analysis */}
      {session?.analysis && (
        <div style={{background:'#0a0f0a',border:'1px solid #1a2a1a',borderRadius:11,padding:'12px 14px',marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:'#4aff7a',letterSpacing:2}}>AI COACHING</div>
            <button onClick={clearAnalysis} style={{background:'none',border:'none',color:'#2a2a2a',cursor:'pointer',fontSize:12,padding:'0 2px'}}>x</button>
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'#555',lineHeight:1.7}}>{session.analysis}</div>
        </div>
      )}

      {/* Add exercise form */}
      {addingExercise && (
        <div style={{background:'#0c0c0c',border:'1px solid #1e1e1e',borderRadius:11,padding:'13px 14px',marginBottom:10}}>
          <input value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} placeholder="Exercise name..." style={{...s,marginBottom:7}}/>
          {newIsCardio ? (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:7}}>
              <input value={newEx.duration} onChange={e=>setNewEx(p=>({...p,duration:e.target.value}))} placeholder="Duration (min)" type="number" style={s}/>
              <input value={newEx.intensity} onChange={e=>setNewEx(p=>({...p,intensity:e.target.value}))} placeholder="Intensity" style={s}/>
              <input value={newEx.calories} onChange={e=>setNewEx(p=>({...p,calories:e.target.value}))} placeholder="Calories burned" type="number" style={s}/>
              <input value={newEx.notes} onChange={e=>setNewEx(p=>({...p,notes:e.target.value}))} placeholder="Notes" style={s}/>
            </div>
          ) : (
            <>
              {newSets.map((set,i) => (
                <div key={i} style={{display:'grid',gridTemplateColumns:'30px 1fr 1fr 30px',gap:5,marginBottom:5,alignItems:'center'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:'#333',textAlign:'center'}}>{i+1}</div>
                  <input value={set.weight} onChange={e=>setNewSets(prev=>prev.map((s2,j)=>j===i?{...s2,weight:e.target.value}:s2))} placeholder="Weight" style={s}/>
                  <input value={set.reps} onChange={e=>setNewSets(prev=>prev.map((s2,j)=>j===i?{...s2,reps:e.target.value}:s2))} placeholder="Reps" type="number" style={s}/>
                  <button onClick={()=>setNewSets(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#333',cursor:'pointer',fontSize:14}}>x</button>
                </div>
              ))}
              <button onClick={()=>setNewSets(p=>[...p,{weight:'',reps:''}])} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:5,color:'#444',fontFamily:"'DM Mono',monospace",fontSize:9,padding:'4px 10px',cursor:'pointer',marginBottom:7}}>+ add set</button>
            </>
          )}
          <div style={{display:'flex',gap:7}}>
            <button onClick={()=>setAddingExercise(false)} style={{flex:1,padding:8,background:'transparent',border:'1px solid #1e1e1e',borderRadius:7,color:'#444',fontFamily:"'DM Mono',monospace",fontSize:10,cursor:'pointer'}}>CANCEL</button>
            <button onClick={addExercise} disabled={!newEx.name} style={{flex:2,padding:8,background:newEx.name?'#e8ff47':'#141414',border:'none',borderRadius:7,color:'#080808',fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1.5,cursor:newEx.name?'pointer':'default'}}>ADD EXERCISE</button>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:7,marginTop:4}}>
        <button onClick={()=>setAddingExercise(true)} style={{flex:2,padding:10,background:'#0c0c0c',border:'1px solid #1e1e1e',borderRadius:9,color:'#444',fontFamily:"'DM Mono',monospace",fontSize:10,cursor:'pointer'}}>+ ADD EXERCISE</button>
        {session && session.exercises.length > 0 && (
          <button onClick={runAnalysis} disabled={analyzing} style={{flex:1,padding:10,background:analyzing?'#0c0c0c':'#0a1a0a',border:`1px solid ${analyzing?'#1e1e1e':'#1a3a1a'}`,borderRadius:9,color:analyzing?'#333':'#4aff7a',fontFamily:"'DM Mono',monospace",fontSize:10,cursor:analyzing?'default':'pointer'}}>
            {analyzing?'ANALYZING...':session?.analysis?'RE-GRADE':'GRADE'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Trends Tab ────────────────────────────────────────────────────────────
function TrendsTab({ foods, sessions }: { foods:FoodItem[]; sessions:WorkoutSession[] }) {
  const dailyTotals = WEEK.map(date => {
    const df = foods.filter(f=>f.logged_date===date)
    return { date, calories: df.reduce((s,f)=>s+f.calories,0), protein: df.reduce((s,f)=>s+(+f.protein||0),0), logged: df.length>0 }
  })
  const avgCal = Math.round(dailyTotals.filter(d=>d.logged).reduce((s,d)=>s+d.calories,0) / Math.max(dailyTotals.filter(d=>d.logged).length,1))
  const avgPro = Math.round(dailyTotals.filter(d=>d.logged).reduce((s,d)=>s+d.protein,0) / Math.max(dailyTotals.filter(d=>d.logged).length,1))
  const sessionsWithRating = sessions.filter(s=>s.rating)
  const avgRating = sessionsWithRating.length > 0 ? (sessionsWithRating.reduce((s,w)=>s+(w.rating||0),0)/sessionsWithRating.length).toFixed(1) : '—'

  return (
    <div style={{padding:'0 14px 40px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
        {[['AVG CALORIES',String(avgCal),'#e8ff47'],['AVG PROTEIN',`${avgPro}g`,'#47c8ff'],['SESSIONS',String(sessions.length),'#4aff7a'],['AVG GRADE',String(avgRating),'#ff9f47']].map(([l,v,c])=>(
          <div key={l} style={{background:'#0c0c0c',border:'1px solid #141414',borderRadius:10,padding:'12px 14px'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#2a2a2a',letterSpacing:1,marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Daily cal chart */}
      <div style={{background:'#0c0c0c',border:'1px solid #141414',borderRadius:11,padding:'12px 14px',marginBottom:10}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#3a3a3a',letterSpacing:1.5,marginBottom:10}}>CALORIES · 7 DAYS</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:5,height:60}}>
          {dailyTotals.map(d => {
            const h = d.calories > 0 ? Math.max((d.calories/MACRO_GOAL.calories)*60, 4) : 4
            const over = d.calories > MACRO_GOAL.calories
            return (
              <div key={d.date} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{width:'100%',height:h,background:d.logged?(over?'#ff6b6b':'#e8ff47'):'#141414',borderRadius:2,transition:'height 0.3s'}}/>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'#2a2a2a'}}>{new Date(d.date+'T12:00').toLocaleDateString('en-US',{weekday:'short'}).slice(0,2)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Workout sessions */}
      <div style={{background:'#0c0c0c',border:'1px solid #141414',borderRadius:11,padding:'12px 14px',marginBottom:10}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#3a3a3a',letterSpacing:1.5,marginBottom:10}}>WORKOUT SESSIONS · 7 DAYS</div>
        {sessions.length === 0 ? (
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#1a1a1a'}}>No sessions logged</div>
        ) : sessions.map(s => (
          <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid #0e0e0e'}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:'#bbb',letterSpacing:1}}>{s.workout_name}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#2a2a2a',marginTop:1}}>{new Date(s.logged_date+'T12:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · {s.exercises?.length||0} exercises</div>
            </div>
            {s.rating && <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:ratingColor(s.rating)}}>{s.rating}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Smart Input Bar ───────────────────────────────────────────────────────
function SmartInputBar({ tab, activeDate, userId, onRefresh }: { tab:string; activeDate:string; userId:string; onRefresh:()=>void }) {
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [photoData, setPhotoData] = useState<string|null>(null)
  const [listening, setListening] = useState(false)
  const [targetMeal, setTargetMeal] = useState('Breakfast')
  const fileRef = useRef<HTMLInputElement>(null)
  const recogRef = useRef<any>(null)
  const accentColor = tab === 'food' ? '#e8ff47' : '#47c8ff'

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoData((reader.result as string).split(',')[1])
    reader.readAsDataURL(file)
  }

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if (!SR) return
    if (listening) { recogRef.current?.stop(); setListening(false); return }
    const r = new SR(); r.continuous=false; r.interimResults=false; r.lang='en-US'
    r.onresult = (e: any) => { setText(prev => prev + ' ' + e.results[0][0].transcript); setListening(false) }
    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)
    recogRef.current = r; r.start(); setListening(true)
  }

  const parse = async () => {
    if (!text.trim() && !photoData) return
    setParsing(true)
    try {
      if (tab === 'food') {
        const res = await fetch('/api/parse-food', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ text, photo: photoData, meal: targetMeal })
        })
        const data = await res.json()
        const items = data.items || []
        for (const item of items) {
          await supabase.from('food_logs').insert({ user_id:userId, logged_date:activeDate, meal:targetMeal, name:item.name, calories:item.calories, protein:item.protein||0, carbs:item.carbs||0, fat:item.fat||0 })
        }
      } else {
        const res = await fetch('/api/parse-workout', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ text, photo: photoData })
        })
        const data = await res.json()
        // Get or create session - avoid .single() which throws on no rows
        let sessionId: string|null = null
        const { data: existing } = await supabase.from('workout_sessions').select('id').eq('user_id',userId).eq('logged_date',activeDate)
        if (existing && existing.length > 0) {
          sessionId = existing[0].id
          // Update name and cals if AI detected them
          await supabase.from('workout_sessions').update({ workout_name: data.workoutName||'Workout', cals_burned: data.calsBurned||0 }).eq('id', sessionId)
        } else {
          const { data: newSession } = await supabase.from('workout_sessions').insert({ user_id:userId, logged_date:activeDate, workout_name:data.workoutName||'Workout', cals_burned:data.calsBurned||0 }).select('id')
          sessionId = newSession?.[0]?.id || null
        }
        if (sessionId && data.exercises && data.exercises.length > 0) {
          for (const ex of data.exercises) {
            const aType = getActivityType(ex.name)
            const isCardio = isCardioType(aType)
            let setsData = ex.sets || []
            if (isCardio && (!setsData.length || setsData[0]?.weight !== undefined)) {
              setsData = [{ duration: ex.duration||null, intensity: ex.intensity||null, calories: ex.calories||null, notes: ex.notes||null }]
            }
            await supabase.from('exercises').insert({ session_id:sessionId, user_id:userId, name:ex.name, type:isCardio?aType:'strength', sets:setsData })
          }
        }
      }
      onRefresh()
      setText(''); setPhotoData(null)
    } catch {}
    setParsing(false)
  }

  return (
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'#080808',borderTop:'1px solid #0f0f0f',padding:'8px 10px 12px',zIndex:50}}>
      {tab === 'food' && (
        <div style={{display:'flex',gap:4,marginBottom:6,overflowX:'auto'}}>
          {MEAL_SLOTS.map(m=>(
            <button key={m} onClick={()=>setTargetMeal(m)} style={{padding:'3px 10px',background:targetMeal===m?'#e8ff4718':'transparent',border:`1px solid ${targetMeal===m?'#e8ff4744':'#141414'}`,borderRadius:5,color:targetMeal===m?'#e8ff47':'#333',fontFamily:"'DM Mono',monospace",fontSize:8,cursor:'pointer',whiteSpace:'nowrap',letterSpacing:0.5}}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      {photoData && (
        <div style={{marginBottom:6,display:'flex',alignItems:'center',gap:7}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#c447ff'}}>📷 Photo ready</div>
          <button onClick={()=>setPhotoData(null)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:12}}>x</button>
        </div>
      )}
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <input
          value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&parse()}
          placeholder={tab==='food'?'Log food with AI...':'Log workout with AI...'}
          style={{flex:1,background:'#0c0c0c',border:'1px solid #181818',borderRadius:10,padding:'10px 12px',color:'#ccc',fontFamily:"'DM Mono',monospace",fontSize:12,outline:'none'}}
        />
        <button onClick={toggleVoice} style={{width:40,height:40,background:listening?'#0a1a0a':'#0c0c0c',border:`1px solid ${listening?'#4aff7a':'#1e1e1e'}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
          <span style={{fontSize:16}}>{listening?'⏹':'🎙'}</span>
        </button>
        <button onClick={()=>fileRef.current?.click()} style={{width:40,height:40,background:photoData?'#1a0a1a':'#0c0c0c',border:`1px solid ${photoData?'#c447ff':'#1e1e1e'}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
          <span style={{fontSize:16}}>📷</span>
        </button>
        <button onClick={parse} disabled={(!text.trim()&&!photoData)||parsing} style={{width:40,height:40,background:(!text.trim()&&!photoData)||parsing?'#111':accentColor,border:'none',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:(!text.trim()&&!photoData)||parsing?'default':'pointer',flexShrink:0}}>
          {parsing
            ? <div style={{width:14,height:14,border:'2px solid #333',borderTop:'2px solid #080808',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
            : <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:'#080808',letterSpacing:1}}>LOG</span>}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:'none'}}/>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [tab, setTab] = useState('food')
  const [activeDate, setActiveDate] = useState(todayKey())
  const [userId, setUserId] = useState<string|null>(null)
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/auth'; return }
      setUserId(data.user.id)
    })
  }, [])

  const fetchData = useCallback(async () => {
    if (!userId) return
    const startDate = WEEK[0]
    const [{ data: foodData }, { data: sessionData }] = await Promise.all([
      supabase.from('food_logs').select('*').eq('user_id',userId).gte('logged_date',startDate).order('created_at'),
      supabase.from('workout_sessions').select('*, exercises(*)').eq('user_id',userId).gte('logged_date',startDate).order('logged_date')
    ])
    setFoods(foodData||[])
    setSessions((sessionData||[]).map((s:any) => ({...s, exercises: s.exercises||[]})))
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading || !userId) return (
    <div style={{background:'#080808',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid #1e1e1e',borderTop:'2px solid #e8ff47',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const dayFoods = foods.filter(f=>f.logged_date===activeDate)
  const totalCals = dayFoods.reduce((s,f)=>s+f.calories,0)
  const totalPro = dayFoods.reduce((s,f)=>s+(+f.protein||0),0)
  const daySession = sessions.find(s=>s.logged_date===activeDate)||null
  const isToday = activeDate===todayKey()
  const isFirstDay = activeDate===WEEK[0]

  const shiftDate = (dir: number) => {
    const d = new Date(activeDate+'T12:00:00')
    d.setDate(d.getDate()+dir)
    const next = d.toISOString().slice(0,10)
    if (WEEK.includes(next)||next===todayKey()) setActiveDate(next)
  }

  const dateLabel = () => new Date(activeDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})
  const dayLabels = WEEK.map(d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'}).slice(0,2))

  return (
    <div style={{background:'#080808',minHeight:'100vh',color:'#eee',fontFamily:"'DM Sans',sans-serif",maxWidth:480,margin:'0 auto'}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&family=DM+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{background:'#080808',borderBottom:'1px solid #0f0f0f',padding:'14px 14px 0',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:3,background:'linear-gradient(90deg,#e8ff47,#47c8ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1}}>RECOMP</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'#2a2a2a',letterSpacing:1.5,marginTop:1}}>208 → 195 · 6′2 · 38YO</div>
          </div>
          <div style={{display:'flex',gap:5}}>
            {[[String(totalCals),'CAL','#e8ff47'],[`${Math.round(totalPro)}g`,'PRO','#47c8ff'],[String(daySession?.exercises?.length||0),'EX','#ff9f47'],[daySession?.cals_burned?String(daySession.cals_burned):'—','BURN','#ff6b6b']].map(([v,l,c])=>(
              <div key={l} style={{background:'#0c0c0c',border:'1px solid #141414',borderRadius:7,padding:'5px 6px',textAlign:'center'}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:c,lineHeight:1}}>{v}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:'#2a2a2a',letterSpacing:0.5}}>{l}</div>
              </div>
            ))}
            <button onClick={async()=>{ await supabase.auth.signOut(); window.location.href='/auth' }} style={{background:'#0c0c0c',border:'1px solid #141414',borderRadius:7,padding:'5px 6px',color:'#333',fontFamily:"'DM Mono',monospace",fontSize:8,cursor:'pointer'}}>OUT</button>
          </div>
        </div>

        {tab!=='trends'&&(
          <>
            <div style={{display:'flex',gap:3,marginBottom:8}}>
              {WEEK.map((date,i)=>{
                const isActive=date===activeDate
                const hasFood=foods.some(f=>f.logged_date===date)
                const hasSess=sessions.some(s=>s.logged_date===date)
                const dow=new Date(date+'T12:00:00').getDay()
                const isWknd=dow===0||dow===6
                return (
                  <button key={date} onClick={()=>setActiveDate(date)} style={{flex:1,padding:'5px 2px',background:isActive?'#1a1a1a':'transparent',border:`1px solid ${isActive?'#333':'#111'}`,borderRadius:5,cursor:'pointer',textAlign:'center'}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:isActive?'#e8ff47':isWknd?'#ff6b6b44':'#2a2a2a',marginBottom:2}}>{dayLabels[i]}</div>
                    <div style={{display:'flex',justifyContent:'center',gap:2}}>
                      <div style={{width:4,height:4,borderRadius:'50%',background:hasFood?(isWknd?'#ff6b6b':'#47c8ff'):'#1a1a1a'}}/>
                      <div style={{width:4,height:4,borderRadius:'50%',background:hasSess?'#4aff7a':'#1a1a1a'}}/>
                    </div>
                  </button>
                )
              })}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <button onClick={()=>shiftDate(-1)} disabled={isFirstDay} style={{background:'none',border:'1px solid #181818',borderRadius:5,color:isFirstDay?'#111':'#3a3a3a',cursor:isFirstDay?'default':'pointer',padding:'3px 10px',fontSize:14}}>‹</button>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:12,color:'#999',fontWeight:600}}>{dateLabel()}</div>
                {isToday&&<div style={{fontSize:8,color:'#e8ff47',fontFamily:"'DM Mono',monospace",letterSpacing:1}}>TODAY</div>}
              </div>
              <button onClick={()=>shiftDate(1)} disabled={isToday} style={{background:'none',border:'1px solid #181818',borderRadius:5,color:isToday?'#181818':'#3a3a3a',cursor:isToday?'default':'pointer',padding:'3px 10px',fontSize:14}}>›</button>
            </div>
          </>
        )}

        <div style={{display:'flex'}}>
          {[['food','NUTRITION','#e8ff47'],['workout','TRAINING','#47c8ff'],['trends','TRENDS','#4aff7a']].map(([key,label,color])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,background:'none',border:'none',borderBottom:tab===key?`2px solid ${color}`:'2px solid transparent',color:tab===key?color:'#2a2a2a',fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,padding:'7px 0 9px',cursor:'pointer',transition:'all 0.2s'}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{paddingTop:12,paddingBottom:90}}>
        {tab==='food'&&<FoodTab foods={foods} activeDate={activeDate} userId={userId} onRefresh={fetchData}/>}
        {tab==='workout'&&<WorkoutTab session={daySession} activeDate={activeDate} userId={userId} onRefresh={fetchData}/>}
        {tab==='trends'&&<TrendsTab foods={foods} sessions={sessions}/>}
      </div>

      {tab!=='trends'&&(
        <SmartInputBar tab={tab} activeDate={activeDate} userId={userId} onRefresh={fetchData}/>
      )}
    </div>
  )
}

