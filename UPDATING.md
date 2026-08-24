# Updating the vendored Navidrome (`navidrome/`)

`navidrome/` is tracked as a **git subtree** rooted at the `upstream` remote
(https://github.com/navidrome/navidrome), currently based on `v0.63.2`. It is
*not* a submodule and *not* a flat file copy — it shares real commit history
with upstream, so merges are proper 3-way merges instead of blind overwrites.

## Pulling in a new upstream version

```bash
git fetch upstream
git subtree pull --prefix=navidrome upstream master --squash
# or pin to a specific tag instead of master:
git subtree pull --prefix=navidrome upstream vX.Y.Z --squash
```

Resolve any conflicts, then commit as usual. Conflicts should only show up in
files this project has actually customized — see the list below.

## Files this project customizes (conflict-prone on update)

These are the files most likely to conflict on a subtree pull, because both
upstream and this project's features touch them:

- `navidrome/cmd/wire_gen.go` (generated — see note below)
- `navidrome/core/wire_providers.go`
- `navidrome/server/nativeapi/native_api.go`
- `navidrome/server/subsonic/api.go`
- `navidrome/model/metadata/map_participants.go`

Everything else this project adds (`core/tag_editor.go`,
`server/subsonic/download.go`, `server/nativeapi/edit_tags.go`,
`ui/src/dialogs/DownloadDialog.jsx`, `ui/src/song/SongEdit*.jsx`,
`ui/src/album/AlbumEdit*.jsx`, etc.) are net-new files and won't conflict.

### `wire_gen.go`

This file is Wire-generated. If you have the `wire` CLI available, prefer
regenerating it over hand-merging conflicts:

```bash
cd navidrome/cmd && go run -mod=mod github.com/google/wire/cmd/wire gen -tags "netgo sqlite_fts5"
```

then diff against what you'd have hand-merged to make sure it matches.

## Custom features (why those files are touched)

- yt-dlp download button + `navidrome-song-downloader` sidecar service
- Liked Songs sidebar section
- Song/Album tag editing UI + backend (`edit_tags.go`, `tag_editor.go`)
- Age-restricted YouTube downloads via cookies file
- Multi-delete, download-only-songs, quote-stripping in tag parsing

## History note

Before this restructure, `navidrome/` was added as a disconnected flat file
copy (no shared git history with upstream), which made every future merge
hit "refusing to merge unrelated histories". It was rebuilt as a subtree in
[commit that introduced this file] — see `git log --oneline -- navidrome`
around that point for the exact conflict resolutions made at the time.
