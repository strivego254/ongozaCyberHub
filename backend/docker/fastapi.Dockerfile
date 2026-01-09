FROM python:3.12-slim

WORKDIR /app

# Set pip timeout environment variable (in seconds - 6000 = 100 minutes)
ENV PIP_DEFAULT_TIMEOUT=6000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/fastapi_app/requirements.txt .

# Install critical packages first
RUN pip install --no-cache-dir --timeout=6000 \
    "fastapi>=0.104.0" \
    "uvicorn[standard]>=0.24.0" \
    "pydantic>=2.5.0" \
    "asyncpg>=0.29.0" \
    "psycopg2-binary>=2.9.9"

# Then install remaining packages
RUN pip install --no-cache-dir --timeout=6000 -r requirements.txt

# Copy FastAPI application
COPY backend/fastapi_app/ .

# Expose port
EXPOSE 8001

# Run FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]


