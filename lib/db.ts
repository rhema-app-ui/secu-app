// 🔧 lib/db.ts — Version minimale et valide TypeScript
// Fonctions stub pour le build (à implémenter avec votre logique métier plus tard)

/**
 * Ajoute une tâche à la file d'attente locale (mode hors ligne)
 * @param type - Type de tâche (ex: "pointage", "incident")
 * @param data - Données à synchroniser
 */
export async function addToQueue(type: string, data: any): Promise<{ success: boolean; id: string }> {
  console.log(`📦 [db.ts] addToQueue: ${type}`, data);
  
  // TODO: Implémenter la vraie logique (IndexedDB, localStorage, etc.)
  return { 
    success: true, 
    id: crypto.randomUUID?.() || `local-${Date.now()}` 
  };
}

/**
 * Synchronise les données en attente avec le serveur
 * @returns Nombre d'actions synchronisées
 */
export async function runSync(): Promise<{ success: boolean; synced: number }> {
  console.log("🔄 [db.ts] runSync: synchronisation...");
  
  // TODO: Implémenter la vraie logique de sync avec Supabase
  return { 
    success: true, 
    synced: 0 // 0 car aucune donnée en attente pour l'instant
  };
}