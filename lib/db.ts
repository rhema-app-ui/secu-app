import Dexie, { Table } from 'dexie';
import { supabase } from './supabase'; // On importe le client Supabase ici pour la sync

// 📦 Interface pour les éléments en file d'attente
export interface SyncItem {
  id?: number;
  type: 'pointage' | 'incident' | 'rapport';
  payload: any;
  createdAt: number;
}

// 🗄️ Configuration de la base locale (IndexedDB)
export class SecuDB extends Dexie {
  sync_queue!: Table<SyncItem>;

  constructor() {
    super('secu-db');
    this.version(1).stores({
      sync_queue: '++id, type, createdAt'
    });
  }
}

export const db = new SecuDB();

// ➕ Ajouter à la file d'attente
export const addToQueue = async (type: SyncItem['type'], payload: any) => {
  await db.sync_queue.add({ type, payload, createdAt: Date.now() });
};

// 🔄 Fonction de Synchronisation Automatique (Le cœur du système)
export const runSync = async () => {
  if (!navigator.onLine) return; // Si pas de net, on ne fait rien

  try {
    const pendingItems = await db.sync_queue.toArray();
    
    if (pendingItems.length === 0) return;

    console.log(`🔄 Sync: ${pendingItems.length} éléments en attente...`);

    const idsToDelete: number[] = [];

    for (const item of pendingItems) {
      try {
        // On envoie vers la bonne table Supabase
        const tableName = item.type === 'pointage' ? 'pointages' : `${item.type}s`;
        
        const { error } = await supabase.from(tableName).insert(item.payload);

        if (!error) {
          idsToDelete.push(item.id!); // Succès, on note l'ID pour suppression
          console.log(`✅ Sync réussi: ${item.type}`);
        } else {
          console.error(`❌ Erreur Sync ${item.type}:`, error.message);
        }
      } catch (e) {
        console.error("Erreur réseau lors de la sync", e);
      }
    }

    // On supprime uniquement ce qui a réussi
    if (idsToDelete.length > 0) {
      await db.sync_queue.bulkDelete(idsToDelete);
      console.log(`🧹 ${idsToDelete.length} éléments nettoyés de la file.`);
    }

    return idsToDelete.length; // Retourne le nombre de succès

  } catch (error) {
    console.error("Erreur globale de sync:", error);
  }
};