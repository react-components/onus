/**
 * Module dependencies
 */

var Onus = require('..');
var React = require('react');

/**
 * save React types
 */

var ReactObj = React.PropTypes.object;

module.exports = Onus({
  displayName: 'Form',
  componentWillMount: function() {
    var self = this
    var forms = self.context.forms;
    if (!forms) return;
    var form = self.form = forms.create({}, this.props.name);
    form.on('change', function() {
      self.forceUpdate();
    });
  },
  componentWillUnmount: function() {
    this.form && this.form.destroy();
  },
  componentWillReceiveProps: function(props) {
    this.form && this.form.update(props.template, props.name);
  },
  childContextTypes: {
    form: ReactObj
  },
  getChildContext: function() {
    return {
      form: this.form
    };
  },
  submit: function(fn) {
    var self = this;
    self.form && self.form.submit(fn)
  },
  onSubmit: function(evt) {
    var self = this;
    if (!self.form) return;
    evt.preventDefault();
    self.form && self.form.submit();
    self.props.onSubmit && self.props.onSubmit(evt, self.form);
  },
  onChange: function() {

  },
  render: function(DOM, $get, props, state, _yield) {
    return DOM('form', {
      controlled: false,
      onSubmit: this.onSubmit,
      onChange: this.onChange
    }, _yield('content', this.form), this.props.children);
  }
});
