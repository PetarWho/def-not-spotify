import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import {
  TextInput,
  NumberInput,
  DateInput,
  Edit,
  required,
  SimpleForm,
  useTranslate,
  Toolbar,
  SaveButton,
  useMutation,
  useNotify,
  useRedirect,
  useRefresh,
  Notification,
  useDataProvider,
} from 'react-admin'
import { Title } from '../common'

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})

const AlbumTitle = ({ record }) => {
  const translate = useTranslate()
  const resourceName = translate('resources.album.name', { smart_count: 1 })
  return <Title subTitle={`${resourceName} ${record ? record.name : ''}`} />
}

const AlbumToolbar = (props) => (
  <Toolbar {...props} classes={useStyles()}>
    <SaveButton disabled={props.pristine} />
  </Toolbar>
)

const AlbumEdit = (props) => {
  const translate = useTranslate()
  const dataProvider = useDataProvider()
  const notify = useNotify()
  const redirect = useRedirect()
  const refresh = useRefresh()

  const save = useCallback(
    async (values) => {
      try {
        // Show a message that album editing is not currently supported
        notify('Album editing is not currently supported in Navidrome. Album metadata is automatically updated during library scans.', 'warning')
        
        // Redirect back to album list
        redirect('/album')
        return
      } catch (error) {
        console.error('Error in album edit:', error)
        notify('ra.notification.http_error', 'warning')
      }
    },
    [notify, redirect],
  )

  return (
    <>
      <Edit title={<AlbumTitle />} undoable={false} {...props}>
        <SimpleForm
          variant={'outlined'}
          toolbar={<AlbumToolbar />}
          save={save}
        >
          <TextInput
            source="name"
            label={translate('resources.album.fields.name')}
            validate={[required()]}
            fullWidth
          />
          <TextInput
            source="artist"
            label={translate('resources.album.fields.artist')}
            fullWidth
          />
          <TextInput
            source="albumArtist"
            label={translate('resources.album.fields.albumArtist')}
            fullWidth
          />
          <TextInput
            source="genre"
            label={translate('resources.album.fields.genre')}
            fullWidth
          />
          <NumberInput
            source="year"
            label={translate('resources.album.fields.year')}
          />
          <DateInput
            source="releaseDate"
            label={translate('resources.album.fields.releaseDate')}
          />
          <TextInput
            source="comment"
            label={translate('resources.album.fields.comment')}
            multiline
            rows={4}
            fullWidth
          />
        </SimpleForm>
      </Edit>
      <Notification />
    </>
  )
}

export default AlbumEdit
