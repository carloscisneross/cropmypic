// pages/api/checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.PRICE_ID, quantity: 1 }],
      // After payment, user lands here; we'll set the cookie then redirect to "/"
      success_url: `${process.env.DOMAIN}/api/after-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/?pro=cancel`,
      allow_promotion_codes: true
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Cannot create session' });
  }
}
