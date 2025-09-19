// pages/api/after-checkout.js
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.redirect('/');

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    // Verify it really completed & has a subscription
    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return res.redirect('/?pro=notpaid');
    }

    // Get the Stripe customer id (we’ll use this in portal + webhook)
    const customerId = session.customer;

    // Sign a short JWT with customer id and plan
    const token = jwt.sign(
      { customer: customerId, plan: 'pro' },
      process.env.COOKIE_SECRET,
      { expiresIn: '365d' }
    );

    // Set httpOnly cookie
    res.setHeader('Set-Cookie', [
      `cmp_pro=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*365}`
    ]);

    return res.redirect('/');
  } catch (e) {
    console.error(e);
    return res.redirect('/?pro=error');
  }
}
