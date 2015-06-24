var React = require('react');

module.exports = {
  contextTypes: {  
    makePath: React.PropTypes.func.isRequired,
    makeHref: React.PropTypes.func.isRequired,
    transitionTo: React.PropTypes.func.isRequired,
    replaceWith: React.PropTypes.func.isRequired,
    goBack: React.PropTypes.func.isRequired
  },

  makePath: function(to, params, query) {
    params = this.encodeParams(params);
    query = this.encodeParams(query);
    return this.context.makePath(to, params, query);
  },

  makeHref: function (to, params, query) {
    params = this.encodeParams(params);
    query = this.encodeParams(query);
    return this.context.makeHref(to, params, query);
  },

  transitionTo: function (to, params, query) {
    params = this.encodeParams(params);
    query = this.encodeParams(query);
    return this.context.transitionTo(to, params, query);
  },

  replaceWith: function (to, params, query) {
    params = this.encodeParams(params);
    query = this.encodeParams(query);
    return this.context.replaceWith(to, params, query);
  },

  goBack: function (to, params, query) {
    return this.context.goBack();
  }
};