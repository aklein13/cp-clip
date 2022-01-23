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
      backup: false,
      startDate: '',
      checkboxPeriod: false,
      checkboxDuplicates: false,
      checkboxBig: false,
      loading: false,
    };
    this.client = new Client();
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

  submitCleanup = () => this.client.request('cleanup', { ...this.state });

  render() {
    return (
      <div id="cleanup">
        <h3>
          Your search might slow down over time, especially if you often copy
          big entries.
        </h3>
        <div id="cleanup-split" className="d-flex">
          <div className="flex-1">
            <div className="d-flex">
              <input
                type="checkbox"
                value={this.state.checkboxPeriod}
                onChange={e => this.handleFormChange(e, 'checkboxPeriod')}
              />
              <h5>Cleanup by date</h5>
            </div>
            <p>Remove all entries that are older then:</p>
            <div>{this.renderDateSelect()}</div>
            <div>OR</div>
            <div className="d-flex">
              <div className="flex-1">{this.renderPeriodInput()}</div>
              <div className="flex-1">{this.renderPeriodSelect()}</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="d-flex">
              <input
                type="checkbox"
                value={this.state.checkboxBig}
                onChange={e => this.handleFormChange(e, 'checkboxBig')}
              />
              <h5>Cleanup big entries</h5>
            </div>
            <p>Big entries (over 10000 characters) slow down the search.</p>
          </div>
          <div className="flex-1">
            <div className="d-flex">
              <input
                type="checkbox"
                value={this.state.checkboxDuplicates}
                onChange={e => this.handleFormChange(e, 'checkboxDuplicates')}
              />
              <h5>Cleanup duplicates</h5>
            </div>
            <p>You usually don't need the same value stored multiple times</p>
          </div>
        </div>
        <h5>
          <input
            type="checkbox"
            value={this.state.backup}
            onChange={e => this.handleFormChange(e, 'backup')}
          />
          Create backup
        </h5>
        <button onClick={this.submitCleanup}>Cleanup</button>
      </div>
    );
  }
}
