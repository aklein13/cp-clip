import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import History from './components/History';
import Cleanup from './components/Cleanup';
import NewProfile from './components/NewProfile';

export default () => (
  <App>
    <Switch>
      <Route path="/cleanup" component={Cleanup} />
      <Route path="/new-profile" component={NewProfile} />
      <Route path="/" component={History} />
    </Switch>
  </App>
);
