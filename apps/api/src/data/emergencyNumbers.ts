import { randomUUID } from "node:crypto";
import type { EmergencyNumber } from "../types.js";

// Rwanda emergency and authority contacts. The `category` slug is what the
// dispatch router (src/lib/dispatch.ts) uses to decide who a report goes to.
export const emergencyNumbers: EmergencyNumber[] = [
  { id: randomUUID(), name: "Police", number: "112", category: "security" },
  { id: randomUUID(), name: "Traffic Accidents", number: "113", category: "traffic" },
  { id: randomUUID(), name: "Fire Brigade", number: "111", category: "fire" },
  { id: randomUUID(), name: "Ambulance / SAMU", number: "912", category: "medical" },
  { id: randomUUID(), name: "Gender-Based Violence", number: "3512", category: "gbv" },
  { id: randomUUID(), name: "Child Helpline", number: "116", category: "child" },
  { id: randomUUID(), name: "RIB (Fraud / Cybercrime)", number: "166", category: "fraud" },
  { id: randomUUID(), name: "Anti-Corruption Hotline", number: "997", category: "corruption" },
  { id: randomUUID(), name: "Ombudsman (Injustice)", number: "3138034", category: "governance" },
  { id: randomUUID(), name: "Water Issues (WASAC)", number: "3535", category: "water" },
  { id: randomUUID(), name: "Power / Electricity (REG/EUCL)", number: "2727", category: "power" },
  { id: randomUUID(), name: "General Emergency", number: "112", category: "general" },
];
