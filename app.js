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

  app.get('/', (req, res) => {
    res.redirect('/footlive')
  })

  // Ruta para servir archivos de texto
  app.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, `./${filename}`);

    // Verifica si el archivo existe
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        // Si ocurre un error al leer el archivo, devuelve un error 500
        res.status(500).send('Error interno del servidor')
      } else {
        // Obtener la extensión del archivo
        const extname = path.extname(filePath);
        
        // Establecer el tipo de contenido basado en la extensión del archivo
        let contentType;
        if (extname === '.xml') {
          contentType = 'application/xml'
        } else if (extname === '.txt') {
          contentType = 'text/plain'
        } else {
          contentType = 'text/plain' // Tipo de contenido predeterminado
        }

        // Establecer el tipo de contenido en el encabezado de la respuesta
        res.type(contentType).send(data)
      }
    })
  })

  const PORT = process.env.PORT ?? 3000

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}

createApp()