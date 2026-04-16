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
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const response = await supabase.auth.getSession()
      const session = response.data?.session
      
      if (!session) {
        router.push("/login")
        return
      }

      const profileResponse = await supabase
        .from("agents")
        .select("subscription_status")
        .eq("email", session.user.email)
        .single()
      
      const status = profileResponse.data?.subscription_status
      
      if (status !== "active" && status !== "trial") {
        router.push("/dashboard")
        return
      }
      
      setIsPro(true)

      const listResponse = await supabase
        .from("pointages")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50)
      
      setPointages(listResponse.data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const exportPDF = () => {
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
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Chargement...</p>
      </main>
    )
  }

  if (!isPro) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-gray-400 mb-4">Acces Pro requis</p>
          <button onClick={() => router.push("/dashboard")} className="bg-purple-600 px-4 py-2 rounded">
            Retour
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <button onClick={() => router.back()} className="mb-4 text-gray-400">
        ← Retour
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Rapports</h1>
        <button onClick={exportPDF} disabled={pointages.length === 0} className="bg-purple-600 px-4 py-2 rounded disabled:opacity-50">
          📄 Export PDF
        </button>
      </div>

      <div className="overflow-x-auto bg-gray-900 rounded border border-gray-800">
        {pointages.length === 0 ? (
          <p className="p-6 text-center text-gray-500">Aucun pointage</p>
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