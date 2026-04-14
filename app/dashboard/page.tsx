"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import SubscribeButton from "../../components/SubscribeButton";
import SubscriptionStatus from "../../components/SubscriptionStatus";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      
      setUser(session.user);

      // Récupère le rôle et les infos depuis la table agents
      const { data: profile } = await supabase
        .from("agents")
        .select("role, statut, site_affecte, nom")
        .eq("email", session.user.email)
        .single();

      setAgentProfile(profile || { role: "agent", statut: "inactif", site_affecte: "Non assigné", nom: "Utilisateur" });
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">⏳ Chargement...</div>;

  const roleColors: Record<string, string> = {
    admin: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    superviseur: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    agent: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 pb-8">
      <header className="flex justify-between items-center bg-gray-900 p-4 rounded-xl mb-6 border border-gray-800">
        <h1 className="text-lg font-bold">🛡️ Secu-App</h1>
        <div className="flex items-center gap-4">
          {/* ✅ Nouveau : Statut abonnement en temps réel */}
          <SubscriptionStatus userEmail={user?.email || ""} />
          
          {/* Bouton déconnexion */}
          <button 
            onClick={handleLogout} 
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* 👤 Section Bienvenue */}
      <section className="bg-gray-900 p-5 rounded-xl border border-gray-800 mb-6">
        <h2 className="text-xl font-semibold mb-1">Bonjour, {agentProfile.nom}</h2>
        <p className="text-gray-400 text-sm">{agentProfile.site_affecte} • {agentProfile.statut.toUpperCase()}</p>
        <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full border ${roleColors[agentProfile.role] || roleColors.agent}`}>
          👤 {agentProfile.role.toUpperCase()}
        </span>
      </section>

      {/* 💳 Section Abonnement Stripe */}
      <section className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-5 rounded-xl border border-purple-500/30 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">🚀 Passez en version Pro</h3>
            <p className="text-sm text-gray-300">• Agents illimités • Rapports avancés • Support prioritaire</p>
          </div>
          <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-500/30 whitespace-nowrap">
            14 jours gratuits
          </span>
        </div>
        <div className="mt-4">
          <SubscribeButton userEmail={user?.email || ""} />
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">Annulable à tout moment • Facturation mensuelle</p>
      </section>

      {/* 🔘 Boutons d'action */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => router.push("/pointage")} 
          className="bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors"
        >
          📍 Pointer
        </button>
        <button 
          onClick={() => router.push("/incident")} 
          className="bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors"
        >
          🔄 Ronde
        </button>
        {agentProfile.role === "admin" && (
          <button 
            onClick={() => router.push("/agents")} 
            className="bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-colors"
          >
            👥 Agents
          </button>
        )}
      </div>

      <footer className="text-center text-xs text-gray-500 mt-4">
        Secu-App v0.2 (Pilote) • Sync: 🟢
      </footer>
    </main>
  );
}