"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import "jspdf-autotable"

export default function RapportPage() {
  const [pointages, setPointages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push("/login"); return }

        const { data: profile } = await supabase
          .from("agents")
          .select("subscription_status")
          .eq("email", session.user.email)
          .single()

        if (profile?.subscription_status !== "active" && profile?.subscription_status !== "trial") {
          router.push("/dashboard")
          return
        }

        const { data } = await supabase
          .from("pointages")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(50)

        setPointages(data || [])
      } catch (err) {
        console.error("❌ Rapport load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Secu-App - Rapport d'activite", 14, 20)
    
    const tableData = pointages.map((p) => [
      new Date(p.timestamp).toLocaleDateString("fr-FR"),
      p.email?.split("@")[0] || "Agent",
      p.type === "checkin" ? "Debut" : "Fin",
      p.lat ? p.lat.toFixed(4) : "-",
      p.lng ? p.lng.toFixed(4) : "-"
    ])

    // jspdf-autotable étend jsPDF via import side-effect
    // @ts-ignore: autoTable est injecté dynamiquement
    doc.autoTable({
      startY: 30,
      head: [["Date", "Agent", "Type", "Lat", "Lng"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9 }
    })

    doc.save(`rapport_secu_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">⏳ Chargement...</div>
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <button onClick={() => router.back()} className="mb-4 text-gray-400">← Retour</button>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Rapports</h1>
        <button onClick={exportPDF} disabled={pointages.length === 0} className="bg-purple-600 px-4 py-2 rounded disabled:opacity-50 hover:bg-purple-700 transition">
          📄 Export PDF
        </button>
      </div>

      <div className="overflow-x-auto bg-gray-900 rounded border border-gray-800">
        {pointages.length === 0 ? (
          <p className="p-6 text-center text-gray-500">📭 Aucun pointage enregistré</p>
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
              {pointages.map((p, i) => (
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