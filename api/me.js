// Returns { isPro: boolean } by checking Stripe directly using the customer id from the cookie
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const cookies = header.split(';').map(v => v.trim().split('='));
  for (const [k, v] of cookies) if (k === name) return decodeURIComponent(v || '');
  return null;
}

module.exports = async (req, res) => {
  try {
    const customerId = getCookie(req, 'cmp_cust');
    if (!customerId) {
      return res.status(200).json({ isPro: false });
    }

    // Ask Stripe if this customer has at least one active/trialing subscription
    // (limit=1 for speed; if you ever have multiple prices, you can filter)
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method'],
      limit: 3,
    });

    const isPro = subs.data.some(s =>
      s.status === 'active' || s.status === 'trialing'
    );

    return res.status(200).json({ isPro });
  } catch (err) {
    console.error('/api/me error', err);
    // If Stripe is down or something fails, default to Free
    return res.status(200).json({ isPro: false });
  }
};
