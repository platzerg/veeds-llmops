import os
import time
    from langfuse import Langfuse
    from dotenv import load_dotenv

load_dotenv()

def run_auto_scoring():
print("🔭 Starting Langfuse Auto-Scoring Automation...")
langfuse = Langfuse()

    # Fetch recent traces(last 1 hour)
    # This simulates a background process
traces = langfuse.get_traces(limit = 50)

for trace in traces.data:
        # Check if trace already has scores
if not trace.scores:
print(f"Checking trace: {trace.id}")
            
            # Logic 1: Cost - Alerting(Automation)
            # If total_cost is missing or 0 but it's a generation, flag for review
            #(Note: Real cost comes from our cost - calculator.ts)
            
            # Logic 2: Keyword - based Quality Scorer
            # We look into the generation output for keywords like "Error" or "Invalid"
generations = [obs for obs in trace.observations if obs.type == 'GENERATION']

for gen in generations:
    output_str = str(gen.output or "")
                
                # Auto - Score: Correctness based on explicit "Success" or "Error"
if "Valid: false" in output_str:
    langfuse.score(
        trace_id = trace.id,
        name = "auto-quality-check",
        value = 0,
        comment = "Automatically flagged: Output contains validation errors."
    )
print(f"  ❌ Scored 0 (Validation Error) for trace {trace.id}")
                elif "Valid: true" in output_str:
langfuse.score(
    trace_id = trace.id,
    name = "auto-quality-check",
    value = 1,
    comment = "Automatically approved: Output is valid."
)
print(f"  ✅ Scored 1 (Validation Success) for trace {trace.id}")

def main():
    # In production, this would run as a cron job or worker
run_auto_scoring()

if __name__ == "__main__":
    main()
