// @flow
import React, {Component} from 'react';
import Client from 'electron-rpc/client';

type IProps = {};

type IState = {
  login: string[],
  search: string,
};

export default class Settings extends Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      activeIndex: 0,
      search: '',
    };
    this.client = new Client();
    this.client.on('clipboard_history', (error, body) => {
      this.setState({history: body, activeIndex: 0});
    });
    this.client.on('get_current_value', () => {
      const {activeIndex} = this.state;
      this.client.request('value_from_history', this.state.history[activeIndex] || '');
    });
    this.client.on('up', this.handleUp);
    this.client.on('down', this.handleDown);
  }

  componentDidMount() {
    document.getElementById('search-input').focus();
  }

  handleUp = () => {
    const {activeIndex} = this.state;
    if (activeIndex > 0) {
      this.setState({activeIndex: activeIndex - 1});
    }
  };

  handleDown = () => {
    const {activeIndex} = this.state;
    if (activeIndex < this.state.history.length - 1) {
      this.setState({activeIndex: activeIndex + 1});
    }
  };

  renderHistoryElement = (value, index) => {
    return (
      <div
        className={`history-element ${this.state.activeIndex === index ? 'active' : ''}`}
        key={index}
      >
        {value}
      </div>
    );
  };

  renderSearch = () => {
    return (
      <input id="search-input" onKeyDown={(e) => console.log(e.key)}/>
    );
  };

  render() {
    const {history} = this.state;
    console.log('state', this.state);
    return (
      <div className="settings-container">
        <h3>Pre-alpha very early access ediszyn</h3>
        {this.renderSearch()}
        {history.map(this.renderHistoryElement)}
      </div>
    );
  }
}
