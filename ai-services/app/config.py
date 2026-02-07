from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("PG_URL")
PORT = os.getenv("AI_SERVICE_PORT", 5001)
