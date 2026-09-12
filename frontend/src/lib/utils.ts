import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

export function formatKg(weightKg: number | string): string {
  const num = typeof weightKg === "string" ? parseFloat(weightKg) : weightKg;
  if (isNaN(num)) return "0 kg";
  return `${num.toLocaleString()} kg`;
}
