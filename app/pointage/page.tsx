"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { supabase } from "../../lib/supabase";
import { addToQueue, runSync, fileToBase64 } from "../../lib/db";
import { useRouter } from "next/navigation";

export default function PointagePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceState, setServiceState] = useState<string | null>(null);
  const [userTenantId, setUserTenantId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Charger le tenant_id au montage
  useEffect(() => {
    const loadTenant = async () => {
      const res: any = await supabase.auth.getSession();
      const session = res.data?.session;
      if (!session?.user?.email) return;
      const profileRes: any = await supabase.from("agents").select("tenant_id").eq("email", session.user.email).single();
      if (profileRes.data?.tenant_id) setUserTenantId(profileRes.data.tenant_id);
    };
    loadTenant();
  }, []);

  // Gestion Online/Offline
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setMessage("🌐 Connexion rétablie ! Synchronisation...");
        runSync().then((result: any) => {
          if (result?.synced > 0) setMessage(`✅ ${result.synced} action(s) synchronisée(s) !`);
          setTimeout(() => setMessage(""), 3000);
        });
      } else {
        setMessage("🔴 Hors ligne. Données sauvegardées localement.");
      }
    };
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPhotoFile(e.target.files[0]);
      setPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePointage = async (type: string) => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setMessage("❌ GPS non supporté");
      return;
    }

    setLoading(true);
    setGpsStatus("acquiring");
    setMessage("📍 Acquisition GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos: any) => {
        setGpsStatus("ready");
        const res: any = await supabase.auth.getSession();
        const email = res.data?.session?.user?.email || "agent@secu.fr";

        let photoUrl = "";
        if (photoFile) {
          setUploadingPhoto(true);
          try {
            if (navigator.onLine) {
              const fileName = `${email}/${Date.now()}-${photoFile.name}`;
              const { data, error } = await supabase.storage.from("pointages-photos").upload(fileName, photoFile);
              if (error) throw error;
              photoUrl = data?.path || "";
            } else {
              photoUrl = await fileToBase64(photoFile);
            }
          } catch (err) {
            console.error("Photo error:", err);
          } finally {
            setUploadingPhoto(false);
          }
        }

        const payload: any = {
          email,
          type,
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
          precision: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
          photo_url: photoUrl || null,
        };
        if (userTenantId) payload.tenant_id = userTenantId;

        if (navigator.onLine) {
          const { error } = await supabase.from("pointages").insert(payload);
          if (error) {
            console.error("Insert error:", error);
            await addToQueue("pointage", payload);
            setMessage(`⚠️ Échec: ${error.message}. Sauvegardé localement.`);
          } else {
            setServiceState(type);
            setMessage(`✅ ${type === "checkin" ? "Début" : "Fin"} de service enregistré.`);
          }
        } else {
          await addToQueue("pointage", payload);
          setServiceState(type);
          setMessage(`💾 Mode hors ligne : ${type === "checkin" ? "Début" : "Fin"} sauvegardé.`);
        }
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

  const handleReset = () => {
    setServiceState(null);
    setMessage("");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-white">← Retour</button>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isOnline ? "bg-green-600/20 text-green-400 border-green-500/30" : "bg-red-600/20 text-red-400 border-red-500/30"}`}>
          {isOnline ? "🟢 EN LIGNE" : "🔴 HORS LIGNE"}
        </div>
      </header>

      <section className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Pointage Terrain</h1>
        <p className="text-gray-400">Validez votre présence</p>
      </section>

      <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
        <label className="block text-sm font-medium mb-2">📸 Photo (optionnel)</label>
        <input type="file" accept="image/*" onChange={handlePhotoSelect} disabled={loading || uploadingPhoto || serviceState !== null} className="block w-full text-sm text-gray-400" />
        {photoPreview && (
          <div className="mt-3 relative">
            <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-700" />
            <button onClick={handleRemovePhoto} disabled={loading || uploadingPhoto} className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">✕</button>
          </div>
        )}
      </section>

      <div className={`text-center mb-8 text-sm font-medium ${gpsStatus === "acquiring" ? "text-yellow-400 animate-pulse" : gpsStatus === "ready" ? "text-green-400" : "text-gray-500"}`}>
        {gpsStatus === "idle" && "En attente GPS..."}
        {gpsStatus === "acquiring" && "📡 Recherche..."}
        {gpsStatus === "ready" && "✅ Position verrouillée"}
        {gpsStatus === "error" && "❌ GPS perdu"}
      </div>

      {serviceState && (
        <div className={`text-center mb-4 p-3 rounded-lg border ${serviceState === "checkin" ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400" : "bg-red-600/20 border-red-500/30 text-red-400"}`}>
          <p className="font-medium">{serviceState === "checkin" ? "🟢 Service en cours" : "🔴 Service terminé"}</p>
          {serviceState === "checkout" && <button onClick={handleReset} className="mt-2 text-xs underline hover:text-white">🔄 Nouveau cycle</button>}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center gap-5">
        <button onClick={() => handlePointage("checkin")} disabled={loading || gpsStatus === "acquiring" || uploadingPhoto || serviceState === "checkin"} className={`w-full py-6 rounded-2xl font-bold text-xl transition-all ${serviceState === "checkin" ? "bg-gray-700 cursor-not-allowed opacity-50" : "bg-emerald-600 hover:bg-emerald-500"}`}>
          {serviceState === "checkin" ? "✅ Déjà commencé" : loading ? "⏳ En cours..." : "🟢 DÉBUT DE SERVICE"}
        </button>
        <button onClick={() => handlePointage("checkout")} disabled={loading || gpsStatus === "acquiring" || uploadingPhoto || serviceState !== "checkin"} className={`w-full py-6 rounded-2xl font-bold text-xl transition-all ${serviceState !== "checkin" ? "bg-gray-700 cursor-not-allowed opacity-50" : "bg-red-600 hover:bg-red-500"}`}>
          {serviceState === "checkout" ? "🔴 Terminé" : serviceState !== "checkin" ? "⏳ Commencez d'abord" : loading ? "⏳ En cours..." : "🔴 FIN DE SERVICE"}
        </button>
      </div>

      {message && <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-xl text-center"><p className="text-sm text-gray-200">{message}</p></div>}
    </main>
  );
}