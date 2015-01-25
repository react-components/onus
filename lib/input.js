/**
 * Module dependencies
 */

var Onus = require('..');
var React = require('react');
var cloneWithProps = require('react-clonewithprops');

/**
 * save React types
 */

var ReactObj = React.PropTypes.object;

module.exports = Onus({
  displayName: 'Input',
  getInitialState: function() {
    var forms = (this.context.forms || {}).global || {};
    return {
      form: forms[this.props.form] || this.context.form
    };
  },
  componentWillReceiveProps: function(props) {
    var forms = (this.context.forms || {}).global || {};
    this.setState({
      form: forms[props.form] || this.context.form
    });
  },
  contextTypes: {
    form: ReactObj
  },
  onChange: function() {
    this.forceUpdate();
  },
  getInput: function() {
    var self = this;
    if (self._input) return self._input;
    var form = self.state.form;
    var props = self.props;
    if (!form) return null;
    var input = form.inputs[props.name];
    if (input) input.on('change', this.onChange);
    return self._input = input;
  },
  render: function(DOM, $get) {
    var props = this.props
    var input = this.getInput();
    if (!input) return false;

    var type = props.type || $get(['type'], input);

    var defaultProps = {
      controlled: false,
      value: input.value,
      type: type,
      placeholder: $get(['placeholder'], input),
      required: $get(['required'], input),
      disabled: $get(['disabled'], input),
      disabled: $get(['disabled'], input),
      onChange: function(evt) {
        input.set(evt.target.value, evt.target.checked);
      }
    };

    var tag = 'input';
    if (type === 'select') tag = type;
    if (type === 'textarea') tag = type;

    return cloneWithProps(DOM(tag, defaultProps, props.children), props);
  }
});
