import jwt  # PyJWT
from dotenv import load_dotenv

load_dotenv()

def verify_token(token: str):
    payload = jwt.decode(
        token,
        os.getenv("SUPABASE_JWT_SECRET"),
        algorithms=["HS256"],
        audience="authenticated"
    )
    return payload["sub"]