FROM python:3.11-slim

# Install ffmpeg and nodejs
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install yt-dlp and fastapi dependencies
RUN pip install --no-cache-dir yt-dlp fastapi uvicorn pydantic

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
