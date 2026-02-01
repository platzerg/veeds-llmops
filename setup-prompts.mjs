// =============================================================================
// Simple Prompt Setup - Pure Node.js (kein PowerShell)
// =============================================================================
// Usage: node setup-prompts.mjs
// =============================================================================

import fs from 'fs/promises';

const LANGFUSE_HOST = process.env.LANGFUSE_HOST || "http://localhost:9222";
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;

async function setupPrompts() {
  console.log("🚀 Setting up Langfuse prompts...\n");

  try {
    // 1. Prüfe Environment Variables
    if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
      throw new Error("❌ LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set in .env");
    }

    console.log("✅ Environment variables found");
    console.log(`   Host: ${LANGFUSE_HOST}`);
    console.log(`   Public Key: ${LANGFUSE_PUBLIC_KEY.substring(0, 10)}...`);

    // 2. Lade Prompt Content
    console.log("\n📄 Loading prompt content...");
    const promptContent = await fs.readFile("eval/prompt.txt", "utf-8");
    console.log(`   Content length: ${promptContent.length} characters`);

    // 3. Test Langfuse Connection
    console.log("\n🔗 Testing Langfuse connection...");
    const healthResponse = await fetch(`${LANGFUSE_HOST}/api/public/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Langfuse not reachable: ${healthResponse.status}`);
    }
    console.log("✅ Langfuse is reachable");

    // 4. Create Prompt via API
    console.log("\n📝 Creating prompt via API...");
    
    const auth = Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString('base64');
    
    const promptData = {
      name: "veeds-proofreader",
      prompt: promptContent,
      labels: ["production"],
      config: {
        model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        temperature: 0,
        max_tokens: 2048
      },
      tags: ["proofreader", "veeds", "yaml-validation"]
    };

    const response = await fetch(`${LANGFUSE_HOST}/api/public/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(promptData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status}`);
      console.log(`   Response: ${errorText}`);
      
      // Versuche zu parsen ob es schon existiert
      if (errorText.includes("already exists") || response.status === 409) {
        console.log("⚠️  Prompt already exists, trying to update...");
        return await updateExistingPrompt(auth, promptData);
      }
      
      throw new Error(`Failed to create prompt: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    console.log("✅ Prompt created successfully!");
    console.log(`   ID: ${result.id}`);
    console.log(`   Name: ${result.name}`);
    console.log(`   Version: ${result.version}`);
    console.log(`   Labels: ${result.labels?.join(", ")}`);

    // 5. Verify prompt
    await verifyPrompt(auth);

    console.log("\n🎉 Setup completed successfully!");
    console.log("👀 Check Langfuse UI: http://localhost:9222 → Prompts");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check if Docker is running: docker compose ps");
    console.log("2. Check if Langfuse is ready: curl http://localhost:9222/api/public/health");
    console.log("3. Check API keys in .env file");
    console.log("4. Check Langfuse UI: http://localhost:9222");
    process.exit(1);
  }
}

async function updateExistingPrompt(auth, promptData) {
  console.log("🔄 Attempting to update existing prompt...");
  
  // Hole existierende Prompts
  const listResponse = await fetch(`${LANGFUSE_HOST}/api/public/prompts`, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });
  
  if (listResponse.ok) {
    const prompts = await listResponse.json();
    console.log(`   Found ${prompts.data?.length || 0} existing prompts`);
    
    const existing = prompts.data?.find(p => p.name === "veeds-proofreader");
    if (existing) {
      console.log(`   Found existing prompt with ${existing.versions?.length || 0} versions`);
      console.log("✅ Prompt already exists and is ready to use!");
      return existing;
    }
  }
  
  throw new Error("Could not create or update prompt");
}

async function verifyPrompt(auth) {
  console.log("\n🔍 Verifying prompt...");
  
  try {
    const response = await fetch(`${LANGFUSE_HOST}/api/public/prompts/veeds-proofreader`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (response.ok) {
      const prompt = await response.json();
      console.log("✅ Prompt verification successful:");
      console.log(`   Name: ${prompt.name}`);
      console.log(`   Versions: ${prompt.versions?.length || 0}`);
    } else {
      console.log("⚠️  Verification failed, but prompt might still work");
    }
  } catch (error) {
    console.log("⚠️  Verification error:", error.message);
  }
}

// Run setup
setupPrompts();