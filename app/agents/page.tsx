"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
      if (!error) setAgents(data);
      setLoading(false);
    };
    fetchAgents();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">⏳ Chargement...</div>;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <button onClick={() => router.back()} className="mb-4 text-sm text-blue-400 hover:underline">← Retour</button>
      <h1 className="text-2xl font-bold mb-4">👥 Gestion des Agents</h1>
      
      <div className="space-y-3">
        {agents.map((a) => (
          <div key={a.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="font-semibold">{a.nom}</p>
              <p className="text-xs text-gray-400">{a.email || "Pas d'email"} • {a.site_affecte || "Non assigné"}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              a.statut === "actif" ? "bg-green-600/20 text-green-400" : "bg-gray-700 text-gray-300"
            }`}>
              {a.statut}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}