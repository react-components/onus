module.exports = {
  decodeParam: function(name) {
    var params = this.getParams();
    return this.context.decodeParams({value: params[name] || name}).value;
  },

  decodeParams: function(params) {
    return this.context.decodeParams(params);
  },

  encodeParam: function(value) {
    return this.context.encodeParams({value: value}).value;
  },

  encodeParams: function(params) {
    return this.context.encodeParams(params);
  }
};
