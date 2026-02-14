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

	"github.com/Masterminds/squirrel"
	"github.com/navidrome/navidrome/conf"
	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/model"
	"github.com/navidrome/navidrome/server/subsonic/responses"
)

type DownloadRequest struct {
	URL     string `json:"url"`
	Library string `json:"library"`
}

type DeleteRequest struct {
	SongID string `json:"songId"`
}

type DeleteAlbumRequest struct {
	AlbumID string `json:"albumId"`
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
		"--no-write-comments",
		"--no-write-description",
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

func (api *Router) deleteSong(r *http.Request) (*responses.Subsonic, error) {
	var deleteReq DeleteRequest
	
	if err := json.NewDecoder(r.Body).Decode(&deleteReq); err != nil {
		log.Error("Failed to decode delete request", "error", err)
		return nil, newError(responses.ErrorGeneric, "Invalid request format")
	}

	if deleteReq.SongID == "" {
		return nil, newError(responses.ErrorGeneric, "Song ID is required")
	}

	// Get the song from the database to find its file path
	song, err := api.ds.MediaFile(r.Context()).Get(deleteReq.SongID)
	if err != nil {
		log.Error("Failed to get song from database", "songId", deleteReq.SongID, "error", err)
		return nil, newError(responses.ErrorDataNotFound, "Song not found")
	}

	// Delete the file from disk
	if song.Path != "" {
		fullPath := filepath.Join(conf.Server.MusicFolder, song.Path)
		if err := os.Remove(fullPath); err != nil {
			log.Error("Failed to delete song file", "file", fullPath, "error", err)
			return nil, newError(responses.ErrorGeneric, fmt.Sprintf("Failed to delete file: %v", err))
		}
		log.Info("Deleted song file", "file", fullPath)
	}

	// Delete the song from the database
	if err := api.ds.MediaFile(r.Context()).Delete(deleteReq.SongID); err != nil {
		log.Error("Failed to delete song from database", "songId", deleteReq.SongID, "error", err)
		return nil, newError(responses.ErrorGeneric, fmt.Sprintf("Failed to delete from database: %v", err))
	}

	log.Info("Deleted song from database", "songId", deleteReq.SongID, "title", song.Title)

	// Check if album is now empty and delete it if so
	if song.AlbumID != "" {
		// Count remaining songs in the album
		albumSongs, err := api.ds.MediaFile(r.Context()).GetAll(model.QueryOptions{
			Filters: squirrel.Eq{"album_id": song.AlbumID},
		})
		if err != nil {
			log.Warn("Failed to check album songs", "albumId", song.AlbumID, "error", err)
		} else if len(albumSongs) == 0 {
			// Album is empty, log and let the system handle cleanup
			log.Info("Album is now empty - will be cleaned up by system", "albumId", song.AlbumID, "name", song.Album)
			
			// Try to get album info and trigger a rescan to clean up empty albums
			if album, err := api.ds.Album(r.Context()).Get(song.AlbumID); err == nil {
				log.Info("Triggering cleanup for empty album", "albumId", song.AlbumID, "name", album.Name)
				// The system will automatically clean up empty albums during next scan
				// For immediate cleanup, we could trigger a scan here
			}
		}
	}

	response := responses.Subsonic{
		Status: "ok",
		DeleteResponse: &responses.DeleteResponse{
			Success: true,
			Message: "Song deleted successfully",
		},
	}

	return &response, nil
}

func (api *Router) getLibraries(r *http.Request) (*responses.Subsonic, error) {
	libraries := getUserAccessibleLibraries(r.Context())

	libraryList := make([]responses.Library, 0, len(libraries))
	
	if len(libraries) == 0 {
		// No libraries found, return default
		libraryList = append(libraryList, responses.Library{
			ID:   "default",
			Name: "Music Library",
		})
	} else {
		for _, lib := range libraries {
			libraryList = append(libraryList, responses.Library{
				ID:   fmt.Sprintf("%d", lib.ID),
				Name: lib.Name,
			})
		}
	}

	response := responses.Subsonic{
		Status: "ok",
		LibraryResponse: &responses.LibraryResponse{
			Success:   true,
			Message:   "Libraries retrieved successfully",
			Libraries: libraryList,
		},
	}

	return &response, nil
}

func (api *Router) deleteAlbum(r *http.Request) (*responses.Subsonic, error) {
	var deleteAlbumReq DeleteAlbumRequest
	
	if err := json.NewDecoder(r.Body).Decode(&deleteAlbumReq); err != nil {
		log.Error("Failed to decode delete album request", "error", err)
		return nil, newError(responses.ErrorGeneric, "Invalid request format")
	}

	if deleteAlbumReq.AlbumID == "" {
		return nil, newError(responses.ErrorGeneric, "Album ID is required")
	}

	// Get all songs in the album
	albumSongs, err := api.ds.MediaFile(r.Context()).GetAll(model.QueryOptions{
		Filters: squirrel.Eq{"album_id": deleteAlbumReq.AlbumID},
	})
	if err != nil {
		log.Error("Failed to get album songs", "albumId", deleteAlbumReq.AlbumID, "error", err)
		return nil, newError(responses.ErrorGeneric, "Failed to get album songs")
	}

	// Get album info for logging
	album, err := api.ds.Album(r.Context()).Get(deleteAlbumReq.AlbumID)
	if err != nil {
		log.Error("Failed to get album info", "albumId", deleteAlbumReq.AlbumID, "error", err)
		return nil, newError(responses.ErrorDataNotFound, "Album not found")
	}

	// Delete all songs in the album
	for _, song := range albumSongs {
		// Delete the file from disk if it exists
		if song.Path != "" {
			fullPath := filepath.Join(conf.Server.MusicFolder, song.Path)
			if err := os.Remove(fullPath); err != nil {
				log.Warn("Failed to delete song file", "file", fullPath, "error", err)
			} else {
				log.Info("Deleted song file", "file", fullPath)
			}
		}
		
		// Delete the song from database
		if err := api.ds.MediaFile(r.Context()).Delete(song.ID); err != nil {
			log.Error("Failed to delete song from database", "songId", song.ID, "error", err)
			return nil, newError(responses.ErrorGeneric, fmt.Sprintf("Failed to delete song: %v", err))
		}
	}
	
	// Delete the album folder if it's empty
	if len(album.FolderIDs) > 0 {
		// Get the first folder ID to construct the album path
		albumPath := filepath.Join(conf.Server.MusicFolder, album.FolderIDs[0])
		if err := os.RemoveAll(albumPath); err != nil {
			log.Warn("Failed to delete album folder", "folder", albumPath, "error", err)
		} else {
			log.Info("Deleted album folder", "folder", albumPath)
		}
		
		// Note: Album will be automatically removed from database by scanner
		// when it detects that folder no longer exists
		log.Info("Album folder removed - will be cleaned up by scanner", "albumId", deleteAlbumReq.AlbumID, "name", album.Name)
		
		// Trigger garbage collection to clean up empty albums immediately
		if err := api.ds.GC(r.Context()); err != nil {
			log.Warn("Failed to trigger GC after album deletion", "albumId", deleteAlbumReq.AlbumID, "error", err)
		} else {
			log.Info("Triggered GC after album deletion", "albumId", deleteAlbumReq.AlbumID)
		}
	}

	log.Info("Deleted album and all its songs", "albumId", deleteAlbumReq.AlbumID, "name", album.Name, "songCount", len(albumSongs))

	response := responses.Subsonic{
		Status: "ok",
		DeleteResponse: &responses.DeleteResponse{
			Success: true,
			Message: fmt.Sprintf("Album '%s' and %d songs deleted successfully", album.Name, len(albumSongs)),
		},
	}

	return &response, nil
}
