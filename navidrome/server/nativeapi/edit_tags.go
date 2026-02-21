package nativeapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/Masterminds/squirrel"
	"github.com/go-chi/chi/v5"
	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/model"
)

type TagUpdateRequest struct {
	Title       *string `json:"title,omitempty"`
	Artist      *string `json:"artist,omitempty"`
	Album       *string `json:"album,omitempty"`
	Genre       *string `json:"genre,omitempty"`
	Year        *int    `json:"year,omitempty"`
	TrackNumber *int    `json:"trackNumber,omitempty"`
	DiscNumber  *int    `json:"discNumber,omitempty"`
	Comment     *string `json:"comment,omitempty"`
}

type AlbumTagUpdateRequest struct {
	Name        *string `json:"name,omitempty"`
	Artist      *string `json:"artist,omitempty"`
	AlbumArtist *string `json:"albumArtist,omitempty"`
	Genre       *string `json:"genre,omitempty"`
	Year        *int    `json:"year,omitempty"`
	Comment     *string `json:"comment,omitempty"`
}

func updateSongTags(ds model.DataStore, tagEditor TagEditor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := chi.URLParam(r, "id")
		if id == "" {
			http.Error(w, "missing parameter: 'id'", http.StatusBadRequest)
			return
		}

		var updateReq TagUpdateRequest
		if err := json.NewDecoder(r.Body).Decode(&updateReq); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		file, err := ds.MediaFile(ctx).Get(id)
		if err != nil {
			if errors.Is(err, model.ErrNotFound) {
				http.Error(w, "Song not found", http.StatusNotFound)
				return
			}
			log.Error(ctx, "Error getting media file", "id", id, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if file.Missing {
			http.Error(w, "File is missing", http.StatusNotFound)
			return
		}

		tags := make(map[string]string)
		if updateReq.Title != nil {
			tags["title"] = *updateReq.Title
		}
		if updateReq.Artist != nil {
			tags["artist"] = *updateReq.Artist
		}
		if updateReq.Album != nil {
			tags["album"] = *updateReq.Album
		}
		if updateReq.Genre != nil {
			tags["genre"] = *updateReq.Genre
		}
		if updateReq.Year != nil {
			tags["year"] = fmt.Sprintf("%d", *updateReq.Year)
		}
		if updateReq.TrackNumber != nil {
			tags["trackNumber"] = fmt.Sprintf("%d", *updateReq.TrackNumber)
		}
		if updateReq.DiscNumber != nil {
			tags["discNumber"] = fmt.Sprintf("%d", *updateReq.DiscNumber)
		}
		if updateReq.Comment != nil {
			tags["comment"] = *updateReq.Comment
		}

		if len(tags) == 0 {
			http.Error(w, "No tags to update", http.StatusBadRequest)
			return
		}

		absolutePath := file.AbsolutePath()
		if err := tagEditor.WriteTags(ctx, absolutePath, tags); err != nil {
			log.Error(ctx, "Error writing tags", "file", absolutePath, err)
			http.Error(w, "Failed to write tags: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if err := touchFile(absolutePath); err != nil {
			log.Warn(ctx, "Could not update file modification time", "file", absolutePath, err)
		}

		response := map[string]interface{}{
			"id":      id,
			"success": true,
			"message": "Tags updated successfully",
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Error(ctx, "Error encoding response", err)
		}
	}
}

func touchFile(path string) error {
	return os.Chtimes(path, time.Now(), time.Now())
}

func updateAlbumTags(ds model.DataStore, tagEditor TagEditor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := chi.URLParam(r, "id")
		if id == "" {
			http.Error(w, "missing parameter: 'id'", http.StatusBadRequest)
			return
		}

		var updateReq AlbumTagUpdateRequest
		if err := json.NewDecoder(r.Body).Decode(&updateReq); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		songs, err := ds.MediaFile(ctx).GetAll(model.QueryOptions{Filters: squirrel.Eq{"album_id": id}})
		if err != nil {
			if errors.Is(err, model.ErrNotFound) {
				http.Error(w, "Album not found", http.StatusNotFound)
				return
			}
			log.Error(ctx, "Error getting album songs", "id", id, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if len(songs) == 0 {
			http.Error(w, "Album has no songs", http.StatusNotFound)
			return
		}

		tags := make(map[string]string)
		if updateReq.Name != nil {
			tags["album"] = *updateReq.Name
		}
		if updateReq.Artist != nil {
			tags["artist"] = *updateReq.Artist
		}
		if updateReq.AlbumArtist != nil {
			tags["albumArtist"] = *updateReq.AlbumArtist
		}
		if updateReq.Genre != nil {
			tags["genre"] = *updateReq.Genre
		}
		if updateReq.Year != nil {
			tags["year"] = fmt.Sprintf("%d", *updateReq.Year)
		}
		if updateReq.Comment != nil {
			tags["comment"] = *updateReq.Comment
		}

		if len(tags) == 0 {
			http.Error(w, "No tags to update", http.StatusBadRequest)
			return
		}

		successCount := 0
		errorCount := 0
		for _, song := range songs {
			if song.Missing {
				continue
			}
			absolutePath := song.AbsolutePath()
			if err := tagEditor.WriteTags(ctx, absolutePath, tags); err != nil {
				log.Error(ctx, "Error writing tags for song", "file", absolutePath, err)
				errorCount++
				continue
			}
			if err := touchFile(absolutePath); err != nil {
				log.Warn(ctx, "Could not update file modification time", "file", absolutePath, err)
			}
			successCount++
		}

		response := map[string]interface{}{
			"id":           id,
			"success":      true,
			"message":      fmt.Sprintf("Updated %d songs, %d errors", successCount, errorCount),
			"successCount": successCount,
			"errorCount":   errorCount,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Error(ctx, "Error encoding response", err)
		}
	}
}
