import React from 'react'
import { Route, Redirect } from 'react-router-dom'
import Personal from './personal/Personal'
import AlbumEditWrapper from './album/AlbumEditWrapper'
import SongEditWrapper from './song/SongEditWrapper'

const routes = [
  <Route exact path="/personal" render={() => <Personal />} key={'personal'} />,
  <Route exact path="/album/edit/:id" render={(props) => <AlbumEditWrapper {...props} />} key={'albumEdit'} />,
  <Route exact path="/song/edit/:id" render={(props) => <SongEditWrapper {...props} />} key={'songEdit'} />,
  <Route exact path="/liked" render={() => <Redirect to="/song?filter=%7B%22starred%22%3Atrue%7D&sort=starred_at&order=DESC" />} key={'liked'} />,
]

export default routes
