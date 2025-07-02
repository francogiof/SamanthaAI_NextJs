import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- DO NOT PUT REACT HOOKS IN THIS FILE ---
// Move useRequirementsForCandidate to a separate file in app/dashboard/candidate/hooks.ts or similar.
