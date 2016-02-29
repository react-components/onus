/**
 * Module dependencies
 */

var isElement = require('react').isValidElement;
var cloneWithProps = require('react-clonewithprops');
var merge = require('utils-merge');

/**
 * Create a render function
 *
 * @param {Object} conf
 * @param {Function} dom
 * @param {Function} noop
 * @param {Function?} hotReload
 * @return {Function}
 */

module.exports = function createRenderFn(conf, dom, noop) {
  var _render = conf.render;

  return function render() {
    var self = this;
    var context = self.context;
    var DOM = self._DOM;
    var store = self._store;
    var canary = self.canary;
    var t = self._t;
    var _yield = self._yield;

    var props = self.props;
    var state = self.state;

    var decode = self.decodeParams || context.decodeParams || noop;
    var query = decode(self.getQuery());
    var params = decode(self.getParams());

    store.start();
    if (canary) canary.start();

    var args = [
      DOM,
      store.get,
      props,
      state,
      _yield,
      params,
      query,
      context.forms,
      t,
      canary
    ];

    var children, hasError;
    try {
      children = _render.apply(self, args);
    } catch (err) {
      console.error(err.stack || err);
      self._error_handler(err);
      hasError = true;
      children = self._error.apply(self, args.concat([err]));
    }

    if (canary) canary.stop();
    var isLoaded = store.stop();

    if (this.done) this.done();

    self.setIsLoaded(isLoaded);

    var loadedClassName = hasError || self.isLoaded() ?
          (module.hot ? (conf.loadedClassName || 'is-loaded') : self.loadedClassName) :
          (module.hot ? (conf.loadingClassName || 'is-loading') : self.loadingClassName);

    var componentClassName = module.hot ?
          (conf.componentClassName || conf.displayName + '-component'):
          self.componentClassName;

    var wrapperProps = {};
    if (conf.mergeProps) {
      merge(wrapperProps, props);
      delete wrapperProps.children;
    }

    var className = componentClassName + ' ' + loadedClassName;
    if (wrapperProps.className) wrapperProps.className += ' ' + className;
    else wrapperProps.className = className;

    return isElement(children) ?
      cloneWithProps(children, wrapperProps) :
      dom(self.rootTag || 'div', wrapperProps, children);
  };
};
