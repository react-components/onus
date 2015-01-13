/**
 * Create a render function
 *
 * @param {Object} conf
 * @param {Function} dom
 * @param {Function} noop
 * @param {Function?} hotReload
 * @return {Function}
 */

module.exports = function createRenderFn(conf, dom, noop, hotReload) {
  var render = module.hot ? hotReload(conf, 'render') : conf.render;

  return function() {
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

    var get = store.start(self._nodeID);

    var args = [
      DOM,
      get,
      t,
      props,
      state,
      params,
      query,
      context.forms
    ];

    var children, hasError;
    try {
      children = render.apply(self, args);
    } catch (err) {
      self._error_handler(err);
      hasError = true;
      children = self._error.apply(self, args.concat([err]));
    }

    var isLoaded = get.stop();

    self.setIsLoaded(isLoaded);

    var loadedClassName = hasError || isLoaded ?
          (module.hot ? (conf.loadedClassName || 'loaded') : self.loadedClassName) :
          (module.hot ? (conf.loadingClassName || 'loading') : self.loadingClassName);

    var componentClassName = module.hot ?
          (conf.componentClassName || conf.displayName + '-component'):
          self.componentClassName;

    var className = componentClassName + ' ' + loadedClassName;

    if (props.className) className += ' ' + props.className;

    return dom('div', {
      className: className
    }, children);
  };
}
