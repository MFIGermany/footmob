import { UserController } from '../controllers/user.js'
import { Router } from 'express'

export const createUserRouter = () => {
    const userRouter = Router()

    const userController = new UserController()

    userRouter.get('/singin', userController.singin)

    return userRouter
}

