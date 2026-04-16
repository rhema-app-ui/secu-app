"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { supabase } from "../../lib/supabase";
import { addToQueue, runSync, fileToBase64 } from "../../lib/db";

export default function PointagePage() {
  // ✅ Hooks AU NIVEAU SUPÉRIEUR (obligatoire)
  const [isOnline, setIsOnline] = useState(true);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 📸 Gestion photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleStatusChange = () => {
      const status = navigator.onLine;
      setIsOnline(status);
      if (status) {
        setMessage("🌐 Connexion rétablie ! Synchronisation...");
        runSync().then((result: any) => {
          if (result && result.synced > 0) {
            setMessage(`✅ ${result.synced} action(s) synchronisée(s) !`);
          } else {
            setMessage("✅ En ligne. Aucune donnée en attente.");
          }
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

  // 📸 Sélection de photo
  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 🗑️ Supprimer la photo sélectionnée
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePointage = async (type: string) => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setMessage("❌ GPS non supporté sur cet appareil");
      return;
    }

    setLoading(true);
    setGpsStatus("acquiring");
    setMessage("📍 Acquisition du signal GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos: any) => {
        setGpsStatus("ready");
        
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        const email = session?.user?.email || "agent-test@secu.fr";

        // 📸 Gestion de la photo
        let photoUrl = "";
        if (photoFile) {
          setUploadingPhoto(true);
          setMessage("📸 Traitement de la photo...");
          
          try {
            if (navigator.onLine) {
              // En ligne : upload vers Supabase Storage
              const fileName = `${email}/${Date.now()}-${photoFile.name}`;
              const {  publicUrl, error: uploadError } = await supabase.storage
                .from("pointages-photos")
                .upload(fileName, photoFile, { cacheControl: "3600", upsert: false });
              
              if (uploadError) throw uploadError;
              photoUrl = publicUrl || "";
            } else {
              // Hors ligne : conversion Base64 pour stockage local
              photoUrl = await fileToBase64(photoFile);
            }
          } catch (err: any) {
            console.error("❌ Photo upload error:", err);
            setMessage("⚠️ Photo non envoyée, mais pointage sauvegardé.");
          } finally {
            setUploadingPhoto(false);
          }
        }

        const payload = {
          email,
          type,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precision: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
          photo_url: photoUrl, // 🔗 URL ou Base64 selon le mode
          is_offline_photo: !navigator.onLine && photoFile !== null,
        };

        // 🚀 Logique Offline / Online
        if (navigator.onLine) {
          const { error } = await supabase.from("pointages").insert(payload);
          if (error) {
            await addToQueue("pointage", payload);
            setMessage("⚠️ Échec serveur. Mis en file d'attente locale.");
          } else {
            setMessage(`✅ ${type === "checkin" ? "Prise de service" : "Fin de service"} enregistrée${photoUrl ? " + photo" : ""}.`);
          }
        } else {
          await addToQueue("pointage", payload);
          setMessage(`💾 Mode hors ligne : ${type === "checkin" ? "Début" : "Fin"}${photoUrl ? " + photo" : ""} sauvegardé.`);
        }
        
        // Reset photo après envoi
        setPhotoFile(null);
        setPhotoPreview(null);
        setLoading(false);
      },
      (err: any) => {
        setGpsStatus("error");
        setMessage(`❌ GPS: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 text-gray-400 hover:text-white">← Retour</button>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          isOnline ? "bg-green-600/20 text-green-400 border-green-500/30" : "bg-red-600/20 text-red-400 border-red-500/30"
        }`}>
          {isOnline ? "🟢 EN LIGNE" : "🔴 HORS LIGNE"}
        </div>
      </header>

      <section className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Pointage Terrain</h1>
        <p className="text-gray-400">Validez votre présence</p>
      </section>

      {/* 📸 Section Photo */}
      <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
        <label className="block text-sm font-medium mb-2">📸 Photo de preuve (optionnel)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handlePhotoSelect}
          disabled={loading || uploadingPhoto}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
        />
        {photoPreview && (
          <div className="mt-3 relative">
            <img 
              src={photoPreview} 
              alt="Aperçu" 
              className="w-full h-40 object-cover rounded-lg border border-gray-700"
            />
            <button 
              onClick={handleRemovePhoto}
              disabled={loading || uploadingPhoto}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded-full disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        )}
        {uploadingPhoto && <p className="text-xs text-yellow-400 mt-2">📤 Envoi de la photo...</p>}
      </section>

      {/* 📡 Status GPS */}
      <div className={`text-center mb-8 text-sm font-medium ${
        gpsStatus === "acquiring" ? "text-yellow-400 animate-pulse" : 
        gpsStatus === "ready" ? "text-green-400" : "text-gray-500"
      }`}>
        {gpsStatus === "idle" && "En attente de GPS..."}
        {gpsStatus === "acquiring" && "📡 Recherche satellites..."}
        {gpsStatus === "ready" && "✅ Position verrouillée"}
        {gpsStatus === "error" && "❌ Signal GPS perdu"}
      </div>

      {/* 🔘 Boutons d'action */}
      <div className="flex-1 flex flex-col justify-center gap-5">
        <button 
          onClick={() => handlePointage("checkin")}
          disabled={loading || gpsStatus === "acquiring" || uploadingPhoto}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-6 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all"
        >
          {loading ? "⏳ En cours..." : "🟢 DÉBUT DE SERVICE"}
        </button>
        
        <button 
          onClick={() => handlePointage("checkout")}
          disabled={loading || gpsStatus === "acquiring" || uploadingPhoto}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-6 rounded-2xl font-bold text-xl shadow-lg shadow-red-900/40 active:scale-[0.98] transition-all"
        >
          {loading ? "⏳ En cours..." : "🔴 FIN DE SERVICE"}
        </button>
      </div>

      {/* 💬 Message de feedback */}
      {message && (
        <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-xl text-center">
          <p className="text-sm text-gray-200">{message}</p>
        </div>
      )}
      
      <footer className="text-center text-xs text-gray-600 mt-8">
        Secu-App v0.3 • Sync: {isOnline ? "Auto" : "Manuelle"} • Photos: {isOnline ? "Storage" : "Base64"}
      </footer>
    </main>
  );
}