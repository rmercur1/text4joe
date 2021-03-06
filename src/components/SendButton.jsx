import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import { StyleSheet, css } from 'aphrodite'

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: 'inline-block',
    marginLeft: 20
  }
})
class SendButton extends Component {
  state = {
    clickStepIndex: 0
  }

  clickStepLabels = () => this.props.threeClickEnabled ? ['Recipient ok?', 'Message ok?', 'Send message'] : ['Send']

  handleTouchTap = () => {
    const { clickStepIndex } = this.state
    const { onFinalTouchTap } = this.props

    if (clickStepIndex < (this.clickStepLabels().length - 1)) {
      this.setState({
        clickStepIndex: clickStepIndex + 1
      })
    } else {
      onFinalTouchTap()
    }
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <RaisedButton
          onTouchTap={this.handleTouchTap}
          disabled={this.props.disabled}
          label={this.clickStepLabels()[this.state.clickStepIndex]}
          primary
        />
      </div>
    )
  }
}

SendButton.propTypes = {
  threeClickEnabled: React.PropTypes.boolean,
  onFinalTouchTap: React.PropTypes.function,
  disabled: React.PropTypes.boolean
}

export default SendButton
