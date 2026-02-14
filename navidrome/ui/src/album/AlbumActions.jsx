import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
  Button,
  sanitizeListRestProps,
  TopToolbar,
  useRecordContext,
  useTranslate,
  useNotify,
  usePermissions,
} from 'react-admin'
import { useMediaQuery, makeStyles } from '@material-ui/core'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import ShuffleIcon from '@material-ui/icons/Shuffle'
import CloudDownloadOutlinedIcon from '@material-ui/icons/CloudDownloadOutlined'
import { RiPlayListAddFill, RiPlayList2Fill } from 'react-icons/ri'
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd'
import ShareIcon from '@material-ui/icons/Share'
import DeleteIcon from '@material-ui/icons/Delete'
import {
  playNext,
  addTracks,
  playTracks,
  shuffleTracks,
  openAddToPlaylist,
  openDownloadMenu,
  DOWNLOAD_MENU_ALBUM,
  openShareMenu,
} from '../actions'
import { formatBytes } from '../utils'
import config from '../config'
import { ToggleFieldsMenu } from '../common'

const useStyles = makeStyles({
  toolbar: { display: 'flex', justifyContent: 'space-between', width: '100%' },
})

const AlbumButton = ({ children, ...rest }) => {
  const record = useRecordContext(rest) || {}
  return (
    <Button {...rest} disabled={record.missing}>
      {children}
    </Button>
  )
}

const deleteAlbum = async (albumId, songCount, dispatch, notify) => {
  try {
    const username = localStorage.getItem('username') || 'admin'
    const token = localStorage.getItem('subsonic-token') || ''
    const salt = localStorage.getItem('subsonic-salt') || ''
    
    const response = await fetch(`/rest/deleteAlbum?u=${encodeURIComponent(username)}&t=${encodeURIComponent(token)}&s=${encodeURIComponent(salt)}&c=NavidromeUI&v=1.8.0&f=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: albumId,
      }),
    })

    const data = await response.json()
    const subsonicResponse = data['subsonic-response'] || data
    
    if (subsonicResponse.status === 'ok' && subsonicResponse.deleteResponse?.success) {
      notify('Album deleted successfully', 'success')
      // Trigger a refresh of the current view
      window.location.reload()
    } else {
      const errorMsg = subsonicResponse.deleteResponse?.message || subsonicResponse.error?.message || 'Delete failed'
      notify(errorMsg, 'error')
    }
  } catch (err) {
    notify('Network error: ' + err.message, 'error')
  }
}

const AlbumActions = ({
  className,
  ids,
  data,
  record,
  permanentFilter,
  ...rest
}) => {
  const dispatch = useDispatch()
  const translate = useTranslate()
  const notify = useNotify()
  const { permissions } = usePermissions()
  const classes = useStyles()
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'))
  const isNotSmall = useMediaQuery((theme) => theme.breakpoints.up('sm'))

  const handlePlay = React.useCallback(() => {
    dispatch(playTracks(data, ids))
  }, [dispatch, data, ids])

  const handlePlayNext = React.useCallback(() => {
    dispatch(playNext(data, ids))
  }, [dispatch, data, ids])

  const handlePlayLater = React.useCallback(() => {
    dispatch(addTracks(data, ids))
  }, [dispatch, data, ids])

  const handleShuffle = React.useCallback(() => {
    dispatch(shuffleTracks(data, ids))
  }, [dispatch, data, ids])

  const handleAddToPlaylist = React.useCallback(() => {
    const selectedIds = ids.filter((id) => !data[id].missing)
    dispatch(openAddToPlaylist({ selectedIds }))
  }, [dispatch, data, ids])

  const handleShare = React.useCallback(() => {
    dispatch(openShareMenu([record.id], 'album', record.name))
  }, [dispatch, record])

  const handleDownload = React.useCallback(() => {
    dispatch(openDownloadMenu(record, DOWNLOAD_MENU_ALBUM))
  }, [dispatch, record])

  const handleDeleteAlbum = React.useCallback(() => {
    const songCount = ids.length
    const confirmMessage = translate('resources.album.actions.deleteConfirm', {
      name: record.name,
      count: songCount
    })
    
    if (window.confirm(confirmMessage)) {
      deleteAlbum(record.id, songCount, dispatch, notify)
    }
  }, [dispatch, record, ids, notify])

  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}>
      <div className={classes.toolbar}>
        <div>
          <AlbumButton
            onClick={handlePlay}
            label={translate('resources.album.actions.playAll')}
          >
            <PlayArrowIcon />
          </AlbumButton>
          <AlbumButton
            onClick={handleShuffle}
            label={translate('resources.album.actions.shuffle')}
          >
            <ShuffleIcon />
          </AlbumButton>
          <AlbumButton
            onClick={handlePlayNext}
            label={translate('resources.album.actions.playNext')}
          >
            <RiPlayList2Fill />
          </AlbumButton>
          <AlbumButton
            onClick={handlePlayLater}
            label={translate('resources.album.actions.addToQueue')}
          >
            <RiPlayListAddFill />
          </AlbumButton>
          <AlbumButton
            onClick={handleAddToPlaylist}
            label={translate('resources.album.actions.addToPlaylist')}
          >
            <PlaylistAddIcon />
          </AlbumButton>
          {config.enableSharing && (
            <AlbumButton
              onClick={handleShare}
              label={translate('ra.action.share')}
            >
              <ShareIcon />
            </AlbumButton>
          )}
          {config.enableDownloads && (
            <AlbumButton
              onClick={handleDownload}
              label={
                translate('ra.action.download') +
                (isDesktop ? ` (${formatBytes(record.size)})` : '')
              }
            >
              <CloudDownloadOutlinedIcon />
            </AlbumButton>
          )}
          {permissions === 'admin' && (
            <AlbumButton
              onClick={handleDeleteAlbum}
              label={translate('resources.album.actions.delete')}
            >
              <DeleteIcon />
            </AlbumButton>
          )}
        </div>
        <div>{isNotSmall && <ToggleFieldsMenu resource="albumSong" />}</div>
      </div>
    </TopToolbar>
  )
}

AlbumActions.propTypes = {
  record: PropTypes.object.isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.number),
}

AlbumActions.defaultProps = {
  record: {},
  selectedIds: [],
}

export default AlbumActions
