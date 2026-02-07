import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import recognizeRouter from './routes/recognize'
import lookupRouter from './routes/lookup'
import preprocessRouter from './routes/preprocess'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/recognize', recognizeRouter)
app.use('/api/lookup', lookupRouter)
app.use('/api/preprocess', preprocessRouter)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
