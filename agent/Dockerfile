FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create .env file from environment variables
RUN echo "OPENAI_API_KEY=$OPENAI_API_KEY" > .env

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"] 