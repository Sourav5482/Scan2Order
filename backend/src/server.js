import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import connectDB from './config/db.js'
import menuRoutes from './routes/menuRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
  })
})

app.use('/menu', menuRoutes)
app.use('/order', orderRoutes)
app.use('/auth', authRoutes)

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

const startServer = async () => {
  try {
    await connectDB()

    app.listen(PORT, () => {
      console.log(`[SERVER] Restaurant QR backend running on port ${PORT}`)
    })
  } catch (error) {
    console.error('[SERVER] Startup failed:', error.message)
    process.exit(1)
  }
}

startServer()
