// components/SubscriptionStatus.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface SubscriptionStatusProps {
  userEmail: string;
}

export default function SubscriptionStatus({ userEmail }: SubscriptionStatusProps) {
  const [status, setStatus] = useState<string>("loading");
  const [periodEnd, setPeriodEnd] = useState<string>("");

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("email", userEmail)
        .maybeSingle();

      if (data) {
        setStatus(data.status);
        if (data.current_period_end) {
          setPeriodEnd(new Date(data.current_period_end).toLocaleDateString("fr-FR"));
        }
      } else {
        setStatus("none");
      }
    };
    if (userEmail) fetchSubscription();
  }, [userEmail]);

  const config: Record<string, { label: string; color: string; icon: string }> = {
    active: { label: "Abonnement actif", color: "bg-green-600/20 text-green-400 border-green-500/30", icon: "🟢" },
    trialing: { label: `Essai gratuit jusqu'au ${periodEnd}`, color: "bg-amber-600/20 text-amber-400 border-amber-500/30", icon: "🟡" },
    past_due: { label: "Paiement en attente", color: "bg-orange-600/20 text-orange-400 border-orange-500/30", icon: "🟠" },
    canceled: { label: "Abonnement annulé", color: "bg-red-600/20 text-red-400 border-red-500/30", icon: "🔴" },
    unpaid: { label: "Facture impayée", color: "bg-red-600/20 text-red-400 border-red-500/30", icon: "🔴" },
    none: { label: "Aucun abonnement", color: "bg-gray-600/20 text-gray-400 border-gray-500/30", icon: "⚪" },
    loading: { label: "Chargement...", color: "bg-gray-600/20 text-gray-400 border-gray-500/30", icon: "⏳" },
  };

  const { label, color, icon } = config[status] || config.loading;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full border ${color}`}>
      {icon} {label}
    </span>
  );
}