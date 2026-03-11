#!/bin/bash
# Usage: ./download_music.sh youtube_url

YTDLP_ARGS=(
    "-x" 
    "--audio-format" "mp3" 
    "--add-metadata" 
    "--embed-thumbnail" 
    "--js-runtimes" "node"
    "--remote-components" "ejs:github"
)

if [ -n "$ND_YTDLPCOOKIESFILE" ]; then
    YTDLP_ARGS+=("--cookies" "$ND_YTDLPCOOKIESFILE")
fi

if [ -n "$ND_YTDLPUSERNAME" ]; then
    YTDLP_ARGS+=("--username" "$ND_YTDLPUSERNAME")
fi

if [ -n "$ND_YTDLPPASSWORD" ]; then
    YTDLP_ARGS+=("--password" "$ND_YTDLPPASSWORD")
fi

yt-dlp "${YTDLP_ARGS[@]}" -o "%(artist)s - %(title)s.%(ext)s" "$1"
