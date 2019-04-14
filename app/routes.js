import React from 'react';
import {Switch, Route} from 'react-router';
import App from './containers/App';
import History from './components/History';
import Settings from './components/settings';

export default () => (
  <App>
    <Switch>
      <Route path="/settings" component={Settings}/>
      <Route path="/" component={History}/>
    </Switch>
  </App>
);
