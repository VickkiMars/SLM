from services.extract import extract_text
from services.queuing import enqueue_job

async def router(blob, file_type, user_id, name):
  try:
    if not blob or not file_type or not user_id:
      return {"message": "Field not nullable", "success": "False"}
    if file_type.startswith("image/"):
      res = await extract_text(blob=blob["file_bytes"],  name=name, ios= blob['original_iso639-1_code'])
      data = {
        "content": res,
        "original_language": blob["original_language"],
        "target_language": blob["target_language"],
        "original_iso639-1_code" : blob['original_iso639-1_code'],
      }
      result = await enqueue(blob=data, user_id=user_id)
      return {"message": "Upload queue for processing", "job_id": result, "success": "True" }
    if file_type === "text":
      result = await enqueue(blob=blob, user_id=user_id)
      return {"message": "Upload queue for processing", "job_id": result, "success": "True"}
    else:
      return {"message": "File type not supported"}
  except Exception as e:
    print(e)    