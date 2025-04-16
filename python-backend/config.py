import os
from dotenv import load_dotenv

load_dotenv(".env")

DATABASE_URL = os.getenv("BIGSYNC_DATABASE_URL", "sqlite:///dev.db")
