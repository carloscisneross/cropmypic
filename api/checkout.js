// /api/checkout.js
// Vercel/Node serverless function to create a Stripe Checkout Session (subscription)

const Stripe = require('stripe');

// 1) Make sure STRIPE_SECRET_KEY and STRIPE_PRICE_ID are set in your Vercel env vars.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId } = (req.body || {});
    const price = priceId || process.env.STRIPE_PRICE_ID; // fallback to env
    if (!price) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    // Build origin for redirect URLs
    const origin =
      req.headers.origin ||
      (req.headers.host ? `https://${req.headers.host}` : 'https://cropmypic.vercel.app');

    // Create a Checkout Session for a subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      payment_method_types: ['card'],
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};

