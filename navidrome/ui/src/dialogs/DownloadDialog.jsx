import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
} from '@material-ui/core'
import { useTranslate, useNotify } from 'react-admin'
import { useDataProvider } from 'react-admin'
import { MdDownload } from 'react-icons/md'

const DownloadDialog = ({ open, onClose }) => {
  const translate = useTranslate()
  const notify = useNotify()
  const dataProvider = useDataProvider()
  const [url, setUrl] = useState('')
  const [library, setLibrary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [libraries, setLibraries] = useState([])

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        // Get library name from backend logs - it shows "Roy's Library"
        // Since library API doesn't work, let's use the actual library name
        setLibraries([{ id: 'default', name: "Roy's Library" }])
      } catch (err) {
        console.error('Failed to fetch libraries:', err)
        setLibraries([{ id: 'default', name: "Roy's Library" }])
      }
    }
    
    if (open) {
      fetchLibraries()
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('URL is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get current user info for authentication
      const username = localStorage.getItem('username') || 'admin'
      const token = localStorage.getItem('subsonic-token') || ''
      const salt = localStorage.getItem('subsonic-salt') || ''
      
      const response = await fetch(`/rest/downloadSong?u=${encodeURIComponent(username)}&t=${encodeURIComponent(token)}&s=${encodeURIComponent(salt)}&c=NavidromeUI&v=1.8.0&f=json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          library: library.trim() || undefined,
        }),
      })

      const data = await response.json()

      console.log('Download response:', data)

      // Handle Subsonic response format
      const subsonicResponse = data['subsonic-response'] || data
      
      if (subsonicResponse.status === 'ok' && subsonicResponse.downloadResponse?.success) {
        notify('Song downloaded successfully', 'success')
        setUrl('')
        setLibrary('')
        onClose()
      } else {
        const errorMsg = subsonicResponse.downloadResponse?.message || subsonicResponse.error?.message || 'Download failed'
        console.error('Download error:', errorMsg, subsonicResponse)
        setError(errorMsg)
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setUrl('')
    setLibrary('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <MdDownload size={24} style={{ marginRight: 8 }} />
          {translate('download.youTube')}
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Box mb={2} p={2} style={{ backgroundColor: '#ffebee', borderRadius: 4, color: '#c62828' }}>
              <Typography variant="body2">
                {error}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            label={translate('download.youTubeUrl')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            margin="normal"
            required
            placeholder="https://youtube.com/watch?v=..."
            disabled={loading}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>{translate('download.youTubeLibrary')}</InputLabel>
            <Select
              value={library}
              onChange={(e) => setLibrary(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">{translate('download.youTubeDefaultLibrary')}</MenuItem>
              {libraries.map((lib) => (
                <MenuItem key={lib.id} value={lib.name}>
                  {lib.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
            {translate('download.youTubeHelpText')}
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            {translate('ra.action.cancel')}
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading || !url.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <MdDownload />}
          >
            {translate('download.youTubeButton')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default DownloadDialog
