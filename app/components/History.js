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
      selectedProfile: '',
    };
    this.history = [];
    this.inputDebounce = null;
    this.input = React.createRef();
    this.list = React.createRef();

    this.client = new Client();
    this.client.on('reset', () => {
      this.resetFocusAndScroll();
      this.resetHistory();
    });
    this.client.on('clipboard_history', (error, body) => {
      this.setHistory(body);
      this.resetFocusAndScroll();
      this.resetHistory();
    });
    this.client.on('clipboard_history_new', (error, body) => {
      this.updateHistory(body);
      this.resetFocusAndScroll();
      this.resetHistory();
    });
    this.client.on('clipboard_history_replace', (error, body) => {
      this.setHistory(body);
      this.filterHistory(this.state.search, true);
    });
    this.client.on('get_current_value', () => {
      const foundValue = this.getCurrentValue();
      this.client.request('value_from_history', foundValue);
      this.resetHistory();
    });
    this.client.on('get_current_value_macro', (error, body) => {
      const foundValue = this.getCurrentValue();
      this.client.request('value_for_macro', {
        value: foundValue.value,
        number: body,
      });
    });
    this.client.on('delete_current_value', () => {
      this.client.request('delete_value', this.getCurrentValue());
    });
    this.client.on('escape', this.resetHistory);
    this.client.on('up', () => this.handleUp(1));
    this.client.on('up_10', () => this.handleUp(10));
    this.client.on('down', () => this.handleDown(1));
    this.client.on('down_10', () => this.handleDown(10));
    this.client.on('clear', () => this.changeSearch());
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
      const position = parseInt(body);
      const valueFromHistory = this.state.history[position - 1];
      if (!valueFromHistory) {
        return;
      }
      this.client.request('value_from_history', valueFromHistory);
      this.changeSearch();
    });
    this.client.on('selected_profile', (error, body) =>
      this.setState({ selectedProfile: body })
    );
  }

  resetFocusAndScroll = () => {
    this.focusSearch();
    this.list.current.scrollToPosition(0);
  };

  focusSearch = () => this.input.current.focus();

  setHistory = newHistory => {
    newHistory.forEach(item => (item.valueLower = item.value.toLowerCase()));
    this.history = newHistory;
  };

  updateHistory = newHistory => {
    this.history = [...newHistory, ...this.history];
  };

  getCurrentValue = () =>
    this.state.history[this.state.activeIndex] || {
      value: '',
    };

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

  filterHistory = (search: string = '', checkIndex: boolean = false) => {
    if (!search) {
      return this.setState({ history: this.history });
    }
    const lowerCaseSearch = search.toLowerCase();
    const result = [];
    const historyLen = this.history.length;
    for (let i = 0; i < historyLen; i++) {
      if (this.history[i].valueLower.indexOf(lowerCaseSearch) !== -1) {
        result.push(this.history[i]);
      }
    }
    this.setState({ history: result });
    if (checkIndex && !result[this.state.activeIndex]) {
      this.setState({ activeIndex: result.length - 1 });
    }
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

  handleInput = e => this.changeSearch(e.target.value);

  renderSelectedProfile = () => {
    const { selectedProfile } = this.state;
    return <div id="selected-profile">Profile: {selectedProfile}</div>;
  };

  render() {
    const { search } = this.state;
    return (
      <div id="history-container" onClick={this.focusSearch}>
        {this.renderSelectedProfile()}
        <input
          id="search-input"
          value={search}
          onChange={this.handleInput}
          ref={this.input}
          placeholder={'Search...'}
        />
        <List
          width={670}
          height={510}
          rowCount={this.state.history.length}
          scrollToIndex={this.state.activeIndex}
          rowHeight={44}
          rowRenderer={this.renderHistoryRow}
          ref={this.list}
        />
      </div>
    );
  }
}
