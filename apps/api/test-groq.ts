import "dotenv/config";
import fs from "fs";

const groqApiKey = process.env.GROQ_API_KEY;
const model = "meta-llama/llama-4-scout-17b-16e-instruct";

// A 2x2 red PNG pixel base64 URL
const testPixelUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0yAAAAFElEQVQImWNkYPjPwMDAwMjECwMAADoA/67c29gAAAAASUVORK5CYII=";

async function test() {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a vision tester. Respond in JSON like: { \"success\": true, \"color\": \"red\" }" },
          {
            role: "user",
            content: [
              { type: "text", text: "What is this image? Tell me its color." },
              { type: "image_url", image_url: { url: testPixelUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });
    
    const status = res.status;
    const text = await res.text();
    const output = `Model: ${model}\nStatus: ${status}\nResponse: ${text}\n`;
    console.log("Done testing 2x2 vision support. Check groq-error.txt.");
    fs.writeFileSync("groq-error.txt", output);
  } catch (err) {
    const output = `Fetch error: ${err instanceof Error ? err.stack : String(err)}\n`;
    console.log("Done checking with error. Check groq-error.txt.");
    fs.writeFileSync("groq-error.txt", output);
  }
}

test();
