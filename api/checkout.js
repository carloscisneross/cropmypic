// Minimal Checkout Session creator (subscription)
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId } = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
    const price = priceId || process.env.STRIPE_PRICE_ID;
    if (!price) return res.status(400).json({ error: 'Missing priceId' });

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${origin}/api/after-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('checkout error', err);
    return res.status(500).json({ error: err.message || 'Checkout failed' });
  }
};


