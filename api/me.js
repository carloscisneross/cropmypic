// pages/api/me.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  try {
    const cookie = req.headers.cookie || '';
    const token = (cookie.match(/(?:^|;\s*)cmp_pro=([^;]+)/) || [])[1];
    if (!token) return res.json({ pro: false });

    const decoded = jwt.verify(token, process.env.COOKIE_SECRET);
    return res.json({ pro: decoded?.plan === 'pro', customer: decoded?.customer || null });
  } catch {
    return res.json({ pro: false });
  }
}
