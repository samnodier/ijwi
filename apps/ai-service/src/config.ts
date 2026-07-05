import "dotenv/config";

export const config = {
  aiProvider: (process.env.AI_PROVIDER ?? "rules").toLowerCase(),
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.2-11b-vision-preview",
  aiServiceSecret: process.env.AI_SERVICE_SECRET ?? "dev-internal-secret-change-me",
  port: Number(process.env.PORT ?? 8000),
};
