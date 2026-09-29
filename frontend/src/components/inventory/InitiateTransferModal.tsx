"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeftRight, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import { inventoryService } from "@/services/inventory";
import { stationsService } from "@/services/stations";
import { Station, InventoryItem } from "@/types";

interface InitiateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferCreated?: (transfer: any) => void;
}

export const InitiateTransferModal: React.FC<InitiateTransferModalProps> = ({
  isOpen,
  onClose,
  onTransferCreated,
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTransfer, setCreatedTransfer] = useState<any | null>(null);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [fromStationId, setFromStationId] = useState<number>(4);
  const [toStationId, setToStationId] = useState<number>(5);
  const [transferQuantity, setTransferQuantity] = useState<string>("50");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      stationsService.getAllStations().then((data) => {
        setStations(data);
        if (data.length >= 2) {
          setFromStationId(data[0].id);
          setToStationId(data[1].id);
        }
      }).catch(console.warn);

      inventoryService.getAllInventory().then((items) => {
        setInventoryList(items);
        if (items.length > 0) {
          setSelectedItemId(items[0].id);
          setFromStationId(items[0].stationId);
        }
      }).catch(console.warn);

      setCreatedTransfer(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  // When selected item changes, auto-update fromStationId
  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = inventoryList.find((i) => i.id === itemId);
    if (item) {
      setFromStationId(item.stationId);
      // Pick a different station for destination if identical
      if (toStationId === item.stationId) {
        const other = stations.find((s) => s.id !== item.stationId);
        if (other) setToStationId(other.id);
      }
    }
  };

  const selectedItem = inventoryList.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const qty = parseFloat(transferQuantity);
    if (!selectedItemId) {
      setSubmitError("Please select an inventory item to transfer.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setSubmitError("Transfer quantity must be greater than zero.");
      return;
    }
    if (selectedItem && qty > selectedItem.currentStock) {
      setSubmitError(
        `Requested quantity (${qty} ${selectedItem.unit}) exceeds available stock (${selectedItem.currentStock} ${selectedItem.unit}).`
      );
      return;
    }
    if (fromStationId === toStationId) {
      setSubmitError("Origin and destination stations must be distinct.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inventoryService.createTransfer({
        item_id: parseInt(selectedItemId, 10),
        from_station_id: fromStationId,
        to_station_id: toStationId,
        quantity: qty,
        notes: notes.trim() || undefined,
      });

      setCreatedTransfer(res);
      if (onTransferCreated) onTransferCreated(res);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to execute inter-station inventory transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedTransfer(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="DISPATCH INTER-STATION INVENTORY TRANSFER">
      {createdTransfer ? (
        <div className="space-y-5 py-2">
          <div className="p-4 bg-[#0A160C] border border-[#7FAF91]/40 rounded flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#7FAF91] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#F5F3EE]">Transfer Manifest Dispatched</h4>
              <p className="text-xs text-[#A5A29C] mt-1">
                Manifest <span className="font-mono text-[#F5F3EE]">{createdTransfer.id}</span> was logged and stock was atomically updated.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] p-4 rounded space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">TRANSFER CODE:</span>
              <span className="text-[#C8A96B] font-bold">{createdTransfer.id}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">ROUTING:</span>
              <span className="text-[#F5F3EE]">{createdTransfer.from_location} &rarr; {createdTransfer.to_location}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">QUANTITY TRANSFERRED:</span>
              <span className="text-[#7FAF91] font-bold">{createdTransfer.quantity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6F6D68]">AUTHORIZING OFFICER:</span>
              <span className="text-[#F5F3EE]">{createdTransfer.officer}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                handleClose();
                window.location.reload();
              }}
            >
              Done & Refresh
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {submitError && (
            <div className="p-3 bg-[#1A0A0A] border border-[#B85C5C]/50 rounded flex items-center gap-2.5 text-xs text-[#E87A7A]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#B85C5C]" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">
              Select Source Inventory Item *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              required
            >
              {inventoryList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentStock} {item.unit} available at Station #{item.stationId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">From Station</label>
              <select
                value={fromStationId}
                disabled
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#A5A29C] cursor-not-allowed"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slug.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">To Destination Station</label>
              <select
                value={toStationId}
                onChange={(e) => setToStationId(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {stations
                  .filter((s) => s.id !== fromStationId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.slug.toUpperCase()})</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">
              Quantity to Transfer {selectedItem && `(${selectedItem.unit})`} *
            </label>
            <Input
              type="number"
              step="any"
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(e.target.value)}
              placeholder="e.g. 100"
              required
            />
            {selectedItem && (
              <p className="text-[11px] text-[#6F6D68] mt-1 font-mono">
                Available stock at source station: {selectedItem.currentStock} {selectedItem.unit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Transfer Notes / Reason</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Emergency ration rebalancing for wintering-over contingency"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1E1E1E]">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Dispatching Transfer..." : "Authorize & Execute Transfer"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
