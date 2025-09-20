// /api/checkout.js
// Vercel/Node serverless function to create a Stripe Checkout Session (subscription)

const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://cropmypic.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body;
    try {
      body = JSON.parse(req.body);
    } catch (e) {
      body = req.body;
    }
    
    const { priceId } = body || {};
    const price = priceId || process.env.STRIPE_PRICE_ID;
    
    if (!price) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    // Build origin for redirect URLs
    const origin = req.headers.origin || 
                   (req.headers.host ? `https://${req.headers.host}` : 'https://cropmypic.vercel.app');

    // Create a Checkout Session for a subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return res.status(200).json({ 
      id: session.id, 
      url: session.url 
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};
