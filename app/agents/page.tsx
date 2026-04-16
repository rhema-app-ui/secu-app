// app/agents/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      // 1️⃣ Récupère le tenant_id de l'utilisateur connecté
      const { data: profile } = await supabase
        .from("agents")
        .select("tenant_id, role")
        .eq("email", session.user.email?.trim().toLowerCase())
        .single();

      if (!profile?.tenant_id) {
        setLoading(false);
        return;
      }
      setTenantId(profile.tenant_id);

      // 2️⃣ Charge UNIQUEMENT les agents de CETTE agence (isolation)
      const { data: agentsList } = await supabase
        .from("agents")
        .select("nom, email, role, statut, tenant_id")
        .eq("tenant_id", profile.tenant_id)
        .order("nom", { ascending: true });
      
      setAgents(agentsList || []);
      setLoading(false);
    };
    load();
  }, []);

  // Fonction pour ajouter un agent (hérite automatiquement du tenant_id)
  const handleAddAgent = async (newAgentEmail: string, newAgentName: string) => {
    if (!tenantId) return;
    
    const { error } = await supabase.from("agents").insert({
      email: newAgentEmail,
      nom: newAgentName,
      role: "agent",
      statut: "actif",
      tenant_id: tenantId, // 🔐 Isolation automatique
    });
    
    if (error) {
      alert(`❌ Erreur: ${error.message}`);
    } else {
      // Recharge la liste
      window.location.reload();
    }
  };

  if (loading) return <div className="p-4 text-gray-400">⏳ Chargement...</div>;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <button onClick={() => router.back()} className="mb-4 text-gray-400 hover:text-white">← Retour</button>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👥 Agents de mon agence</h1>
        {/* Bouton ajout simple (à améliorer avec un modal plus tard) */}
        <button 
          onClick={() => {
            const email = prompt("Email du nouvel agent:");
            const nom = prompt("Nom du nouvel agent:");
            if (email && nom) handleAddAgent(email, nom);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Ajouter un agent
        </button>
      </div>

      <div className="space-y-2">
        {agents.map((a, i) => (
          <div key={i} className="p-3 bg-gray-900 rounded border border-gray-800 flex justify-between items-center">
            <div>
              <p className="font-medium">{a.nom}</p>
              <p className="text-sm text-gray-400">{a.email} • {a.role} • {a.statut}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded ${
              a.role === "admin" ? "bg-purple-600/20 text-purple-400" : "bg-blue-600/20 text-blue-400"
            }`}>
              {a.role}
            </span>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-gray-500 text-center py-8">Aucun agent dans cette agence.</p>
        )}
      </div>
    </main>
  );
}