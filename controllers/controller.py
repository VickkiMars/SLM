from services.extract import extract_text
from services.queuing import enqueue_job

async def router(blob, file_type, user_id):
  try:
    if not blob or not file_type or not user_id:
      return {"message": "Feild not nullable"}
    if file_type.startswith("image"):
      res = await extract_text(blob)
      result = await enqueue(blob=res, user_id=user_id)
      return {"message": "Upload queue for processing", "job_id": result}
    if file_type === "text":
      result = await enqueue(blob=res, user_id=user_id)
      return {"message": "Upload queue for processing", "job_id": result}
  except Exception as e:
    print(e)    