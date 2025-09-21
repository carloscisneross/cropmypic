// Verifies Stripe webhooks (good to have, even if we don’t store state)
// NOTE: set STRIPE_WEBHOOK_SECRET in Vercel and connect this endpoint in Stripe Dashboard
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

module.exports = async (req, res) => {
  // Vercel gives you the raw body only if you disable body parsing. If your
  // project framework auto-parses the body, switch to "verify" mode (Next.js)
  // or use stripes' recommended adapter. For many plain Vercel Node APIs, this works:
  let rawBody = '';
  await new Promise(resolve => {
    req.on('data', c => (rawBody += c));
    req.on('end', resolve);
  });

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // You could log or trigger email, etc. No cookie can be set here.
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // If you later add a DB, you’d sync here.
        break;
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).end();
  }
};

// IMPORTANT: If you’re using Next.js, also export config to disable body parsing:
// export const config = { api: { bodyParser: false } }

