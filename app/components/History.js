// @flow
import React, {PureComponent} from 'react';
import Client from 'electron-rpc/client';
import {ALPHABET, NUMBERS, SPECIAL_CHARS} from '../constants';
import {List} from 'react-virtualized';

type IProps = {};

type ISearch = {
  value: string,
  date: string,
};

type IState = {
  activeIndex: number,
  history: ISearch[],
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
    this.history = [];

    this.client = new Client();
    this.client.on('clipboard_history', (error, body) => {
      this.history = body;
      this.changeSearch();
    });
    this.client.on('get_current_value', () => {
      this.client.request('value_from_history', this.state.history[this.state.activeIndex] || {value: ''});
      this.changeSearch();
    });
    this.client.on('up', () => this.handleUp(1));
    this.client.on('up_10', () => this.handleUp(10));
    this.client.on('down', () => this.handleDown(1));
    this.client.on('down_10', () => this.handleDown(10));
    ALPHABET.forEach((char) => {
      this.client.on(char, () => this.changeSearch(
        this.state.search + char));
      const charUpper = char.toUpperCase();
      this.client.on(charUpper, () => this.changeSearch(this.state.search + charUpper));
    });
    SPECIAL_CHARS.forEach((char) => {
      this.client.on(char, () => this.changeSearch(this.state.search + char));
    });
    NUMBERS.forEach((char) => {
      this.client.on(char, () => this.changeSearch(this.state.search + char));
    });
    this.client.on('backspace', () => this.changeSearch(this.state.search.slice(0, -1)));
    this.client.on('clear', () => this.changeSearch());
    this.client.on('space', () => this.changeSearch(this.state.search + ' '));
    this.client.on('plus', () => this.changeSearch(this.state.search + '+'));
    this.client.on('enter', () => this.changeSearch(this.state.search + '\n'));
    this.client.on('clear_last', () => this.changeSearch(this.state.search.split(' ').slice(0, -1).join(' ')));
  }

  changeSearch = (newSearch: string = '') => {
    this.setState({search: newSearch, activeIndex: 0});
    this.filterHistory(newSearch);
  };

  filterHistory = (search: string = '') => {
    if (!search) {
      return this.setState({history: this.history});
    }
    const lowerCaseSearch = search.toLowerCase();
    this.setState({history: this.history.filter((item) => item.value.toLowerCase().includes(lowerCaseSearch))});
  };

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

  render() {
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
