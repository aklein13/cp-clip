import {ACTIONS, RETRY_TIME, KR_WS, JP_WS} from '../constants';
import {store} from '../index';

export function playPause() {
  return {type: ACTIONS.PLAY_PAUSE};
}

let listenMoeWs;
let sendHeartbeat;
let heartbeatReceived;

const setHeartbeat = (ms) => {
  sendHeartbeat = setInterval(() => {
    listenMoeWs.send(JSON.stringify({op: 9}));
  }, ms);
};

const reconnect = (channel = 'JP') => {
  stopWs();
  initWs(channel)(store.dispatch);
};

let retryIfInactive = null;

export const initWs = (channel = 'JP') => {
  return (dispatch) => {
    if (listenMoeWs) {
      stopWs();
    }
    listenMoeWs = new WebSocket(channel === 'JP' ? JP_WS : KR_WS);

    listenMoeWs.onopen = () => {
      dispatch({
        type: ACTIONS.SET_CHANNEL,
        payload: {channel},
      });
      listenMoeWs.send(JSON.stringify({op: 0, d: {auth: ''}}));
      console.log('Websocket connection established on ' + channel);
    };

    listenMoeWs.onerror = (err) => {
      console.log(err);
      setTimeout(() => initWs(channel)(store.dispatch), RETRY_TIME);
    };

    listenMoeWs.onmessage = async (message) => {
      let response;
      try {
        response = JSON.parse(message.data);
      }
      catch (error) {
        console.warn(error, message.data);
        return;
      }
      if (response.op === 0) {
        const {heartbeat} = response.d;
        heartbeatReceived = heartbeat;
        retryIfInactive = setTimeout(reconnect, heartbeat + RETRY_TIME);
        return setHeartbeat(heartbeat);
      }
      else if (response.op === 1) {
        if (heartbeatReceived) {
          clearTimeout(retryIfInactive);
          retryIfInactive = setTimeout(reconnect, heartbeatReceived + RETRY_TIME);
        }
        dispatch({
          type: ACTIONS.SET_SONG,
          payload: {
            song: response.d.song,
            requester: response.d.requester,
          },
        })
      }
      else if (response.op === 10 && heartbeatReceived) {
        clearTimeout(retryIfInactive);
        retryIfInactive = setTimeout(reconnect, heartbeatReceived + 10000);
      }
    };
    localStorage.setItem('channel', channel);
  };
};

export const stopWs = () => {
  if (listenMoeWs) {
    listenMoeWs.close();
    clearInterval(sendHeartbeat);
    clearTimeout(retryIfInactive);
    heartbeatReceived = null;
    listenMoeWs = null;
  }
};
