// @flow
import React, {Component} from 'react';
import {initWs} from '../actions/player';
import {connect} from 'react-redux';

type IProps = {
  initWs: () => void,
  currentChannel: string,
  client: Client,
};

class Panel extends Component<IProps> {
  switchChannel = () => {
    const {currentChannel} = this.props;
    this.props.initWs(currentChannel === 'JP' ? 'KR' : 'JP');
  };

  openSettings = () => this.props.client.request('open_settings');

  render() {
    const {currentChannel} = this.props;
    const isJpActive = currentChannel === 'JP' || !currentChannel;
    return (
      <div className="panel">
        <div className="panel-top">
          <div className="fa fa-gear" onClick={this.openSettings}/>
          <div className="fa fa-close" onClick={() => this.props.client.request('close_app')}/>
        </div>
        <div className="channel-switch">
          <span
            className={isJpActive ? 'active' : ''}
            onClick={isJpActive ? null : this.switchChannel}
          >
            JP
          </span>
          <span
            className={isJpActive ? '' : 'active'}
            onClick={isJpActive ? this.switchChannel : null}
          >
            KR
          </span>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = {
  initWs,
};

function mapStateToProps(state) {
  return {
    currentChannel: state.player.channel,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Panel);
