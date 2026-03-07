import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  const { name, calories, protein, carbs, fat, goals } = await request.json()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You are a nutrition coach specializing in body recomposition. Rate meals on a 1-10 scale based on how well they support recomp goals (building muscle while losing fat). Consider protein density, calorie efficiency, macro balance, and food quality. Return ONLY valid JSON, no markdown.`,
    messages: [{
      role: 'user',
      content: `Rate this meal for body recomposition:
Meal: ${name}
Calories: ${calories}
Protein: ${protein}g
Carbs: ${carbs}g  
Fat: ${fat}g
Daily goals: ${goals.calories} cal, ${goals.protein}g protein, ${goals.carbs}g carbs, ${goals.fat}g fat

Return JSON: {"score": 7.5, "notes": "2-3 sentence coaching note explaining the rating and any improvements"}`
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ score: 5, notes: 'Unable to rate at this time.' })
  }
}

