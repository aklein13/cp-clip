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

export const JP_WS = 'wss://listen.moe/gateway';
export const KR_WS = 'wss://listen.moe/kpop/gateway';

export const API_URL = 'https://listen.moe/api/';

export const API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/vnd.listen.v4+json',
};

export const RETRY_TIME = 10000;

export const ALPHABET = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
