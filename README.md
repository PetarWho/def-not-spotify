# def-not-spotify 🎵

A powerful, self-hosted music server setup that combines **Navidrome** with an integrated **YouTube/SoundCloud downloader** and **Cloudflare Tunnel** for seamless remote access.

## 🚀 Features

- **Navidrome Music Server**: Modern, high-performance music streaming server.
- **Integrated Downloader**: Download songs directly from the Navidrome UI.
- **Multi-Platform Support**: Powered by `yt-dlp`, supports YouTube, SoundCloud, Bandcamp, and more.
- **Library Management**: Choose which folder to save your downloads to.
- **Automatic Scanning**: New downloads are instantly scanned and added to your library.
- **Remote Access**: Built-in Cloudflare Tunnel support for secure access anywhere without port forwarding.
- **Age-Restricted Content**: Support for YouTube authentication via cookies or credentials.

## 🏗️ Architecture

The system consists of three main components:
1.  **Navidrome**: The core music server (modified to include a download UI and proxy).
2.  **Downloader Service**: A FastAPI wrapper around `yt-dlp` that handles the actual downloading.
3.  **Cloudflare Tunnel**: Securely exposes your Navidrome instance to the internet.

## 🛠️ Setup

### 1. Prerequisites
- Docker and Docker Compose installed.
- A Cloudflare account (optional, for remote access).

### 2. Configure Environment Variables
Copy the example environment file and fill in your details:
```bash
cp .env.example .env
```

**Configuration Details:**
| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDFLARE_TUNNEL_TOKEN` | Your Cloudflare Tunnel token for remote access. | No |
| `ND_YTDLPCOOKIESFILE` | Path to a `cookies.txt` file for YouTube authentication. | Recommended |
| `ND_YTDLPUSERNAME` | YouTube account email (alternative to cookies). | No |
| `ND_YTDLPPASSWORD` | YouTube account password (alternative to cookies). | No |

### 3. Authentication for Downloads (Recommended)
To download age-restricted or premium content, it is highly recommended to use a cookies file:
1.  Install the "Get cookies.txt" extension in your browser.
2.  Go to YouTube and export your cookies.
3.  Save the file as `navidrome-data/yt-cookies.txt`.
4.  Ensure `ND_YTDLPCOOKIESFILE=/data/yt-cookies.txt` is set in your `.env`.

### 4. Start the Services
```bash
docker-compose up -d
```

### 5. Access Navidrome
- **Locally**: [http://localhost:4533](http://localhost:4533)
- **Remotely**: Via your Cloudflare Tunnel hostname.
- Create an admin account on your first visit.

## 📥 How to Download Music

1.  Open the Navidrome UI.
2.  Click the user menu (top-right corner).
3.  Select **"Download Song"**.
4.  Paste the URL (YouTube, SoundCloud, etc.).
5.  (Optional) Select a specific library folder.
6.  Click **Download**.

The song will be processed, tagged with metadata, and automatically appear in your library.

## 🛠️ Troubleshooting & Logs

If you encounter issues, you can check the logs of the services:

```bash
# View all logs
docker-compose logs -f

# View downloader logs (useful for debugging download failures)
docker-compose logs -f navidrome-song-downloader

# View Navidrome logs
docker-compose logs -f navidrome
```

## ⌨️ Manual Usage (CLI)

For manual downloads without using the UI, you can use the provided script:

```bash
./download_music.sh "https://www.youtube.com/watch?v=..."
```

Note: This requires `yt-dlp` to be installed locally or run inside the container.

## 📁 Project Structure

```text
.
├── docker-compose.yml           # Main service configuration
├── .env.example                 # Environment variable template
├── music/                       # Root directory for your music collection
├── navidrome-data/              # Navidrome database, config, and cookies
├── navidrome/                   # Navidrome source code with UI enhancements
│   ├── server/subsonic/         # Backend proxy logic for downloads
│   └── ui/src/dialogs/          # Custom Download UI components
└── navidrome-song-downloader/   # FastAPI service wrapping yt-dlp
    ├── main.py                  # Downloader API logic
    └── Dockerfile               # Downloader container definition
```

## 📝 Notes

- **Scanning**: Navidrome is configured to automatically scan the music folder. If a song doesn't appear immediately, check the logs.
- **Formats**: All songs are currently downloaded in **MP3 (320kbps)** format with embedded thumbnails and metadata.
- **YouTube Music**: The downloader works best with standard YouTube and YouTube Music URLs.

## ⚖️ License
This project inherits the Navidrome license (GPLv3). See the `LICENSE` file for details.
