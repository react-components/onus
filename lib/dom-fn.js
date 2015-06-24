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

    // if (tag === 'form' && props.controlled !== false) return dom(Form(), props, slice.call(a, 2));
    // if ((tag === 'input' || tag === 'select' || tag === 'textarea') && props.type !== 'submit' && props.controlled !== false && props.name) {
    //   props.type = props.type || (tag !== 'input' ? tag : null);
    //   return dom(Input(), props, slice.call(a, 2));
    // }

    if (tag !== 'a' || !props || !props.to) return dom.apply(null, a);

    var params = props.params = (self.encodeParams || self.context.encodeParams || noop)(props.params);
    if (params) {
      props.activeClassName = props.activeClassName || 'is-active';
      return dom(Link, props, slice.call(a, 2));
    }
    delete props.to;
    return dom.apply(null, a);
  };
};

var _Form;
function Form() {
  return _Form || require('./form');
}

var _Input;
function Input() {
  return _Input || require('./input');
}
