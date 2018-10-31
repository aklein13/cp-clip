// @flow
import type {IApiAction} from './constants';

export const startRequest = (initialData, action: IApiAction, attrs = {},
                             params = {}, method = 'GET', postData = null) => {
  return (dispatch) => {
    dispatch(StartedCallback(action, attrs, params, postData));
    const urlParams = encodeQueryData(params);
    method = method.toUpperCase();
    const requestData = {
      method,
      headers: {},
    };

    let url = `${action.url}?${urlParams}`;
    for (let attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        url = url.replace(`{${attr}}`, attrs[attr]);
      }
    }
    if (
      (method === 'POST' || method === 'PUT' || method === 'PATCH')
      && postData
    ) {
      requestData.headers['content-type'] = 'application/json';
      requestData.body = JSON.stringify(postData);
    }

    return fetch(url, requestData)
      .then((res) => {
        if (res.ok) {
          if (res.status === 204) {
            return dispatch(SuccessCallback(res, action, attrs, params, url, postData));
          }
          return res.json()
            .then((result) => dispatch(SuccessCallback(result, action, attrs, params, url, postData)));
        } else {
          return res.json()
            .then((result) => dispatch(FailureCallback(result, action, attrs, params, url, postData)));
        }
      })
      .catch((error) => dispatch(FailureCallback(error, action, attrs, params, url, postData)));
  };
};

export function StartedCallback(action, attrs, params, postData) {
  return {
    type: action.startRequest,
    attrs,
    params,
    postData,
  };
}

export function SuccessCallback(res, action, attrs, params, url, postData) {
  return {
    type: action.successRequest,
    res,
    attrs,
    params,
    url,
    postData,
  };
}

export function FailureCallback(message, action, attrs, params, url, postData) {
  return {
    type: action.failureRequest,
    errorMessage: message,
    attrs,
    params,
    url,
    postData,
  };
}

export const encodeQueryData = (data) => {
  let ret = [];
  for (let d in data) {
    if (data.hasOwnProperty(d)) {
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    }
  }
  return ret.join('&');
};
