import Client from 'electron-rpc/client';
import {ACTIONS, API_HEADERS, API_URL, RETRY_TIME} from '../constants';
import {store} from '../index';

const client = new Client();

export const login = (login, password) => {
  return (dispatch) => {
    const headers = new Headers(API_HEADERS);
    const body = {
      username: login,
      password,
    };
    const init = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    };
    const url = API_URL + 'login';
    const request = new Request(url);
    fetch(request, init).then((response) => response.json())
      .catch(error => {
        alert('Network request failed');
        console.error('Error:', error);
      })
      .then((data) => {
        const {token} = data;
        if (!token) {
          return dispatch({type: ACTIONS.LOGIN_ERROR});
        }
        dispatch({
          type: ACTIONS.LOGIN_SUCCESS,
          payload: {token, login},
        });
        localStorage.setItem('login', login);
        localStorage.setItem('token', token);
        client.request('logged_in', {login, token});
      });
  }
};

export const fetchFavourites = (login, token) => {
  return (dispatch) => {
    const headers = new Headers(API_HEADERS);
    headers.append('Authorization', 'Bearer ' + token);
    const init = {
      method: 'GET',
      headers,
    };
    const url = `${API_URL}favorites/${login}`;
    const request = new Request(url);
    fetch(request, init).then((response) => response.json())
      .catch((error) => {
        console.log('Error:', error);
        // Retry to fetch
        setTimeout(() => fetchFavourites(login, token)(store.dispatch), RETRY_TIME);
      })
      .then((data) => {
        if (data && data.favorites) {
          dispatch({
            type: ACTIONS.LOAD_FAVOURITES,
            payload: {favourites: data.favorites},
          })
        }
      });
  }
};

export const manageFavourite = (songId, token, shouldBeFav) => {
  return (dispatch) => {
    // Assume request won't fail to make it instant
    dispatch({
      type: ACTIONS.SET_FAVOURITE,
      payload: {songId, shouldBeFav},
    });
    const headers = new Headers(API_HEADERS);
    headers.append('Authorization', 'Bearer ' + token);
    const init = {
      method: shouldBeFav ? 'POST' : 'DELETE',
      headers,
    };
    const url = `${API_URL}favorites/${songId}`;
    const request = new Request(url);
    fetch(request, init).then((response) => {
      if (response.ok) {
        return true;
      }
      throw new Error('Request failed.');
    })
      .catch(error => {
        console.error(error);
        alert(`Error: ${error}`);
        dispatch({
          type: ACTIONS.SET_FAVOURITE,
          payload: {songId, shouldBeFav: !shouldBeFav},
        });
      })
  }
};

export function clearAuthError() {
  return {type: ACTIONS.CLEAR_ERROR}
}

export function setUser(login, token) {
  return {
    type: ACTIONS.SET_USER,
    payload: {token, login},
  }
}

export function logOut(fromPlayer = false) {
  if (!fromPlayer) {
    client.request('logged_out');
    localStorage.setItem('token', '');
  }
  return {type: ACTIONS.LOG_OUT};
}
