// @ts-nocheck
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🔐 Initialisation Supabase (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Routes publiques (toujours accessibles)
  const publicRoutes = ['/', '/login', '/signup', '/api/stripe/webhook'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 🔍 Vérifier la session utilisateur
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Vérifier l'abonnement dans Supabase
    const {  subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('email', request.headers.get('x-user-email')) // À passer depuis le frontend
      .maybeSingle();

    const now = new Date();
    const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;

    // ✅ Accès autorisé si :
    // - statut = 'active' OU 'trialing'
    // - ET période en cours non expirée
    if (subscription && 
        ['active', 'trialing'].includes(subscription.status) && 
        periodEnd && periodEnd > now) {
      return NextResponse.next();
    }

    // ❌ Accès refusé : rediriger vers page d'abonnement
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/dashboard?subscription_required=true', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // En cas d'erreur, on laisse passer (mode pilote)
    return NextResponse.next();
  }
}

// 🔧 Config : appliquer le middleware uniquement aux routes protégées
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};