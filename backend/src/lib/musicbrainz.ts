const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2'
const USER_AGENT = 'SideA/1.0.0 (vinyl-collection-tracker)'

// Rate limiting: MusicBrainz requires max 1 request per second
let lastRequestTime = 0
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()

  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  })
}

export type MusicBrainzRelease = {
  id: string
  title: string
  artist: string
  releaseDate: string | null
  label: string | null
  country: string | null
  trackCount: number
  tracks: { position: number; title: string; length: number | null }[]
  coverArtUrl: string | null
}

type MBSearchResult = {
  releases: {
    id: string
    title: string
    date?: string
    country?: string
    'label-info'?: { label?: { name: string } }[]
    'artist-credit': { name: string; artist: { name: string } }[]
    'track-count': number
  }[]
}

type MBReleaseDetail = {
  id: string
  title: string
  date?: string
  country?: string
  'label-info'?: { label?: { name: string } }[]
  'artist-credit': { name: string; artist: { name: string } }[]
  media: {
    tracks: {
      position: number
      title: string
      length: number | null
    }[]
  }[]
}

export async function searchRelease(title: string, artist: string): Promise<MusicBrainzRelease | null> {
  // Search for the release
  const query = encodeURIComponent(`release:"${title}" AND artist:"${artist}"`)
  const searchUrl = `${MUSICBRAINZ_API}/release?query=${query}&limit=5&fmt=json`

  const searchResponse = await rateLimitedFetch(searchUrl)
  if (!searchResponse.ok) {
    console.error('MusicBrainz search failed:', searchResponse.status)
    return null
  }

  const searchData = (await searchResponse.json()) as MBSearchResult
  if (!searchData.releases || searchData.releases.length === 0) {
    // Try a more relaxed search with just the title
    const relaxedQuery = encodeURIComponent(`release:"${title}"`)
    const relaxedUrl = `${MUSICBRAINZ_API}/release?query=${relaxedQuery}&limit=5&fmt=json`
    const relaxedResponse = await rateLimitedFetch(relaxedUrl)

    if (!relaxedResponse.ok) return null
    const relaxedData = (await relaxedResponse.json()) as MBSearchResult
    if (!relaxedData.releases || relaxedData.releases.length === 0) return null
    searchData.releases = relaxedData.releases
  }

  const release = searchData.releases[0]

  // Get full release details including tracks
  const detailUrl = `${MUSICBRAINZ_API}/release/${release.id}?inc=recordings+artist-credits+labels&fmt=json`
  const detailResponse = await rateLimitedFetch(detailUrl)

  if (!detailResponse.ok) {
    console.error('MusicBrainz release detail failed:', detailResponse.status)
    return null
  }

  const detail = (await detailResponse.json()) as MBReleaseDetail

  // Get cover art from Cover Art Archive
  const coverArtUrl = await getCoverArtUrl(release.id)

  // Extract tracks from all media (discs)
  const tracks = detail.media.flatMap((media) =>
    media.tracks.map((track) => ({
      position: track.position,
      title: track.title,
      length: track.length,
    }))
  )

  return {
    id: release.id,
    title: detail.title,
    artist: detail['artist-credit'].map((ac) => ac.name).join(''),
    releaseDate: detail.date || null,
    label: detail['label-info']?.[0]?.label?.name || null,
    country: detail.country || null,
    trackCount: tracks.length,
    tracks,
    coverArtUrl,
  }
}

type CoverArtResponse = {
  images?: {
    front: boolean
    image: string
    thumbnails?: { large?: string }
  }[]
}

async function getCoverArtUrl(releaseId: string): Promise<string | null> {
  try {
    const response = await rateLimitedFetch(
      `https://coverartarchive.org/release/${releaseId}`
    )
    if (!response.ok) return null

    const data = (await response.json()) as CoverArtResponse
    const front = data.images?.find((img) => img.front)
    return front?.thumbnails?.large || front?.image || null
  } catch {
    return null
  }
}
