// @flow
import React, {PureComponent} from 'react';
import Client from 'electron-rpc/client';
import {ALPHABET, NUMBERS, SPECIAL_CHARS} from '../constants';
import {List} from 'react-virtualized';

type IProps = {};

type IState = {
  login: string[],
  search: string,
};

export default class History extends PureComponent<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      activeIndex: 0,
      search: '',
    };

    this.client = new Client();
    this.client.on('clipboard_history', (error, body) => {
      this.setState({history: body, activeIndex: 0, search: ''});
    });
    this.client.on('get_current_value', () => {
      const {activeIndex} = this.state;
      const filteredHistory = this.getHistory();
      this.client.request('value_from_history', filteredHistory[activeIndex] || {value: ''});
      this.setState({activeIndex: 0, search: ''});
    });
    this.client.on('up', () => this.handleUp(1));
    this.client.on('up_10', () => this.handleUp(10));
    this.client.on('down', () => this.handleDown(1));
    this.client.on('down_10', () => this.handleDown(10));
    ALPHABET.forEach((char) => {
      this.client.on(char, () => this.setState({
        search: this.state.search + char,
        activeIndex: 0,
      }));
      const charUpper = char.toUpperCase();
      this.client.on(charUpper, () => this.setState({
        search: this.state.search + charUpper,
        activeIndex: 0,
      }));
    });
    SPECIAL_CHARS.forEach((char) => {
      this.client.on(char, () => this.setState({
        search: this.state.search + char,
        activeIndex: 0,
      }));
    });
    NUMBERS.forEach((char) => {
      this.client.on(char, () => this.setState({
        search: this.state.search + char,
        activeIndex: 0,
      }));
    });
    this.client.on('backspace', () => this.setState({search: this.state.search.slice(0, -1), activeIndex: 0}));
    this.client.on('clear', () => this.setState({search: '', activeIndex: 0}));
    this.client.on('space', () => this.setState({search: this.state.search + ' ', activeIndex: 0}));
    this.client.on('plus', () => this.setState({search: this.state.search + '+', activeIndex: 0}));
    this.client.on('enter', () => this.setState({search: this.state.search + '\n', activeIndex: 0}));
    this.client.on('clear_last', () => this.setState({
      search: this.state.search.split(' ').slice(0, -1).join(' '),
      activeIndex: 0,
    }));
  }

  handleUp = (amount: number) => {
    const {activeIndex} = this.state;
    if (activeIndex > 0) {
      let nextIndex = activeIndex - amount;
      if (nextIndex < 0) {
        nextIndex = 0;
      }
      this.setState({activeIndex: nextIndex});
    }
  };

  handleDown = (amount: number) => {
    const {activeIndex, history} = this.state;
    const maxHistoryIndex = history.length - 1;
    if (activeIndex < maxHistoryIndex) {
      let nextIndex = activeIndex + amount;
      if (nextIndex > maxHistoryIndex) {
        nextIndex = maxHistoryIndex;
      }
      this.setState({activeIndex: nextIndex});
    }
  };

  renderHistoryRow = ({key, index, style}) => {
    return (
      <div
        className={`history-element ${this.state.activeIndex === index ? 'active' : ''}`}
        key={key}
        style={style}
      >
        {this.state.history[index].value}
        <span className="date">{this.state.history[index].date}</span>
      </div>
    );
  };

  getHistory = () => {
    const {history, search} = this.state;
    if (!search) {
      return history;
    }
    const lowerCaseSearch = search.toLowerCase();
    return history.filter((item) => item.value.toLowerCase().includes(lowerCaseSearch));
  };

  render() {
    const filteredHistory = this.getHistory();
    const {search} = this.state;
    return (
      <div className="history-container">
        <p className={`search-input ${!search ? 'placeholder' : ''}`}>
          {search || 'Search...'}
        </p>
        <List
          width={650}
          height={462}
          rowCount={this.state.history.length}
          scrollToIndex={this.state.activeIndex}
          rowHeight={41}
          rowRenderer={this.renderHistoryRow}
        />
      </div>
    );
  }
}
