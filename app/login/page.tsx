"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 🔐 Connexion avec Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800">
        <h1 className="text-2xl font-bold text-center mb-6">🛡️ Secu-App Connexion</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
              placeholder="agent@agence.fr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* 🔗 Lien d'inscription avec Next.js Link (navigation fluide) */}
        <p className="text-center mt-4 text-sm text-gray-400">
          Pas de compte ?{" "}
          <Link 
            href="/register" 
            className="text-blue-500 hover:text-blue-400 font-medium transition"
          >
            Créer un compte agent
          </Link>
        </p>
      </div>
    </main>
  );
}