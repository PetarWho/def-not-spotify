import React from 'react'
import SongEdit from './SongEdit'

const SongEditWrapper = (props) => {
  // Extract the ID from the route params
  const id = props.match.params.id
  
  // Provide all required React Admin props
  const editProps = {
    ...props,
    id,
    basePath: '/song',
    resource: 'song',
  }
  
  return <SongEdit {...editProps} />
}

export default SongEditWrapper
