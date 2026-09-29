"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, Badge } from "@/components/ui";
import { db, QueuedOfflineAction } from "@/lib/offline/storage/db";
import { syncOfflineQueue, getOfflineQueueCount } from "@/lib/offline/sync/syncEngine";
import { RefreshCw, CheckCircle2, AlertTriangle, Wifi, WifiOff, X } from "lucide-react";

interface OfflineSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const OfflineSyncDrawer: React.FC<OfflineSyncDrawerProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [queuedItems, setQueuedItems] = useState<QueuedOfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshQueue = async () => {
    try {
      const items = await db.offline_queue.orderBy("id").reverse().toArray();
      setQueuedItems(items);
    } catch {
      setQueuedItems([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshQueue();
      setSyncResult(null);
    }
  }, [isOpen]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncOfflineQueue();
      setSyncResult(res);
      await refreshQueue();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      console.warn("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (confirm("Are you sure you want to discard all queued offline changes?")) {
      await db.offline_queue.clear();
      await refreshQueue();
      if (onSyncComplete) onSyncComplete();
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="OFFLINE QUEUE & LOCAL SYNC ENGINE">
      <div className="space-y-5 text-xs font-mono">
        {/* Connection status header */}
        <div className="flex items-center justify-between p-3 rounded bg-[#121212] border border-[#242424]">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-[#7FAF91]">
                <Wifi className="w-4 h-4" />
                <span>ONLINE &bull; SAT-COM CONNECTED</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#B85C5C]">
                <WifiOff className="w-4 h-4" />
                <span>OFFLINE &bull; LOCAL INDEXED-DB CACHE</span>
              </span>
            )}
          </div>
          <Badge variant="outline" className="border-[#C8A96B]/30 text-[#C8A96B]">
            {queuedItems.length} PENDING
          </Badge>
        </div>

        {syncResult && (
          <div className="p-3 rounded bg-[#0A160C] border border-[#7FAF91]/40 flex items-center gap-2 text-[#7FAF91]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Synchronized {syncResult.synced} action(s) to server. {syncResult.failed > 0 && `(${syncResult.failed} failed)`}</span>
          </div>
        )}

        {/* Queued Action List */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#A5A29C] uppercase text-[11px]">Queued Field Mutations</span>
            {queuedItems.length > 0 && (
              <button
                onClick={handleClearQueue}
                className="text-[10px] text-[#B85C5C] hover:underline"
              >
                Discard Queue
              </button>
            )}
          </div>

          {queuedItems.length === 0 ? (
            <div className="p-8 text-center bg-[#0D0D0D] border border-[#1E1E1E] rounded text-[#6F6D68]">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-[#7FAF91]/60" />
              <p>All field events synchronized with HQ database.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {queuedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#0D0D0D] border border-[#242424] rounded space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#C8A96B] font-bold text-[11px]">{item.type}</span>
                    <span className="text-[10px] text-[#6F6D68]">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#A5A29C]">
                    <span className="text-[#6F6D68]">{item.method}</span> {item.endpoint}
                  </div>
                  {item.payload && (
                    <div className="p-1.5 bg-[#050505] rounded text-[10px] text-[#808080] truncate font-sans">
                      {JSON.stringify(item.payload)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-4 border-t border-[#1E1E1E]">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSyncNow}
            disabled={isSyncing || queuedItems.length === 0}
          >
            {isSyncing ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing...
              </span>
            ) : (
              "Force Sync All Now"
            )}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
