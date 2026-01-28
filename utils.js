import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// En algunas plataformas (especialmente serverless como Vercel) el working directory no es
// necesariamente la raíz del proyecto. Por eso, resolvemos rutas relativas con base en la
// ubicación de este archivo (utils.js), que en este proyecto vive junto a los .json.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProbablyAbsolute = (p) => {
  if (typeof p !== 'string') return false
  // /..., C:\..., \\server\share
  return path.isAbsolute(p) || /^[a-zA-Z]:\\/.test(p) || p.startsWith('\\\\')
}

const resolvePath = (p) => {
  if (!p) return p
  if (isProbablyAbsolute(p)) return p
  // Normaliza './file.json' -> 'file.json'
  const cleaned = p.replace(/^\.\//, '').replace(/^\.\\/, '')
  return path.join(__dirname, cleaned)
}

export const readJSON = async (filePath) => {
    try {
        const data = await fs.readFile(resolvePath(filePath), 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error)
        throw error
    }
}

export const writeJSON = async (filePath, data) => {
    try {
        await fs.writeFile(resolvePath(filePath), JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
        // En Vercel el filesystem suele ser read-only (salvo /tmp). Si alguien intenta
        // escribir, hacemos fallback a /tmp para no reventar en runtime.
        if (error?.code === 'EROFS' || error?.code === 'EPERM') {
          const tmpPath = path.join('/tmp', path.basename(String(filePath)))
          await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8')
          console.warn(`writeJSON: filesystem read-only; guardado en ${tmpPath}`)
          return
        }
        console.error('Error al escribir en el archivo JSON:', error)
        throw error
    }
}