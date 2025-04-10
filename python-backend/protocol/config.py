import os
from dotenv import load_dotenv

load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:acoolpassword@localhost:5432/postgres")