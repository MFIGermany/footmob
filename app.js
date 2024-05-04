import { createFootMobRouter } from './routes/footmob.js'
import express, { json } from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

export const createApp = () => {
  const app = express()
  app.use(json())
  app.use(cors())
  app.disable('x-powered-by')

  app.use(express.static(path.join(__dirname, './static/public')))
  
  app.set('views', path.join(__dirname, './static/views'))
  app.set("view engine", "ejs")

  // Para recibir los valores por POST
  app.use(express.urlencoded({extended: false}))

  const URL = process.env.URL

  app.use('/footmob', createFootMobRouter({ url: URL }))
  app.use('/footlive', createFootMobRouter({ url: URL }))

  const PORT = process.env.PORT ?? 3000

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}

createApp()