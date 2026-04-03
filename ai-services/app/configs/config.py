from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("PG_URL")
PORT = int(os.getenv("AI_SERVICE_PORT", 5001))
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
UPLOAD_DIR = os.getenv("UPLOAD_DIR")
