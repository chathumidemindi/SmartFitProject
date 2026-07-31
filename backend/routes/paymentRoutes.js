const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Stripe checkout
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Stripe webhook
router.post('/webhook', paymentController.stripeWebhook);

// Verify session after redirect (frontend success page)
router.get('/verify-session', paymentController.verifySession);

module.exports = router;
