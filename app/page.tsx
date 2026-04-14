"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("Connexion à Supabase...");

  useEffect(() => {
    const testDB = async () => {
      try {
        const { data, error } = await supabase.from("agents").select("*");
        if (error) throw error;
        setStatus(`✅ Connecté ! ${data.length} agent(s) trouvé(s)`);
      } catch (err: any) {
        setStatus(`❌ Erreur: ${err.message}`);
      }
    };
    testDB();
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>🛡️ Secu-App Pilote</h1>
      <p style={{ fontSize: "1.2rem", padding: "1rem", background: "#1f2937", borderRadius: "8px" }}>{status}</p>
    </main>
  );
}