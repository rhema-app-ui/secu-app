"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("Connexion à Supabase...");
  const router = useRouter();

  useEffect(() => {
    const testDB = async () => {
      try {
        const { data, error } = await supabase.from("agents").select("*");
        if (error) throw error;
        
        // ✅ Succès : afficher le statut + rediriger après 1 seconde
        setStatus(`✅ Connecté ! ${data.length} agent(s) trouvé(s)`);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        
      } catch (err: any) {
        // ❌ Erreur : afficher le message et rester sur la page
        setStatus(`❌ Erreur: ${err.message}`);
      }
    };
    testDB();
  }, [router]);

  return (
    <main style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "#0a0a0a", 
      color: "white", 
      fontFamily: "sans-serif",
      padding: "2rem"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", textAlign: "center" }}>
        🛡️ Secu-App Pilote
      </h1>
      <p style={{ 
        fontSize: "1.2rem", 
        padding: "1rem", 
        background: "#1f2937", 
        borderRadius: "8px",
        textAlign: "center",
        maxWidth: "400px"
      }}>
        {status}
        {status.includes("✅") && <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.9rem", opacity: 0.8 }}>🔄 Redirection vers le dashboard...</span>}
      </p>
    </main>
  );
}