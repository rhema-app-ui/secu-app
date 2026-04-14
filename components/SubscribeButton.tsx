"use client";
import { useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";

// 🔑 Initialisation sécurisée de Stripe
// On utilise une variable locale pour éviter les erreurs TS sur process.env
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePromise: Promise<Stripe | null> = stripePublicKey 
  ? loadStripe(stripePublicKey) 
  : Promise.resolve(null);

interface SubscribeButtonProps {
  userEmail: string;
}

export default function SubscribeButton({ userEmail }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!userEmail) {
      alert("⚠️ Veuillez vous connecter pour vous abonner");
      return;
    }

    // Vérification basique de la clé
    if (!stripePublicKey) {
      alert("⚠️ Configuration Stripe manquante");
      return;
    }

    setLoading(true);
    
    try {
      // 📡 Appeler notre API Next.js
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, plan: "pilote" }),
      });

      const result = await response.json();

      if (result.error) throw new Error(result.error);
      
      // 🔄 Rediriger vers le Checkout Stripe sécurisé
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Aucune URL de redirection reçue");
      }
    } catch (err: any) {
      console.error("Erreur abonnement:", err);
      alert(`❌ Erreur: ${err.message || "Une erreur est survenue"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-lg shadow-lg shadow-purple-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">🔄</span> Redirection...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          💳 Démarrer l'essai gratuit (14 jours)
        </span>
      )}
    </button>
  );
}