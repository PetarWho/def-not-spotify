import React from 'react'
import AlbumEdit from './AlbumEdit'

const AlbumEditWrapper = (props) => {
  // Extract the ID from the route params
  const id = props.match.params.id
  
  // Provide all required React Admin props
  const editProps = {
    ...props,
    id,
    basePath: '/album',
    resource: 'album',
  }
  
  return <AlbumEdit {...editProps} />
}

export default AlbumEditWrapper
