/**
 * Slice
 */

var slice = Array.prototype.slice;

module.exports = function createDomFn(conf, dom, noop, Link) {
  var DOM = conf.DOM || function() {};

  return function(tag, props, children) {
    var self = this;
    var a = arguments;
    var out = DOM.apply(self, Array.prototype.concat.call([dom], a));
    if (out) return out;

    // for debugging
    if (tag === 'json') {
      return process.env.NODE_ENV === 'production' ?
        false :
        dom('pre', props, JSON.stringify(children, null, '  '));
    }

    var context = self.context, forms;
    if ((forms = context.forms)) {
      if (tag === 'form' && props && props.template) return dom(forms.Form, props, slice.call(a, 2));
      if (tag === 'input' && props && props.name && !props.unmanaged) return dom(forms.Input, props, slice.call(a, 2));
    }

    if (tag !== 'a' || !props || !props.to) return dom.apply(null, a);

    var params = props.params = (self.encodeParams || self.context.encodeParams || noop)(props.params);
    if  (params) return dom(Link, props, slice.call(a, 2));
    delete props.to;
    return dom.apply(null, a);
  }
}
