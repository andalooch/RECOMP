import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  const { items, mealName, calories, protein, carbs, fat, goals } = await request.json()

  const itemList = Array.isArray(items) && items.length > 0
    ? items.map((f: any) => `- ${f.name}: ${f.calories}cal, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fat}g fat`).join('\n')
    : `- ${mealName}: ${calories}cal, ${protein}g protein, ${carbs}g carbs, ${fat}g fat`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are a blunt nutrition coach for body recomposition (building muscle while losing fat). Rate food items HONESTLY with varied scores:
- 9-10: Exceptional — high protein, clean macros, perfect for recomp (grilled chicken, eggs, Greek yogurt, whey)
- 7-8: Good — solid protein, reasonable macros (oats, rice + protein, wraps with lean meat)
- 5-6: Mediocre — low protein density, processed, or high in empty calories
- 3-4: Poor — high fat + simple carbs, low protein (fries, white bread alone, sugary drinks)
- 1-2: Terrible — alcohol, fried junk, desserts, near-zero protein

Be specific about WHY each score. Scores must vary — don't give everything a 6 or 8.
Return ONLY valid JSON, no markdown.`,
    messages: [{
      role: 'user',
      content: `Rate each food item AND the overall meal for body recomposition.
Athlete: 208lb male, 6'2", 38yo, goal 195lb recomp, training 6-7x/week.
Daily targets: ${goals.calories} cal, ${goals.protein}g protein, ${goals.carbs}g carbs, ${goals.fat}g fat.

Meal: ${mealName}
Total: ${calories}cal, ${protein}g protein, ${carbs}g carbs, ${fat}g fat

Items:
${itemList}

Return JSON in this exact format:
{
  "items": [
    {"name": "exact food name as given", "score": 9.2, "note": "one sentence — why this score"},
    {"name": "exact food name as given", "score": 3.1, "note": "one sentence — why this score"}
  ],
  "mealScore": 7.4,
  "mealNotes": "2 sentences — overall meal assessment and one concrete improvement"
}`
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    if (parsed.items) {
      parsed.items = parsed.items.map((i: any) => ({
        ...i,
        score: Math.min(10, Math.max(1, parseFloat(i.score) || 5))
      }))
    }
    parsed.mealScore = Math.min(10, Math.max(1, parseFloat(parsed.mealScore) || 5))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ items: [], mealScore: 5, mealNotes: 'Unable to rate at this time.' })
  }
}

