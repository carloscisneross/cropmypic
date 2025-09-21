// Called by Stripe after successful payment (via success_url)
// We fetch the session, pull out the customer id, set a cookie, and send the user home.
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

function setCookie(res, name, value, days = 365) {
  const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `Expires=${expires}`,
    'Path=/',
    'SameSite=Lax',
    'Secure',            // your site is HTTPS on Vercel
    'HttpOnly'           // JS can’t read it; use /api/me to check status
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

module.exports = async (req, res) => {
  try {
    const { session_id } = req.query || {};
    if (!session_id) {
      // If someone hits this without a session id, just go home.
      return res.redirect(302, '/');
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer'],
    });

    // session.customer can be a string or an object (expanded). We need the id.
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

    if (customerId) {
      // Store the Stripe customer id in a cookie
      setCookie(res, 'cmp_cust', customerId);
    }

    // Go back to the app (optional flag for a one-time “thanks” toast)
    return res.redirect(302, '/?checkout=success');
  } catch (err) {
    console.error('after-checkout error', err);
    return res.redirect(302, '/?checkout=error');
  }
};
