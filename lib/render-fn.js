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
    var t = self._t;
    var _yield = self._yield;

    var props = self.props;
    var state = self.state;

    var decode = self.decodeParams || context.decodeParams || noop;
    var query = decode(self.getQuery());
    var params = decode(self.getParams());

    store.start();

    var args = [
      DOM,
      store.get,
      props,
      state,
      _yield,
      params,
      query,
      context.forms,
      t
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

    var isLoaded = store.stop();

    self.setIsLoaded(isLoaded);

    var loadedClassName = hasError || self.isLoaded() ?
          (module.hot ? (conf.loadedClassName || 'loaded') : self.loadedClassName) :
          (module.hot ? (conf.loadingClassName || 'loading') : self.loadingClassName);

    var componentClassName = module.hot ?
          (conf.componentClassName || conf.displayName + '-component'):
          self.componentClassName;

    var className = componentClassName + ' ' + loadedClassName;

    if (props.className) className += ' ' + props.className;

    var wrapperProps = {
      className: className
    };

    if (conf.mergeProps) {
      merge(wrapperProps, props);
    }

    return isElement(children) ?
      cloneWithProps(children, wrapperProps) :
      dom(self.rootTag || 'div', wrapperProps, children);
  };
}
