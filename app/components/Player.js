// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Client from 'electron-rpc/client';
import {playPause, initWs, stopWs} from '../actions/player';
import {fetchFavourites, setUser, manageFavourite, logOut} from '../actions/auth';
import {JP_STREAM, KR_STREAM} from '../constants';
import Panel from './Panel';
import Marquee from './Marquee';

type IProps = {
  initWs: () => void,
  setUser: () => void,
  fetchFavourites: () => void,
  playPause: () => void,
  currentChannel: string,
  currentSong: any,
  isPlaying: boolean,
  manageFavourite: (number, string, boolean) => void,
  logOut: () => void,
};

type IState = {
  volume: number,
};

class Player extends Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.client = new Client();
    this.client.on('media_play', this.mediaKeyPlayPause);
    this.client.on('media_switch', this.switchChannel);
    this.client.on('request_song_info', this.sendSongInfo);
    this.client.on('user_logged_out', () => this.props.logOut(true));
    this.client.on('user_logged_in', (error, body) => {
      if (!body) {
        return console.error(error);
      }
      const {token, login} = body;
      if (token && login) {
        this.props.setUser(login, token);
        this.props.fetchFavourites(login, token);
      }
    });
    this.client.on('color_changed', (error, body) => {
      if (!body || error) {
        console.log('return');
        return console.error(error);
      }
      this.manageColor(body.value, body.name);
    });
    this.player = null;
    this.state = {
      volume: 50,
    };
  }

  manageColor = (value, name) => {
    if (name === 'text') {
      document.documentElement.style.setProperty('--text-color', value);
      return localStorage.setItem('textColor', value);
    }
    let currentColor = value;
    document.documentElement.style.setProperty('--primary', currentColor);
    document.documentElement.style.setProperty('--primary-d-5', currentColor);
    document.documentElement.style.setProperty('--primary-d-6', currentColor);
    document.documentElement.style.setProperty('--primary-d-15', currentColor);
    document.documentElement.style.setProperty('--primary-l-9', currentColor);
    document.documentElement.style.setProperty('--primary-l-10', currentColor);
    localStorage.setItem('primaryColor', value);
  };

  mediaKeyPlayPause = () => {
    // const {currentSong, login, token} = this.props;
    // // Retry to connect if failed
    // if (!currentSong) {
    //   const previousChannel = localStorage.getItem('channel');
    //   this.props.initWs(previousChannel || 'JP');
    //   if (token && login) {
    //     this.props.fetchFavourites(login, token);
    //   }
    // }
    this.props.playPause();
  };

  sendSongInfo = () => {
    const {currentSong} = this.props;
    if (!currentSong) {
      return;
    }
    const songText = `${currentSong.subTitle} ${currentSong.title}`;
    this.client.request('copy_song_info', songText)
  };

  componentWillMount() {
    const previousChannel = localStorage.getItem('channel');
    this.props.initWs(previousChannel || 'JP');
    const previousVolume = parseInt(localStorage.getItem('volume'));
    if (previousVolume) {
      this.setState({volume: previousVolume});
    }
    const autoPlay = localStorage.getItem('autoPlay');
    if (autoPlay && autoPlay === 'true') {
      this.props.playPause();
    }
    const login = localStorage.getItem('login');
    const token = localStorage.getItem('token');
    if (token && login) {
      this.props.setUser(login, token);
      this.props.fetchFavourites(login, token);
    }
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    savedPrimaryColor && this.manageColor(savedPrimaryColor, 'primary');
    const savedTextColor = localStorage.getItem('textColor');
    savedTextColor && this.manageColor(savedTextColor, 'text');
    window.addEventListener('mousewheel', this.manageScroll);
  }

  componentDidMount() {
    this.player = document.getElementById('audio-player');
    this.player.volume = (this.state.volume / 100).toFixed(2);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.isPlaying !== newProps.isPlaying) {
      this.client.request('player_change', newProps.isPlaying);
    }
  }

  componentWillUnmount() {
    this.props.stopWs();
  }

  manageScroll = (e) => {
    const {player} = this;
    if (!player) {
      this.player = document.getElementById('audio-player');
      return;
    }
    let {volume} = this.state;
    if (e.wheelDelta >= 0 && volume <= 95) {
      volume += 5;
      player.volume = (volume / 100).toFixed(2);
      this.setState({volume});
      localStorage.setItem('volume', volume);
    }
    else if (e.wheelDelta < 0 && volume >= 5) {
      volume -= 5;
      player.volume = (volume / 100).toFixed(2);
      this.setState({volume});
      localStorage.setItem('volume', volume);
    }
  };

  switchChannel = () => {
    const {currentChannel} = this.props;
    this.props.initWs(currentChannel === 'JP' ? 'KR' : 'JP');
  };

  renderPlayButton() {
    const {isPlaying} = this.props;
    const playerClass = `btn-pause-play fa fa-${isPlaying ? 'pause' : 'play'}`;
    return (
      <div className={playerClass} onClick={this.props.playPause}/>
    )
  }

  renderAudioPlayer() {
    const {isPlaying, currentChannel} = this.props;
    let streamUrl = '';
    if (isPlaying) {
      streamUrl = currentChannel === 'JP' ? JP_STREAM : KR_STREAM;
    }
    return (
      <audio autoPlay id="audio-player" crossOrigin="anonymous" preload="auto" src={streamUrl}/>
    );
  }

  renderVolume() {
    const {volume} = this.state;
    return (
      <span className="player-volume">
        {volume}%
      </span>
    )
  }

  renderEventsOverlay() {
    // Need this to handle mouse events on one side of the song detail info and window drag on the other
    return (
      <div id="events-overlay">
        <div className="drag"/>
        <div className="mouse"/>
      </div>
    )
  }

  renderFavouriteStar() {
    const {favourites, currentSong, token} = this.props;
    if (!token) {
      return;
    }
    const isFav = favourites[currentSong.id];
    return (
      <div
        id="fav-star"
        className={isFav ? 'active' : ''}
        onClick={() => this.props.manageFavourite(currentSong.id, token, !isFav)}
      >
        <i className="fa fa-star"/>
      </div>
    );
  }

  renderSongInfo() {
    const {currentSong} = this.props;
    if (!currentSong) {
      return (
        <div className="song-info loading">
          <p className="loading">Loading...</p>
          {this.renderEventsOverlay()}
        </div>
      );
    }
    // TODO Some better overflow detection?
    return (
      <div className="song-info">
        {currentSong.subTitle.length > 25 ?
          <Marquee
            size="h3"
            text={currentSong.subTitle}
            time="12000"
          />
          :
          <h3>{currentSong.subTitle}</h3>
        }
        {currentSong.title.length > 17 ?
          <Marquee
            size="h2"
            text={currentSong.title}
            time="12000"
            color="white"
          />
          :
          <h2>{currentSong.title}</h2>
        }
        {currentSong.requester &&
        <h3 className="requested">Requested by: {currentSong.requester}</h3>
        }
        {this.renderFavouriteStar()}
        {this.renderEventsOverlay()}
      </div>
    )
  }

  render() {
    return (
      <div id="player-wrapper">
        <div id="player">
          {this.renderAudioPlayer()}
          {this.renderPlayButton()}
          {this.renderSongInfo()}
          {this.renderVolume()}
        </div>
        <Panel client={this.client}/>
      </div>
    );
  }
}

const mapDispatchToProps = {
  fetchFavourites,
  playPause,
  initWs,
  setUser,
  stopWs,
  manageFavourite,
  logOut,
};

function mapStateToProps(state) {
  return {
    isPlaying: state.player.isPlaying,
    currentSong: state.player.currentSong,
    currentChannel: state.player.channel,
    favourites: state.auth.favourites,
    token: state.auth.token,
    login: state.auth.login,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Player);
