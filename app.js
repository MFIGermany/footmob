import { createFootMobRouter } from './routes/footmob.js'
import express, { json } from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'url'
import fs from 'fs'

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

  // Ruta para servir archivos de texto
  app.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, `./${filename}`);

    // Verifica si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // Si el archivo no existe, devuelve un error 404
        res.status(404).send('Archivo no encontrado');
      } else {
        // Si el archivo existe, lee su contenido y envíalo como respuesta
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            // Si ocurre un error al leer el archivo, devuelve un error 500
            res.status(500).send('Error interno del servidor')
          } else {
            // Si se lee el archivo correctamente, envía el contenido como respuesta
            res.type('text/plain').send(data)
          }
        })
      }
    })
  })

  const PORT = process.env.PORT ?? 3000

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}

createApp()