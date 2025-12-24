import { LeadStatus } from "./types";

export const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "bg-blue-100 text-blue-800 border-blue-200",
  [LeadStatus.DRAFTING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [LeadStatus.REVIEW]: "bg-purple-100 text-purple-800 border-purple-200",
  [LeadStatus.READY]: "bg-green-100 text-green-800 border-green-200",
  [LeadStatus.SENT]: "bg-gray-100 text-gray-800 border-gray-200",
  [LeadStatus.ARCHIVED]: "bg-red-50 text-red-800 border-red-100",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "Nouveau Prospect",
  [LeadStatus.DRAFTING]: "IA en rédaction...",
  [LeadStatus.REVIEW]: "À réviser",
  [LeadStatus.READY]: "Prêt à l'envoi",
  [LeadStatus.SENT]: "Envoyé",
  [LeadStatus.ARCHIVED]: "Archivé",
};