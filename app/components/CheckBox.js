// @flow
import React, {Component} from 'react';

type IProps = {
  checked: boolean,
  onCheck: () => void,
};

export default class CheckBox extends Component<IProps> {
  render() {
    const {checked} = this.props;
    return (
      <div className="checkbox" onClick={this.props.onCheck}>
        {checked && <i className="fa fa-check"/>}
      </div>
    );
  }
}
