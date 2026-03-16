from fastapi import FastAPI
from fastapi import Depends
from configs.config import PORT
from auth.api_key import verify_internal_api_key

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
def analyze(image_url: str, _: None = Depends(verify_internal_api_key)):
    pass
    # result = analyze_image(image_url)

    # return {
    #     "message": f"Analyzing image from URL: {image_url}",
    #     "status": "success",
    #     "category": result["category"],
    #     "severity_score": result["severity_score"] 
    # }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="localhost", port=PORT, reload=True)