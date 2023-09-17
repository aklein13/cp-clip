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
      threshold: 10000,
    };
    this.client = new Client();
  }

  renderPeriodSelect() {
    return (
      <select
        value={this.state.selectedPeriod}
        onChange={e => this.handleFormChange(e, 'selectedPeriod')}
        disabled={!this.state.checkboxPeriod}
      >
        {selectOptions.map(option => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  handleFormChange = (value, name) => {
    value = typeof value === 'object' ? value.target.value : value;
    this.setState({ [name]: value });
  };

  renderPeriodInput() {
    return (
      <input
        type="number"
        min={1}
        max={100}
        value={this.state.periodNumber}
        onChange={e => this.handleFormChange(e, 'periodNumber')}
        disabled={!this.state.checkboxPeriod}
      />
    );
  }

  renderDateSelect() {
    return (
      <input
        type="date"
        value={this.state.startDate}
        onChange={e => this.handleFormChange(e, 'startDate')}
        disabled={!this.state.checkboxPeriod}
      />
    );
  }

  renderThresholdInput() {
    return (
      <input
        type='number'
        min={0}
        value={this.state.threshold}
        onChange={e => this.handleFormChange(e, 'threshold')}
        disabled={!this.state.checkboxBig}
      />
    );
  }

  submitCleanup = () => {
    this.setState({ loading: true });
    this.client.request('cleanup', { ...this.state });
  };

  renderCheckbox = (key, label) => (
    <div
      className="input-checkbox"
      onClick={() => this.handleFormChange(!this.state[key], key)}
    >
      <input type="checkbox" checked={this.state[key]} />
      <h5>{label}</h5>
    </div>
  );

  render() {
    const {
      checkboxPeriod,
      checkboxBig,
      checkboxDuplicates,
      loading,
      periodNumber,
      startDate,
    } = this.state;
    const anyCheckboxSelected =
      (checkboxPeriod && (startDate || periodNumber)) ||
      checkboxBig ||
      checkboxDuplicates;

    return (
      <div id="cleanup">
        <div id="cleanup-split" className="d-flex">
          <div className="flex-1">
            {this.renderCheckbox('checkboxPeriod', 'Cleanup by date')}
            <p>Remove all entries that are older then:</p>
            <div>{this.renderDateSelect()}</div>
            <div className="mt-2 mb-2">OR</div>
            <div className="input-checkbox">
              <div className="flex-1">{this.renderPeriodInput()}</div>
              <div className="flex-1 ml-2">{this.renderPeriodSelect()}</div>
            </div>
          </div>

          <div className="flex-1">
            {this.renderCheckbox('checkboxBig', 'Cleanup big entries')}
            <p>
              Big entries (over 10000 characters) slow down search the most.
            </p>
            <p>Remove entries bigger then:</p>
            <div>{this.renderThresholdInput()}</div>
          </div>

          <div className="flex-1">
            {this.renderCheckbox('checkboxDuplicates', 'Cleanup duplicates')}
            <p>
              You usually don't need the same value stored multiple times.
              <br />
              Only the newest entries will be kept.
            </p>
          </div>
        </div>

        <div className="mt-3">
          {this.renderCheckbox('backup', 'Create a backup')}
        </div>
        {loading ? (
          <div className="loader mt-2" />
        ) : (
          <button onClick={this.submitCleanup} disabled={!anyCheckboxSelected}>
            Cleanup
          </button>
        )}
      </div>
    );
  }
}
