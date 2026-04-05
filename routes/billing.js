import { Router } from 'express'
import { BillingController } from '../controllers/billing.js'

export const createBillingRouter = () => {
  const router = Router()
  const controller = new BillingController()

  router.get('/upgrade', controller.upgrade)
  router.get('/billing/metrics', controller.metrics)
  router.get('/billing/success', controller.success)
  router.get('/billing/cancel', controller.cancel)
  router.get('/api/pro-status', controller.status)

  return { router, controller }
}
