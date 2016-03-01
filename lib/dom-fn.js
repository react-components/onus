var Link = require('onus-router/react/link');
var Redirect = require('onus-router/react/redirect');

module.exports = function createDomFn(conf, dom) {
  var transform = conf.DOM;

  return function(tag, props, children) {
    var self = this;
    var a = arguments;

    // Allow for dynamic preprocessing at the component level
    if (transform) {
      var out = DOM.apply(self, [dom].concat(a));
      if (out) return out;
    }

    if (tag === 'a' && props && props.to) a[0] = Link;
    if (tag === 'redirect' && props && props.to) a[0] = Redirect;
    if (tag === 'json') {
      if (process.env.NODE_ENV === 'production') {
        a = [false];
      } else {
        a = [
          'pre',
          props,
          JSON.stringify(children, null, '  ')
        ];
      }
    }

    return dom.apply(null, a);
  };
};
