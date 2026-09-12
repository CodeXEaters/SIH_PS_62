import Dexie, { type Table } from "dexie";
import type { CargoItem, InventoryItem, Personnel, Mission } from "@/types";

export interface QueuedOfflineAction {
  id?: number;
  type: string;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload?: any;
  timestamp: string;
}

export class DhruvOfflineDatabase extends Dexie {
  cargo!: Table<CargoItem, string>;
  inventory!: Table<InventoryItem, string>;
  personnel!: Table<Personnel, string>;
  missions!: Table<Mission, string>;
  offline_queue!: Table<QueuedOfflineAction, number>;

  constructor() {
    super("DhruvOfflineDB");
    this.version(2).stores({
      cargo: "id, cargoCode, status, destinationStationId",
      inventory: "id, stationId, category",
      personnel: "id, stationId, status",
      missions: "id, status, riskLevel",
      offline_queue: "++id, type, endpoint, timestamp",
    });
  }
}

export const db = new DhruvOfflineDatabase();
