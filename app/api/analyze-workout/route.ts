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
    max_tokens: 1200,
    system: `You are an elite strength and conditioning coach for body recomposition. Athlete: 6'2", 208lb, 38yo, goal 195lb recomp, training 6-7x/week, intermediate-advanced lifter.

Grade each exercise individually AND the session overall. Be honest and varied:
- 9-10: Exceptional volume/intensity, progressive overload, smart programming
- 7-8: Solid work, good execution, minor tweaks possible  
- 5-6: Average — low volume, conservative weight, or poor exercise selection
- 3-4: Underperforming — too light, too few sets, wrong movement pattern
- 1-2: Counter-productive or negligible stimulus

Reference exact weights and reps. Be direct. Return ONLY valid JSON, no markdown.`,
    messages: [{
      role: 'user',
      content: `Grade this workout — each exercise individually AND the full session:
Workout: "${workoutName||'Workout'}"
Calories burned: ${calsBurned||'unknown'}
Exercises:
${exerciseSummary}

Return this exact JSON:
{
  "workoutName": "Back & Biceps",
  "rating": 8.4,
  "analysis": "3-5 sentence overall session coaching note. Specific, direct, one concrete next-session target.",
  "exerciseGrades": [
    {
      "name": "exact exercise name as given",
      "score": 8.7,
      "note": "1-2 sentences — what was good or bad about this specific exercise, reference the actual weights/reps"
    }
  ]
}

For workoutName: infer from exercises (e.g. "Chest & Triceps", "Back & Biceps", "Legs", "Shoulders", "Push", "Pull", "Cardio"). Keep existing name if accurate.`
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    if (parsed.exerciseGrades) {
      parsed.exerciseGrades = parsed.exerciseGrades.map((g: any) => ({
        ...g,
        score: Math.min(10, Math.max(1, parseFloat(g.score) || 5))
      }))
    }
    parsed.rating = Math.min(10, Math.max(1, parseFloat(parsed.rating) || 7))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ rating: 7.5, analysis: 'Solid session logged.', workoutName, exerciseGrades: [] })
  }
}

