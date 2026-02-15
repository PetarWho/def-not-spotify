import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import {
  TextInput,
  NumberInput,
  ReferenceInput,
  AutocompleteInput,
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

  const save = useCallback(
    async (values) => {
      try {
        // Show a message that song editing is not currently supported
        notify('Song editing is not currently supported in Navidrome. Song metadata is automatically updated during library scans.', 'warning')
        
        // Redirect back to song list
        redirect('/song')
        return
      } catch (error) {
        console.error('Error in song edit:', error)
        notify('ra.notification.http_error', 'warning')
      }
    },
    [notify, redirect],
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
          <ReferenceInput
            source="albumId"
            reference="album"
            label={translate('resources.song.fields.album')}
            filterToQuery={(searchText) => ({ name: searchText })}
          >
            <AutocompleteInput optionText="name" fullWidth />
          </ReferenceInput>
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
