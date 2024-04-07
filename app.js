import { createFootMobRouter } from './routes/footmob.js'
import express, { json } from 'express'
import cors from 'cors'

import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

export const createApp = () => {
  const app = express()
  app.use(json())
  app.use(cors())
  app.disable('x-powered-by')

  // Para recibir los valores por POST
  app.use(express.urlencoded({extended: false}))

  const URL = process.env.URL

  app.use('/footmob', createFootMobRouter({ url: URL }))

  const PORT = process.env.PORT ?? 3000

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}

createApp()