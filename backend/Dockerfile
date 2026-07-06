FROM python:3.11-slim

WORKDIR /app

# ffmpeg: assembles generated concept videos. fonts-dejavu-core: Pillow needs a
# real TTF for slide text (the slim base image ships none). curl: fetches the
# Piper voice model below, once, at build time rather than on a cold container
# start under production traffic.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu-core \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Self-hosted Piper TTS voice model (no external API calls at runtime).
# Deliberately NOT under /app: local dev bind-mounts ./backend over /app
# (see docker-compose.yml), which would otherwise shadow anything baked in here.
RUN mkdir -p /opt/piper-voices && \
    curl -sL -o /opt/piper-voices/en_US-lessac-medium.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx" && \
    curl -sL -o /opt/piper-voices/en_US-lessac-medium.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json"

COPY ./app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]