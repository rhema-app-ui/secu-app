"use client";
import { useState, useRef } from "react";

export default function IncidentPage() {
  const [categorie, setCategorie] = useState("autre");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "ready" | "error">("idle");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage("⚠️ Photo trop lourde (>2Mo)");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("acquiring");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ready");
        setMessage("✅ Position GPS capturée");
      },
      () => {
        setGpsStatus("error");
        setMessage("❌ GPS indisponible");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      setMessage("⚠️ Veuillez capturer votre position GPS");
      return;
    }
    
    setSubmitting(true);
    setMessage("🔄 Envoi en cours...");

    try {
      // 🗄️ Enregistrement minimal dans Supabase (sans upload photo pour le pilote)
      const payload = {
        email: "test@secu-agency.fr",
        categorie,
        description,
        photo_url: null, // 🔴 Upload photo désactivé pour le pilote (à réactiver plus tard)
        lat: coords.lat,
        lng: coords.lng,
        precision: 10,
        timestamp: new Date().toISOString(),
        statut: "nouveau"
      };

      const response = await fetch(
        `https://npicdgklpikwntxzgspa.supabase.co/rest/v1/incidents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        setMessage("✅ Incident déclaré ! Redirection...");
        setTimeout(() => {
          window.location.href = "/dashboard"; // ✅ Navigation robuste
        }, 1500);
      } else {
        throw new Error("Échec");
      }
    } catch {
      setMessage("❌ Erreur d'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 text-gray-400 hover:text-white">← Retour</button>
        <h1 className="text-lg font-bold">🚨 Incident</h1>
        <div className="w-16" />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
        
        {/* Catégorie */}
        <section>
          <label className="block text-sm font-medium mb-2 text-gray-300">Type d'incident</label>
          <div className="grid grid-cols-2 gap-2">
            {["vol", "intrusion", "degradation", "accident", "autre"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategorie(cat)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition ${
                  categorie === cat ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-900 border-gray-700 text-gray-300"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Description */}
        <section>
          <label className="block text-sm font-medium mb-2 text-gray-300">Observations</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 focus:border-blue-500 outline-none text-white"
            placeholder="Décrivez l'incident..."
          />
        </section>

        {/* Photo (UI seulement pour le pilote) */}
        <section>
          <label className="block text-sm font-medium mb-2 text-gray-300">Photo (optionnel)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
            ) : (
              <p className="text-gray-400 text-sm">📷 Appuyer pour ajouter une photo</p>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Max 2Mo • Upload désactivé en pilote</p>
        </section>

        {/* GPS */}
        <section>
          <label className="block text-sm font-medium mb-2 text-gray-300">Localisation</label>
          <button
            type="button"
            onClick={captureGPS}
            disabled={gpsStatus === "acquiring"}
            className={`w-full py-3 rounded-xl font-medium transition ${
              gpsStatus === "ready" ? "bg-green-600/20 text-green-400 border border-green-500/30" :
              gpsStatus === "error" ? "bg-red-600/20 text-red-400 border border-red-500/30" :
              "bg-gray-900 border border-gray-700 text-gray-300"
            }`}
          >
            {gpsStatus === "idle" && "📍 Capturer ma position"}
            {gpsStatus === "acquiring" && "🔄 Acquisition..."}
            {gpsStatus === "ready" && "✅ Position validée"}
            {gpsStatus === "error" && "❌ Réessayer"}
          </button>
        </section>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm text-center ${
            message.includes("✅") ? "bg-green-600/20 text-green-400" :
            message.includes("❌") ? "bg-red-600/20 text-red-400" :
            "bg-amber-600/20 text-amber-400"
          }`}>
            {message}
          </div>
        )}

        {/* Bouton envoyer */}
        <button
          type="submit"
          disabled={submitting || !coords}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 disabled:opacity-50 py-4 rounded-2xl font-bold text-lg mt-auto"
        >
          {submitting ? "🔄 Envoi..." : "🚨 DÉCLARER L'INCIDENT"}
        </button>
      </form>
    </main>
  );
}