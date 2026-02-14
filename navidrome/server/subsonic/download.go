package subsonic

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/navidrome/navidrome/conf"
	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/server/subsonic/responses"
)

type DownloadRequest struct {
	URL     string `json:"url"`
	Library string `json:"library"`
}

func (api *Router) downloadSong(r *http.Request) (*responses.Subsonic, error) {
	var downloadReq DownloadRequest
	
	if err := json.NewDecoder(r.Body).Decode(&downloadReq); err != nil {
		log.Error("Failed to decode download request", "error", err)
		return nil, newError(responses.ErrorGeneric, "Invalid request format")
	}

	if downloadReq.URL == "" {
		return nil, newError(responses.ErrorGeneric, "URL is required")
	}

	musicFolder := conf.Server.MusicFolder
	if downloadReq.Library != "" {
		// If a specific library is requested, use it as a subdirectory
		musicFolder = filepath.Join(musicFolder, downloadReq.Library)
	}

	// Ensure the directory exists
	if err := os.MkdirAll(musicFolder, 0755); err != nil {
		log.Error("Failed to create music directory", "directory", musicFolder, "error", err)
		return nil, newError(responses.ErrorGeneric, "Failed to create music directory")
	}

	// Download the song using yt-dlp
	filename, err := api.downloadWithYTDLP(downloadReq.URL, musicFolder)
	if err != nil {
		log.Error("Failed to download song", "url", downloadReq.URL, "error", err)
		return nil, newError(responses.ErrorGeneric, fmt.Sprintf("Download failed: %v", err))
	}

	// Trigger a library scan
	if api.scanner != nil {
		go func() {
			_, err := api.scanner.ScanAll(context.Background(), false)
			if err != nil {
				log.Warn("Failed to trigger library scan after download", "error", err)
			}
		}()
	}

	response := responses.Subsonic{
		Status: "ok",
		DownloadResponse: &responses.DownloadResponse{
			Success: true,
			Message: "Song downloaded successfully",
			File:    filename,
		},
	}

	return &response, nil
}

func (api *Router) downloadWithYTDLP(url, outputDir string) (string, error) {
	// Use yt-dlp to download the audio
	outputPattern := filepath.Join(outputDir, "%(artist)s - %(title)s.%(ext)s")
	
	cmd := exec.Command("yt-dlp", 
		"-x", 
		"--audio-format", "mp3", 
		"--add-metadata", 
		"--embed-thumbnail",
		"-o", outputPattern,
		url,
	)

	cmd.Dir = outputDir
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("yt-dlp failed: %v, output: %s", err, string(output))
	}

	// Try to extract the filename from the output
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "[download] Destination:") {
			parts := strings.Split(line, ": ")
			if len(parts) > 1 {
				filename := strings.TrimSpace(parts[1])
				if _, err := os.Stat(filename); err == nil {
					return filepath.Base(filename), nil
				}
			}
		}
	}

	// If we can't extract the filename, return a generic success message
	return "downloaded_file.mp3", nil
}
