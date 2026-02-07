import os
from langfuse import Langfuse
from dotenv import load_dotenv

load_dotenv()

def sync_prompts():
    print("🔄 Syncing local prompts to Langfuse...")
    langfuse = Langfuse()

    # Read the local system prompt
    prompt_path = "eval/prompt.txt"
    if not os.path.exists(prompt_path):
        print(f"❌ Error: {prompt_path} not found.")
        return

    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt_content = f.read()

    # Sync to Langfuse
    # This creates a new version if the content changed
    try:
        langfuse.create_prompt(
            name="veeds-proofreader",
            prompt=prompt_content,
            is_active=True,
            type="text",
            config={
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                "temperature": 0
            }
        )
        print("✅ Successfully synced 'veeds-proofreader' to Langfuse.")
    except Exception as e:
        print(f"❌ Failed to sync: {e}")

if __name__ == "__main__":
    sync_prompts()
