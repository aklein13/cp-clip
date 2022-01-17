// @flow
import React, { Component } from 'react';
import Client from 'electron-rpc/client';

type IProps = {};

type IState = {
  selectedPeriod: string,
  periodNumber: number,
  startDate: string,
};

const selectOptions = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];

export default class Cleanup extends Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      selectedPeriod: 'months',
      periodNumber: null,
      startDate: '',
    };
  }

  renderPeriodSelect() {
    return (
      <select
        value={this.state.selectedPeriod}
        onChange={e => this.handleFormChange(e, 'selectedPeriod')}
      >
        {selectOptions.map(option => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  handleFormChange = (e, name) => this.setState({ [name]: e.target.value });

  renderPeriodInput() {
    return (
      <input
        type="number"
        min={1}
        max={100}
        value={this.state.periodNumber}
        onChange={e => this.handleFormChange(e, 'periodNumber')}
      />
    );
  }

  renderDateSelect() {
    return (
      <input
        type="datetime-local"
        value={this.state.startDate}
        onChange={e => this.handleFormChange(e, 'startDate')}
      />
    );
  }

  cleanupPeriod = () => {};

  cleanupBigDuplicates = () => {};

  render() {
    return (
      <div id="cleanup">
        <h3>
          Your search might slow down over time, especially if you often copy
          big entries (over 10000 characters).
        </h3>
        <div id="cleanup-split" className="d-flex">
          <div className="flex-1">
            <h5>Cleanup by date</h5>
            <p>Remove all entries that are older then:</p>
            <div className="d-flex">
              <div className="flex-1 d-flex">
                <div className="flex-1">{this.renderPeriodInput()}</div>
                <div className="flex-1">{this.renderPeriodSelect()}</div>
              </div>
              <div className="flex-1">{this.renderDateSelect()}</div>
            </div>
            <button onClick={this.cleanupPeriod}>Cleanup</button>
          </div>
          <div className="flex-1">
            <h5>Cleanup big and duplicated entries</h5>
            <button onClick={this.cleanupBigDuplicates}>Cleanup</button>
          </div>
        </div>
      </div>
    );
  }
}
