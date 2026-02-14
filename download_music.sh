#!/bin/bash
# Usage: ./download_music.sh youtube_url
yt-dlp -x --audio-format mp3 --add-metadata --embed-thumbnail -o "%(artist)s - %(title)s.%(ext)s" "$1"
