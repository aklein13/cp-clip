// @flow
import {combineReducers} from 'redux';
import {routerReducer as router} from 'react-router-redux';
import player from './player';
import auth from './auth';

const rootReducer = combineReducers({
  player,
  auth,
  router,
});

export default rootReducer;
