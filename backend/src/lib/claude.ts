import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type AlbumExtraction = {
  title: string | null
  artist: string | null
  confidence: 'high' | 'medium' | 'low'
}

export async function extractAlbumInfo(imageBase64: string, mimeType: string): Promise<AlbumExtraction> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `You are analyzing an image of a vinyl record album cover or label. Extract the album title and artist name.

Respond ONLY with a JSON object in this exact format:
{
  "title": "Album Title Here",
  "artist": "Artist Name Here",
  "confidence": "high" | "medium" | "low"
}

Rules:
- If you can clearly read both title and artist, set confidence to "high"
- If you can mostly determine them but aren't 100% sure, set confidence to "medium"
- If you're guessing or the image is unclear, set confidence to "low"
- If you cannot determine a field at all, set it to null
- Do not include any other text, just the JSON object`,
          },
        ],
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    return { title: null, artist: null, confidence: 'low' }
  }

  try {
    const parsed = JSON.parse(textContent.text)
    return {
      title: parsed.title || null,
      artist: parsed.artist || null,
      confidence: parsed.confidence || 'low',
    }
  } catch {
    return { title: null, artist: null, confidence: 'low' }
  }
}
