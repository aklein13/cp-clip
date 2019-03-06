export const ACTIONS = {
  LOGIN_SUCCESS: 'login_success',
};

export type IApiAction = {
  action: string,
  url: string,
  startRequest: string,
  successRequest: string,
  failureRequest: string,
}

export const API_ACTIONS: { [key: string]: IApiAction } = {};

export const API_URL = 'http://localhost:8000/';
