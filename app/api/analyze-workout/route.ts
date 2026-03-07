import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  const { exercises, workoutName, calsBurned } = await request.json()

  const exerciseSummary = exercises.map((ex: any) => {
    if (ex.sets && ex.sets.length > 0 && ex.sets[0].weight !== undefined) {
      const setStr = ex.sets.map((s: any) => `${s.weight}x${s.reps}`).join(', ')
      return `${ex.name}: ${setStr}`
    }
    const cd = ex.sets?.[0] || {}
    return `${ex.name}: ${cd.duration||'?'} min${cd.intensity ? `, ${cd.intensity}` : ''}`
  }).join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: `You are an elite strength and conditioning coach specializing in body recomposition for intermediate-advanced lifters. The athlete: 6'2", 208lb, 38yo, training 6-7x/week, goal is 208→195lb recomp. Be specific, direct, and actionable. Reference exact weights and reps. Return ONLY valid JSON, no markdown.`,
    messages: [{
      role: 'user',
      content: `Grade this workout session and identify the muscle groups trained:
Current workout name: "${workoutName||'Workout'}"
Calories burned: ${calsBurned||'unknown'}
Exercises:
${exerciseSummary}

Return JSON:
{
  "workoutName": "Back & Biceps",
  "rating": 8.4,
  "analysis": "3-5 sentence coaching analysis. Be specific about what was good, what needs work, and one concrete next-session target."
}

For workoutName: identify the primary muscle groups trained (e.g. "Chest & Triceps", "Back & Biceps", "Legs", "Shoulders", "Push", "Pull", "Cycling & Yoga"). If already named correctly, keep it.`
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ rating: 7.5, analysis: 'Solid session logged.', workoutName })
  }
}

