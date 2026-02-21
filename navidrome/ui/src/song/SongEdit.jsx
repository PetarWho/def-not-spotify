import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import {
  TextInput,
  NumberInput,
  Edit,
  required,
  SimpleForm,
  useTranslate,
  Toolbar,
  SaveButton,
  useNotify,
  useRedirect,
  useRefresh,
  Notification,
  useDataProvider,
  useRecordContext,
} from 'react-admin'
import { Title } from '../common'

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})

const SongTitle = ({ record }) => {
  const translate = useTranslate()
  const resourceName = translate('resources.song.name', { smart_count: 1 })
  return <Title subTitle={`${resourceName} ${record ? record.title : ''}`} />
}

const SongToolbar = (props) => (
  <Toolbar {...props} classes={useStyles()}>
    <SaveButton disabled={props.pristine} />
  </Toolbar>
)

const SongEdit = (props) => {
  const translate = useTranslate()
  const dataProvider = useDataProvider()
  const notify = useNotify()
  const redirect = useRedirect()
  const refresh = useRefresh()
  const record = useRecordContext()

  const save = useCallback(
    async (values) => {
      try {
        const songId = record?.id || values.id
        if (!songId) {
          notify('Cannot save: missing song ID', 'error')
          return
        }
        
        const tags = {}
        if (values.title !== undefined) tags.title = values.title
        if (values.artist !== undefined) tags.artist = values.artist
        if (values.album !== undefined) tags.album = values.album
        if (values.genre !== undefined) tags.genre = values.genre
        if (values.year !== undefined) tags.year = values.year
        if (values.trackNumber !== undefined) tags.trackNumber = values.trackNumber
        if (values.discNumber !== undefined) tags.discNumber = values.discNumber
        if (values.comment !== undefined) tags.comment = values.comment

        await dataProvider.updateSongTags(songId, tags)
        
        notify('Song metadata updated successfully')
        refresh()
        redirect('/song')
      } catch (error) {
        console.error('Error in song edit:', error)
        notify('Failed to update song metadata: ' + (error.message || 'Unknown error'), 'warning')
      }
    },
    [dataProvider, notify, redirect, refresh, record],
  )

  return (
    <>
      <Edit title={<SongTitle />} undoable={false} {...props}>
        <SimpleForm
          variant={'outlined'}
          toolbar={<SongToolbar />}
          save={save}
        >
          <TextInput
            source="title"
            label={translate('resources.song.fields.title')}
            validate={[required()]}
            fullWidth
          />
          <TextInput
            source="artist"
            label={translate('resources.song.fields.artist')}
            fullWidth
          />
          <TextInput
            source="album"
            label={translate('resources.song.fields.albumName')}
            fullWidth
          />
          <TextInput
            source="genre"
            label={translate('resources.song.fields.genre')}
            fullWidth
          />
          <NumberInput
            source="year"
            label={translate('resources.song.fields.year')}
          />
          <NumberInput
            source="trackNumber"
            label={translate('resources.song.fields.trackNumber')}
          />
          <NumberInput
            source="discNumber"
            label={translate('resources.song.fields.discNumber')}
          />
          <TextInput
            source="comment"
            label={translate('resources.song.fields.comment')}
            multiline
            rows={3}
            fullWidth
          />
        </SimpleForm>
      </Edit>
      <Notification />
    </>
  )
}

export default SongEdit
