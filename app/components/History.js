// @flow
import React, { Component } from 'react';
import Client from 'electron-rpc/client';
import { List } from 'react-virtualized';

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

export default class History extends Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      activeIndex: 0,
      search: '',
    };
    this.history = [];
    this.inputDebounce = null;

    this.client = new Client();
    this.client.on('clipboard_history', (error, body) => {
      console.log('received history', error, body.length);
      this.history = body;
      this.setState({ search: '', activeIndex: 0 });
      this.filterHistory('');
    });
    this.client.on('get_current_value', () => {
      const foundValue = this.state.history[this.state.activeIndex] || {
        value: '',
      };
      this.resetHistory();
      this.client.request('value_from_history', foundValue);
    });
    this.client.on('escape', this.resetHistory);
    this.client.on('up', () => this.handleUp(1));
    this.client.on('up_10', () => this.handleUp(10));
    this.client.on('down', () => this.handleDown(1));
    this.client.on('down_10', () => this.handleDown(10));
    this.client.on('write_input', (_error, char) => {
      console.log('write_input', _error, char);
      this.changeSearch(this.state.search + char);
    });
    this.client.on('backspace', () =>
      this.changeSearch(this.state.search.slice(0, -1))
    );
    this.client.on('clear', () => this.changeSearch());
    this.client.on('space', () => this.changeSearch(this.state.search + ' '));
    this.client.on('plus', () => this.changeSearch(this.state.search + '+'));
    this.client.on('enter', () => this.changeSearch(this.state.search + '\n'));
    this.client.on('clear_last', () =>
      this.changeSearch(
        this.state.search
          .split(' ')
          .slice(0, -1)
          .join(' ')
      )
    );
    this.client.on('paste_nth', (_error, body) => {
      console.log('paste?', _error);
      const position = parseInt(body) || 1;
      const valueFromHistory = this.state.history[position - 1];
      if (!valueFromHistory) {
        return;
      }
      this.client.request('value_from_history', valueFromHistory);
      this.changeSearch();
    });
  }

  resetHistory = () => {
    this.setState({ search: '', activeIndex: 0 });
    this.filterHistory('');
  };

  changeSearch = (newSearch: string = '') => {
    if (this.inputDebounce) {
      clearTimeout(this.inputDebounce);
    }
    this.setState({ search: newSearch, activeIndex: 0 });
    this.inputDebounce = setTimeout(() => {
      this.filterHistory(newSearch);
      this.inputDebounce = null;
    }, 200);
  };

  handleClick = (index: number) => {
    this.client.request(
      'value_from_history',
      this.state.history[index] || { value: '' }
    );
    this.changeSearch();
  };

  filterHistory = (search: string = '') => {
    if (!search) {
      return this.setState({ history: this.history });
    }
    const lowerCaseSearch = search.toLowerCase();
    const result = [];
    const historyLen = this.history.length;
    for (let i = 0; i < historyLen; i++) {
      if (this.history[i].value.toLowerCase().indexOf(lowerCaseSearch) !== -1) {
        result.push(this.history[i]);
      }
    }
    this.setState({ history: result });
  };

  handleUp = (amount: number) => {
    const { activeIndex } = this.state;
    if (activeIndex > 0) {
      let nextIndex = activeIndex - amount;
      if (nextIndex < 0) {
        nextIndex = 0;
      }
      this.setState({ activeIndex: nextIndex });
    }
  };

  handleDown = (amount: number) => {
    const { activeIndex, history } = this.state;
    const maxHistoryIndex = history.length - 1;
    if (activeIndex < maxHistoryIndex) {
      let nextIndex = activeIndex + amount;
      if (nextIndex > maxHistoryIndex) {
        nextIndex = maxHistoryIndex;
      }
      this.setState({ activeIndex: nextIndex });
    }
  };

  renderHistoryRow = ({ key, index, style }) => {
    return (
      <div
        className={`history-element ${
          this.state.activeIndex === index ? 'active' : ''
        }`}
        key={key}
        style={style}
        onClick={() => this.handleClick(index)}
      >
        {this.state.history[index].value}
        <span className="date">{this.state.history[index].date}</span>
        {index < 9 && <p className="order">{index + 1}</p>}
      </div>
    );
  };

  render() {
    const { search } = this.state;
    return (
      <div id="history-container">
        <p id="search-input" className={!search ? 'placeholder' : ''}>
          {search || 'Search...'}
        </p>
        <List
          width={670}
          height={510}
          rowCount={this.state.history.length}
          scrollToIndex={this.state.activeIndex}
          rowHeight={44}
          rowRenderer={this.renderHistoryRow}
        />
      </div>
    );
  }
}
