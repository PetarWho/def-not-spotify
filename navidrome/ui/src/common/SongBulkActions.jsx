import React, { Fragment, useEffect } from 'react'
import { useUnselectAll, usePermissions, useNotify, useDataProvider, Button } from 'react-admin'
import { addTracks, playNext, playTracks } from '../actions'
import { RiPlayList2Fill, RiPlayListAddFill } from 'react-icons/ri'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import DeleteIcon from '@material-ui/icons/Delete'
import { BatchPlayButton } from './index'
import { AddToPlaylistButton } from './AddToPlaylistButton'
import { makeStyles } from '@material-ui/core/styles'
import { BatchShareButton } from './BatchShareButton'
import config from '../config'

const useStyles = makeStyles((theme) => ({
  button: {
    color: theme.palette.type === 'dark' ? 'white' : undefined,
  },
}))

export const SongBulkActions = (props) => {
  const classes = useStyles()
  const unselectAll = useUnselectAll()
  const { permissions } = usePermissions()
  const notify = useNotify()
  const dataProvider = useDataProvider()

  useEffect(() => {
    unselectAll(props.resource)
  }, [unselectAll, props.resource])

  const handleDelete = async () => {
    const { selectedIds, resource } = props
    const count = selectedIds.length
    
    if (window.confirm(`Are you sure you want to delete ${count} song${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      try {
        const username = localStorage.getItem('username') || 'admin'
        const token = localStorage.getItem('subsonic-token') || ''
        const salt = localStorage.getItem('subsonic-salt') || ''
        const clientUniqueId = localStorage.getItem('clientUniqueId') || ''
        
        let successCount = 0
        let failedCount = 0
        
        for (const songId of selectedIds) {
          const response = await fetch(`/rest/deleteSong?u=${encodeURIComponent(username)}&t=${encodeURIComponent(token)}&s=${encodeURIComponent(salt)}&c=NavidromeUI&v=1.8.0&f=json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-ND-Authorization': `Bearer ${localStorage.getItem('token')}`,
              'X-ND-Client-Unique-Id': clientUniqueId,
            },
            body: JSON.stringify({ songId }),
          })
          
          const data = await response.json()
          const subsonicResponse = data['subsonic-response'] || data
          
          if (subsonicResponse.status === 'ok' && subsonicResponse.deleteResponse?.success) {
            successCount++
          } else {
            failedCount++
          }
        }
        
        if (failedCount === 0) {
          notify(`Successfully deleted ${successCount} song${successCount > 1 ? 's' : ''}`, 'success')
          unselectAll(resource)
          window.location.reload()
        } else {
          notify(`Deleted ${successCount} song${successCount > 1 ? 's' : ''}, ${failedCount} failed`, 'warning')
          unselectAll(resource)
          window.location.reload()
        }
      } catch (err) {
        notify('Network error: ' + err.message, 'error')
      }
    }
  }

  return (
    <Fragment>
      <BatchPlayButton
        {...props}
        action={playTracks}
        label={'resources.song.actions.playNow'}
        icon={<PlayArrowIcon />}
        className={classes.button}
      />
      <BatchPlayButton
        {...props}
        action={playNext}
        label={'resources.song.actions.playNext'}
        icon={<RiPlayList2Fill />}
        className={classes.button}
      />
      <BatchPlayButton
        {...props}
        action={addTracks}
        label={'resources.song.actions.addToQueue'}
        icon={<RiPlayListAddFill />}
        className={classes.button}
      />
      {config.enableSharing && (
        <BatchShareButton {...props} className={classes.button} />
      )}
      <AddToPlaylistButton {...props} className={classes.button} />
      {permissions === 'admin' && (
        <Button
          onClick={handleDelete}
          label={'resources.song.actions.delete'}
          className={classes.button}
        >
          <DeleteIcon />
        </Button>
      )}
    </Fragment>
  )
}
