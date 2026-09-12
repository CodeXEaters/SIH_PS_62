export interface OfflineAction {
  type: string;
  endpoint: string;
  payload: any;
}

export async function seedInitialOfflineData(): Promise<void> {
  // Offline data seeding is not implemented yet.
}

export async function queueOfflineAction(action: OfflineAction): Promise<void> {
  // Queue action for offline background synchronization
}
