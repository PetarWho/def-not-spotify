from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import subprocess
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class DownloadRequest(BaseModel):
    url: str
    output_dir: str
    cookies_file: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

@app.post("/download")
async def download_song(req: DownloadRequest):
    logger.info(f"Received download request for URL: {req.url} into {req.output_dir}")
    
    if not req.url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Ensure output directory exists
    os.makedirs(req.output_dir, exist_ok=True)
    
    output_pattern = os.path.join(req.output_dir, "%(artist)s - %(title)s.%(ext)s")
    
    args = [
        "yt-dlp",
        "-x",
        "--audio-format", "mp3",
        "--add-metadata",
        "--no-write-comments",
        "--no-write-description",
        "--embed-thumbnail",
        "--js-runtimes", "node",
        "--remote-components", "ejs:github",
        "-o", output_pattern,
    ]
    
    if req.cookies_file and os.path.exists(req.cookies_file):
        args.extend(["--cookies", req.cookies_file])
    elif req.cookies_file:
        logger.warning(f"Cookies file not found: {req.cookies_file}")
        
    if req.username:
        args.extend(["--username", req.username])
    if req.password:
        args.extend(["--password", req.password])
        
    args.append(req.url)
    
    logger.info(f"Running command: {' '.join(args)}")
    
    try:
        process = subprocess.run(
            args,
            cwd=req.output_dir,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Extract filename from output
        filename = "downloaded_file.mp3"
        lines = process.stdout.split('\n')
        for line in lines:
            if "[download] Destination:" in line:
                filename = line.split(": ", 1)[1].strip()
                filename = os.path.basename(filename)
                logger.info(f"Extracted filename from destination: {filename}")
                break
            elif "has already been downloaded" in line:
                # [download] /music/Artist - Title.mp3 has already been downloaded
                # Try to find the path in the line
                parts = line.split(" ")
                for part in parts:
                    if ".mp3" in part:
                        filename = os.path.basename(part)
                        logger.info(f"Extracted filename from already downloaded message: {filename}")
                        break

        return {
            "success": True, 
            "message": "Song downloaded successfully", 
            "file": filename
        }
    
    except subprocess.CalledProcessError as e:
        logger.error(f"yt-dlp failed: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"yt-dlp failed: {e.stderr or e.stdout}")
    except Exception as e:
        logger.exception("An unexpected error occurred")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
