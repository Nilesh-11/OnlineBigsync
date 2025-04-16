# Step 1: Use the official Python image as the base
FROM python:3.10-slim

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy the requirements file to the container
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV BIGSYNC_DATABASE_URL=postgresql+psycopg://postgres:acoolpassword@localhost:5432/bigsync

EXPOSE 8080

# Step 8: Start the backend server using uvicorn (as FastAPI recommends for production)
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
