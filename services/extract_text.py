import requests
import os
from dot_env import load_dotenv

load_dotenv()

async def extract_text(blob, name, iso):
  try:
    res = requests.post(
        "https://api.ocr.space/parse/image",
        files={"file": (name, blob)},
        data={"apikey": os.get("OCR_KEY"), "language": iso}
    )
    return res.json()["ParsedResult"][0]["ParsedText"]
  except Exception as e:
    print(e)
    #end  