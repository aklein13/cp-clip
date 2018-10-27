import {ACTIONS} from '../constants';

const initialState = {
  isPlaying: false,
  currentSong: null,
  channel: '',
};

const getArtistNames = (artists) => ' ' + artists.map((artist) => artist.name).join();

export default function player(state = initialState, action: any) {
  switch (action.type) {
    case ACTIONS.PLAY_PAUSE:
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case ACTIONS.SET_SONG:
      const {song, requester} = action.payload;
      // let image = null;
      // song.albums && song.albums.some((album) => {
      //   if (album.image) {
      //     image = album.image;
      //     return true
      //   }
      // });
      const newSong = {
        id: song.id,
        title: song.title,
        subTitle: getArtistNames(song.artists),
        requester: requester ? requester.displayName : null,
        // image,
      };
      return {
        ...state,
        currentSong: newSong,
      };
    case ACTIONS.SET_CHANNEL:
      return {
        ...state,
        channel: action.payload.channel,
      };
    default:
      return state;
  }
}
