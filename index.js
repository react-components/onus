/**
 * Module dependencies
 */

var React = require('react');
var dom = React.createElement;
var merge = require('utils-merge');

/**
 * Load the function initializers
 */

var createRenderFn = require('./lib/render-fn');
var createDomFn = require('./lib/dom-fn');
var loadingStatus = require('./lib/loading-status');

/**
 * noop
 */

function noop(a) { return a; }

/**
 * save React types
 */

var PropTypes = React.PropTypes;
var ReactObj = PropTypes.object;
var ReactFunc = PropTypes.func;

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

var nextComponentId = 0;

/**
 * Create an Onus component
 */

function createComponent(conf, filename) {
  // create a mixin with the defined lifecycle events
  var events = {};
  for (var i = 0, event; i < lifecycle.length; i++) {
    event = lifecycle[i];
    if (conf[event]) events[event] = conf[event];
  }

  // load the standard mixins
  var mixins = [
    loadingStatus,
    events
  ].concat(conf.mixins || []);

  var component = {
    displayName: conf.displayName,

    mixins: mixins,

    contextTypes: merge({
      canary: ReactObj,
      errorHandler: ReactFunc,
      events: ReactFunc,
      format: ReactObj,
      forms: ReactObj,
      router: ReactObj,
      store: ReactObj.isRequired,
      translate: ReactObj,
    }, conf.contextTypes),

    __onus_onStoreChange: function(href) {
      var self = this;
      self.isMounted() && self.forceUpdate();
    },

    componentWillMount: function() {
      var self = this;
      var context = self.context;

      var store = self._store = context.store.context(self.__onus_onStoreChange);
      if (context.store.getAsync) self.getAsync = context.store.getAsync.bind(context.store);
      self._t = self._t || context.translate ? context.translate.context(store) : noop;
      if (context.canary) self.canary = context.canary.context(self.__onus_onStoreChange);

      Object.defineProperties(self, {
        forms: {
          get: function() {
            return context.forms;
          }
        },
        router: {
          get: function() {
            return context.router;
          }
        },
        location: {
          get: function() {
            return context.router.location;
          }
        }
      });

      self._error_handler = self._error_handler || context.errorHandler || noop;

      if (module.hot) {
        self.__onusComponentId = nextComponentId++;
        (conf.__subs = conf.__subs || {})[self.__onusComponentId] = function() {
          self.forceUpdate();
        };
      }

      if (conf.componentWillMount) conf.componentWillMount.call(this);
    },

    componentWillUnmount: function() {
      var self = this;
      if (module.hot) delete conf.__subs[self.__onusComponentId];
      self._store.destroy();
      if (self.canary) self.canary.destroy();
    },

    statics: conf.statics,

    _DOM: conf._DOM || createDomFn(conf, dom),

    _yield: conf._yield || _yield,

    _render: conf._render || createRenderFn(conf, dom),

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
      if (err) console.error(err.stack || err);
      return false;
    },

    equalPairs: function() {
      var a = arguments;
      for (var i = 0; i < a.length; i+=2) {
        if (!this.isEqual(a[i], a[i + 1])) return false;
      }
      return true;
    },

    isEqual: function(a, b) {
      var typeA = typeof a;
      var typeB = typeof b
      // the types have changed
      if (typeA !== typeB) return false;
      // scalars
      if (a === b) return true;
      // defined values
      if (a && b) {
        if (typeof a.__hash !== 'undefined' && typeof b.__hash !== 'undefined') return a.__hash === b.__hash;
        if (typeof a.hashCode === 'function' && typeof b.hashCode === 'function') return a.hashCode() === b.hashCode();
      }
      // TODO add other comparisons
      return false;
    },

    loadedClassName: conf.loadedClassName || 'is-loaded',

    loadingClassName: conf.loadingClassName || 'is-loading',

    componentClassName: conf.componentClassName || conf.displayName + '-component',

    render: function() {
      // TODO see if we can cache this
      // TODO detect any recursive re-renders
      if (process.env.NODE_ENV === 'development') {
        if (typeof window !== 'undefined') {
          onus.renderCounts[conf.displayName] |= 0;
          onus.renderCounts[conf.displayName]++;
          onus.renderTotal++;
        }
      }

      return this._render();
    }
  };

  if (conf.initialState) component.getInitialState = function() {
    var state = {};
    for (var k in conf.initialState) {
      state[k] = conf.initialState[k];
    }
    return state;
  };

  for (var k in conf) {
    if (component[k] || !conf.hasOwnProperty(k) || events[k]) continue;
    component[k] = conf[k];
  }

  return React.createClass(component);
}

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    window.onus = {
      renderCounts: {},
      renderTotal: 0,
      reset: function() {
        onus.renderCounts = {};
        onus.renderTotal = 0;
      }
    };
  }
}

/**
 * Wrap the yield function
 */

function _yield(name, context) {
  var prop = this.props[name || 'children'];
  if (typeof prop !== 'function') return prop;

  var args = Array.prototype.slice.call(arguments, 2);
  return prop.apply(context, args);
}
