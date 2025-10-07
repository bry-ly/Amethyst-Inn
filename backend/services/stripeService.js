// services/stripeService.js
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Create a Payment Intent
 */
export const createPaymentIntent = async ({ amount, currency = 'usd', bookingId, guestEmail, guestName, metadata = {} }) => {
  try {
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      receipt_email: guestEmail,
      description: `Hotel booking payment for booking #${bookingId}`,
      metadata: {
        bookingId: bookingId.toString(),
        guestName,
        ...metadata
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe Payment Intent Creation Error:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

/**
 * Retrieve a Payment Intent
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Stripe Payment Intent Retrieval Error:', error);
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
};

/**
 * Create or retrieve a Stripe Customer
 */
export const createOrRetrieveCustomer = async ({ email, name, userId }) => {
  try {
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    return await stripe.customers.create({
      email,
      name,
      metadata: { userId: userId.toString() },
    });
  } catch (error) {
    console.error('Stripe Customer Creation Error:', error);
    throw new Error(`Failed to create/retrieve customer: ${error.message}`);
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundParams = { payment_intent: paymentIntentId, reason };
    if (amount) refundParams.amount = Math.round(amount * 100);

    return await stripe.refunds.create(refundParams);
  } catch (error) {
    console.error('Stripe Refund Error:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Construct webhook event
 */
export const constructWebhookEvent = (rawBody, signature) => {
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error(`Webhook Error: ${error.message}`);
  }
};

/**
 * Get publishable key
 */
export const getPublishableKey = () => process.env.STRIPE_PUBLISHABLE_KEY;

export default stripe;
