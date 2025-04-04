import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function generatePatientId(): string {
  const prefix = "P";
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNumber}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const INJURY_TYPES = [
  "Burn",
  "Cut",
  "Bruise",
  "Sprain",
  "Fracture",
  "Bite",
  "Sting",
  "Allergy",
  "Poisoning",
  "Other"
];

export const INJURY_STATUS = [
  "New",
  "Treated",
  "Healing",
  "Recovered",
  "Resolved",
  "Needs Attention"
];

export const BLOOD_TYPES = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"
];

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
