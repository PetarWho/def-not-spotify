package core

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/navidrome/navidrome/log"
)

type TagEditor interface {
	WriteTags(ctx context.Context, filePath string, tags map[string]string) error
}

type TagEditorImpl struct {
	ffmpegPath string
}

func NewTagEditor() (*TagEditorImpl, error) {
	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		return nil, fmt.Errorf("ffmpeg not found: %w", err)
	}
	log.Info("Tag editor initialized", "ffmpeg", ffmpegPath)
	return &TagEditorImpl{ffmpegPath: ffmpegPath}, nil
}

func (e *TagEditorImpl) WriteTags(ctx context.Context, filePath string, tags map[string]string) error {
	ext := filepath.Ext(filePath)
	base := filePath[:len(filePath)-len(ext)]
	tempFile := base + ".tmp" + ext
	
	args := []string{"-i", filePath}
	
	tagMap := map[string]string{
		"title":       "title",
		"artist":      "artist",
		"album":       "album",
		"albumArtist": "album_artist",
		"genre":       "genre",
		"year":        "date",
		"trackNumber": "track",
		"discNumber":  "disc",
		"comment":     "comment",
	}
	
	for field, val := range tags {
		if tagName, ok := tagMap[field]; ok {
			args = append(args, "-metadata", fmt.Sprintf("%s=%s", tagName, val))
		}
	}
	
	args = append(args, "-codec", "copy", "-y", tempFile)
	
	log.Debug(ctx, "Writing tags with ffmpeg", "file", filePath, "args", args)
	
	cmd := exec.CommandContext(ctx, e.ffmpegPath, args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Error(ctx, "Failed to write tags", "file", filePath, "output", string(output), err)
		os.Remove(tempFile)
		return fmt.Errorf("ffmpeg error: %w, output: %s", err, string(output))
	}
	
	if err := os.Rename(tempFile, filePath); err != nil {
		return fmt.Errorf("failed to rename temp file: %w", err)
	}
	
	log.Info(ctx, "Successfully wrote tags", "file", filePath)
	return nil
}
