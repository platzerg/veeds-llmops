import { proofreadEntry } from '../src/proofreader.js';
import 'dotenv/config';

async function demo() {
    console.log("🚀 Starting VEEDS Proofreader Demo...");

    const yamlEntry = `
materialNumber: ENGINE-789
description: Wartung für Max Mustermann aus Musterstadt.
unit: pcs
technician: Thomas Test
phone: +49 123 456789
email: t.test@example.com
  `;

    try {
        const result = await proofreadEntry(yamlEntry, {
            userId: "demo-user-123",
            tags: ["demo", "cost-test"]
        });

        console.log("\n✅ Proofreading Result:");
        console.log(JSON.stringify(result, null, 2));

        console.log("\n✨ Check your Langfuse dashboard for the trace and cost metrics!");
    } catch (error: any) {
        console.error("❌ Demo failed:", error.message);
    }
}

demo();
