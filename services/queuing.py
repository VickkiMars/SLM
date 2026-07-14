from utils.redis import r 
import json
import uuid
from services.translate import translate_text
import time
import asyncio


async def enqueue_job(user_id, blob):
  try:
    id = str(uuid.uuid4())
    job = {
        "job_id": id,
        "user_id": user_id,
        "document": blob,
        "status": 'pending'
    }
    r.lpush("translation_queue", json.dumps(job))
    return {job['job_id']}
  except Exception as e:
    print(e)
  
async def worker_loop():
  while True:
    raw_job = r.rpop("translation_queue")
    if raw_job:
      job = json.loads(raw_job)
      model_output = await translate_text(job['document'])
      r.set(f"result:{job['job_id']}", json.dumps({
          "user_id": job['user_id'],
          "output": model_output,
          "status": "complete",
          "created_at": time.time()
      }))
    else:
      await asyncio.sleep(1)