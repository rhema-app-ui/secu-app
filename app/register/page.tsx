"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("⏳ Création du compte...");

    // 1. Créer le compte dans Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage(`❌ Erreur Auth: ${authError.message}`);
      return;
    }

    if (data.user) {
      // 2. Ajouter l'agent dans votre table `agents`
      const { error: dbError } = await supabase.from("agents").insert([
        {
          "e-mail": email,
          nom,
          role: "agent",
          statut: "actif",
          // Si votre table a une colonne user_id pour lier à l'auth, ajoutez : user_id: data.user.id
        }
      ]);

      if (dbError) {
        setMessage(`❌ Erreur DB: ${dbError.message}`);
        return;
      }

      setMessage("✅ Compte créé ! Redirection...");
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white", fontFamily: "sans-serif" }}>
      <form onSubmit={handleRegister} style={{ background: "#1f2937", padding: "2rem", borderRadius: "12px", width: "320px", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>🛡️ Inscription Agent</h2>
        <input type="text" placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} required style={{ padding: "0.5rem", borderRadius: "6px", border: "none" }} />
        <input type="email" placeholder="Email professionnel" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "0.5rem", borderRadius: "6px", border: "none" }} />
        <input type="password" placeholder="Mot de passe (min 6 caractères)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ padding: "0.5rem", borderRadius: "6px", border: "none" }} />
        <button type="submit" style={{ padding: "0.7rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>S'inscrire</button>
        {message && <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", textAlign: "center" }}>{message}</p>}
      </form>
    </main>
  );
}