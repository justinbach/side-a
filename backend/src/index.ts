import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import recognizeRouter from './routes/recognize'
import lookupRouter from './routes/lookup'
import preprocessRouter from './routes/preprocess'
import recommendRouter from './routes/recommend'
import catalogSearchRouter from './routes/catalog-search'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, etc.)
    if (!origin) return callback(null, true)
    // Allow configured origin and localhost
    if (allowedOrigins.some(o => o === origin)) return callback(null, true)
    // Allow all Vercel deployments (preview + production)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/recognize', recognizeRouter)
app.use('/api/lookup', lookupRouter)
app.use('/api/preprocess', preprocessRouter)
app.use('/api/recommend', recommendRouter)
app.use('/api/catalog-search', catalogSearchRouter)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
