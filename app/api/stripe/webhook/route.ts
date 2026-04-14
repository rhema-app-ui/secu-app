// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 🔐 Initialisations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(`❌ Webhook signature failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subId = session.subscription;
        const customerId = session.customer;
        const email = session.customer_email;

        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);
        await supabase.from('subscriptions').upsert({
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
        console.log(`✅ Subscription active for ${email}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;

        await supabase.from('subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        }).eq('stripe_customer_id', customerId);
        console.warn(`⚠️ Payment failed for ${email}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase.from('subscriptions').update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', sub.id);
        console.log(`🔄 Subscription ${sub.status} updated`);
        break;
      }

      default:
        console.log(`📦 Unhandled event: ${event.type}`);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}