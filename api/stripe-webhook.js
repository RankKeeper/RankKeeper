// api/stripe-webhook.js
// Vercel serverless function — receives Stripe events and updates Supabase

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    const rawBody = await getRawBody(req)
    const sig = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const db = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY  // service key — bypasses RLS
  )

  const subscription = event.data.object

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(subscription.customer)
  const email = customer.email

  if (!email) {
    console.error('No email found for customer:', subscription.customer)
    return res.status(200).json({ received: true })
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const status = subscription.status  // 'active', 'trialing', 'past_due', 'canceled'
    const accessStatus = (status === 'active' || status === 'trialing') ? 'active' : 'inactive'
    const accessUntil = status === 'canceled'
      ? new Date().toISOString()
      : new Date(subscription.current_period_end * 1000).toISOString()

    const { error } = await db.from('profiles').upsert({
      email,
      access_status: accessStatus,
      access_until: accessUntil,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
    }, { onConflict: 'email' })

    if (error) console.error('Supabase upsert error:', error)
    else console.log(`Updated ${email} → ${accessStatus} until ${accessUntil}`)
  }

  if (event.type === 'customer.subscription.deleted') {
    const { error } = await db.from('profiles')
      .update({ access_status: 'inactive', access_until: new Date().toISOString() })
      .eq('email', email)

    if (error) console.error('Supabase update error:', error)
    else console.log(`Deactivated ${email}`)
  }

  return res.status(200).json({ received: true })
}
