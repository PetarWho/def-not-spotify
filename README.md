# Self-Hosted Music Server with Download Capability

This setup combines Navidrome (a music server) with a music download service in a single Docker Compose configuration.

## Features

- **Navidrome Music Server**: Browse, stream, and manage your music collection
- **Built-in Song Downloads**: Download songs directly from YouTube, SoundCloud, and other supported platforms
- **Library Organization**: Choose which library/folder to save downloaded songs
- **Automatic Scanning**: Downloaded songs are automatically added to your Navidrome library

## Setup

1. **Create required directories:**
   ```bash
   mkdir -p music navidrome-data
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Access Navidrome:**
   - Open your browser and go to `http://localhost:4533`
   - Create an admin account when prompted

## Using the Download Feature

1. Click the user menu in the top-right corner of Navidrome
2. Select "Download Song" from the menu
3. Enter the URL of the song you want to download (YouTube, SoundCloud, etc.)
4. Choose which library folder to save the song to (optional)
5. Click "Download"

The song will be downloaded and automatically added to your Navidrome library.

## Directory Structure

```
songs/
├── docker-compose.yml          # Main configuration
├── Dockerfile                 # Music downloader service
├── download_music.sh          # Download script
├── music/                    # Your music collection
├── navidrome-data/           # Navidrome database and config
└── navidrome/               # Modified Navidrome source
    ├── Dockerfile           # Modified to include yt-dlp
    └── ui/src/dialogs/DownloadDialog.jsx
```

## Configuration

The services are configured as follows:

- **Navidrome**: Runs on port 4533, stores music in `./music`, data in `./navidrome-data`
- **Music Downloader**: Runs in the same network, downloads to `./music` directory

Both services share a Docker network called `music-network` for communication.

## Supported Platforms

The download service supports all platforms that yt-dlp supports, including:
- YouTube
- SoundCloud
- Bandcamp
- Vimeo
- And many more...

## Notes

- The music downloader service runs continuously to handle download requests
- Downloaded files are automatically scanned by Navidrome
- You can organize your music by selecting different library folders

## Legacy Usage

For manual downloads using the original method:

```bash
docker-compose run --rm music-downloader "https://www.youtube.com/watch?v=VIDEO_ID"
```
