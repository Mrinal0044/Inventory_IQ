FROM python:3.11-slim

WORKDIR /app

# Install system dependencies, including JRE for Spark
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-jre \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port and start app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
