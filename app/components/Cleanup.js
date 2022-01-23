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

  handleFormChange = (e, name) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
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
        type="datetime-local"
        value={this.state.startDate}
        onChange={e => this.handleFormChange(e, 'startDate')}
        disabled={!this.state.checkboxPeriod}
      />
    );
  }

  submitCleanup = () => {
    this.setState({ loading: true });
    this.client.request('cleanup', { ...this.state });
  };

  render() {
    const {
      checkboxPeriod,
      checkboxBig,
      checkboxDuplicates,
      backup,
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
            <div className="input-checkbox">
              <input
                type="checkbox"
                value={checkboxPeriod}
                onChange={e => this.handleFormChange(e, 'checkboxPeriod')}
              />
              <h5>Cleanup by date</h5>
            </div>
            <p>Remove all entries that are older then:</p>
            <div>{this.renderDateSelect()}</div>
            <div className="mt-2 mb-2">OR</div>
            <div className="input-checkbox">
              <div className="flex-1">{this.renderPeriodInput()}</div>
              <div className="flex-1 ml-2">{this.renderPeriodSelect()}</div>
            </div>
          </div>

          <div className="flex-1">
            <div className="input-checkbox">
              <input
                type="checkbox"
                value={checkboxBig}
                onChange={e => this.handleFormChange(e, 'checkboxBig')}
              />
              <h5>Cleanup big entries</h5>
            </div>
            <p>
              Big entries (over 10000 characters) slow down search the most.
            </p>
          </div>

          <div className="flex-1">
            <div className="input-checkbox">
              <input
                type="checkbox"
                value={checkboxDuplicates}
                onChange={e => this.handleFormChange(e, 'checkboxDuplicates')}
              />
              <h5>Cleanup duplicates</h5>
            </div>
            <p>You usually don't need the same value stored multiple times.</p>
          </div>
        </div>

        <div className="input-checkbox mt-3">
          <input
            type="checkbox"
            value={backup}
            onChange={e => this.handleFormChange(e, 'backup')}
          />
          <h5>Create a backup</h5>
        </div>
        <button
          onClick={this.submitCleanup}
          disabled={loading || !anyCheckboxSelected}
          className="mt-2"
        >
          Cleanup
        </button>
      </div>
    );
  }
}
