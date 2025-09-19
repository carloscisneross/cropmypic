// pages/api/webhook.js
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // You could store mapping customer <-> status in your DB
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed':
        // In a real app, update your DB to reflect non-pro state.
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
}
