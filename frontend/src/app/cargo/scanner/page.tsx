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
  Upload,
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

interface VerifiedCargoIdentity {
  id: number; // actual numeric PostgreSQL database ID
  cargo_code: string;
  qr_code: string;
}

export default function QrScannerPage() {
  const [scannerState, setScannerState] = useState<ScannerState>("IDLE");
  const [manualId, setManualId] = useState("");
  const [scannedItem, setScannedItem] = useState<CargoItem | null>(null);
  const [verifiedCargo, setVerifiedCargo] = useState<VerifiedCargoIdentity | null>(null);
  const [decodedPayload, setDecodedPayload] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanAuditMsg, setScanAuditMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);

  // References for html5-qrcode instance, file picker, and lifecycle control
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    console.log("Decoded QR:", payload);

    try {
      // 1. Resolve real cargo record from backend
      const match = await cargoService.resolveCargoByQr(payload);
      if (!match) {
        setScannerState("ERROR");
        setVerifiedCargo(null);
        setScannedItem(null);
        setErrorMessage(
          `QR detected, but it is not a recognized DHRUV cargo QR: "${payload}"`
        );
        setIsProcessing(false);
        return;
      }

      console.log("Resolved cargo:", {
        id: match.id,
        cargo_code: match.cargo_code,
        qr_code: match.qr_code,
      });

      setVerifiedCargo({
        id: match.id,
        cargo_code: match.cargo_code,
        qr_code: match.qr_code,
      });
      setScannedItem(match.cargo);

      // 2. Call backend scan endpoint: POST /api/v1/cargo/{id}/scan
      try {
        const scanResult = await cargoService.scanCargo(
          match.id,
          payload,
          "Terminal Optical Scanner"
        );
        setScannedItem(scanResult.cargo);
        setScanAuditMsg(scanResult.message);
        setStatusMessage(
          isSimulated
            ? `[DEMO / SIMULATED SCAN] Verified: ${match.cargo_code} (DB ID: #${match.id})`
            : `✓ Optical scan recorded at Terminal for ${match.cargo_code}`
        );
        setScannerState("SUCCESS");
      } catch (apiErr: any) {
        const errDetail =
          apiErr?.data?.detail || apiErr?.message || "Backend scan recording failed";
        setScanAuditMsg(`Cargo resolved but backend mutation rejected: ${errDetail}`);
        setErrorMessage(
          `Backend scan registration failed for ${match.cargo_code}: ${errDetail}`
        );
        setScannerState("ERROR");
      }
    } catch (err: any) {
      setScannerState("ERROR");
      setVerifiedCargo(null);
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

  // Handle local QR code image upload and real decoding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // Clear file input so the same file can be reselected
    if (!file) return;

    // 1. If camera is scanning, stop it cleanly first
    await stopScanner();

    setErrorMessage(null);
    setStatusMessage(null);
    setScanAuditMsg(null);

    // 2. Validate file type: PNG, JPG/JPEG, WEBP
    const validMimeTypes = ["image/png", "image/jpeg", "image/webp"];
    const validExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!validMimeTypes.includes(file.type) && !hasValidExt) {
      setScannerState("ERROR");
      setErrorMessage("Invalid file format. Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    setIsDecodingImage(true);
    let decodedText: string | null = null;
    let html5QrCode: any = null;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      html5QrCode = new Html5Qrcode("qr-file-reader");
      decodedText = await html5QrCode.scanFile(file, false);
    } catch (decodeErr: any) {
      setScannerState("ERROR");
      setErrorMessage("Could not detect a QR code in this image.");
      return;
    } finally {
      if (html5QrCode) {
        try {
          html5QrCode.clear();
        } catch {}
      }
      setIsDecodingImage(false);
    }

    if (decodedText && decodedText.trim()) {
      await processDecodedPayload(decodedText.trim(), false);
    } else {
      setScannerState("ERROR");
      setErrorMessage("Could not detect a QR code in this image.");
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
  const handleConfirmHandover = async () => {
    // Defensive validation before submission (Requirement 5)
    if (!verifiedCargo) {
      setErrorMessage("No verified cargo available for custody handover.");
      return;
    }

    if (
      typeof verifiedCargo.id !== "number" ||
      isNaN(verifiedCargo.id) ||
      verifiedCargo.id <= 0
    ) {
      setErrorMessage(
        `Invalid cargo database ID (${verifiedCargo.id}). Cannot perform custody handover without a valid numeric ID.`
      );
      return;
    }

    if (!verifiedCargo.cargo_code) {
      setErrorMessage("Missing cargo code on verified cargo record.");
      return;
    }

    if (!verifiedCargo.qr_code) {
      setErrorMessage("Missing QR identity on verified cargo record.");
      return;
    }

    console.log("Handover cargo ID:", verifiedCargo.id);
    console.log(`Final request: POST /api/v1/cargo/${verifiedCargo.id}/scan`);

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const scanResult = await cargoService.scanCargo(
        verifiedCargo.id,
        {
          qr_code: verifiedCargo.qr_code,
          location: "Terminal Station Warehouse",
          event_type: "SCANNED",
          remarks: `Physical custody handover verified and logged at Terminal Station Warehouse for ${verifiedCargo.cargo_code}.`,
        }
      );

      setScannedItem(scanResult.cargo);
      setStatusMessage(
        `✓ Custody handover confirmed for ${verifiedCargo.cargo_code} (DB ID: #${verifiedCargo.id}). Chain of custody event recorded.`
      );
      setScanAuditMsg(scanResult.message);
    } catch (err: any) {
      console.error("Custody handover error:", err);
      // Requirement 10: Specific error handling
      const status = err?.status || err?.response?.status;
      const detail = err?.data?.detail || err?.response?.data?.detail || err?.message;

      if (status === 404) {
        setErrorMessage(`Cargo not found (404): ${detail || `Cargo ID ${verifiedCargo.id} not found in database.`}`);
      } else if (status === 403) {
        setErrorMessage(`Unauthorized operation (403): ${detail || "You do not have permission to log custody handovers."}`);
      } else if (status === 400 || status === 422) {
        setErrorMessage(`Validation error (${status}): ${detail || "Invalid scan payload parameters."}`);
      } else if (status >= 500) {
        setErrorMessage(`Server error (${status}): ${detail || "Internal backend error during custody recording."}`);
      } else {
        setErrorMessage(`Custody handover failed: ${detail || "Unknown network error."}`);
      }
    } finally {
      setIsProcessing(false);
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
              isDecodingImage
                ? "text-[#C8A96B]"
                : scannerState === "SCANNING"
                ? "text-[#7FAF91]"
                : scannerState === "STARTING"
                ? "text-[#C8A96B]"
                : scannerState === "ERROR" || scannerState === "PERMISSION_DENIED"
                ? "text-[#E06C75]"
                : scannerState === "SUCCESS"
                ? "text-[#7FAF91]"
                : "text-[#A5A29C]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDecodingImage
                  ? "bg-[#C8A96B] animate-ping"
                  : scannerState === "SCANNING"
                  ? "bg-[#7FAF91] animate-pulse"
                  : scannerState === "STARTING"
                  ? "bg-[#C8A96B] animate-ping"
                  : scannerState === "ERROR" || scannerState === "PERMISSION_DENIED"
                  ? "bg-[#E06C75]"
                  : scannerState === "SUCCESS"
                  ? "bg-[#7FAF91]"
                  : "bg-[#6F6D68]"
              }`}
            />
            <span>
              {isDecodingImage
                ? "DECODING IMAGE..."
                : scannerState === "SCANNING"
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

              {/* Dedicated isolated container for file-based QR decoding */}
              <div id="qr-file-reader" className="hidden" style={{ display: "none" }} />

              {/* Hidden file input for local QR image uploads */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                style={{ display: "none" }}
                onChange={handleFileUpload}
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
                        Point camera at physical cargo QR codes or select an image file to decode.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={startScanner}
                          className="font-mono text-xs px-6"
                          disabled={isDecodingImage}
                        >
                          START CAMERA
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-mono text-xs px-6 flex items-center gap-2"
                          disabled={isDecodingImage}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isDecodingImage ? "DECODING IMAGE..." : "UPLOAD QR IMAGE"}</span>
                        </Button>
                      </div>
                      <span className="text-[10px] font-mono text-[#6F6D68] mt-3">
                        or upload a QR image
                      </span>
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
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={startScanner}
                          className="font-mono text-xs"
                          disabled={isDecodingImage}
                        >
                          TRY AGAIN
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-mono text-xs flex items-center gap-1.5"
                          disabled={isDecodingImage}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isDecodingImage ? "DECODING..." : "UPLOAD QR IMAGE"}</span>
                        </Button>
                      </div>
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
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={startScanner}
                          className="font-mono text-xs"
                          disabled={isDecodingImage}
                        >
                          RETRY CAMERA
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-mono text-xs flex items-center gap-1.5"
                          disabled={isDecodingImage}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isDecodingImage ? "DECODING..." : "UPLOAD QR IMAGE"}</span>
                        </Button>
                      </div>
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
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={startScanner}
                          className="font-mono text-xs"
                          disabled={isDecodingImage}
                        >
                          SCAN NEXT TARGET
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-mono text-xs flex items-center gap-1.5"
                          disabled={isDecodingImage}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isDecodingImage ? "DECODING..." : "UPLOAD QR IMAGE"}</span>
                        </Button>
                      </div>
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
            {scannerState === "SCANNING" ? (
              <Button
                variant="danger"
                size="sm"
                onClick={stopScanner}
                className="w-full font-mono text-xs flex items-center justify-center gap-2"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP CAMERA</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={startScanner}
                  className="flex-1 font-mono text-xs flex items-center justify-center gap-2"
                  disabled={isDecodingImage}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>START CAMERA</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 font-mono text-xs flex items-center justify-center gap-2"
                  disabled={isDecodingImage}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isDecodingImage ? "DECODING..." : "UPLOAD QR IMAGE"}</span>
                </Button>
              </div>
            )}

            {/* Real Camera State Indicator (Frame Rate / Sensor State) */}
            <div className="text-center text-xs font-mono py-1">
              {isDecodingImage && (
                <span className="text-[#C8A96B] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#C8A96B] animate-ping" />
                  <span>DECODING IMAGE...</span>
                </span>
              )}
              {!isDecodingImage && scannerState === "SCANNING" && (
                <span className="text-[#7FAF91] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#7FAF91] animate-pulse" />
                  <span>CAMERA ACTIVE</span>
                </span>
              )}
              {!isDecodingImage && scannerState === "STARTING" && (
                <span className="text-[#C8A96B] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#C8A96B] animate-ping" />
                  <span>CAMERA STARTING</span>
                </span>
              )}
              {!isDecodingImage && (scannerState === "ERROR" || scannerState === "PERMISSION_DENIED") && (
                <span className="text-[#E06C75] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#E06C75]" />
                  <span>SENSOR FAULT</span>
                </span>
              )}
              {!isDecodingImage && scannerState === "IDLE" && (
                <span className="text-[#6F6D68] flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#6F6D68]" />
                  <span>OPTICAL SENSOR READY</span>
                </span>
              )}
              {!isDecodingImage && scannerState === "SUCCESS" && (
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
                    onClick={handleConfirmHandover}
                    disabled={isProcessing || !verifiedCargo}
                  >
                    {isProcessing ? "Processing Handover..." : "Confirm Custody Handover"}
                  </Button>
                  <Link
                    href={`/cargo/${scannedItem.cargo_code || scannedItem.id}`}
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
