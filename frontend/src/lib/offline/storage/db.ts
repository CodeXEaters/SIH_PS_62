import Dexie, { type Table } from "dexie";
import type { CargoItem, InventoryItem, Personnel, Mission } from "@/types";

export class DhruvOfflineDatabase extends Dexie {
  cargo!: Table<CargoItem, string>;
  inventory!: Table<InventoryItem, string>;
  personnel!: Table<Personnel, string>;
  missions!: Table<Mission, string>;

  constructor() {
    super("DhruvOfflineDB");
    this.version(1).stores({
      cargo: "id, cargoCode, status, destinationStationId",
      inventory: "id, stationId, category",
      personnel: "id, stationId, status",
      missions: "id, status, riskLevel",
    });
  }
}

export const db = new DhruvOfflineDatabase();
