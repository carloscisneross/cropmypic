// Creates a Customer Portal session using the customer id from the cookie
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const customerId = getCookie(req, 'cmp_cust');
    if (!customerId) return res.status(401).json({ error: 'Not signed in' });

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('portal error', err);
    return res.status(500).json({ error: err.message || 'Portal failed' });
  }
};

