const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// TASK 2: Create order in MongoDB, then create Stripe Checkout Session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { products, customer } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products found"
      });
    }

    // Calculate totals
    const subtotal = products.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
    const deliveryFee = 450;
    const totalAmount = subtotal + deliveryFee;

    // Create Order in MongoDB with pending status
    const order = await Order.create({
      customerName: customer?.fullName || 'Guest',
      email: customer?.email || 'guest@smartfit.com',
      phone: customer?.phone || '',
      shippingAddress: customer?.address || '',
      city: customer?.city || '',
      products: products.map(p => ({
        productId: p.id || p._id || '',
        name: p.name,
        image: p.image || '',
        size: p.size || '',
        color: p.color || '',
        quantity: p.quantity || 1,
        price: p.price
      })),
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    // Build Stripe line items
    const lineItems = products.map((product) => ({
      price_data: {
        currency: "lkr",
        product_data: {
          name: product.name,
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: product.quantity || 1,
    }));

    // Add delivery fee as a line item
    lineItems.push({
      price_data: {
        currency: "lkr",
        product_data: { name: "Delivery Fee" },
        unit_amount: deliveryFee * 100,
      },
      quantity: 1,
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "http://localhost:3000/payment-cancel",
      metadata: {
        orderId: order._id.toString()
      }
    });

    // Save stripe session ID to the order
    order.stripeSessionId = session.id;
    await order.save();

    console.log(`[Payment] Order ${order._id} created, Stripe session ${session.id}`);

    res.status(200).json({
      success: true,
      url: session.url,
      orderId: order._id
    });

  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// TASK 3: Stripe Webhook - handle checkout.session.completed
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For local development without webhook signing
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      try {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          stripeSessionId: session.id
        });
        console.log(`[Webhook] Order ${orderId} marked as paid and confirmed`);
      } catch (err) {
        console.error(`[Webhook] Failed to update order ${orderId}:`, err.message);
      }
    }
  }

  res.status(200).json({ received: true });
};

// TASK 3 supplement: Verify payment by session_id (called from frontend success page)
exports.verifySession = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Missing session_id' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Find and update the order
      const order = await Order.findOne({ stripeSessionId: session_id });

      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();
        console.log(`[VerifySession] Order ${order._id} confirmed via session verification`);
      }

      return res.status(200).json({
        success: true,
        orderId: order?._id,
        paymentStatus: 'paid'
      });
    }

    return res.status(200).json({
      success: true,
      paymentStatus: session.payment_status
    });

  } catch (error) {
    console.error('[VerifySession] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
