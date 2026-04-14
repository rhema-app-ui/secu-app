"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { addToQueue, runSync } from "../../lib/db";

export default function PointagePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 📡 Surveillance de la connexion réseau
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleStatusChange = () => {
      const status = navigator.onLine;
      setIsOnline(status);
      if (status) {
        setMessage("🌐 Connexion rétablie ! Synchronisation...");
        runSync().then((count) => {
          if (count && count > 0) setMessage(`✅ ${count} action(s) synchronisée(s) !`);
          else setMessage("✅ En ligne. Aucune donnée en attente.");
          setTimeout(() => setMessage(""), 3000);
        });
      } else {
        setMessage("🔴 Hors ligne. Vos données seront sauvegardées localement.");
      }
    };

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  const handlePointage = async (type: "checkin" | "checkout") => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setMessage("❌ GPS non supporté sur cet appareil");
      return;
    }

    setLoading(true);
    setGpsStatus("acquiring");
    setMessage("📍 Acquisition du signal GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsStatus("ready");
        
        // ✅ Syntaxe correcte pour Supabase v2
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || "agent-test@secu.fr";

        const payload = {
          email,
          type,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precision: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        // 🚀 Logique Offline / Online
        if (navigator.onLine) {
          const { error } = await supabase.from("pointages").insert(payload);
          if (error) {
            // Si l'envoi direct échoue, on bascule en file d'attente locale
            await addToQueue("pointage", payload);
            setMessage("⚠️ Échec serveur. Mis en file d'attente locale.");
          } else {
            setMessage(`✅ ${type === "checkin" ? "Prise de service" : "Fin de service"} enregistrée.`);
          }
        } else {
          // Mode Hors Ligne : sauvegarde locale uniquement
          await addToQueue("pointage", payload);
          setMessage(`💾 Mode hors ligne : ${type === "checkin" ? "Début" : "Fin"} sauvegardé.`);
        }
        
        setLoading(false);
      },
      (err) => {
        setGpsStatus("error");
        setMessage(`❌ GPS: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 text-gray-400 hover:text-white">← Retour</button>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          isOnline ? "bg-green-600/20 text-green-400 border-green-500/30" : "bg-red-600/20 text-red-400 border-red-500/30"
        }`}>
          {isOnline ? "🟢 EN LIGNE" : "🔴 HORS LIGNE"}
        </div>
      </header>

      {/* Titre */}
      <section className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Pointage Terrain</h1>
        <p className="text-gray-400">Validez votre présence</p>
      </section>

      {/* GPS Status */}
      <div className={`text-center mb-8 text-sm font-medium ${
        gpsStatus === "acquiring" ? "text-yellow-400 animate-pulse" : 
        gpsStatus === "ready" ? "text-green-400" : "text-gray-500"
      }`}>
        {gpsStatus === "idle" && "En attente de GPS..."}
        {gpsStatus === "acquiring" && "📡 Recherche satellites..."}
        {gpsStatus === "ready" && "✅ Position verrouillée"}
        {gpsStatus === "error" && "❌ Signal GPS perdu"}
      </div>

      {/* Boutons */}
      <div className="flex-1 flex flex-col justify-center gap-5">
        <button 
          onClick={() => handlePointage("checkin")}
          disabled={loading || gpsStatus === "acquiring"}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-6 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all"
        >
          🟢 DÉBUT DE SERVICE
        </button>
        
        <button 
          onClick={() => handlePointage("checkout")}
          disabled={loading || gpsStatus === "acquiring"}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-6 rounded-2xl font-bold text-xl shadow-lg shadow-red-900/40 active:scale-[0.98] transition-all"
        >
          🔴 FIN DE SERVICE
        </button>
      </div>

      {/* Message de feedback */}
      {message && (
        <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-xl text-center">
          <p className="text-sm text-gray-200">{message}</p>
        </div>
      )}
      
      <footer className="text-center text-xs text-gray-600 mt-8">
        Secu-App v0.2 • Sync: {isOnline ? "Auto" : "Manuelle"}
      </footer>
    </main>
  );
}