"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Box,
  Plus,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import {
  cargoService,
  CreateCargoInput,
  BackendCargoCreated,
} from "@/services/cargo";
import { stationsService } from "@/services/stations";
import { Station, CargoItem } from "@/types";

interface RegisterCargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCargoCreated?: (cargo: CargoItem) => void;
}

const CATEGORIES = [
  { value: "SCIENTIFIC", label: "Scientific Instrumentation" },
  { value: "MEDICAL", label: "Medical Supplies & Plasma" },
  { value: "FUEL", label: "Fuel & Power Generation" },
  { value: "FOOD", label: "Life Support & Provisions" },
  { value: "EQUIPMENT", label: "Heavy Machinery Spares" },
] as const;

const PRIORITIES = [
  { value: "LOW", label: "Low Priority", color: "text-[#A5A29C]" },
  { value: "MEDIUM", label: "Medium Priority (Standard)", color: "text-[#7FAF91]" },
  { value: "HIGH", label: "High Priority (Expedited)", color: "text-[#C8A96B]" },
  { value: "CRITICAL", label: "Critical Priority (Life Support)", color: "text-[#B85C5C]" },
] as const;

export const RegisterCargoModal: React.FC<RegisterCargoModalProps> = ({
  isOpen,
  onClose,
  onCargoCreated,
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CreateCargoInput["category"]>("SCIENTIFIC");
  const [weight, setWeight] = useState("");
  const [priority, setPriority] = useState<CreateCargoInput["priority"]>("HIGH");
  const [originStationId, setOriginStationId] = useState<number>(1);
  const [destinationStationId, setDestinationStationId] = useState<number>(4);
  const [currentLocation, setCurrentLocation] = useState("NCPOR Goa Logistics Bay");

  // State control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdResult, setCreatedResult] = useState<{
    cargo: CargoItem;
    raw: BackendCargoCreated;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load real stations from stationsService
  useEffect(() => {
    if (isOpen) {
      setIsLoadingStations(true);
      stationsService
        .getAllStations()
        .then((data) => {
          if (data && data.length > 0) {
            setStations(data);
            // Default origin to Goa (id 1 or first station)
            const goa = data.find((s) => s.id === 1 || s.name.toLowerCase().includes("goa"));
            if (goa) setOriginStationId(goa.id);
            // Default destination to Bharati (id 4 or another station)
            const bharati = data.find((s) => s.id === 4 || s.name.toLowerCase().includes("bharati"));
            if (bharati) setDestinationStationId(bharati.id);
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch stations for cargo modal:", err);
        })
        .finally(() => {
          setIsLoadingStations(false);
        });
    } else {
      // Reset state when modal is closed
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName("");
    setCategory("SCIENTIFIC");
    setWeight("");
    setPriority("HIGH");
    setCurrentLocation("NCPOR Goa Logistics Bay");
    setIsSubmitting(false);
    setGeneralError(null);
    setFieldErrors({});
    setCreatedResult(null);
    setCopied(false);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Cargo package name or description is required.";
    }

    const parsedWeight = parseFloat(weight);
    if (!weight || isNaN(parsedWeight) || parsedWeight <= 0) {
      errors.weight = "Weight must be a positive number greater than 0 kg.";
    }

    if (!originStationId) {
      errors.originStationId = "Departure polar station is required.";
    }

    if (!destinationStationId) {
      errors.destinationStationId = "Destination polar station is required.";
    }

    if (originStationId && destinationStationId && originStationId === destinationStationId) {
      errors.destinationStationId = "Origin and destination stations cannot be the same.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload: CreateCargoInput = {
        name: name.trim(),
        category,
        weight: parseFloat(weight),
        priority,
        origin_station_id: Number(originStationId),
        destination_station_id: Number(destinationStationId),
        current_location: currentLocation.trim() || undefined,
      };

      const result = await cargoService.createCargo(payload);
      setCreatedResult(result);

      if (onCargoCreated) {
        onCargoCreated(result.cargo);
      }
    } catch (err: any) {
      console.error("Failed to create cargo:", err);
      if (err?.status === 403) {
        setGeneralError(
          "Access Denied (HTTP 403): You do not have permission to register new cargo manifests. Only LOGISTICS, OPERATIONS, or ADMIN roles are authorized."
        );
      } else if (err?.data?.detail) {
        if (Array.isArray(err.data.detail)) {
          const formatted = err.data.detail
            .map((d: any) => `${d.loc?.join(".") || "field"}: ${d.msg}`)
            .join("; ");
          setGeneralError(`Validation Error: ${formatted}`);
        } else {
          setGeneralError(String(err.data.detail));
        }
      } else {
        setGeneralError(err?.message || "Failed to register cargo with backend.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyQr = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.raw.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const originStation = stations.find((s) => s.id === originStationId);
  const destinationStation = stations.find((s) => s.id === destinationStationId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createdResult ? "Cargo Manifest Registered" : "Register New Cargo Package"}
      description={
        createdResult
          ? "The package has been registered in the PostgreSQL database with a unique QR identity."
          : "Create an official polar shipping manifest with automated QR code identity assignment."
      }
      maxWidth="xl"
    >
      <div className="p-6">
        {/* Success State View */}
        {createdResult ? (
          <div className="space-y-6">
            {/* Top Success Banner */}
            <div className="p-4 rounded bg-[#0E1A12] border border-[#7FAF91]/40 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#7FAF91] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold font-mono text-[#F5F3EE] uppercase tracking-wider">
                  MANIFEST CREATED SUCCESSFULLY
                </h4>
                <p className="text-xs text-[#A5A29C] mt-1 font-mono">
                  Saved to canonical PostgreSQL database as an active polar consignment.
                </p>
              </div>
            </div>

            {/* Cargo Identity Card */}
            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242424] pb-3">
                <div>
                  <span className="text-[10px] text-[#6F6D68] uppercase block tracking-wider">
                    ASSIGNED CARGO CODE
                  </span>
                  <span className="text-xl font-bold text-[#F5F3EE] mt-0.5 block">
                    {createdResult.raw.cargo_code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" dot>
                    {createdResult.raw.status}
                  </Badge>
                  <Badge
                    variant={
                      createdResult.raw.priority === "CRITICAL"
                        ? "danger"
                        : createdResult.raw.priority === "HIGH"
                        ? "warning"
                        : "default"
                    }
                  >
                    {createdResult.raw.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-[#6F6D68] uppercase block">ITEM NAME</span>
                  <span className="text-sm text-[#F5F3EE] font-semibold mt-0.5 block">
                    {createdResult.raw.name}
                  </span>
                  <span className="text-[11px] text-[#A5A29C] mt-0.5 block">
                    Category: {createdResult.raw.category}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#6F6D68] uppercase block">MASS &amp; STOWAGE</span>
                  <span className="text-sm text-[#C8A96B] font-semibold mt-0.5 block">
                    {createdResult.raw.weight.toFixed(1)} kg
                  </span>
                  <span className="text-[11px] text-[#A5A29C] mt-0.5 block">
                    Current: {createdResult.raw.current_location}
                  </span>
                </div>

                <div className="sm:col-span-2 border-t border-[#1C1C1C] pt-3">
                  <span className="text-[10px] text-[#6F6D68] uppercase block">PLANNED POLAR ROUTE</span>
                  <div className="flex items-center gap-2 mt-1 text-[#F5F3EE] font-bold">
                    <span>{originStation?.name || `Station #${createdResult.raw.origin_station_id}`}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C8A96B]" />
                    <span>{destinationStation?.name || `Station #${createdResult.raw.destination_station_id}`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Identity Card */}
            <div className="p-4 rounded bg-[#141414] border border-[#2A2A2A] space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#C8A96B]" />
                  <span className="text-xs font-bold text-[#F5F3EE] uppercase tracking-wider">
                    CRYPTOGRAPHIC QR IDENTITY
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyQr}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E1E1E] border border-[#333] hover:border-[#C8A96B] text-xs text-[#F5F3EE] transition-colors"
                  title="Copy QR payload for scanner testing"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#7FAF91]" />
                      <span className="text-[#7FAF91]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#A5A29C]" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-2.5 rounded bg-[#080808] border border-[#202020] select-all break-all text-xs text-[#C8A96B] font-bold">
                {createdResult.raw.qr_code}
              </div>

              <p className="text-[11px] text-[#A5A29C] leading-relaxed">
                Use this payload in the{" "}
                <Link
                  href="/cargo/scanner"
                  onClick={onClose}
                  className="text-[#C8A96B] hover:underline font-bold"
                >
                  QR Scanner
                </Link>{" "}
                to test real optical scanning and chain-of-custody location verification.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2 border-t border-[#242424]">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto font-mono text-xs"
              >
                Close &amp; Refresh Dashboard
              </Button>
              <Link href={`/cargo/${createdResult.raw.cargo_code}`} onClick={onClose} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto font-mono text-xs gap-1.5"
                >
                  <span>View Cargo Digital Twin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form View */
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {/* General Error Banner */}
            {generalError && (
              <div className="p-3.5 rounded bg-[#1F1010] border border-[#B85C5C]/50 text-[#B85C5C] space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Submission Rejected</span>
                </div>
                <p className="text-[11px] leading-relaxed pl-6">{generalError}</p>
              </div>
            )}

            {/* Row 1: Name */}
            <div>
              <label className="text-[11px] uppercase text-[#A5A29C] block mb-1 font-semibold">
                Consignment Name / Description <span className="text-[#B85C5C]">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Emergency Medical Plasma &amp; Cryo-Serum"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                disabled={isSubmitting}
                className={`w-full ${fieldErrors.name ? "border-[#B85C5C]" : ""}`}
              />
              {fieldErrors.name && (
                <span className="text-[10px] text-[#B85C5C] mt-1 block">{fieldErrors.name}</span>
              )}
            </div>

            {/* Row 2: Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase text-[#A5A29C] block mb-1 font-semibold">
                  Category <span className="text-[#B85C5C]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded bg-[#101010] border border-[#242424] text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B] transition-colors"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase text-[#A5A29C] block mb-1 font-semibold">
                  Logistics Priority <span className="text-[#B85C5C]">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded bg-[#101010] border border-[#242424] text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B] transition-colors"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Mass & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase text-[#A5A29C] block mb-1 font-semibold">
                  Weight (kg) <span className="text-[#B85C5C]">*</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 24.5"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    if (fieldErrors.weight) setFieldErrors((prev) => ({ ...prev, weight: "" }));
                  }}
                  disabled={isSubmitting}
                  className={`w-full ${fieldErrors.weight ? "border-[#B85C5C]" : ""}`}
                />
                {fieldErrors.weight && (
                  <span className="text-[10px] text-[#B85C5C] mt-1 block">{fieldErrors.weight}</span>
                )}
              </div>

              <div>
                <label className="text-[11px] uppercase text-[#A5A29C] block mb-1 font-semibold">
                  Initial Staging Location
                </label>
                <Input
                  type="text"
                  placeholder="e.g. NCPOR Goa Logistics Wharf"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>
            </div>

            {/* Row 4: Polar Route (Origin & Destination) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1C1C1C]">
              <div>
                <label className="text-[11px] uppercase text-[#A5A29C] block mb-1 font-semibold">
                  Origin Station (Departure) <span className="text-[#B85C5C]">*</span>
                </label>
                <select
                  value={originStationId}
                  onChange={(e) => {
                    setOriginStationId(Number(e.target.value));
                    if (fieldErrors.destinationStationId) {
                      setFieldErrors((prev) => ({ ...prev, destinationStationId: "" }));
                    }
                  }}
                  disabled={isSubmitting || isLoadingStations}
                  className="w-full h-10 px-3 rounded bg-[#101010] border border-[#242424] text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B] transition-colors"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.slug.toUpperCase()})
                    </option>
                  ))}
                </select>
                {fieldErrors.originStationId && (
                  <span className="text-[10px] text-[#B85C5C] mt-1 block">
                    {fieldErrors.originStationId}
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] uppercase text-[#A5A29C] block mb-1 font-semibold">
                  Destination Station <span className="text-[#B85C5C]">*</span>
                </label>
                <select
                  value={destinationStationId}
                  onChange={(e) => {
                    setDestinationStationId(Number(e.target.value));
                    if (fieldErrors.destinationStationId) {
                      setFieldErrors((prev) => ({ ...prev, destinationStationId: "" }));
                    }
                  }}
                  disabled={isSubmitting || isLoadingStations}
                  className={`w-full h-10 px-3 rounded bg-[#101010] border ${
                    fieldErrors.destinationStationId ? "border-[#B85C5C]" : "border-[#242424]"
                  } text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B] transition-colors`}
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.slug.toUpperCase()})
                    </option>
                  ))}
                </select>
                {fieldErrors.destinationStationId && (
                  <span className="text-[10px] text-[#B85C5C] mt-1 block">
                    {fieldErrors.destinationStationId}
                  </span>
                )}
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#242424]">
              <span className="text-[10px] text-[#6F6D68]">
                Authority required: <strong className="text-[#A5A29C]">LOGISTICS, OPERATIONS, or ADMIN</strong>
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto font-mono text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto font-mono text-xs gap-1.5 bg-[#C8A96B] hover:bg-[#B89858] text-black font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Consignment</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
