import openai
import json
import os
from dotenv import load_dotenv

load_dotenv()

with open("data/prompt.txt", "r") as f:
  prompt = f.write()

client = openai.OpenAI(
    base_url = 'https://api.fikraapi.co.ke/v1',
    api_key = os.getenv("FIKRA_APIKEY")
)

async def translate_text(blob):
  response = client.chat.completions.create(
      model="fikra-pro-120b",
      messages=[{
          "role": "system",
          "content": f"{prompt}"
      },
      {
          "role": "user",
          "content": blob
      }
      ]
  )
  result = response.choices[0].message.content