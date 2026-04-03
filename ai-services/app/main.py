from fastapi import Depends
from configs.config import PORT
from fastapi import FastAPI, HTTPException
from auth.api_key import verify_internal_api_key
from ai_model.predict import predict_image
from utils import get_absolute_image_path, ImageURL
import os

app = FastAPI()
    
# Public route (health check)
@app.get("/")
def health():
    return {"status": "AI service running"}

# Protected test route
@app.post("/healthCheck")
def health_check(_: None = Depends(verify_internal_api_key)):
    return {"message": "Authorized access"}

@app.post("/analyze")
async def analyze(payload: ImageURL,_: None = Depends(verify_internal_api_key)):
    file_path = get_absolute_image_path(payload.image_url)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    result = predict_image(file_path)
    return result

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="localhost", port=PORT, reload=True)