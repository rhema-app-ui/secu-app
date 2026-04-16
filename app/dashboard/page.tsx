"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import SubscribeButton from "../../components/SubscribeButton";
import SubscriptionStatus from "../../components/SubscriptionStatus";

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [agentProfile, setAgentProfile] = useState<{
    nom: string;
    role: string;
    statut: string;
    site_affecte: string;
    subscription_status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      // ✅ CORRECTION CRITIQUE : ajout de "data:" manquant avant
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);
      const email = session.user.email?.trim().toLowerCase() || "";

      // ✅ CORRECTION CRITIQUE : "data:" ajouté ici aussi
      const { data: profile } = await supabase
        .from("agents")
        .select("role, statut, site_affecte, nom, subscription_status")
        .eq("email", email)
        .single();

      if (profile) {
        setAgentProfile({
          nom: profile.nom || "Utilisateur",
          role: profile.role || "agent",
          statut: profile.statut || "inactif",
          site_affecte: profile.site_affecte || "Non assigné",
          subscription_status: profile.subscription_status || "free",
        });
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isPro = agentProfile?.subscription_status === "trial" || agentProfile?.subscription_status === "active";

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">⏳ Chargement...</div>;
  }

  const roleColors: Record<string, string> = {
    admin: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    superviseur: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    agent: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  };

  const planBadges: Record<string, { label: string; class: string }> = {
    free: { label: "🆓 Gratuit", class: "bg-gray-600/20 text-gray-400 border-gray-500/30" },
    trial: { label: "🎁 Essai Pro", class: "bg-green-600/20 text-green-400 border-green-500/30" },
    active: { label: "💼 Pro Actif", class: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" },
    canceled: { label: "⚠️ Expiré", class: "bg-red-600/20 text-red-400 border-red-500/30" },
  };

  const currentPlan = agentProfile?.subscription_status || "free";
  const planInfo = planBadges[currentPlan] || planBadges.free;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 pb-8">
      <header className="flex justify-between items-center bg-gray-900 p-4 rounded-xl mb-6 border border-gray-800">
        <h1 className="text-lg font-bold">🛡️ Secu-App</h1>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs rounded-full border ${planInfo.class}`}>
            {planInfo.label}
          </span>
          {currentPlan !== "active" && user?.email && <SubscriptionStatus userEmail={user.email} />}
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Déconnexion
          </button>
        </div>
      </header>

      <section className="bg-gray-900 p-5 rounded-xl border border-gray-800 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Bonjour, {agentProfile?.nom}</h2>
            <p className="text-gray-400 text-sm">{agentProfile?.site_affecte} • {agentProfile?.statut.toUpperCase()}</p>
          </div>
          <span className={`px-3 py-1 text-xs rounded-full border ${roleColors[agentProfile?.role || "agent"]}`}>
            👤 {(agentProfile?.role || "agent").toUpperCase()}
          </span>
        </div>
      </section>

      {currentPlan !== "active" && (
        <section className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-5 rounded-xl border border-purple-500/30 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">🚀 Débloquez la version Pro</h3>
              <ul className="text-sm text-gray-300 space-y-1 mt-2">
                <li>✅ Agents illimités</li>
                <li>✅ Historique complet + exports PDF</li>
                <li>✅ Notifications SMS en temps réel</li>
              </ul>
            </div>
            <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-500/30 whitespace-nowrap h-fit">
              14 jours gratuits
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <SubscribeButton userEmail={user?.email || ""} />
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => router.push("/pointage")} className="bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors">
          📍 Pointer
        </button>
        <button onClick={() => router.push("/incident")} className="bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors">
          🔄 Ronde
        </button>
        <button
          onClick={() => isPro ? router.push("/rapport") : setShowUpgradeModal(true)}
          className={`py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors relative ${isPro ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-800 cursor-not-allowed opacity-70"}`}
        >
          📊 Rapports
          {!isPro && <span className="absolute top-2 right-2 text-[10px] bg-amber-600 px-1.5 py-0.5 rounded text-white">Pro</span>}
        </button>
        {(agentProfile?.role === "admin" || isPro) && (
          <button onClick={() => router.push("/agents")} className="bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors">
            👥 Agents
          </button>
        )}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-gray-900 p-6 rounded-2xl border border-purple-500/50 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">🔒 Fonctionnalité Pro</h3>
            <p className="text-gray-400 mb-4">Les exports PDF et l'historique complet sont réservés aux abonnés Pro.</p>
            <div className="space-y-3">
              <SubscribeButton userEmail={user?.email || ""} />
              <button onClick={() => setShowUpgradeModal(false)} className="w-full py-2 text-sm text-gray-400 hover:text-white transition">
                Peut-être plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-xs text-gray-500 mt-4">
        Secu-App v0.2 (Pilote) • Plan: <span className="text-gray-300">{planInfo.label}</span>
      </footer>
    </main>
  );
}