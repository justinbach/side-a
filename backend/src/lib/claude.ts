import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type AlbumExtraction = {
  title: string | null
  artist: string | null
  confidence: 'high' | 'medium' | 'low'
}

export type Point = {
  x: number
  y: number
}

export type BoundingBox = {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

export type AlbumBoundsAnalysis = {
  albumDetected: boolean
  boundingBox: BoundingBox | null
  rotationDegrees: number
  confidence: 'high' | 'medium' | 'low'
}

export async function extractAlbumInfo(imageBase64: string, mimeType: string): Promise<AlbumExtraction> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
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

Step 1: Read any visible text on the cover — title and artist name are usually printed prominently.

Step 2: If the cover has little or no readable text, use your visual knowledge of iconic album artwork to identify the album. For example: a prism refracting a rainbow on a black background is "The Dark Side of the Moon" by Pink Floyd; people on a zebra crossing is "Abbey Road" by The Beatles; a banana is "The Velvet Underground & Nico" by The Velvet Underground; and so on. Apply the same reasoning to any iconic artwork you recognise.

Respond ONLY with a JSON object in this exact format:
{
  "title": "Album Title Here",
  "artist": "Artist Name Here",
  "confidence": "high" | "medium" | "low"
}

Rules:
- If you can clearly read both title and artist (or confidently identify iconic artwork), set confidence to "high"
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

export async function rankAlbumsForContext(
  context: string,
  albums: { id: string; title: string; artist: string }[]
): Promise<string[]> {
  if (albums.length === 0) return []

  const albumList = albums
    .map((a, i) => `${i + 1}. ID: ${a.id} | "${a.title}" by ${a.artist}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system:
      'You are a music recommender helping a vinyl collector choose what to listen to next. ' +
      'Given a listening context and a list of albums, pick and rank the best fits. ' +
      'Respond ONLY with a valid JSON array of album IDs (strings) in ranked order, no other text.',
    messages: [
      {
        role: 'user',
        content: `Listening context: ${context}\n\nAlbums to choose from:\n${albumList}\n\nReturn a JSON array of up to 8 album IDs, best fit first. Example: ["id1","id2","id3"]`,
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') return []

  try {
    const parsed = JSON.parse(textContent.text)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, 8)
  } catch {
    return []
  }
}

export async function analyzeAlbumBounds(imageBase64: string, mimeType: string): Promise<AlbumBoundsAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
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
            text: `You are analyzing a photo that may contain a vinyl record album cover. Identify the album cover's boundaries and orientation.

Respond ONLY with a JSON object in this exact format:
{
  "albumDetected": true,
  "boundingBox": {
    "topLeft": { "x": 0.1, "y": 0.1 },
    "topRight": { "x": 0.9, "y": 0.1 },
    "bottomRight": { "x": 0.9, "y": 0.9 },
    "bottomLeft": { "x": 0.1, "y": 0.9 }
  },
  "rotationDegrees": 0,
  "confidence": "high"
}

Instructions:
- All coordinates are normalized 0.0 to 1.0 relative to image dimensions (0,0 is top-left, 1,1 is bottom-right)
- The corners should trace the album cover clockwise starting from top-left AS IT APPEARS in the image
- rotationDegrees is the clockwise rotation needed to make the album upright (-45 to 45 range)
- If no album cover is visible, set albumDetected to false and boundingBox to null
- confidence: "high" if boundaries are clear, "medium" if partially obscured, "low" if guessing
- Do not include any other text, just the JSON object`,
          },
        ],
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    return { albumDetected: false, boundingBox: null, rotationDegrees: 0, confidence: 'low' }
  }

  try {
    const parsed = JSON.parse(textContent.text)
    return {
      albumDetected: parsed.albumDetected ?? false,
      boundingBox: parsed.boundingBox ?? null,
      rotationDegrees: parsed.rotationDegrees ?? 0,
      confidence: parsed.confidence ?? 'low',
    }
  } catch {
    return { albumDetected: false, boundingBox: null, rotationDegrees: 0, confidence: 'low' }
  }
}
