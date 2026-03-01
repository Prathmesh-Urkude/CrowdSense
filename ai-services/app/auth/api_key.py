from fastapi import Header, HTTPException
from configs.config import INTERNAL_API_KEY

def verify_internal_api_key(x_internal_api_key: str = Header(None)):
    if x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing API key"
        )