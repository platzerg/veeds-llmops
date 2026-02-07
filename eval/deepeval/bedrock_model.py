import boto3
import json
import os
from deepeval.models.base_model import DeepEvalBaseLLM
from dotenv import load_dotenv

load_dotenv()

class BedrockClaude(DeepEvalBaseLLM):
    def __init__(self, model_id="anthropic.claude-3-5-sonnet-20240620-v1:0"):
        self.model_id = model_id
        self.client = boto3.client(
            service_name="bedrock-runtime",
            region_name=os.getenv("AWS_REGION", "eu-central-1")
        )

    def load_model(self):
        return self.client

    def generate(self, prompt: str) -> str:
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0
        })

        response = self.client.invoke_model(
            body=body,
            modelId=self.model_id
        )

        response_body = json.loads(response.get("body").read())
        return response_body.get("content")[0].get("text")

    async def a_generate(self, prompt: str) -> str:
        return self.generate(prompt)

    def get_model_name(self):
        return self.model_id
