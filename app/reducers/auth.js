import {ACTIONS} from '../constants';

type IAuthState = {
  login: string,
  token: any,
}

const initialState: IAuthState = {
  login: '',
  token: null,
};

export default function auth(state: IAuthState = {...initialState}, action: any) {
  switch (action.type) {
    default:
      return state;
  }
}