"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Box,
  Truck,
  FileCheck,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { mockCargoItems } from "@/data/mock";
import { CargoItem } from "@/types";

export default function QrScannerPage() {
  const [manualId, setManualId] = useState("");
  const [scannedItem, setScannedItem] = useState<CargoItem | null>(mockCargoItems[0]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [scanningActive, setScanningActive] = useState(false);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualId.trim().toUpperCase();
    const found = mockCargoItems.find((c) => c.id.toUpperCase() === query || c.id.includes(query));
    if (found) {
      setScannedItem(found);
      setStatusMessage(`Found cargo unit: ${found.id}`);
    } else {
      setStatusMessage(`No cargo found matching "${manualId}".`);
    }
  };

  const handleSimulateScan = (id: string) => {
    const item = mockCargoItems.find((c) => c.id === id) || mockCargoItems[0];
    setScanningActive(true);
    setStatusMessage("Scanning optical matrix code...");
    setTimeout(() => {
      setScannedItem(item);
      setScanningActive(false);
      setStatusMessage(`✓ Optical QR decoded: ${item.id}`);
    }, 450);
  };

  const handleConfirmReceipt = () => {
    if (scannedItem) {
      scannedItem.status = "Received";
      setStatusMessage(`✓ Receipt confirmed for ${scannedItem.id}. Station custody recorded into IndexedDB.`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <Link
              href="/cargo"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#C8A96B] hover:underline mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>RETURN TO CARGO MANIFESTS</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              SCAN CARGO / ASSET
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Optical inspection terminal with cryptographic custody confirmation and offline persistence.
            </p>
          </div>

          <span className="text-xs font-mono text-[#7FAF91] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF91]" />
            <span>OPTICAL SENSOR READY</span>
          </span>
        </div>

        {/* Minimal Black Camera Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Camera Frame (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Viewport Box: Black camera interface with minimal gold corner markers */}
            <div className="relative aspect-square w-full rounded bg-[#0A0A0A] border border-[#242424] p-8 flex flex-col items-center justify-center overflow-hidden text-center select-none">
              {/* Minimal Gold Corner Markers */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#C8A96B]" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#C8A96B]" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#C8A96B]" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#C8A96B]" />

              {/* Minimal Scanning Reticle Frame */}
              <div className="w-44 h-44 rounded-xs border border-[#242424] relative flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-[#6F6D68] mb-2" />
                <span className="text-[10px] font-mono tracking-widest text-[#6F6D68] uppercase">
                  ALIGN TARGET
                </span>
                {scanningActive && (
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-[#C8A96B] animate-pulse" />
                )}
              </div>

              <div className="mt-6 text-xs font-mono text-[#6F6D68]">
                <span>CAMERA SENSOR ACTIVE &bull; 60 FPS</span>
              </div>

              {/* Simulated Tag Presets for Demo */}
              <div className="mt-6 pt-4 border-t border-[#242424] w-full">
                <span className="text-[9px] font-mono text-[#6F6D68] uppercase tracking-wider block mb-2">
                  SIMULATED TEST TAGS
                </span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {mockCargoItems.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSimulateScan(item.id)}
                      className="px-2 py-1 rounded bg-[#101010] hover:bg-[#151515] border border-[#242424] text-[10px] font-mono text-[#A5A29C] hover:text-[#F5F3EE] transition-colors"
                    >
                      {item.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Manual Identification Input */}
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <Input
                placeholder="Enter Lot ID manually (e.g. CRG-ANT-004821)..."
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button type="submit" variant="secondary" size="sm" className="font-mono text-xs shrink-0">
                Lookup
              </Button>
            </form>
          </div>

          {/* Clean Confirmation Panel (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            {scannedItem ? (
              <div className="p-6 rounded bg-[#101010] border border-[#242424] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                  <div>
                    <span className="text-[10px] font-mono text-[#6F6D68] uppercase tracking-widest block">
                      CONFIRMATION PANEL
                    </span>
                    <h2 className="text-base font-bold font-mono text-[#F5F3EE] mt-0.5">
                      {scannedItem.id}
                    </h2>
                  </div>
                  <Badge variant={scannedItem.status === "Delayed" ? "warning" : "success"} dot>
                    {scannedItem.status}
                  </Badge>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6F6D68]">DESCRIPTION:</span>
                    <span className="text-[#F5F3EE] font-sans font-medium text-right max-w-[240px] truncate">
                      {scannedItem.description}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6F6D68]">CONSIGNEE:</span>
                    <span className="text-[#F5F3EE]">{scannedItem.owner}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6F6D68]">DESTINATION:</span>
                    <span className="text-[#C8A96B] font-bold">{scannedItem.destination}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6F6D68]">NET WEIGHT:</span>
                    <span className="text-[#F5F3EE]">{scannedItem.weightKg} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6F6D68]">HAZARD CLASS:</span>
                    <span className="text-[#A5A29C]">{scannedItem.hazardClass}</span>
                  </div>
                </div>

                {statusMessage && (
                  <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424] text-xs font-mono text-[#C8A96B]">
                    {statusMessage}
                  </div>
                )}

                {/* Handover & Custody Confirmation Actions */}
                <div className="pt-4 border-t border-[#242424] flex flex-col sm:flex-row items-center gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto flex-1 font-mono text-xs"
                    onClick={handleConfirmReceipt}
                  >
                    Confirm Custody Handover
                  </Button>
                  <Link href={`/cargo/${scannedItem.id}`} className="w-full sm:w-auto">
                    <Button variant="secondary" size="sm" className="w-full font-mono text-xs">
                      Open Digital Twin
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-10 rounded bg-[#0A0A0A] border border-[#242424] text-center space-y-2">
                <Box className="w-8 h-8 text-[#6F6D68] mx-auto mb-2" />
                <span className="text-xs font-mono text-[#F5F3EE] block">NO TARGET ACQUIRED</span>
                <p className="text-[11px] text-[#6F6D68]">
                  Scan a QR code using the camera reticle or input an ID manually.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
