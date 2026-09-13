"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  HeartPulse,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { personnelService } from "@/services/personnel";
import { Personnel } from "@/types";

export default function PersonnelProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [person, setPerson] = useState<Personnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setNotFound(false);
    personnelService
      .getPersonnelById(id)
      .then((p) => {
        if (isMounted) {
          if (p) setPerson(p);
          else setNotFound(true);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch personnel:", err);
        if (isMounted) setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const standardTimeline = [
    { step: "Departed Goa (NCPOR Flag-off)", location: "Goa, India", date: "15 Nov 2026", completed: true },
    { step: "Arrived Cape Town Staging", location: "Cape Town, South Africa", date: "01 Dec 2026", completed: true },
    { step: "Boarded Vessel (MV Vasiliy Golovnin)", location: "Port of Cape Town", date: "04 Dec 2026", completed: true },
    { step: "Reached Antarctica (Prydz Bay Mooring)", location: "Larsemann Coast", date: "08 Jan 2027", completed: true },
  ];

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-16 text-center">
          <p className="text-xs font-mono text-[#6F6D68] uppercase tracking-wider">
            Loading personnel profile...
          </p>
        </div>
      </AppShell>
    );
  }

  if (notFound || !person) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-16 space-y-4 text-center">
          <div className="inline-block p-4 rounded-full bg-[#101010] border border-[#242424] text-[#B85C5C] mb-2">
            <ShieldCheck className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-xl font-bold font-mono text-[#F5F3EE]">PERSONNEL RECORD NOT FOUND</h2>
          <p className="text-xs font-mono text-[#A5A29C]">
            No expedition member record found for identifier &quot;{id}&quot;.
          </p>
          <div className="pt-2">
            <Link href="/personnel">
              <Button variant="secondary" size="sm" className="font-mono text-xs">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Return to Personnel Roster</span>
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-[#242424] pb-6">
          <Link
            href="/personnel"
            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#C8A96B] hover:underline mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>RETURN TO EXPEDITION REGISTRY</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE]">
                  {person.name}
                </h1>
                <Badge variant={person.status === "Emergency" ? "danger" : "success"} dot>
                  {person.status}
                </Badge>
              </div>
              <p className="text-xs font-mono text-[#A5A29C] mt-1">
                ID: <span className="text-[#F5F3EE] font-bold">{person.id}</span> &bull; {person.role} &bull; {person.team}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs">
              <span className="text-[10px] text-[#6F6D68] uppercase block">CURRENT LOCATION</span>
              <span className="text-sm font-bold text-[#C8A96B]">{person.location}</span>
            </div>
          </div>
        </div>

        {/* Large Clean Information Hierarchy (No excessive cards) */}
        <div className="space-y-8">
          {/* 1. Core Medical & Survival Credentials */}
          <div className="p-6 rounded bg-[#101010] border border-[#242424] space-y-4 font-mono text-xs">
            <span className="text-xs font-bold tracking-wider text-[#F5F3EE] uppercase block border-b border-[#242424] pb-2">
              EXPEDITION CREDENTIALS &bull; MEDICAL SURVIVAL CLEARANCE
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
              <div>
                <span className="text-[10px] text-[#6F6D68] uppercase block">MEDICAL FITNESS</span>
                <span className="text-sm font-bold text-[#7FAF91] mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{person.medicalClearance}</span>
                </span>
                <span className="text-[10px] text-[#A5A29C] mt-0.5 block">Blood: {person.bloodGroup}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#6F6D68] uppercase block">POLAR TRAINING</span>
                <span className="text-sm font-bold text-[#F5F3EE] mt-1 block">
                  {person.trainingStatus.replace("_", " ")}
                </span>
                <span className="text-[10px] text-[#A5A29C] mt-0.5 block">{person.polarExpeditionsCount} Expeditions Completed</span>
              </div>

              <div>
                <span className="text-[10px] text-[#6F6D68] uppercase block">EMERGENCY DISPATCH</span>
                <span className="text-xs font-bold text-[#F5F3EE] mt-1 block truncate">
                  {person.emergencyContact}
                </span>
                <span className="text-[10px] text-[#A5A29C] mt-0.5 block">NCPOR Central Hotline</span>
              </div>

              <div>
                <span className="text-[10px] text-[#6F6D68] uppercase block">BIOMETRIC VITALS</span>
                <span className="text-sm font-bold text-[#F5F3EE] mt-1 block">
                  {person.vitalSigns?.heartRateBpm ?? 72} BPM &bull; {person.vitalSigns?.spo2Pct ?? 98}% SpO2
                </span>
                <span className="text-[10px] text-[#7FAF91] mt-0.5 block">Nominal Vitals</span>
              </div>
            </div>
          </div>

          {/* 2. Transit Corridor Milestones */}
          <div className="p-6 rounded bg-[#101010] border border-[#242424] space-y-4 font-mono text-xs">
            <span className="text-xs font-bold tracking-wider text-[#F5F3EE] uppercase block border-b border-[#242424] pb-2">
              EXPEDITION TRANSIT MILESTONES (46TH ISEA)
            </span>

            <div className="divide-y divide-[#242424]">
              {standardTimeline.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="text-[#C8A96B] font-bold">0{idx + 1}</span>
                    <div>
                      <span className="text-[#F5F3EE] font-bold block">{item.step}</span>
                      <span className="text-[10px] text-[#6F6D68]">{item.location}</span>
                    </div>
                  </div>
                  <span className="text-[#7FAF91] text-[11px]">
                    ✓ {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
