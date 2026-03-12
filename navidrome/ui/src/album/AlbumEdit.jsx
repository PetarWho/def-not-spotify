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
  const record = useRecordContext()

  const save = useCallback(
    async (values) => {
      try {
        const albumId = record?.id || values.id
        if (!albumId) {
          notify('Cannot save: missing album ID', 'error')
          return
        }
        
        const tags = {}
        if (values.name !== undefined) tags.name = values.name
        if (values.albumArtist !== undefined) tags.albumArtist = values.albumArtist
        if (values.genre !== undefined) tags.genre = values.genre
        if (values.maxYear !== undefined) tags.year = values.maxYear
        if (values.comment !== undefined) tags.comment = values.comment

        const result = await dataProvider.updateAlbumTags(albumId, tags)
        
        if (result.data.errorCount > 0) {
          notify(`Updated ${result.data.successCount} songs, ${result.data.errorCount} errors`, 'warning')
        } else {
          notify(`Album metadata updated successfully (${result.data.successCount} songs)`)
        }
        refresh()
        redirect('/album')
      } catch (error) {
        console.error('Error in album edit:', error)
        notify('Failed to update album metadata: ' + (error.message || 'Unknown error'), 'warning')
      }
    },
    [dataProvider, notify, redirect, refresh, record],
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
            source="maxYear"
            label={translate('resources.album.fields.year')}
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
