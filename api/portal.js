// pages/api/portal.js
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const cookie = req.headers.cookie || '';
    const token = (cookie.match(/(?:^|;\s*)cmp_pro=([^;]+)/) || [])[1];
    if (!token) return res.status(401).send('Not Pro');

    const decoded = jwt.verify(token, process.env.COOKIE_SECRET);
    const customer = decoded.customer;

    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: process.env.DOMAIN + '/'
    });

    return res.redirect(portal.url);
  } catch (e) {
    console.error(e);
    res.status(401).send('Unauthorized');
  }
}
