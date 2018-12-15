export const ACTIONS = {
  PLAY_PAUSE: 'play_pause',
  SET_SONG: 'set_current_song',
  SET_CHANNEL: 'set_current_channel',
  LOGIN_ERROR: 'login_error',
  CLEAR_ERROR: 'clear_auth_error',
  LOGIN_SUCCESS: 'login_success',
  SET_USER: 'set_token',
  LOAD_FAVOURITES: 'fetch_favourites',
  SET_FAVOURITE: 'set_favourite',
  LOG_OUT: 'log_out',
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

export const ALPHABET: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
export const SPECIAL_CHARS: string[] = ['~', '!', '"', '\'', '?', '.', ';', '[', ']', '\\', ',', '/', '@', '#', '$', '%', '|', '^', '&', '*', '(', ')', '-', '=', '{', '}', ':', '<', '>', '`', '_'];
export const NUMBERS: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
