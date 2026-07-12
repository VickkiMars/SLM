from controllers.controller import router
from middleware.auth import verify_token
from services.get_text import get_text_by_jobid
from fastapi import FastAPI, Request, HTTPException, UploadFile, File
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
async def upload_file(file: UploadFile = File(...), request:Request):
  try:
    token = request.body()
    user_id = await verify_token(token)
    #ratelimit
    file_type = file.content_type
    file_size = file.size
    blob = file.file
    res = router(blob=blob, user_id=user_id, file_type=file_type) 
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
async def send_text(request:Request):
  try:
    token = request.body()
    user_id = await verify_token(token)
    #rate limit
    blob = request.body()
    file_type = "text"
    user_id = user_id
    res = router(blob=blob, user_id=user_id, file_type=file_type) 
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
async def send_text(job_id: str, request:Request):
  try:
    user_id = request.body()
    res = get_text_by_jobid(job_id=job_id, user_id=user_id)
    yeild res

  except Eception as e:
    print(e)  
  
  

