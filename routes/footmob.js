import { FootMobController } from '../controllers/footmob.js'
import { Router } from 'express'

export const createFootMobRouter = ({ url }) => {
  const footmobRouter = Router()

  const footMobController = new FootMobController({ url })

  // Aqui van las llamadas a los metodos
  footmobRouter.post('/', footMobController.index)
  footmobRouter.get('/news', footMobController.news)
  footmobRouter.get('/leagues/:lang', footMobController.leagues)

  return footmobRouter
}
