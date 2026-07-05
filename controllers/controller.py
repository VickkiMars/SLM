from services.extract import *
from services.queuing import *

async def router(blob, file_type):
  if file_type.startswith("image"):
    res = await extract_text(blob)
    queue(res)
    return {"msg": "True"}
  if file_type === "text":
    queue(blob)
    return {"msg": "True"}
    