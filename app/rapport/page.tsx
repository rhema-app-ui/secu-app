"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function RapportPage() {
  const [isPro, setIsPro] = useState(false)
  const [pointages, setPointages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [debug, setDebug] = useState("")
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      try {
        setDebug("1. Récupération session...")
        const response = await supabase.auth.getSession()
        const session = response.data?.session
        
        if (!session) {
          setDebug("❌ Pas de session → redirect login")
          router.push("/login")
          return
        }
        setDebug("2. Session OK, email: " + session.user.email)

        setDebug("3. Vérification abonnement...")
        const profileResponse = await supabase
          .from("agents")
          .select("subscription_status")
          .eq("email", session.user.email)
          .single()
        
        const status = profileResponse.data?.subscription_status
        setDebug("4. Statut: " + status)
        
        if (status !== "active" && status !== "trial") {
          setDebug("❌ Accès refusé → redirect dashboard")
          router.push("/dashboard")
          return
        }
        
        setIsPro(true)
        setDebug("5. Chargement des pointages...")

        const listResponse = await supabase
          .from("pointages")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(50)
        
        setDebug("6. Réponse: " + (listResponse.data?.length || 0) + " pointages")
        setPointages(listResponse.data || [])
      } catch (err: any) {
        setDebug("❌ Erreur: " + err.message)
        console.error("Rapport error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const exportPDF = () => {
    setDebug("📄 Génération PDF...")
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Secu-App - Rapport", 14, 22)
    doc.setFontSize(11)
    doc.text("Date: " + new Date().toLocaleDateString("fr-FR"), 14, 30)

    const rows = pointages.map((p: any) => [
      new Date(p.timestamp).toLocaleString("fr-FR"),
      p.email ? p.email.split("@")[0] : "Agent",
      p.type === "checkin" ? "Debut" : "Fin",
      p.lat ? p.lat.toFixed(4) : "",
      p.lng ? p.lng.toFixed(4) : ""
    ])

    autoTable(doc, {
      startY: 40,
      head: [["Date", "Agent", "Type", "Lat", "Lng"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 }
    })

    doc.save("rapport_" + Date.now() + ".pdf")
    setDebug("✅ PDF exporté !")
  }

  // Affichage debug pendant chargement
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-4">
        <button onClick={() => router.back()} className="mb-4 text-gray-400">← Retour</button>
        <div className="bg-gray-900 p-4 rounded border border-gray-800">
          <p className="text-yellow-400">⏳ Chargement...</p>
          <p className="text-xs text-gray-500 mt-2">{debug}</p>
        </div>
      </main>
    )
  }

  // Accès refusé avec debug
  if (!isPro) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-4">
        <button onClick={() => router.back()} className="mb-4 text-gray-400">← Retour</button>
        <div className="bg-gray-900 p-6 rounded border border-gray-800 text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-gray-400 mb-2">Acces Pro requis</p>
          <p className="text-xs text-gray-600 mb-4">{debug}</p>
          <button onClick={() => router.push("/dashboard")} className="bg-purple-600 px-4 py-2 rounded">
            Retour au dashboard
          </button>
        </div>
      </main>
    )
  }

  // Page principale avec debug + bouton toujours visible
  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <button onClick={() => router.back()} className="mb-4 text-gray-400">← Retour</button>

      {/* Debug panel (à supprimer en prod) */}
      <div className="bg-gray-900 p-3 rounded mb-4 text-xs text-gray-500">
        Debug: {debug} • Pointages: {pointages.length}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Rapports</h1>
        {/* ✅ Bouton TOUJOURS visible pour le test */}
        <button 
          onClick={exportPDF} 
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded disabled:opacity-50"
        >
          📄 Export PDF
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-gray-900 rounded border border-gray-800">
        {pointages.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-2">📭 Aucun pointage trouvé</p>
            <p className="text-xs text-gray-600">
              Astuce: Va sur /pointage et crée un pointage test pour voir des données ici.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Type</th>
                <th className="p-3">Position</th>
              </tr>
            </thead>
            <tbody>
              {pointages.map((p: any, i: number) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="p-3">{new Date(p.timestamp).toLocaleString("fr-FR")}</td>
                  <td className="p-3 text-gray-300">{p.email?.split("@")[0]}</td>
                  <td className="p-3">{p.type === "checkin" ? "🟢 Debut" : "🔴 Fin"}</td>
                  <td className="p-3 text-gray-400">{p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}