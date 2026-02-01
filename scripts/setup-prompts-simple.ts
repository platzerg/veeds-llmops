// =============================================================================
// Simple Langfuse Prompt Setup (ohne externe Dependencies)
// =============================================================================
// Usage: npx tsx scripts/setup-prompts-simple.ts
// =============================================================================

import { getLangfuse } from "../src/langfuse-client.js";
import fs from "fs/promises";

async function setupPrompts() {
  console.log("🚀 Setting up Langfuse prompts...\n");

  try {
    // 1. Prüfe Langfuse Verbindung
    console.log("🔗 Testing Langfuse connection...");
    const langfuse = getLangfuse();
    
    // 2. Lade Prompt-Inhalt
    console.log("📄 Loading prompt content from eval/prompt.txt...");
    const promptContent = await fs.readFile("eval/prompt.txt", "utf-8");
    console.log(`   Content length: ${promptContent.length} characters`);

    // 3. Erstelle Prompt über Langfuse Client
    console.log("📝 Creating prompt in Langfuse...");
    
    // Verwende die interne Langfuse API (falls verfügbar)
    try {
      // Versuche den Prompt zu erstellen
      const result = await createPromptDirectly(langfuse, {
        name: "veeds-proofreader",
        prompt: promptContent,
        labels: ["production"],
        config: {
          model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
          temperature: 0,
          max_tokens: 2048
        }
      });
      
      console.log("✅ Prompt created successfully!");
      console.log(`   Name: veeds-proofreader`);
      console.log(`   Labels: production`);
      
    } catch (error) {
      console.log("⚠️  Direct creation failed, trying alternative method...");
      
      // Alternative: Verwende HTTP Request mit built-in fetch (Node 18+)
      await createPromptViaHTTP(promptContent);
    }

    console.log("\n🎉 Prompt setup completed!");
    console.log("👀 Check Langfuse UI: http://localhost:9222 → Prompts");
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check if Langfuse is running: docker compose ps");
    console.log("2. Check API keys in .env file");
    console.log("3. Check Langfuse UI: http://localhost:9222");
    process.exit(1);
  }
}

async function createPromptDirectly(langfuse: any, promptData: any) {
  // Versuche verschiedene Methoden der Langfuse API
  
  // Methode 1: createPrompt (falls verfügbar)
  if (typeof langfuse.createPrompt === 'function') {
    return await langfuse.createPrompt(promptData);
  }
  
  // Methode 2: Über interne API
  if (langfuse._client && typeof langfuse._client.createPrompt === 'function') {
    return await langfuse._client.createPrompt(promptData);
  }
  
  throw new Error("Direct prompt creation not available");
}

async function createPromptViaHTTP(promptContent: string) {
  console.log("🌐 Using HTTP API method...");
  
  const baseUrl = process.env.LANGFUSE_HOST || "http://localhost:9222";
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  
  if (!publicKey || !secretKey) {
    throw new Error("LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set in .env");
  }
  
  // Verwende Node.js built-in fetch (Node 18+)
  const response = await fetch(`${baseUrl}/api/public/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`
    },
    body: JSON.stringify({
      name: "veeds-proofreader",
      prompt: promptContent,
      labels: ["production"],
      config: {
        model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        temperature: 0,
        max_tokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ HTTP API creation successful!");
  return result;
}

async function verifyPrompts() {
  console.log("🔍 Verifying prompts in Langfuse...\n");
  
  try {
    const langfuse = getLangfuse();
    
    // Versuche den Prompt zu laden
    const prompt = await langfuse.getPrompt("veeds-proofreader", undefined, {
      label: "production"
    });
    
    console.log("✅ Prompt verification successful:");
    console.log(`   Name: ${prompt.name}`);
    console.log(`   Version: ${prompt.version}`);
    console.log(`   Content length: ${prompt.prompt?.length || 0} chars`);
    
  } catch (error) {
    console.log("❌ Prompt not found or error:", error.message);
    console.log("💡 Try running setup first: npm run setup:prompts");
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || "setup";
  
  switch (command) {
    case "setup":
      await setupPrompts();
      break;
    case "verify":
      await verifyPrompts();
      break;
    case "both":
      await setupPrompts();
      console.log();
      await verifyPrompts();
      break;
    default:
      console.log("Usage:");
      console.log("  npx tsx scripts/setup-prompts-simple.ts setup");
      console.log("  npx tsx scripts/setup-prompts-simple.ts verify");
      console.log("  npx tsx scripts/setup-prompts-simple.ts both");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}