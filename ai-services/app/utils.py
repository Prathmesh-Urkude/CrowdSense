from pydantic import BaseModel
import os
from configs.config import UPLOAD_DIR

class ImageURL(BaseModel):
    image_url: str


def get_absolute_image_path(image_url: str) -> str:
    relative_path = image_url.replace("uploads", "", 1).lstrip("/\\")
    return os.path.join(UPLOAD_DIR, relative_path)