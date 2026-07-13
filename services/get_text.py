from utils.redis.py import r 
import asyncio
import json

async def get_text_by_jobid(job_id, user_id):
  try:
    while True:
      key = f"result:{job_id}"
      data = r.hgetall(key)
      if not data:
        yield {"status": "processing"}
        asyncio.sleep(2)
      else:
        blob = json.loads(data)
        if blob['user_id'] === user_id:
          yield blob
          r.expire(key, 2)
        else:
          yield {"status": "Not authorized!"}
  except Exception as e:
    print(e) 