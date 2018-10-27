import React, {Component} from 'react'

const tagStyle = {
  margin: '0 auto',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

class Marquee extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 10000,
      htmlTag: 'h3',
    };
  }

  componentWillMount() {
    const {size, time} = this.props;
    this.setState({
      crossTime: time || 10000,
      htmlTag: size || 'h3',
    });
  }

  render() {
    const {text} = this.props;
    const {
      crossTime,
    } = this.state;
    const textStyle = {
      display: 'inline-block',
      paddingLeft: '100%',
      animation: `marquee ${crossTime}ms linear infinite`,
    };

    return (
      <section id="marquee">
        <this.state.htmlTag style={tagStyle}>
          <span style={textStyle}>{text}</span>
        </this.state.htmlTag>
      </section>
    );
  }
}

export default Marquee;
