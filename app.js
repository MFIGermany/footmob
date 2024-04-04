import { createFootMobRouter } from './routes/footmob.js'
import { corsMiddleware } from './middlewares/cors.js'
import express, { json } from 'express'

import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

export const createApp = () => {
  const app = express()
  app.use(json())
  app.use(corsMiddleware())
  app.disable('x-powered-by')

  app.use(express.urlencoded({extended: false}))

  const URL = process.env.URL
  const USER = process.env.USER

  const url = URL + '?user=' + USER + '&sortOnClient=true&countryCode=BRA'

  app.use('/footmob', createFootMobRouter({ url }))

  const PORT = process.env.PORT ?? 3000

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}

createApp()