// @flow
import React, {Component} from 'react';
import Client from 'electron-rpc/client';

export const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

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
    alphabet.forEach((char) => this.client.on(char, () => this.setState({
      search: this.state.search + char,
      activeIndex: 0,
    })));
    this.client.on('backspace', () => this.setState({search: this.state.search.slice(0, -1), activeIndex: 0}));
    this.client.on('clear', () => this.setState({search: '', activeIndex: 0}));
    this.client.on('clear_last', () => this.setState({
      search: this.state.search.split(' ').slice(0, -1).join(' '),
      activeIndex: 0,
    }));
  }

  scrollToIndex = (index) => {
    const target = document.getElementById(`h-${index - 1}`);
    if (target) {
      target.scrollIntoView(true, {behavior: 'smooth'});
    }
  };

  handleUp = () => {
    const {activeIndex} = this.state;
    if (activeIndex > 0) {
      this.setState({activeIndex: activeIndex - 1});
      this.scrollToIndex(activeIndex - 1);
    }
  };

  handleDown = () => {
    const {activeIndex} = this.state;
    if (activeIndex < this.state.history.length - 1) {
      this.setState({activeIndex: activeIndex + 1});
      this.scrollToIndex(activeIndex + 1);
    }
  };

  renderHistoryElement = (item, index) => {
    return (
      <div
        className={`history-element ${this.state.activeIndex === index ? 'active' : ''}`}
        key={index}
        id={`h-${index}`}
      >
        {item.value}
        <span className="date">{item.date}</span>
      </div>
    );
  };

  renderSearch = () => {
    return (
      <input id="search-input" onKeyDown={(e) => console.log(e.key)}/>
    );
  };

  render() {
    let {history, search} = this.state;
    if (search) {
      console.log(history);
      console.log(search);
      history = history.filter((item) => item.value.toLowerCase().includes(search.toLowerCase()));
    }

    return (
      <div className="history-container">
        <p>{search}</p>
        {this.renderSearch()}
        <div className="history-list">
          {history.map(this.renderHistoryElement)}
        </div>
      </div>
    );
  }
}
