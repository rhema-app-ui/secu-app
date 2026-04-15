import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// 🔐 Initialisation Stripe (côté serveur uniquement)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  try {
    // 1️⃣ Récupération sécurisée de l'URL de base
    // Fallback intelligent si NEXT_PUBLIC_APP_URL est vide ou mal lue
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || 'https://secu-app.netlify.app';
    
    // Nettoyage strict : supprime les espaces et les slashes finaux
    baseUrl = baseUrl.trim().replace(/\/+$/, '');
    
    // Vérification de sécurité
    if (!baseUrl.startsWith('http')) {
      throw new Error(`Base URL invalide détectée : "${baseUrl}"`);
    }

    // 2️⃣ Construction des URLs Stripe (format strict requis par Stripe)
    const successUrl = `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard?canceled=true`;

    // 3️⃣ Création de la session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
              name: 'Secu-App - Abonnement Pilote',
              description: 'Accès complet au dashboard agents'
            },
            unit_amount: 0, // 0 = gratuit/test. Mettez le montant en cents pour la prod (ex: 2990 = 29,90€)
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Changez en 'subscription' quand vous utiliserez un Stripe Price ID
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        source: 'secu-app-pilot'
      }
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('❌ Erreur Stripe Checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Impossible de créer la session de paiement' }, 
      { status: 500 }
    );
  }
}