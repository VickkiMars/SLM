from controllers.controller import router
from middleware.auth import rate_limit, verify_token
from services.get_text import get_text_by_jobid
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from services.queuing import worker_loop
import logging
import asyncio
import uvicorn


app = FastAPI()
logger = logging.getLogger("uvicorn.error")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
  worker_task = asyncio.create_task(worker_loop())
  yield
  worker_task.cancel()
  try:
    await worker_task
  except asyncio.CancelledError:
    pass
app = FastAPI(lifespan=lifespan)


@app.post("/api/upload/translate")
async def upload_file(request:Request, file: UploadFile = File(...),  authorisation: str = Header(None)):
  try:
    if not authorisation:
      raise HTTPException(
        status_code=401,
        detail="Not Authorised"
      )
    data = await verify_token(authorisation)
    if not data:
      raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
      )
    user_id = data["user_id"]
    is_allowed = await rate_limit(user_id)
    if not is_allowed:
      raise HTTPException(
        status_code=429,
        detail="Too many request"
      )
    body = await request.form()
    file_type = file.content_type
    file_name = file.filename
    blob = {
      "original_language" : body.get('original_language'),
      "target_language" : body.get('target_language'),
      "original_iso639-1_code" : body.get('original_iso639-1_code'),
      "file_bytes" : file.file
    }
    res = await router(blob=blob, user_id=user_id, file_type=file_type, name=file_name) 
    if res['success']:
      return res
    else:
      raise HTTPException(
        status_code=400,
        detail=res
      )
  except HTTPException:
    raise 
 
  except Exception as e:
    logger.exception(f"Unexpected error: {e}")
    raise HTTPException(
        status_code=400,
        detail="failed"
      )  
  

@app.post("/api/text/translate")
async def send_text(request:Request, authorisation: str = Header(None)):
  try:
    if not authorisation:
      raise HTTPException(
        status_code=401,
        detail="Not Authorised"
      )
      return {"Not Authorised"}
    data = await verify_token(authorisation)
    if not data:
      raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
      )
    user_id = data["user_id"]
    is_allowed = await rate_limit(user_id)
    if not is_allowed:
      raise HTTPException(
        status_code=429,
        detail="Too many request"
      )
    body = await request.json()
    file_type = "text"
    blob = {
      "original_language" : body.get('original_language'),
      "target_language" : body.get('target_language'),
      "content": body.get('content')
    }
    res = await router(blob=blob, user_id=user_id, file_type=file_type, name="name") 
    if res['success'] == "True":
      return res
    else:
      raise HTTPException(
        status_code=400,
         detail=res
      )
  except HTTPException:
    raise
  
  except Exception as e:
    logger.exception(f"Unexpected error: {e}") 
    raise HTTPException(
        status_code=400,
        detail="failed"
      )
    
    
@app.get("/api/status/{job_id}")
async def send_text(job_id: str, authorisation: str = Header(None)):
  try:
    if not authorisation:
      raise HTTPException(
        status_code=401,
        detail="Not Authorised"
      )
    data = await verify_token(authorisation)
    if not data:
      raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
      )
    user_id = data["user_id"]
    return StreamingResponse(get_text_by_jobid(job_id=job_id, user_id=user_id), media_type= "text/event-stream")

  except HTTPException:
    raise
 
  except Exception as e:
    logger.exception(f"Unexpected error: {e}")
    raise HTTPException(
        status_code=400,
        detail="failed"
      )  
  



@app.get("/api/user/getdetails")
async def send_text(authorisation: str = Header(None)):
  try:
    if not authorisation:
      raise HTTPException(
        status_code=401,
        detail="Not Authorised"
      )
    data = await verify_token(authorisation)
    if not data:
      raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
      )
    details = {
      "user_id" : data["user_id"],
      "user_name" : data["user_name"],
      "user_email" : data["user_email"]
    }
    return details

  except HTTPException:
    raise
 
  except Exception as e:
    logger.exception(f"Unexpected error: {e}")
    raise HTTPException(
        status_code=400,
        detail="failed"
      )  
  
  
if __name__ == "__main__":
  uvicorn.run(
    "main:app",
    host="0.0.0.0",
    port=8080,
    reload=True
  )
