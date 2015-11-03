/**
 * Module dependencies
 */

var merge = require('utils-merge');
var Context = require('reference-count');

/**
 * Mixin default options
 */

var DEFAULT_OPTIONS = {
  combination: true,
  master: true,
  overwrite: false,
  frozen: false,
};

var castId = 0;
var cache = {};
var context = new Context();
var fnMem;

context.on('garbage', function(key) {
  delete cache[key];
});

module.exports = {
  castCreate: castCreate,
  componentWillMount: function() {
    this._castId = castId++;
    fnMem = memoize.bind(this);
  },
  componentWillUnmount: function() {
    context.destroy(this._castId);
  }
};

function castCreate(statuses, conf) {
  statuses = statuses || {};
  conf = conf || {};

  var displayName = this.constructor.displayName;
  var sweep = context.sweep(this._castId);

  this.done = sweep.done;

  var props = this.props;
  var classes = props.classes || {};
  var options = merge(DEFAULT_OPTIONS, conf);
  var castName = options.master && props.id ? props.id : displayName;

  var castOpts = Object.assign({}, DEFAULT_OPTIONS, conf, props.castOptions || {});
  var cachedArgs = [displayName, castName, statuses, classes, castOpts];
  var withCachedArgs = (n, fn) => fnMem(n, cachedArgs, fn)
  var withStatuses = (string, cx) => fnMem('seed', seedClasses)(string, statuses, cx || {});

  var funcs = withCachedArgs('seedAll', function(displayName, castName, classes) {
    return {
      displayFn: withStatuses(displayName, classes),
      displayFnPlain: withStatuses(displayName),
      castFn: withStatuses(castName, classes)
    };
  })(displayName, castName, classes);

  return withCachedArgs('allCreate', withCachedArgs('create', function(n, sx) {
    var fns = [];
    if (castOpts.frozen) fns.push(funcs.displayFn);
    else if (castOpts.overwrite) fns.push(funcs.castFn);
    else {
      fns.push(funcs.castFn);
      if (castOpts.combination && castName !== displayName)
        fns.push(funcs.displayFnPlain);
    }

    return withCachedArgs('render', renderClasses)(fns, n, sx);
  }));
}

function renderClasses(fns, n, sx) {
  return fns.map(function(fn) {
    return fn(n, sx);
  }).join(' ');
}

function seedClasses(base, statuses, classes) {
  if (classes[base]) base = classes[base];

  var rootStatuses = fnMem('add', addStatuses)(statuses);

  return function(className, classStatuses) {
    if (classes[className]) className = classes[className];

    var isString = typeof className === 'string';
    var isSolo = isString && className.charAt(0) === '#';
    var baseClassName = isString
          ? className.replace(/^(&|#)/, base)
          : base + '';

    if (classes[baseClassName]) baseClassName = classes[baseClassName];

    var allStatuses = classStatuses
          ? fnMem('add', addStatuses)(classStatuses, rootStatuses)
          : rootStatuses;

    var statusClasses = allStatuses.length && !isSolo
          ? baseClassName + allStatuses.join(' ' + baseClassName)
          : '';

    return `${baseClassName} ${statusClasses}`.trim();
  };
}

function addStatuses(sx, arr) {
  var output = (arr || []).slice();
  for (var s in sx) {
    output.push('-' + appendStatus(sx[s], s));
  }
  return output;
}

function appendStatus(bool, str) {
  return 'is-' + (bool ? '' : 'not-') + str;
}

function memoize(name, rootArgs, fn){
  var sweep = context.sweep(this._castId);
  if (!fn) {
    fn = rootArgs;
    rootArgs = [];
  }

  var rootKey = JSON.stringify({name: rootArgs});

  return function() {
    var args = [].slice.call(arguments);
    var key = rootKey + JSON.stringify(args);

    if (cache[key] !== undefined) return cache[key];

    sweep.count(key);

    var res = fn.apply(null, args);
    cache[key] = res;
    return res;
  }
}
