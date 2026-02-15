import React from 'react'
import { Route } from 'react-router-dom'
import Personal from './personal/Personal'
import AlbumEditWrapper from './album/AlbumEditWrapper'
import SongEditWrapper from './song/SongEditWrapper'

const routes = [
  <Route exact path="/personal" render={() => <Personal />} key={'personal'} />,
  <Route exact path="/album/edit/:id" render={(props) => <AlbumEditWrapper {...props} />} key={'albumEdit'} />,
  <Route exact path="/song/edit/:id" render={(props) => <SongEditWrapper {...props} />} key={'songEdit'} />,
]

export default routes
