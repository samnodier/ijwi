import "dotenv/config";

export const config = {
  aiProvider: (process.env.AI_PROVIDER ?? "rules").toLowerCase(),
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct",
  aiServiceSecret: process.env.AI_SERVICE_SECRET ?? "dev-internal-secret-change-me",
  port: Number(process.env.PORT ?? 8000),
};
