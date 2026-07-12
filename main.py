from controllers.controller import router
from middleware.auth import verify_token
from services.get_text import get_text_by_jobid
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload/translate")
async def upload_file(file: UploadFile = File(...), request:Request, authorisation: str = Header(None)):
  try:
    if not authorisation:
      raise HTTPException(
        status_code=401,
        detail="Not Authorised"
      )
      return{"Not Authorised"}
    user_id = await verify_token(authorisation)
    if not user_id:
      raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
      )
      return {"Invalid credentials"}
    #ratelimit
    body = await request.json()
    file_type = file.content_type
    file_name = file.file_name
    file_size = file.size
    blob = {
      "original_language" : body.get('original_language'),
      "target_language" : body.get('target_language'),
      "original_iso639-1_code" : body.get('original_iso639-1_code'),
      "file_bytes" : file.file
    }
    res = await router(blob=blob, user_id=user_id, file_type=file_type) 
    if res[success] == "True":
      raise HTTPException(
        status_code=200,
        detail="success"
      )
      return res
    else:
      raise HTTPException(
        status_code=400,
        detail="failed"
      )
      return res
  except Exception as e:
    print(e)
  

@app.post("/text/translate")
async def send_text(request:Request, authorisation: str = Header(None)):
  try:
    if not authorisation:
      raise HTTPException(
        status_code=401,
        detail="Not Authorised"
      )
      return {"Not Authorised"}
    user_id = await verify_token(authorisation)
    if not user_id:
      raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
      )
      return {"Invalid credentials"}
    #rate limit
    body = await request.json()
    file_type = "text"
    blob = {
      "original_language" : body.get('original_language'),
      "target_language" : body.get('target_language'),
      "content": body.get('comtent')
    }
    res = await router(blob=blob, user_id=user_id, file_type=file_type) 
      if res[success] == "True":
        raise HTTPException(
          status_code=200,
          detail="success"
        )
        return res
      else:
        raise HTTPException(
          status_code=400,
          detail="failed"
        )
        return res
  except Eception as e:
    print(e)  
    
    
@app.get("/status/{job_id}")
async def send_text(job_id: str, authorisation: str = Header(None)):
  try:
    if not authorisation:
      raise HTTPException(
        status_code=401,
        detail="Not Authorised"
      )
      return {""Not Authorised}
    user_id = await verify_token(authorisation)
    if not user_id:
      raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
      )
      return {"Invalid credentials"}
    res = get_text_by_jobid(job_id=job_id, user_id=user_id)
    yeild res

  except Eception as e:
    print(e)  
  
  

