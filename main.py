from controllers.controller import router
from middleware.auth import verify_token
from services.get_text import get_text_by_jobid
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import logging 


app = FastAPI()
logger = logging.getLogger("uvicorn.error")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/upload/translate")
async def upload_file(request:Request,file: UploadFile = File(...),  authorisation: str = Header(None)):
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
    #ratelimit
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
    #rate limit
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
  
  

