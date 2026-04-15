"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import SubscribeButton from "../../components/SubscribeButton";
import SubscriptionStatus from "../../components/SubscriptionStatus";

// 🎯 Types pour la sécurité TypeScript
type AgentProfile = {
  nom: string;
  role: "admin" | "superviseur" | "agent";
  statut: string;
  site_affecte: string;
  subscription_status?: "free" | "trial" | "active" | "canceled";
};

// 🎁 Configuration des plans
const PLANS = {
  free: { maxAgents: 3, historyHours: 24, canExport: false, canSMS: false },
  trial: { maxAgents: 10, historyHours: 168, canExport: true, canSMS: false }, // 7 jours
  active: { maxAgents: 999, historyHours: 9999, canExport: true, canSMS: true },
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      
      setUser(session.user);

      // ✅ Récupère le profil + statut d'abonnement depuis Supabase
      const { data: profile } = await supabase
        .from("agents")
        .select("role, statut, site_affecte, nom, subscription_status")
        .eq("e-mail", session.user.email) // ⚠️ Attention : colonne "e-mail" avec tiret
        .single();

      setAgentProfile({
        nom: profile?.nom || "Utilisateur",
        role: profile?.role || "agent",
        statut: profile?.statut || "inactif",
        site_affecte: profile?.site_affecte || "Non assigné",
        subscription_status: profile?.subscription_status || "free",
      });
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 🔐 Vérifie si l'utilisateur a accès à une fonctionnalité Premium
const hasAccess = (feature: "canExport" | "canSMS"): boolean => {
  const plan = agentProfile?.subscription_status || "free";
  
  // Les plans "trial" et "active" ont accès aux fonctionnalités Pro
  if (plan === "trial" || plan === "active") {
    return true;
  }
  
  // Le plan "free" n'a accès à rien de premium
  return false;
};

  // 🚀 Gère le clic sur une fonctionnalité restreinte
  const handlePremiumClick = (featureName: string) => {
    if (!hasAccess("canExport")) { // On utilise canExport comme indicateur "Pro"
      setShowUpgradeModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>⏳ Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    superviseur: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    agent: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  };

  const planBadges = {
    free: { label: "🆓 Gratuit", class: "bg-gray-600/20 text-gray-400 border-gray-500/30" },
    trial: { label: "🎁 Essai Pro", class: "bg-green-600/20 text-green-400 border-green-500/30" },
    active: { label: "💼 Pro Actif", class: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" },
    canceled: { label: "⚠️ Expiré", class: "bg-red-600/20 text-red-400 border-red-500/30" },
  };

  const currentPlan = agentProfile?.subscription_status || "free";
  const planInfo = planBadges[currentPlan];

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 pb-8">
      
      {/* 🔝 HEADER */}
      <header className="flex justify-between items-center bg-gray-900 p-4 rounded-xl mb-6 border border-gray-800">
        <h1 className="text-lg font-bold">🛡️ Secu-App</h1>
        <div className="flex items-center gap-3">
          {/* 📊 Badge du plan actuel */}
          <span className={`px-3 py-1 text-xs rounded-full border ${planInfo.class}`}>
            {planInfo.label}
          </span>
          
          {/* 💳 Statut abonnement + Bouton upgrade si besoin */}
          {currentPlan !== "active" && (
            <SubscriptionStatus userEmail={user?.email || ""} />
          )}
          
          {/* 🔐 Déconnexion */}
          <button 
            onClick={handleLogout} 
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* 👤 SECTION BIENVENUE */}
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
        
        {/* 📈 Stats rapides avec indicateur Premium */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">12</p>
            <p className="text-xs text-gray-500">Pointages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">98%</p>
            <p className="text-xs text-gray-500">Ponctualité</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {hasAccess("canExport") ? "∞" : PLANS.free.historyHours + "h"}
            </p>
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              Historique
              {!hasAccess("canExport") && <span className="text-[10px] bg-gray-700 px-1 rounded">Pro</span>}
            </p>
          </div>
        </div>
      </section>

      {/* 💳 SECTION UPGRADE (Visible seulement si pas Pro) */}
      {currentPlan !== "active" && (
        <section className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-5 rounded-xl border border-purple-500/30 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">🚀 Débloquez la version Pro</h3>
              <ul className="text-sm text-gray-300 space-y-1 mt-2">
                <li>✅ Agents illimités</li>
                <li>✅ Historique complet + exports PDF</li>
                <li>✅ Notifications SMS en temps réel</li>
                <li>✅ Support prioritaire 24/7</li>
              </ul>
            </div>
            <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-500/30 whitespace-nowrap h-fit">
              14 jours gratuits
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <SubscribeButton userEmail={user?.email || ""} />
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">Annulable à tout moment • Facturation mensuelle</p>
        </section>
      )}

      {/* 🔘 BOUTONS D'ACTION */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* 📍 Pointer - Toujours accessible */}
        <button 
          onClick={() => router.push("/pointage")} 
          className="bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors"
        >
          📍 Pointer
        </button>
        
        {/* 🔄 Ronde - Toujours accessible */}
        <button 
          onClick={() => router.push("/incident")} 
          className="bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors"
        >
          🔄 Ronde
        </button>
        
        {/* 📊 Rapports - Premium */}
        <button 
          onClick={() => hasAccess("canExport") ? router.push("/rapport") : handlePremiumClick("Rapports")}
          className={`py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors relative ${
            hasAccess("canExport") 
              ? "bg-purple-600 hover:bg-purple-700" 
              : "bg-gray-800 cursor-not-allowed opacity-70"
          }`}
        >
          📊 Rapports
          {!hasAccess("canExport") && (
            <span className="absolute top-2 right-2 text-[10px] bg-amber-600 px-1.5 py-0.5 rounded text-white">Pro</span>
          )}
        </button>
        
        {/* 👥 Agents - Admin ou Premium */}
        {(agentProfile?.role === "admin" || hasAccess("canExport")) && (
          <button 
            onClick={() => router.push("/agents")} 
            className="bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors"
          >
            👥 Agents
          </button>
        )}
      </div>

      {/* 🧩 MODAL D'UPGRADE (Apparaît au clic sur une feature Premium) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-gray-900 p-6 rounded-2xl border border-purple-500/50 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">🔒 Fonctionnalité Pro</h3>
            <p className="text-gray-400 mb-4">
              Les exports PDF et l'historique complet sont réservés aux abonnés Pro.
            </p>
            <div className="space-y-3">
              <SubscribeButton userEmail={user?.email || ""} />
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition"
              >
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