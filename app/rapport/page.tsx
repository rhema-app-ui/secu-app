"use client";
import { useState, useRef, useEffect } from "react";

export default function RapportPage() {
  const [contenu, setContenu] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "ready" | "error">("idle");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 🎨 Gestion signature canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    
    // Redimensionner canvas pour mobile
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2; // HiDPI
      canvas.height = 120 * 2;
      ctx.scale(2, 2);
      ctx.strokeStyle = "#ffffff";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setSignature(canvasRef.current?.toDataURL("image/png") || null);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("idle");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ready");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      setMessage("⚠️ Veuillez capturer votre position GPS");
      return;
    }
    if (contenu.trim().length < 10) {
      setMessage("⚠️ Observation trop courte (min. 10 caractères)");
      return;
    }
    
    setSubmitting(true);
    setMessage("🔄 Enregistrement...");

    try {
      const payload = {
        email: "test@secu-agency.fr", // 🔴 À remplacer par session.user.email
        contenu: contenu.trim().slice(0, 300),
        signature_data_url: signature,
        lat: coords.lat,
        lng: coords.lng,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(
        `https://npicdgklpikwntxzgspa.supabase.co/rest/v1/rapports`,
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
        setMessage("✅ Rapport enregistré !");
        setContenu("");
        clearSignature();
        setTimeout(() => window.location.href = "/dashboard", 1500);
      } else {
        throw new Error();
      }
    } catch {
      setMessage("❌ Erreur d'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 text-gray-400 hover:text-white">← Retour</button>
        <h1 className="text-lg font-bold">📝 Rapport</h1>
        <div className="w-16" />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
        
        {/* 📋 Observation (1 champ unique) */}
        <section>
          <label className="block text-sm font-medium mb-2 text-gray-300">Observation du shift</label>
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value.slice(0, 300))}
            rows={4}
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 focus:border-blue-500 outline-none text-white placeholder-gray-500"
            placeholder="R.A.S. ou décrire un événement..."
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{contenu.length}/300</p>
        </section>

        {/* ✍️ Signature (optionnel) */}
        <section>
          <label className="block text-sm font-medium mb-2 text-gray-300">Signature (optionnel)</label>
          <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 bg-gray-800 touch-none"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={clearSignature} className="text-xs text-gray-400 hover:text-white underline">Effacer</button>
          </div>
        </section>

        {/* 📍 GPS (obligatoire pour preuve) */}
        <section>
          <label className="block text-sm font-medium mb-2 text-gray-300">Localisation</label>
          <button
            type="button"
            onClick={captureGPS}
            className={`w-full py-3 rounded-xl font-medium transition ${
              gpsStatus === "ready" ? "bg-green-600/20 text-green-400 border border-green-500/30" :
              gpsStatus === "error" ? "bg-red-600/20 text-red-400 border border-red-500/30" :
              "bg-gray-900 border border-gray-700 text-gray-300"
            }`}
          >
            {gpsStatus === "idle" && "📍 Capturer ma position"}
            {gpsStatus === "ready" && "✅ Position validée"}
            {gpsStatus === "error" && "❌ Réessayer"}
          </button>
        </section>

        {/* 💬 Feedback */}
        {message && (
          <div className={`p-3 rounded-lg text-sm text-center ${
            message.includes("✅") ? "bg-green-600/20 text-green-400" :
            message.includes("❌") ? "bg-red-600/20 text-red-400" :
            "bg-amber-600/20 text-amber-400"
          }`}>
            {message}
          </div>
        )}

        {/* 🔘 Bouton envoyer */}
        <button
          type="submit"
          disabled={submitting || !coords}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-50 py-4 rounded-2xl font-bold text-lg mt-auto"
        >
          {submitting ? "🔄 Enregistrement..." : "✅ ENREGISTRER LE RAPPORT"}
        </button>
      </form>
    </main>
  );
}