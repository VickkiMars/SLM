import jwt  # PyJWT
from utils.redis import r
import time
from dotenv import load_dotenv

load_dotenv()
capacity = 10
refill_rate = 5
# 50 per day

async def verify_token(token: str):
    payload = jwt.decode(
        token,
        os.getenv("SUPABASE_JWT_SECRET"),
        algorithms=["HS256"],
        audience="authenticated"
    )
    if payload:
      data = {
        "user_id": payload["sub"],
        "user_email": payload.get("email"),
        "user_name": payload.get("name")
      } 
      return data
    else:
      return 




async def rate_limit(id):
  key = f"bucket{id}"
  now = time.time()
  data = r.get(key)
  if not data:
    tokens = capacity - 1
    last_refill = now
    left_tokens = 49
    return True
  else:
    tokens = float(data['tokens'])
    last_refill = float(data['last_refill'])
    left_tokens = int(data['left_tokens'])
  elapsed = now - last_refill
  refill = elapsed * (refill_rate/60)
  tokens = min(capacity, tokens + refill)
  if tokens < 1 or left_tokens < 1:
    return False
  else:
    tokens = tokens - 1
    left_tokens = left_tokens - 1
    return True
