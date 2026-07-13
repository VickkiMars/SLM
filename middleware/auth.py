import jwt  # PyJWT
from dotenv import load_dotenv

load_dotenv()

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