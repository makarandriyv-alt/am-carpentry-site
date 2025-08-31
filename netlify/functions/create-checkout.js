
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const data = JSON.parse(event.body || '{}');
    const currency = (data.currency || 'cad').toLowerCase();
    let line_items = data.lineItems;
    if (!line_items) {
      const amount = Math.round((Number(data.amount) || 0) * 100);
      if (!amount || amount < 1000) return { statusCode: 400, body: 'Amount too small' };
      line_items = [{
        price_data: { currency, product_data: { name: 'Deposit' }, unit_amount: amount },
        quantity: 1
      }];
    }
    const origin = event.headers.origin || `https://${process.env.URL || process.env.DEPLOY_PRIME_URL}`;
    const session = await stripe.checkout.sessions.create({
      mode: data.mode || 'payment',
      line_items,
      success_url: `${origin}/success.html?session_id={{CHECKOUT_SESSION_ID}}`,
      cancel_url: `${origin}/cancelled.html`
    });
    return { statusCode: 200, body: JSON.stringify({ id: session.id, url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
};
