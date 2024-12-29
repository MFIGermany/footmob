import { UserController } from '../controllers/user.js'
import { Router } from 'express'
import passport from 'passport'

export const createUserRouter = () => {
    const userRouter = Router()

    const userController = new UserController()

    // Ruta para iniciar sesión con Google
    userRouter.get('/auth/google', passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    }))
  
    // Ruta de callback de Google
    userRouter.get('/auth/google/footlive', passport.authenticate('google', { 
        failureRedirect: '/login' }), 
        userController.singin
    )
  
    // Ruta para cerrar sesión
    userRouter.get('/logout', (req, res) => {
        req.logout((err) => {
        if (err) return next(err)
            res.redirect('/')
        })
    })

    // Ruta para validar captcha
    userRouter.post('/getmonero', userController.recaptcha)
    userRouter.post('/withdraw', userController.withdraw)
    userRouter.post('/savedir', userController.savedir)
    userRouter.get('/wallet', userController.wallet)

    return userRouter
}

