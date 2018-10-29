import {ACTIONS} from '../constants';

const initialState = {
  login: '',
  token: null,
};

export default function auth(state = {...initialState}, action: any) {
  switch (action.type) {
    default:
      return state;
  }
}