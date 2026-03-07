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
      content: `Parse this workout: "${text}". Return JSON only, no markdown.`
    })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You are a workout parser. Parse workout descriptions into structured exercise data.
Return ONLY valid JSON in this format, no markdown:
{
  "workoutName": "Back & Biceps",
  "calsBurned": 480,
  "exercises": [
    {"name": "Barbell Squat", "type": "strength", "sets": [{"weight": "135", "reps": "10"}, {"weight": "185", "reps": "8"}]},
    {"name": "Cycling", "type": "cycling", "duration": 45, "intensity": "Moderate", "calories": 380, "notes": "Peloton"}
  ]
}
For cardio/class activities use type like: cycling, yoga, run, walk, swim, hiit, pilates, hotworx, rowing.
For strength exercises use type: "strength" with sets array.
Estimate calories burned if not provided based on exercise type and duration.`,
    messages
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ workoutName: 'Workout', exercises: [] })
  }
}

