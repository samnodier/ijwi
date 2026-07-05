import { randomUUID } from "node:crypto";
import type { EmergencyNumber } from "../types.js";

export const emergencyNumbers: EmergencyNumber[] = [
  { id: randomUUID(), name: "Police", number: "112", category: "security" },
  { id: randomUUID(), name: "Ambulance / SAMU", number: "912", category: "medical" },
  { id: randomUUID(), name: "Fire Brigade", number: "112", category: "fire" },
  { id: randomUUID(), name: "Gender-Based Violence", number: "3512", category: "social" },
];
