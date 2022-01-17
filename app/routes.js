import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import History from './components/History';
import Cleanup from './components/Cleanup';

export default () => (
  <App>
    <Switch>
      <Route path="/cleanup" component={Cleanup} />
      <Route path="/" component={History} />
    </Switch>
  </App>
);
