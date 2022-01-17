// @flow
import React, { Component } from 'react';
import { HashRouter } from 'react-router-dom';
import Routes from '../routes';

export default class Root extends Component {
  render() {
    return (
      <HashRouter>
        <Routes />
      </HashRouter>
    );
  }
}
