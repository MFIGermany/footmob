import { PaypalController } from '../controllers/paypal.js'
import { Router } from 'express'

export const createPaypalRouter = () => {
    const paypalRouter = Router()

    const paypalController = new PaypalController()

    paypalRouter.post('/create-donation', paypalController.createPayment)

    return paypalRouter
}

