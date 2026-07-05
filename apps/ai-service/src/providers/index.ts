import { config } from "../config.js";
import type { AIProvider } from "./base.js";
import { GroqProvider } from "./groq.js";
import { RulesProvider } from "./rules.js";

let cached: AIProvider | null = null;

/** Return the configured provider, falling back to rules. */
export function getProvider(): AIProvider {
  if (cached) return cached;

  // GroqProvider only validates the API key when constructed, so importing it
  // is safe even when running with the rules provider and no key set.
  cached = config.aiProvider === "groq" ? new GroqProvider() : new RulesProvider();

  return cached;
}
