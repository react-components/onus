/**
 * Module dependencies
 */

var React = require('react');
var dom = React.createElement;
var Router = require('react-router');
var RouteHandler = Router.RouteHandler;
var Link = Router.Link;
var LoadingStatusMixin = require('react-loading-status-mixin');
var merge = require('utils-merge');
var raf = require('raf');

/**
 * Load the function initializers
 */

var createRenderFn = require('./lib/render-fn');
var createDomFn = require('./lib/dom-fn');

/**
 * noop
 */

function noop(a) { return a; }

/**
 * save React types
 */

var PropTypes = React.PropTypes;
var ReactObj = PropTypes.object;
var ReactFunc = PropTypes.func

/**
 * expose component creation
 */

exports['default'] = exports = module.exports = createComponent;

/**
 * Lifecylce methods
 */

var lifecycle = [
  'componentDidMount',
  'componentWillReceiveProps',
  'shouldComponentUpdate',
  'componentWillUpdate',
  'componentDidUpdate',
  'componentWillUnmount'
];

/**
 * Create an Onus component
 */

function createComponent(conf, filename) {
  // TODO handle module.hot

  // create a mixin with the defined lifecycle events
  var events = {};
  for (var i = 0, event; i < lifecycle.length; i++) {
    event = lifecycle[i];
    if (conf[event]) events[event] = conf[event];
  }

  // load the standard mixins
  var mixins = [
    Router.State,
    Router.Navigation,
    LoadingStatusMixin,
    events
  ].concat(conf.mixins || []);

  var component = {
    displayName: conf.displayName,

    mixins: mixins,

    contextTypes: merge({
      store: ReactObj.isRequired,
      forms: ReactObj,
      translate: ReactObj,
      errorHandler: ReactFunc,
      encodeParams: ReactFunc,
      decodeParams: ReactFunc
    }, conf.contextTypes),

    __onus_onStoreChange: function() {
      var self = this;
      self.isMounted() && self.forceUpdate();
    },

    componentWillMount: function() {
      var self = this;
      var context = self.context;

      var store = self._store = context.store.context(self.__onus_onStoreChange);
      self._t = self._t || context.translate ? context.translate.context(store) : noop;

      self._error_handler = self._error_handler || context.errorHandler || noop;

      if (module.hot) {
        (conf.__subs = conf.__subs || {})[this._rootNodeID] = function() {
          self.forceUpdate();
        };
      }

      if (conf.componentWillMount) conf.componentWillMount.call(this);
    },

    componentWillUnmount: function() {
      var self = this;
      if (module.hot) delete conf.__subs[self._rootNodeID];
      self._store.destroy();
    },

    statics: conf.statics,

    _DOM: conf._DOM || createDomFn(conf, dom, noop, Link),

    _yield: conf._yield || _yield,

    _render: conf._render || createRenderFn(conf, dom, noop),

    // TODO
    _error: function(DOM,
      get,
      props,
      state,
      _yield,
      params,
      query,
      forms,
      t,
      err) {
      console.error(err.stack || err);
    },

    loadedClassName: conf.loadedClassName || 'loaded',

    loadingClassName: conf.loadingClassName || 'loading',

    componentClassName: conf.componentClassName || conf.displayName + '-component',

    render: function() {
      // TODO see if we can cache this
      // TODO detect any recursive re-renders
      return this._render();
    }
  };

  if (conf.initialState) component.getInitialState = function() {
    return conf.initialState;
  };

  for (var k in conf) {
    if (component[k] || !conf.hasOwnProperty(k) || events[k]) continue;
    component[k] = conf[k];
  }

  return React.createClass(component);
}

/**
 * Wrap the yield function
 */

function _yield(name) {
  var props = this.props;

  if (!name) return props.children ? props.children : dom(RouteHandler);

  var prop = props[name];
  if (typeof prop !== 'function') return prop;
  var args = Array.prototype.slice.call(arguments, 1);
  return prop.apply(this._store.get, args);
}
