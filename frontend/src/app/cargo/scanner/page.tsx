"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Box,
  Camera,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Square,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { cargoService } from "@/services/cargo";
import { CargoItem } from "@/types";

type ScannerState =
  | "IDLE"
  | "STARTING"
  | "SCANNING"
  | "SUCCESS"
  | "ERROR"
  | "PERMISSION_DENIED";

export default function QrScannerPage() {
  const [scannerState, setScannerState] = useState<ScannerState>("IDLE");
  const [manualId, setManualId] = useState("");
  const [scannedItem, setScannedItem] = useState<CargoItem | null>(null);
  const [decodedPayload, setDecodedPayload] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanAuditMsg, setScanAuditMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // References for html5-qrcode instance and lifecycle control
  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);
  const hasDecodedRef = useRef<boolean>(false);

  // Stop camera tracks cleanly
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        isScanningRef.current = false;
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Notice: Camera stop:", err);
      }
    }
    setScannerState((prev) =>
      prev === "SCANNING" || prev === "STARTING" ? "IDLE" : prev
    );
  }, []);

  // Cleanup on unmount or navigation away
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
          });
      }
    };
  }, []);

  // Process decoded QR payload against real backend
  const processDecodedPayload = async (
    payload: string,
    isSimulated: boolean = false
  ) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setDecodedPayload(payload);

    try {
      // 1. Resolve real cargo record from backend
      const match = await cargoService.resolveCargoByQr(payload);
      if (!match) {
        setScannerState("ERROR");
        setErrorMessage(
          `QR detected, but it is not a recognized DHRUV cargo QR: "${payload}"`
        );
        setIsProcessing(false);
        return;
      }

      setScannedItem(match.cargo);

      // 2. Call backend scan endpoint: POST /api/v1/cargo/{id}/scan
      try {
        const scanResult = await cargoService.scanCargo(
          match.rawId,
          payload,
          "Terminal Optical Scanner"
        );
        setScannedItem(scanResult.cargo);
        setScanAuditMsg(scanResult.message);
        setStatusMessage(
          isSimulated
            ? `[DEMO / SIMULATED SCAN] Verified: ${scanResult.cargo.id}`
            : `✓ Optical scan recorded at Terminal`
        );
      } catch (apiErr: any) {
        const errDetail =
          apiErr?.data?.detail || apiErr?.message || "Backend scan recording failed";
        setScanAuditMsg(`Cargo resolved but backend mutation rejected: ${errDetail}`);
        setErrorMessage(
          `Backend scan registration failed for ${match.cargo.id}: ${errDetail}`
        );
        setScannerState("ERROR");
      }
    } catch (err: any) {
      setScannerState("ERROR");
      setErrorMessage(
        err?.data?.detail || err?.message || "Failed to query cargo registry from backend."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Start real browser camera scanner
  const startScanner = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setScanAuditMsg(null);

    // 1. Check secure context (Camera requires HTTPS or localhost)
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!window.isSecureContext && !isLocalhost) {
        setScannerState("ERROR");
        setErrorMessage("Camera access requires HTTPS or localhost.");
        return;
      }
    }

    // 2. Check mediaDevices API availability
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setScannerState("ERROR");
      setErrorMessage("No camera available on this device.");
      return;
    }

    setScannerState("STARTING");
    hasDecodedRef.current = false;

    try {
      // Ensure previous scanner was cleared
      if (scannerRef.current && isScanningRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
        isScanningRef.current = false;
      }

      // Dynamic import of html5-qrcode ensures 100% SSR safety in Next.js
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrEdge = Math.floor(minEdge * 0.75);
            return { width: qrEdge, height: qrEdge };
          },
          aspectRatio: 1.0,
        },
        async (decodedText: string) => {
          // Prevent duplicate scan events
          if (hasDecodedRef.current) return;
          hasDecodedRef.current = true;

          // Stop scanner immediately upon successful decode to release camera
          await stopScanner();

          // Process verified QR payload
          await processDecodedPayload(decodedText, false);
        },
        () => {
          // Frame-by-frame non-match callback (normal scanning cycle)
        }
      );

      isScanningRef.current = true;
      setScannerState("SCANNING");
    } catch (err: any) {
      isScanningRef.current = false;
      const errStr = String(err?.message || err || "").toLowerCase();

      if (
        errStr.includes("permission") ||
        errStr.includes("notallowederror") ||
        errStr.includes("denied")
      ) {
        setScannerState("PERMISSION_DENIED");
        setErrorMessage(
          "Camera permission denied. Allow camera access in your browser settings and try again."
        );
      } else if (
        errStr.includes("notfounderror") ||
        errStr.includes("devicesnotfound") ||
        errStr.includes("no camera")
      ) {
        setScannerState("ERROR");
        setErrorMessage("No camera available on this device.");
      } else {
        setScannerState("ERROR");
        setErrorMessage(
          err?.message || "Failed to initialize camera video feed."
        );
      }
    }
  };

  // Manual cargo code or QR lookup fallback
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualId.trim();
    if (!query) return;
    await stopScanner();
    await processDecodedPayload(query, false);
  };

  // Demo simulated test scan
  const handleSimulateScan = async (code: string) => {
    await stopScanner();
    await processDecodedPayload(code, true);
  };

  // Confirm receipt / custody handover action
  const handleConfirmReceipt = async () => {
    if (!scannedItem) return;
    try {
      const updated = await cargoService.updateCargoStatus(
        scannedItem.id,
        "Received",
        "Terminal Station Warehouse"
      );
      setScannedItem(updated);
      setStatusMessage(
        `✓ Custody confirmed for ${scannedItem.id}. Station custody recorded into database.`
      );
    } catch (err: any) {
      setStatusMessage(
        `Failed to update cargo status: ${err?.data?.detail || err?.message}`
      );
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
              Optical inspection terminal with chain-of-custody verification and offline persistence.
            </p>
          </div>

          <span
            className={`text-xs font-mono flex items-center gap-1.5 ${
              scannerState === "SCANNING"
                ? "text-[#7FAF91]"
                : scannerState === "STARTING"
                ? "text-[#C8A96B]"
                : scannerState === "ERROR" || scannerState === "PERMISSION_DENIED"
                ? "text-[#E06C75]"
                : "text-[#A5A29C]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                scannerState === "SCANNING"
                  ? "bg-[#7FAF91] animate-pulse"
                  : scannerState === "STARTING"
                  ? "bg-[#C8A96B] animate-ping"
                  : scannerState === "ERROR" || scannerState === "PERMISSION_DENIED"
                  ? "bg-[#E06C75]"
                  : "bg-[#6F6D68]"
              }`}
            />
            <span>
              {scannerState === "SCANNING"
                ? "OPTICAL SENSOR ACTIVE"
                : scannerState === "STARTING"
                ? "INITIALIZING..."
                : scannerState === "SUCCESS"
                ? "TARGET ACQUIRED"
                : scannerState === "ERROR" || scannerState === "PERMISSION_DENIED"
                ? "SENSOR FAULT"
                : "OPTICAL SENSOR READY"}
            </span>
          </span>
        </div>

        {/* Scanner Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Camera Frame (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Viewport Box: Black camera interface with minimal gold corner markers */}
            <div className="relative aspect-square w-full rounded bg-[#0A0A0A] border border-[#242424] overflow-hidden flex flex-col items-center justify-center select-none">
              {/* html5-qrcode DOM Target Video Container */}
              <div
                id="qr-reader"
                className="w-full h-full absolute inset-0 overflow-hidden"
              />

              {/* Gold Corner Markers */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#C8A96B] pointer-events-none z-20" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#C8A96B] pointer-events-none z-20" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#C8A96B] pointer-events-none z-20" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#C8A96B] pointer-events-none z-20" />

              {/* State Overlays when NOT actively scanning */}
              {scannerState !== "SCANNING" && (
                <div className="absolute inset-0 bg-[#0A0A0A] z-10 p-6 flex flex-col items-center justify-center text-center">
                  {scannerState === "IDLE" && (
                    <>
                      <Camera className="w-12 h-12 text-[#6F6D68] mb-3" />
                      <span className="text-xs font-mono text-[#F5F3EE] uppercase tracking-wider mb-1">
                        OPTICAL SCANNER STANDBY
                      </span>
                      <p className="text-[11px] text-[#A5A29C] max-w-xs mb-5">
                        Click below to activate camera and scan physical cargo QR codes.
                      </p>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={startScanner}
                        className="font-mono text-xs px-6"
                      >
                        START CAMERA
                      </Button>
                    </>
                  )}

                  {scannerState === "STARTING" && (
                    <>
                      <RefreshCw className="w-10 h-10 text-[#C8A96B] animate-spin mb-3" />
                      <span className="text-xs font-mono text-[#C8A96B] uppercase tracking-wider mb-1">
                        INITIALIZING OPTICAL SENSOR...
                      </span>
                      <p className="text-[11px] text-[#6F6D68]">
                        Requesting camera permission and activating video stream...
                      </p>
                    </>
                  )}

                  {scannerState === "PERMISSION_DENIED" && (
                    <>
                      <AlertTriangle className="w-10 h-10 text-[#E06C75] mb-2" />
                      <span className="text-xs font-mono text-[#E06C75] uppercase tracking-wider mb-1">
                        PERMISSION DENIED
                      </span>
                      <p className="text-[11px] text-[#F5F3EE] max-w-xs mb-4">
                        {errorMessage ||
                          "Camera permission denied. Allow camera access in your browser settings and try again."}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={startScanner}
                        className="font-mono text-xs"
                      >
                        TRY AGAIN
                      </Button>
                    </>
                  )}

                  {scannerState === "ERROR" && (
                    <>
                      <AlertCircle className="w-10 h-10 text-[#E06C75] mb-2" />
                      <span className="text-xs font-mono text-[#E06C75] uppercase tracking-wider mb-1">
                        SENSOR FAULT
                      </span>
                      <p className="text-[11px] text-[#F5F3EE] max-w-xs mb-4">
                        {errorMessage || "An unexpected camera error occurred."}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={startScanner}
                        className="font-mono text-xs"
                      >
                        RETRY CAMERA
                      </Button>
                    </>
                  )}

                  {scannerState === "SUCCESS" && (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-[#7FAF91] mb-2" />
                      <span className="text-xs font-mono text-[#7FAF91] uppercase tracking-wider mb-1">
                        ✓ QR DECODED
                      </span>
                      <p className="text-[11px] font-mono text-[#A5A29C] max-w-xs truncate mb-4">
                        {decodedPayload}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={startScanner}
                        className="font-mono text-xs"
                      >
                        SCAN NEXT TARGET
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Scanning Reticle Frame (Overlay during active scanning) */}
              {scannerState === "SCANNING" && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  <div className="w-52 h-52 rounded border border-[#C8A96B]/60 relative flex flex-col items-center justify-between p-2 shadow-[0_0_20px_rgba(200,169,107,0.15)]">
                    {/* Animated Scanning Laser Line */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-[#C8A96B] animate-pulse shadow-[0_0_8px_#C8A96B]" />
                    <span className="text-[9px] font-mono tracking-widest text-[#C8A96B] bg-black/70 px-2 py-0.5 rounded">
                      ALIGN TARGET
                    </span>
                    <span className="text-[8px] font-mono text-[#A5A29C] bg-black/70 px-2 py-0.5 rounded">
                      ANTARCTIC LOGISTICS QR
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Control Action Buttons */}
            {scannerState === "SCANNING" && (
              <Button
                variant="danger"
                size="sm"
                onClick={stopScanner}
                className="w-full font-mono text-xs flex items-center justify-center gap-2"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP CAMERA</span>
              </Button>
            )}

            {/* Real Camera State Indicator (Frame Rate / Sensor State) */}
            <div className="text-center text-xs font-mono py-1">
              {scannerState === "SCANNING" && (
                <span className="text-[#7FAF91] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#7FAF91] animate-pulse" />
                  <span>CAMERA ACTIVE</span>
                </span>
              )}
              {scannerState === "STARTING" && (
                <span className="text-[#C8A96B] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#C8A96B] animate-ping" />
                  <span>CAMERA STARTING</span>
                </span>
              )}
              {(scannerState === "ERROR" || scannerState === "PERMISSION_DENIED") && (
                <span className="text-[#E06C75] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#E06C75]" />
                  <span>CAMERA ERROR</span>
                </span>
              )}
              {scannerState === "IDLE" && (
                <span className="text-[#6F6D68] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#6F6D68]" />
                  <span>CAMERA OFFLINE</span>
                </span>
              )}
              {scannerState === "SUCCESS" && (
                <span className="text-[#7FAF91] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#7FAF91]" />
                  <span>TARGET ACQUIRED</span>
                </span>
              )}
            </div>

            {/* Manual Identification Input */}
            <form onSubmit={handleManualSearch} className="flex gap-2 pt-2">
              <Input
                placeholder="Enter Cargo Code or QR manually (e.g. CRG-2026-001)..."
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="font-mono text-xs shrink-0 flex items-center gap-1.5"
                disabled={isProcessing || !manualId.trim()}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Lookup</span>
              </Button>
            </form>

            {/* Simulated Tag Presets for Demo Fallback */}
            <div className="mt-4 pt-4 border-t border-[#242424] w-full">
              <span className="text-[9px] font-mono text-[#6F6D68] uppercase tracking-wider block mb-2 text-center">
                DEMO / SIMULATED SCAN
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {["CRG-2026-001", "CRG-2026-002", "CRG-2026-003"].map((code) => (
                  <button
                    key={code}
                    onClick={() => handleSimulateScan(code)}
                    disabled={isProcessing}
                    className="px-2.5 py-1 rounded bg-[#101010] hover:bg-[#181818] border border-[#242424] hover:border-[#C8A96B]/40 text-[10px] font-mono text-[#A5A29C] hover:text-[#F5F3EE] transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
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
                  <Badge
                    variant={
                      scannedItem.status === "Delayed"
                        ? "warning"
                        : scannedItem.status === "Received"
                        ? "success"
                        : "default"
                    }
                    dot
                  >
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
                    <span className="text-[#C8A96B] font-bold">
                      {scannedItem.destination}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6F6D68]">NET WEIGHT:</span>
                    <span className="text-[#F5F3EE]">{scannedItem.weightKg} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6F6D68]">HAZARD CLASS:</span>
                    <span className="text-[#A5A29C]">
                      {scannedItem.hazardClass}
                    </span>
                  </div>
                </div>

                {/* Scanned QR Payload and Verification Result */}
                {decodedPayload && (
                  <div className="p-3.5 rounded bg-[#0A0A0A] border border-[#7FAF91]/30 text-xs font-mono space-y-1.5">
                    <div className="text-[#7FAF91] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#7FAF91]" />
                      <span>✓ QR DECODED</span>
                    </div>
                    <div className="text-[#A5A29C] text-[11px] break-all pl-5">
                      PAYLOAD: {decodedPayload}
                    </div>
                    {scanAuditMsg && (
                      <div className="text-[#C8A96B] text-[11px] pl-5">
                        ✓ CARGO VERIFIED • {scanAuditMsg}
                      </div>
                    )}
                  </div>
                )}

                {statusMessage && (
                  <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424] text-xs font-mono text-[#C8A96B] whitespace-pre-line">
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
                  <Link
                    href={`/cargo/${scannedItem.id}`}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full font-mono text-xs"
                    >
                      Open Digital Twin
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-10 rounded bg-[#0A0A0A] border border-[#242424] text-center space-y-2">
                <Box className="w-8 h-8 text-[#6F6D68] mx-auto mb-2" />
                <span className="text-xs font-mono text-[#F5F3EE] block">
                  NO TARGET ACQUIRED
                </span>
                <p className="text-[11px] text-[#6F6D68]">
                  Scan a QR code using the camera reticle or input an ID manually.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded CSS for html5-qrcode video styling */}
      <style jsx global>{`
        #qr-reader {
          border: none !important;
          background: transparent !important;
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 4px !important;
        }
        #qr-reader__scan_region {
          background: transparent !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
        #qr-reader__camera_selection {
          display: none !important;
        }
      `}</style>
    </AppShell>
  );
}
