import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import History from './components/History';

export default () => (
  <App>
    <Switch>
      <Route path="/" component={History} />
    </Switch>
  </App>
);
