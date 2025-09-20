// /api/checkout.js
const Stripe = require('stripe');

// Secret must be a **standard** secret key (sk_live_...), not a restricted key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = async (req, res) => {
  // CORS (safe even if same-origin)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ Handle both string and already-parsed JSON bodies
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const price = body.priceId || process.env.STRIPE_PRICE_ID;
    if (!price) return res.status(400).json({ error: 'Missing priceId' });

    // Build success/cancel URLs from origin
    const origin =
      req.headers.origin ||
      (req.headers.host ? `https://${req.headers.host}` : 'https://cropmypic.vercel.app');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('STRIPE CHECKOUT ERROR:', {
      message: err.message,
      type: err.type,
      code: err.code,
    });
    // Return error details to help you debug (remove details in prod if you like)
    return res.status(500).json({ error: err.message, type: err.type, code: err.code });
  }
};

