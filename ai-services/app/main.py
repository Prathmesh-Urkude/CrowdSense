from fastapi import FastAPI
from fastapi import Header, HTTPException
from config import PORT, INTERNAL_API_KEY

app = FastAPI()

# Public route (health check)
@app.get("/")
def health():
    return {"status": "AI service running"}

# Protected test route
@app.get("/test")
def test_secure(x_internal_api_key: str = Header(None)):
    if x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing API key"
        )

    return {
        "message": "Authorized access to AI service",
        "status": "success"
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT, reload=True)