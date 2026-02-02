from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def health():
    return {"status": "AI service running"}

if __name__ == "__main__":
    import os
    import uvicorn

    PORT = int(os.getenv("AI_SERVICE_PORT", 5001))

    uvicorn.run(app, host="0.0.0.0", port=PORT, reload=True)