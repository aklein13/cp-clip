import {ACTIONS} from '../constants';

const initialState = {
  login: '',
  token: null,
  error: '',
  favourites: {},
};

export default function auth(state = {...initialState}, action: any) {
  switch (action.type) {
    case ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        error: 'Invalid login on password',
      };
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: '',
      };
    case ACTIONS.SET_USER:
    case ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        login: action.payload.login,
        token: action.payload.token,
      };
    case ACTIONS.LOAD_FAVOURITES:
      const loadedFavourites = {};
      action.payload.favourites.forEach((fav) => loadedFavourites[fav.id] = true);
      return {
        ...state,
        favourites: loadedFavourites,
      };
    case ACTIONS.SET_FAVOURITE:
      const previousFavourites = {...state.favourites};
      const {songId, shouldBeFav} = action.payload;
      if (shouldBeFav) {
        previousFavourites[songId] = true;
      }
      else {
        delete previousFavourites[songId];
      }
      return {
        ...state,
        favourites: previousFavourites,
      };
    case ACTIONS.LOG_OUT:
      return {
        ...initialState,
      };
    default:
      return state;
  }
}