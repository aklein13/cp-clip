// @flow
import React, { Component } from 'react';
import Client from 'electron-rpc/client';

type IProps = {};

type IState = { name: string };

export default class NewProfile extends Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = { name: '' };
    this.client = new Client();
  }

  handleFormChange = (value, name) => {
    value = typeof value === 'object' ? value.target.value : value;
    this.setState({ [name]: value });
  };

  renderNameInput() {
    return (
      <input
        placeholder="Profile name"
        autoFocus
        className="w-100"
        value={this.state.name}
        required
        onChange={e => this.handleFormChange(e, 'name')}
      />
    );
  }

  handleSubmit = () => {
    this.client.request('new_profile', { ...this.state });
  };

  render() {
    const { name } = this.state;

    return (
      <form id="new-profile" onSubmit={this.handleSubmit}>
        <h1 className="m-0 mb-3">Create a new profile</h1>
        <p className="mt-4 mb-3">Profile name:</p>
        <div className="w-100">{this.renderNameInput()}</div>
        <button disabled={!name} className="mt-3" type="submit">
          Create
        </button>
      </form>
    );
  }
}
