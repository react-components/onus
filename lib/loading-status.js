module.exports = {
  isLoaded: function() {
    return this.state.isLoaded;
  },

  getInitialState: function() {
    return {
      isLoaded: true
    };
  },

  setIsLoaded: function(newVal) {
    var self = this;
    var state = self.state
    var prev = state.isLoaded;
    if (newVal !== prev) setTimeout(function() {
      if (self.isMounted()) self.setState({isLoaded: newVal});
    });
  }
};