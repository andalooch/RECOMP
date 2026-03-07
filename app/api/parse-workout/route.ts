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
    system: `You are a workout log parser. Parse workout descriptions into structured exercise data.

Common input formats to handle:
- "bench press 135x10 185x8 205x6" → 3 sets with different weights
- "bench press 50x10, 60x12, 70x8" → weight first, then reps
- "incline db press 50x10, 60x12, 70x8" → dumbbell press
- "3x10 bench at 185" → 3 sets of 10 at 185
- "cycling 45 min moderate" → cardio activity
- "back squat 5x5 225" → 5 sets of 5 at 225

Return ONLY valid JSON in this exact format, no markdown:
{
  "workoutName": "Back & Biceps",
  "calsBurned": 480,
  "exercises": [
    {
      "name": "Incline Dumbbell Press",
      "type": "strength",
      "sets": [
        {"weight": "50", "reps": "10"},
        {"weight": "60", "reps": "12"},
        {"weight": "70", "reps": "8"}
      ]
    },
    {
      "name": "Cycling",
      "type": "cycling",
      "sets": [{"duration": 45, "intensity": "Moderate", "calories": 380, "notes": ""}]
    }
  ]
}

For the workoutName: infer from exercise selection (e.g. chest/tricep exercises → "Chest & Triceps", rows/pulldowns/curls → "Back & Biceps").
For calsBurned: estimate based on exercise type, volume, and duration. Strength training typically 300-600 cal/hour.
For strength sets: weight is always a string (e.g. "185" or "BW"), reps is always a string (e.g. "10").
For cardio: use sets array with one object containing duration, intensity, calories, notes.`,
    messages
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ workoutName: 'Workout', calsBurned: 0, exercises: [] })
  }
}

