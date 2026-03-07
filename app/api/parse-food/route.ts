import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  const { text, photo, meal } = await request.json()

  const messages: any[] = []

  if (photo) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo } },
        { type: 'text', text: `Parse the food items from this image${text ? ` and this description: "${text}"` : ''}. Return JSON only, no markdown.` }
      ]
    })
  } else {
    messages.push({
      role: 'user',
      content: `Parse these food items: "${text}". Return JSON only, no markdown.`
    })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are a nutrition parser. Given food descriptions or images, extract individual food items with accurate macros.
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{"items":[{"name":"Food Name","calories":000,"protein":00,"carbs":00,"fat":00}]}
Use realistic USDA-based nutrition values. If a quantity is specified, scale accordingly.`,
    messages
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ items: [] })
  }
}

