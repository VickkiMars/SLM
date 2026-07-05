import openai
import json

with open("data/prompt.txt", "r") as f:
  prompt = f.write()
with open("data/format.json", "r") as f:
  format = json.load(f)

client = openai.OpenAI(
    base_url = 'https://api.fikraapi.co.ke/v1',
    api_key = 
)

async def translate_text(blob):
  response = client.chat.completions.create(
      model="fikra-pro-120b",
      messages=[{
          "role": "system",
          "content": f"{prompt}. OUTPUT ONLY THE JSON FORMAT GIVEN: {format}"
      },
      {
          "role": "user",
          "content": blob
      }
      ]
  )
  result = response.choices[0].message.content