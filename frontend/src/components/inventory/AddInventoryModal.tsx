"use client";

import React, { useState, useEffect } from "react";
import { Database, Plus, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import { inventoryService } from "@/services/inventory";
import { stationsService } from "@/services/stations";
import { Station, InventoryItem } from "@/types";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: InventoryItem) => void;
}

const CATEGORIES = [
  { value: "FUEL", label: "Fuel & Power Generation (Jet A-1 / Polar Diesel)" },
  { value: "RATIONS", label: "Life Support & Polar Rations (MRE / Freeze-Dried)" },
  { value: "MEDICAL", label: "Medical Supplies, Blood Plasma & Pharmaceuticals" },
  { value: "SPARE_PARTS", label: "Heavy Machinery, Snowcat & Generator Spares" },
  { value: "SCIENTIFIC", label: "Laboratory Reagents & Sampling Equipment" },
] as const;

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<InventoryItem | null>(null);

  // Form State
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<string>("FUEL");
  const [stationId, setStationId] = useState<number>(4);
  const [quantity, setQuantity] = useState<string>("1000");
  const [minThreshold, setMinThreshold] = useState<string>("200");
  const [dailyConsumption, setDailyConsumption] = useState<string>("15");
  const [unit, setUnit] = useState<string>("L");
  const [expiryDate, setExpiryDate] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      stationsService.getAllStations().then((data) => {
        setStations(data);
        if (data.length > 0) setStationId(data[0].id);
      }).catch(console.warn);

      setCreatedItem(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const qty = parseFloat(quantity);
    const min = parseFloat(minThreshold);
    const daily = parseFloat(dailyConsumption);

    if (!itemName.trim()) {
      setSubmitError("Item description name is required.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setSubmitError("Quantity must be a valid number greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const item = await inventoryService.createInventoryItem({
        item_name: itemName.trim(),
        category,
        station_id: stationId,
        quantity: qty,
        minimum_threshold: isNaN(min) ? 0 : min,
        daily_consumption: isNaN(daily) ? 1.0 : daily,
        unit: unit.trim().toUpperCase() || "UNITS",
        expiry_date: expiryDate || undefined,
      });

      setCreatedItem(item);
      if (onItemAdded) onItemAdded(item);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to record inventory item with logistics server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setItemName("");
    setCreatedItem(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="LOG NEW STATION STOCK INVENTORY">
      {createdItem ? (
        <div className="space-y-5 py-2">
          <div className="p-4 bg-[#0A160C] border border-[#7FAF91]/40 rounded flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#7FAF91] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#F5F3EE]">Stock Item Successfully Logged</h4>
              <p className="text-xs text-[#A5A29C] mt-1">
                Item <span className="font-mono text-[#F5F3EE]">{createdItem.name}</span> has been stored in station inventory records.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] p-4 rounded space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">ITEM ID:</span>
              <span className="text-[#C8A96B] font-bold">INV-{createdItem.id}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">STATION:</span>
              <span className="text-[#F5F3EE]">{stations.find((s) => s.id === stationId)?.name || `Station #${stationId}`}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">RECORDED QUANTITY:</span>
              <span className="text-[#7FAF91] font-bold">{createdItem.currentStock} {createdItem.unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6F6D68]">PROJECTED DAYS REMAINING:</span>
              <Badge variant="outline" className="text-[#C8A96B] border-[#C8A96B]/30">{createdItem.daysRemaining} Days</Badge>
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
              Item Name & Specification *
            </label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Polar Grade Jet A-1 Fuel Drums"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Target Polar Station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slug.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Quantity *</label>
              <Input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Unit</label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="L, KG, BOX"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Min Safety Threshold</label>
              <Input
                type="number"
                step="any"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Daily Burn Rate</label>
              <Input
                type="number"
                step="any"
                value={dailyConsumption}
                onChange={(e) => setDailyConsumption(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Lot Expiry Date (Optional)</label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1E1E1E]">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Logging Stock..." : "Confirm & Save Stock"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
