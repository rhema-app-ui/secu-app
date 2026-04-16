// 🔧 lib/db.ts — File d'attente locale réelle (localStorage)
export async function addToQueue(type: string, data: any): Promise<{ success: boolean; id: string }> {
  try {
    const queue = JSON.parse(localStorage.getItem("secu_queue") || "[]");
    const id = crypto.randomUUID?.() || `local-${Date.now()}`;
    queue.push({ id, type, data, synced: false, createdAt: new Date().toISOString() });
    localStorage.setItem("secu_queue", JSON.stringify(queue));
    return { success: true, id };
  } catch (e) {
    console.error("❌ addToQueue failed:", e);
    return { success: false, id: "" };
  }
}

export async function runSync(): Promise<{ success: boolean; synced: number }> {
  try {
    const queue = JSON.parse(localStorage.getItem("secu_queue") || "[]");
    if (queue.length === 0) return { success: true, synced: 0 };

    const { supabase } = await import("./supabase");
    let syncedCount = 0;

    for (const item of queue) {
      if (item.synced) continue;
      
      const { error } = await supabase.from(item.type === "pointage" ? "pointages" : "incidents").insert(item.data);
      if (!error) {
        item.synced = true;
        syncedCount++;
      }
    }

    // Nettoyer la file
    const newQueue = queue.filter((i: any) => !i.synced);
    localStorage.setItem("secu_queue", JSON.stringify(newQueue));
    return { success: true, synced: syncedCount };
  } catch (e) {
    console.error("❌ runSync failed:", e);
    return { success: false, synced: 0 };
  }
}

// Utilitaire pour convertir photo en Base64 (hors ligne)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}