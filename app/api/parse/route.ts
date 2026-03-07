import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  const { text, photo } = await request.json()

  const messages: any[] = []

  if (photo) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo } },
        { type: 'text', text: `Parse the workout from this image${text ? ` and description: "${text}"` : ''}. Return JSON only, no markdown.` }
      ]
    })
  } else {
    messages.push({
      role: 'user',
      content: `Parse this workout log into sessions: "${text}". Return JSON only, no markdown.`
    })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are a workout log parser. Your job is to split workout logs into separate sessions and name each one correctly.

STEP 1 - IDENTIFY DISTINCT ACTIVITIES:
Scan the input for different activity types. These should ALWAYS be separate sessions:
- Strength/weight training exercises (bench press, curls, rows, pulldowns, squats, etc.)
- Running / jogging
- Cycling / spinning
- Walking
- Swimming
- Yoga / pilates
- HIIT / cardio classes
- Any other distinct sport or class

STEP 2 - NAME EACH STRENGTH SESSION BY MUSCLE GROUPS:
Look at ALL the strength exercises and name the session based on what muscles they hit:
- Back exercises (rows, pulldowns, pull-ups, deadlifts) + Bicep exercises (curls) → "Back & Biceps"
- Chest exercises (bench press, flyes, push-ups) + Tricep exercises (pushdowns, extensions) → "Chest & Triceps"  
- Shoulder exercises (press, lateral raises, face pulls) → "Shoulders"
- Leg exercises (squats, lunges, leg press, RDL) → "Legs"
- Mixed upper body → "Upper Body"
- Full body mix → "Full Body"
DO NOT name a strength session after a cardio activity that also appears in the log.

STEP 3 - NAME EACH CARDIO SESSION:
- Running/jogging → "Running"
- Cycling/spinning → "Cycling"  
- Walking → "Walking"
- Swimming → "Swimming"
- Yoga → "Yoga"
- HIIT → "HIIT"

Return ONLY valid JSON:
{
  "sessions": [
    {
      "workoutName": "Back & Biceps",
      "calsBurned": 420,
      "exercises": [
        {"name": "Lat Pulldown", "type": "strength", "sets": [{"weight": "120", "reps": "10"}]},
        {"name": "Barbell Curl", "type": "strength", "sets": [{"weight": "65", "reps": "10"}]}
      ]
    },
    {
      "workoutName": "Running",
      "calsBurned": 310,
      "exercises": [
        {"name": "Running", "type": "run", "sets": [{"duration": 28, "intensity": "Moderate", "calories": 310, "notes": "3 miles"}]}
      ]
    }
  ]
}

Calorie estimates per session:
- Strength training: 6-10 cal/min depending on intensity
- Running: ~100 cal/mile or ~600 cal/hr
- Cycling: ~400-600 cal/hr
- Walking: ~80-100 cal/mile
- Yoga: ~200-300 cal/hr

Always return a "sessions" array even for a single session.
Strength sets: weight and reps as strings. Cardio: duration(mins), intensity, calories, notes.`,
    messages
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    if (parsed.sessions) return NextResponse.json(parsed)
    // fallback: old single-session format
    return NextResponse.json({ sessions: [{ workoutName: parsed.workoutName || 'Workout', calsBurned: parsed.calsBurned || 0, exercises: parsed.exercises || [] }] })
  } catch {
    return NextResponse.json({ sessions: [{ workoutName: 'Workout', calsBurned: 0, exercises: [] }] })
  }
}

