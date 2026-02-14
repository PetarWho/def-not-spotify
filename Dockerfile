FROM python:3.11-slim

# Install ffmpeg and other dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip install --no-cache-dir yt-dlp

# Create download directory
RUN mkdir -p /downloads

# Copy the download script
COPY download_music.sh /usr/local/bin/download_music.sh
RUN chmod +x /usr/local/bin/download_music.sh

WORKDIR /downloads

# Default command
ENTRYPOINT ["/usr/local/bin/download_music.sh"]