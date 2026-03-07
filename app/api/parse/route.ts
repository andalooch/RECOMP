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
      content: `Parse this workout log: "${text}". Return JSON only, no markdown.`
    })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are a workout log parser. Parse workout descriptions into one or more distinct sessions.

CRITICAL: If the input contains multiple distinct workout types (e.g. a strength session AND a cardio activity), split them into SEPARATE sessions in the sessions array. Do NOT combine them into one session.

Examples of what should be split:
- "back and biceps workout + ran 3 miles" → 2 sessions: "Back & Biceps" and "Running"
- "lifted chest then did 30 min cycling" → 2 sessions: "Chest" and "Cycling"
- "yoga this morning, lifting tonight" → 2 sessions: "Yoga" and "Lifting"

Common input formats to handle:
- "bench press 135x10 185x8 205x6" → 3 sets with different weights
- "3x10 bench at 185" → 3 sets of 10 at 185
- "cycling 45 min moderate" → cardio activity
- "ran 3 miles 28 minutes" → running cardio

Return ONLY valid JSON in this exact format, no markdown:
{
  "sessions": [
    {
      "workoutName": "Back & Biceps",
      "calsBurned": 420,
      "exercises": [
        {
          "name": "Lat Pulldown",
          "type": "strength",
          "sets": [
            {"weight": "120", "reps": "10"},
            {"weight": "130", "reps": "8"}
          ]
        }
      ]
    },
    {
      "workoutName": "Running",
      "calsBurned": 310,
      "exercises": [
        {
          "name": "Running",
          "type": "run",
          "sets": [{"duration": 28, "intensity": "Moderate", "calories": 310, "notes": "3 miles"}]
        }
      ]
    }
  ]
}

Rules:
- Always return a "sessions" array, even if there is only one session
- workoutName: infer from exercises (rows/pulldowns/curls → "Back & Biceps", bench/flyes → "Chest", etc.)
- calsBurned: estimate per session. Strength 300-600 cal/hr, running ~100 cal/mile, cycling ~400-600 cal/hr
- Strength sets: weight and reps are always strings (e.g. "185", "10")
- Cardio: sets array with one object: duration (mins), intensity, calories, notes`,
    messages
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    // Support both new {sessions:[]} format and old {workoutName, exercises} format
    if (parsed.sessions) return NextResponse.json(parsed)
    return NextResponse.json({ sessions: [parsed] })
  } catch {
    return NextResponse.json({ sessions: [{ workoutName: 'Workout', calsBurned: 0, exercises: [] }] })
  }
}

