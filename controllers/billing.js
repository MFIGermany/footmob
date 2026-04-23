import Stripe from 'stripe'
import { BillingModel } from '../models/billing.js'

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://football-live.up.railway.app'
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || ''
const STRIPE_PRICE_BRL_ID = process.env.STRIPE_PRICE_BRL_ID || ''

export async function detectCountry(req) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress

  // 1. intentar header directo (si existe)
  let country = req.headers['cf-ipcountry']

  // 2. fallback a API
  if (!country && ip) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await res.json()
      country = data.country_code
    } catch (err) {
      console.error('Geo lookup error:', err)
    }
  }

  return country || 'US'
}

function renderHtml({ title, message, actionHref = '', actionText = '', secondaryHref = '', secondaryText = '' }) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background:#101014; color:#f5f5f7; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:24px; }
    .card { max-width:460px; width:100%; background:#17171d; border:1px solid #2a2a33; border-radius:16px; padding:24px; box-shadow:0 12px 36px rgba(0,0,0,.3); }
    h1 { margin:0 0 12px; font-size:24px; }
    p { color:#d3d3d8; line-height:1.5; margin:0 0 16px; }
    .actions { display:flex; gap:12px; flex-wrap:wrap; }
    a { text-decoration:none; }
    .primary { background:#eb5052; color:#fff; padding:12px 16px; border-radius:12px; font-weight:700; }
    .secondary { background:#2b2b33; color:#fff; padding:12px 16px; border-radius:12px; }
    code { background:#22222a; color:#fff; padding:2px 6px; border-radius:6px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="actions">
      ${actionHref ? `<a class="primary" href="${actionHref}">${actionText}</a>` : ''}
      ${secondaryHref ? `<a class="secondary" href="${secondaryHref}">${secondaryText}</a>` : ''}
    </div>
  </div>
</body>
</html>`
}

export class BillingController {
  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      console.warn('STRIPE_SECRET_KEY no configurada')
    }

    this.stripe = secretKey ? new Stripe(secretKey) : null
    this.billingModel = new BillingModel()
    this.statusCache = new Map()
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      dbReads: 0
    }
  }

  getCacheTtl(record) {
    const now = Date.now()
    const nowDate = new Date()

    const expiresAt = record?.current_period_end ? new Date(record.current_period_end) : null
    const hasNotExpired = !expiresAt || expiresAt > nowDate

    const active = Boolean(
      record &&
      record.status === 'active' &&
      hasNotExpired
    )

    if (active && expiresAt) {
      const msUntilExpire = expiresAt.getTime() - nowDate.getTime()
      const maxTtl = 6 * 60 * 60 * 1000 // 6 horas
      const safetyMargin = 60 * 1000 // 1 minuto
      const minTtl = 30 * 1000 // 30 segundos

      return now + Math.max(minTtl, Math.min(msUntilExpire, maxTtl) - safetyMargin)
    }

    return now + 20 * 60 * 1000 // 20 min para free/inactive
  }

  buildStatusResponse(installId, record) {
    const now = new Date()
    const expiresAt = record?.current_period_end ? new Date(record.current_period_end) : null
    const hasNotExpired = !expiresAt || expiresAt > now

    const active = Boolean(
      record &&
      record.status === 'active' &&
      hasNotExpired
    )

    return {
      ok: true,
      installId,
      plan: active ? 'pro' : 'free',
      active,
      status: record?.status || 'inactive',
      expiresAt: record?.current_period_end || null,
      cancelAtPeriodEnd: Boolean(record?.cancel_at_period_end),
      updatedAt: record?.updated_at || null
    }
  }

  invalidateStatusCache(installId) {
    if (!installId) return
    this.statusCache.delete(String(installId))
  }

  upgrade = async (req, res) => {
    try {
      const installId = String(req.query.install_id || '').trim()
      if (!installId) {
        return res.status(400).send(renderHtml({
          title: 'Instalación inválida',
          message: 'Falta el parámetro install_id. Abre el checkout desde la extensión.'
        }))
      }

      const country = await detectCountry(req)

      const selectedPriceId =
        country === 'BR'
          ? STRIPE_PRICE_BRL_ID
          : STRIPE_PRICE_ID

      if (!this.stripe || !selectedPriceId) {
        return res.status(500).send(renderHtml({
          title: 'Configuración incompleta',
          message: 'Falta configurar Stripe en el servidor. Añade STRIPE_SECRET_KEY y STRIPE_PRICE_ID en Railway.'
        }))
      }

      const cancelUrl = `${APP_BASE_URL}/billing/cancel?install_id=${encodeURIComponent(installId)}`
      const successUrl = `${APP_BASE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`

      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: selectedPriceId,
            quantity: 1
          }
        ],
        client_reference_id: installId,
        metadata: {
          install_id: installId
        },
        subscription_data: {
          metadata: {
            install_id: installId
          }
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true
      })

      await this.billingModel.upsertPendingCheckout({
        installId,
        checkoutSessionId: session.id,
        checkoutUrl: session.url,
        priceId: selectedPriceId
      })

      this.invalidateStatusCache(installId)

      return res.redirect(303, session.url)
    } catch (error) {
      console.error('Error en /upgrade:', error)
      return res.status(500).send(renderHtml({
        title: 'No se pudo iniciar el pago',
        message: 'Hubo un problema al crear la sesión de Stripe. Revisa los logs del servidor.'
      }))
    }
  }

  success = async (req, res) => {
    try {
      const sessionId = String(req.query.session_id || '').trim()
      if (!sessionId) {
        return res.status(400).send(renderHtml({
          title: 'Pago incompleto',
          message: 'No se recibió session_id. Si ya pagaste, vuelve a abrir la extensión para verificar tu estado.'
        }))
      }

      if (!this.stripe) {
        return res.status(500).send(renderHtml({
          title: 'Servidor sin Stripe',
          message: 'El servidor no tiene Stripe configurado todavía.'
        }))
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'line_items.data.price']
      })

      if (session.payment_status !== 'paid' && session.status !== 'complete') {
        return res.status(400).send(renderHtml({
          title: 'Pago no confirmado',
          message: 'Stripe todavía no marcó el pago como completado. Espera unos segundos y vuelve a abrir la extensión.'
        }))
      }

      const installId = await this.billingModel.activateFromCheckoutSession(session)

      this.invalidateStatusCache(installId)

      return res.send(renderHtml({
        title: 'Football Live Pro activado',
        message: `Tu suscripción Pro ya quedó activada para la instalación <code>${installId}</code>. Vuelve a abrir la extensión y actualizará el plan automáticamente.`,
        actionHref: APP_BASE_URL,
        actionText: 'Volver al sitio'
      }))
    } catch (error) {
      console.error('Error en /billing/success:', error)
      return res.status(500).send(renderHtml({
        title: 'No se pudo validar el pago',
        message: 'Hubo un problema validando la sesión de Stripe. Revisa los logs del servidor.'
      }))
    }
  }

  cancel = async (req, res) => {
    return res.send(renderHtml({
      title: 'Pago cancelado',
      message: 'No se realizó ningún cargo. Puedes volver a intentarlo desde la extensión.',
      actionHref: APP_BASE_URL,
      actionText: 'Volver al sitio'
    }))
  }

  status = async (req, res) => {
    try {
      const installId = String(req.query.install_id || '').trim()
      if (!installId) {
        return res.status(400).json({ ok: false, error: 'install_id requerido' })
      }

      const now = Date.now()
      const cached = this.statusCache.get(installId)

      if (cached && cached.nextCheckAt > now) {
        this.stats.cacheHits += 1
        return res.json(cached.response)
      }

      this.stats.cacheMisses += 1
      this.stats.dbReads += 1

      const record = await this.billingModel.getStatusByInstallId(installId)
      const response = this.buildStatusResponse(installId, record)
      const nextCheckAt = this.getCacheTtl(record)

      this.statusCache.set(installId, {
        response,
        nextCheckAt
      })

      return res.json(response)
    } catch (error) {
      console.error('Error en /api/pro-status:', error)
      return res.status(500).json({ ok: false, error: 'No se pudo consultar el estado' })
    }
  }

  metrics = async (req, res) => {
    const total = this.stats.cacheHits + this.stats.cacheMisses
    const hitRate = total > 0
      ? ((this.stats.cacheHits / total) * 100).toFixed(2)
      : '0.00'

    return res.json({
      ok: true,
      stats: {
        ...this.stats,
        totalRequests: total,
        hitRate: `${hitRate}%`
      },
      cacheSize: this.statusCache.size
    })
  }

  webhook = async (req, res) => {
    try {
      if (!this.stripe) {
        return res.status(500).send('Stripe no configurado')
      }

      const signature = req.headers['stripe-signature']
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!webhookSecret) {
        return res.status(500).send('Falta STRIPE_WEBHOOK_SECRET')
      }

      const event = this.stripe.webhooks.constructEvent(req.body, signature, webhookSecret)

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object

          if (session.mode === 'subscription') {
            const fullSession = await this.stripe.checkout.sessions.retrieve(session.id, {
              expand: ['subscription', 'line_items.data.price']
            })

            const installId = await this.billingModel.activateFromCheckoutSession(fullSession)
            this.invalidateStatusCache(installId)
          }
          break
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const installId = await this.billingModel.upsertFromSubscription(event.data.object, event.type)
          this.invalidateStatusCache(installId)
          break
        }

        case 'invoice.payment_failed': {
          const installId = await this.billingModel.markPaymentFailedFromInvoice(event.data.object, event.type)
          this.invalidateStatusCache(installId)
          break
        }

        default:
          break
      }

      return res.json({ received: true })
    } catch (error) {
      console.error('Error en webhook Stripe:', error.message)
      return res.status(400).send(`Webhook Error: ${error.message}`)
    }
  }
}