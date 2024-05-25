import { FootMobController } from '../controllers/footmob.js'
import { Router } from 'express'

export const createFootMobRouter = ({ url }) => {
  const footmobRouter = Router()

  const footMobController = new FootMobController({ url })

  // Aqui van las llamadas a los metodos
  footmobRouter.post('/view', footMobController.view)
  footmobRouter.post('/', footMobController.index)
  footmobRouter.get('/', footMobController.matches)
  footmobRouter.get('/views/:lang?', footMobController.view)
  footmobRouter.get('/news/:lang?', footMobController.news)
  footmobRouter.get('/matches/:lang?', footMobController.matches)
  footmobRouter.get('/leagues/:lang', footMobController.leagues)

  return footmobRouter
}
