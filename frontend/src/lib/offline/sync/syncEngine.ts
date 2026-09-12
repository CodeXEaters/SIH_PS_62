import { db, QueuedOfflineAction } from "../storage/db";
import { apiClient } from "@/services/apiClient";
import type { CargoItem, InventoryItem, Personnel, Mission } from "@/types";

export interface OfflineAction {
  type: string;
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  payload?: any;
}

export async function queueOfflineAction(action: OfflineAction): Promise<void> {
  await db.offline_queue.add({
    type: action.type,
    endpoint: action.endpoint,
    method: action.method || "POST",
    payload: action.payload,
    timestamp: new Date().toISOString(),
  });
}

export async function getOfflineQueueCount(): Promise<number> {
  return await db.offline_queue.count();
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const actions = await db.offline_queue.orderBy("id").toArray();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      if (action.method === "POST") {
        await apiClient.post(action.endpoint, action.payload);
      } else if (action.method === "PUT") {
        await apiClient.put(action.endpoint, action.payload);
      } else if (action.method === "PATCH") {
        await apiClient.patch(action.endpoint, action.payload);
      } else if (action.method === "DELETE") {
        await apiClient.delete(action.endpoint);
      }
      if (action.id !== undefined) {
        await db.offline_queue.delete(action.id);
      }
      synced++;
    } catch (err: any) {
      // If still offline, abort processing queue to retry later
      if (err?.isOffline) {
        break;
      }
      // If server rejected with 4xx or 5xx, discard or mark error
      if (action.id !== undefined) {
        await db.offline_queue.delete(action.id);
      }
      failed++;
    }
  }

  return { synced, failed };
}

export async function cacheEntityData(
  category: "cargo" | "inventory" | "personnel" | "missions",
  items: any[]
): Promise<void> {
  try {
    if (category === "cargo") {
      await db.cargo.bulkPut(items);
    } else if (category === "inventory") {
      await db.inventory.bulkPut(items);
    } else if (category === "personnel") {
      await db.personnel.bulkPut(items);
    } else if (category === "missions") {
      await db.missions.bulkPut(items);
    }
  } catch (err) {
    console.warn("Failed to cache offline data:", err);
  }
}

export async function seedInitialOfflineData(): Promise<void> {
  // Can be called to initialize local storage if empty
}
