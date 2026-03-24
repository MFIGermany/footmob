import { createConnection } from './connection.js'

export class BillingModel {
  constructor() {
    this.connection = null
    this.ready = this.init()
  }

  async init() {
    try {
      this.connection = await createConnection()
      await this.ensureTables()
      console.log('BillingModel listo')
    } catch (error) {
      console.error('Error al inicializar BillingModel:', error.message)
      throw error
    }
  }

  async ensureTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS extension_subscriptions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        install_id VARCHAR(120) NOT NULL,
        plan VARCHAR(30) NOT NULL DEFAULT 'pro',
        status VARCHAR(40) NOT NULL DEFAULT 'pending',
        stripe_customer_id VARCHAR(120) DEFAULT NULL,
        stripe_subscription_id VARCHAR(120) DEFAULT NULL,
        stripe_checkout_session_id VARCHAR(120) DEFAULT NULL,
        stripe_price_id VARCHAR(120) DEFAULT NULL,
        checkout_url TEXT DEFAULT NULL,
        current_period_end DATETIME DEFAULT NULL,
        cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
        activated_at DATETIME DEFAULT NULL,
        last_event_type VARCHAR(120) DEFAULT NULL,
        raw_payload JSON DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_extension_subscriptions_install_id (install_id),
        UNIQUE KEY uq_extension_subscriptions_subscription_id (stripe_subscription_id),
        KEY idx_extension_subscriptions_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `

    await this.connection.execute(sql)
  }

  async upsertPendingCheckout({ installId, checkoutSessionId, checkoutUrl, priceId }) {
    await this.ready

    const sql = `
      INSERT INTO extension_subscriptions (
        install_id, status, stripe_checkout_session_id, checkout_url, stripe_price_id
      ) VALUES (?, 'pending', ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = 'pending',
        stripe_checkout_session_id = VALUES(stripe_checkout_session_id),
        checkout_url = VALUES(checkout_url),
        stripe_price_id = VALUES(stripe_price_id),
        updated_at = CURRENT_TIMESTAMP
    `

    await this.connection.execute(sql, [installId, checkoutSessionId, checkoutUrl, priceId])
  }

  normalizeStatus(status) {
    const value = String(status || '').toLowerCase()

    if (['active', 'trialing'].includes(value)) return 'active'
    if (['canceled', 'cancelled', 'unpaid', 'incomplete_expired', 'past_due', 'paused'].includes(value)) return 'inactive'
    if (!value) return 'pending'
    return value
  }

  unixToMysqlDate(unixSeconds) {
    if (!unixSeconds) return null
    const date = new Date(Number(unixSeconds) * 1000)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 19).replace('T', ' ')
  }

  async activateFromCheckoutSession(session) {
	  await this.ready

	  const installId = session?.client_reference_id || session?.metadata?.install_id
	  if (!installId) {
		throw new Error('Checkout session sin install_id')
	  }

	  const subscriptionId = typeof session.subscription === 'string'
		? session.subscription
		: session.subscription?.id || null

	  const customerId = typeof session.customer === 'string'
		? session.customer
		: session.customer?.id || null

	  const priceId = session?.line_items?.data?.[0]?.price?.id || null

	  const subscription = typeof session.subscription === 'object'
		? session.subscription
		: null

	  const sql = `
		INSERT INTO extension_subscriptions (
		  install_id,
		  plan,
		  status,
		  stripe_customer_id,
		  stripe_subscription_id,
		  stripe_checkout_session_id,
		  stripe_price_id,
		  current_period_end,
		  cancel_at_period_end,
		  activated_at,
		  last_event_type,
		  raw_payload
		) VALUES (?, 'pro', 'active', ?, ?, ?, ?, ?, ?, NOW(), 'checkout.session.completed', ?)
		ON DUPLICATE KEY UPDATE
		  plan = 'pro',
		  status = 'active',
		  stripe_customer_id = VALUES(stripe_customer_id),
		  stripe_subscription_id = VALUES(stripe_subscription_id),
		  stripe_checkout_session_id = VALUES(stripe_checkout_session_id),
		  stripe_price_id = COALESCE(VALUES(stripe_price_id), stripe_price_id),
		  current_period_end = COALESCE(VALUES(current_period_end), current_period_end),
		  cancel_at_period_end = VALUES(cancel_at_period_end),
		  activated_at = COALESCE(activated_at, NOW()),
		  last_event_type = 'checkout.session.completed',
		  raw_payload = VALUES(raw_payload),
		  updated_at = CURRENT_TIMESTAMP
	  `

	  await this.connection.execute(sql, [
		installId,
		customerId,
		subscriptionId,
		session.id,
		priceId,
		this.unixToMysqlDate(subscription?.current_period_end),
		subscription?.cancel_at_period_end ? 1 : 0,
		JSON.stringify(session)
	  ])

	  return installId
	}

  async upsertFromSubscription(subscription, eventType = 'customer.subscription.updated') {
    await this.ready

    const installId = subscription?.metadata?.install_id || null
    const subscriptionId = subscription?.id || null
    const customerId = typeof subscription?.customer === 'string'
      ? subscription.customer
      : subscription?.customer?.id || null
    const priceId = subscription?.items?.data?.[0]?.price?.id || null
    const normalizedStatus = this.normalizeStatus(subscription?.status)

    if (installId) {
      const sql = `
        INSERT INTO extension_subscriptions (
          install_id,
          plan,
          status,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          current_period_end,
          cancel_at_period_end,
          activated_at,
          last_event_type,
          raw_payload
        ) VALUES (?, 'pro', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          plan = 'pro',
          status = VALUES(status),
          stripe_customer_id = VALUES(stripe_customer_id),
          stripe_subscription_id = VALUES(stripe_subscription_id),
          stripe_price_id = COALESCE(VALUES(stripe_price_id), stripe_price_id),
          current_period_end = VALUES(current_period_end),
          cancel_at_period_end = VALUES(cancel_at_period_end),
          activated_at = COALESCE(activated_at, VALUES(activated_at)),
          last_event_type = VALUES(last_event_type),
          raw_payload = VALUES(raw_payload),
          updated_at = CURRENT_TIMESTAMP
      `

      await this.connection.execute(sql, [
        installId,
        normalizedStatus,
        customerId,
        subscriptionId,
        priceId,
        this.unixToMysqlDate(subscription?.current_period_end),
        subscription?.cancel_at_period_end ? 1 : 0,
        normalizedStatus === 'active' ? this.unixToMysqlDate(Math.floor(Date.now()/1000)) : null,
        eventType,
        JSON.stringify(subscription)
      ])
      return
    }

    if (subscriptionId) {
      const sql = `
        UPDATE extension_subscriptions
        SET status = ?,
            stripe_customer_id = COALESCE(?, stripe_customer_id),
            stripe_price_id = COALESCE(?, stripe_price_id),
            current_period_end = ?,
            cancel_at_period_end = ?,
            last_event_type = ?,
            raw_payload = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = ?
      `

      await this.connection.execute(sql, [
        normalizedStatus,
        customerId,
        priceId,
        this.unixToMysqlDate(subscription?.current_period_end),
        subscription?.cancel_at_period_end ? 1 : 0,
        eventType,
        JSON.stringify(subscription),
        subscriptionId
      ])
    }
  }
  
  async markPaymentFailedFromInvoice(invoice, eventType = 'invoice.payment_failed') {
	  await this.ready

	  const subscriptionId = typeof invoice?.subscription === 'string'
		? invoice.subscription
		: invoice?.subscription?.id || null

	  const customerId = typeof invoice?.customer === 'string'
		? invoice.customer
		: invoice?.customer?.id || null

	  if (!subscriptionId) return

	  const sql = `
		UPDATE extension_subscriptions
		SET status = 'past_due',
			stripe_customer_id = COALESCE(?, stripe_customer_id),
			last_event_type = ?,
			raw_payload = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE stripe_subscription_id = ?
	  `

	  await this.connection.execute(sql, [
		customerId,
		eventType,
		JSON.stringify(invoice),
		subscriptionId
	  ])
	}

  async getStatusByInstallId(installId) {
    await this.ready

    const sql = `
	  SELECT install_id, plan, status, current_period_end, cancel_at_period_end,
			 stripe_subscription_id, stripe_customer_id, updated_at, activated_at
	  FROM extension_subscriptions
	  WHERE install_id = ?
	  ORDER BY updated_at DESC
	  LIMIT 1
	`

    const [rows] = await this.connection.execute(sql, [installId])
    return rows[0] || null
  }
}
