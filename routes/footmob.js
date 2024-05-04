import { FootMobController } from '../controllers/footmob.js'
import { Router } from 'express'

export const createFootMobRouter = ({ url }) => {
  const footmobRouter = Router()

  const footMobController = new FootMobController({ url })

  // Aqui van las llamadas a los metodos
  footmobRouter.post('/view', footMobController.view)
  footmobRouter.post('/', footMobController.index)
  footmobRouter.get('/', footMobController.view)
  footmobRouter.get('/news', footMobController.news)
  footmobRouter.get('/leagues/:lang', footMobController.leagues)

  return footmobRouter
}
