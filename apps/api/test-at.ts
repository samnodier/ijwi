import "dotenv/config";
import fs from "fs";
import { sendMessage } from "./src/lib/notify.js";

const outputInit = `Testing Africa's Talking messaging...\nAPI Key: ${process.env.AT_API_KEY ? (process.env.AT_API_KEY.slice(0, 10) + "...") : "undefined"}\nUsername: ${process.env.AT_USERNAME}\nDemo Phone: ${process.env.DEMO_PHONE}\n`;
console.log(outputInit);

async function test() {
  try {
    const result = await sendMessage("+250780000000", "IJWI TEST: This is a test message to verify the Africa's Talking integration!");
    const output = `${outputInit}Result: ${JSON.stringify(result, null, 2)}\n`;
    console.log("Messaging check done. Status written to at-message-status.txt.");
    fs.writeFileSync("at-message-status.txt", output);
  } catch (err) {
    const output = `${outputInit}Error: ${err instanceof Error ? err.stack : String(err)}\n`;
    console.log("Messaging check done with error. Status written to at-message-status.txt.");
    fs.writeFileSync("at-message-status.txt", output);
  }
}

test();
