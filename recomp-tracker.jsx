import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a nutrition and fitness logger. Parse natural language food and workout descriptions.

Portion handling:
- "handful" = ~30-40g (cheese=110cal, nuts=170cal, berries=35cal)
- "decent amount" = 1.3x standard, "a ton of" = 1.75x, "a bit of" = 0.5x
- "couple" = 2, "few" = 3-4
- Parse ALL items in one sentence as separate entries
- Know branded products: Mission Low Carb Wrap = 70cal 5p 19c 3f, Premier Protein shake = 160cal 30p 4c 3f, etc.

For FOOD return ONLY this JSON (no markdown):
{"type":"food","meal":"Breakfast","items":[{"name":"4 whole eggs","calories":280,"protein":24,"carbs":0,"fat":20},{"name":"3 egg whites","calories":51,"protein":11,"carbs":0,"fat":0},{"name":"Mission Low Carb Wrap","calories":70,"protein":5,"carbs":19,"fat":3}],"summary":"3 items to Breakfast — 401 cal, 40g protein"}

For WORKOUT return ONLY this JSON (no markdown):
{"type":"workout","workoutName":"Chest & Triceps","rating":8.2,"calsBurned":420,"analysis":"2-3 sentence critique of the session.","exercises":[{"name":"Bench Press","sets":[{"weight":"185","reps":"8"},{"weight":"185","reps":"7"}]}],"summary":"Workout logged — 420 cal burned"}`

export async function POST(req: NextRequest) {
  try {
    const { message, userGoals } = await req.json()
    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 })

    const systemWithGoals = userGoals
      ? `${SYSTEM_PROMPT}\n\nUser goals: ${userGoals.calories} cal, ${userGoals.protein}g protein, ${userGoals.carbs}g carbs, ${userGoals.fat}g fat daily.`
      : SYSTEM_PROMPT

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: systemWithGoals,
      messages: [{ role: 'user', content: message }],
    })

    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim()

    // Extract JSON robustly
    let parsed
    try { parsed = JSON.parse(text) } catch {
      const s = text.indexOf('{'), e = text.lastIndexOf('}')
      if (s !== -1 && e > s) parsed = JSON.parse(text.slice(s, e + 1))
      else throw new Error('No JSON in response')
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
