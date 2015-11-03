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

function castCreate(conds = {}, conf = {}) {
  var displayName = this.constructor.displayName;
  var _props = this.props;

  var sweep = context.sweep(this._castId);
  this.done = sweep.done;

  var props = [_props.id, _props.classes || {}, _props.castOptions || {}];
  var args = fnMem('genArgs', generateArgs)(displayName, conds, conf, props);
  return fnMem('wrap', generateCast)(args);
}

function generateArgs(displayName, conds, conf, [id, classes, castOptions]) {
  var options = Object.assign({}, DEFAULT_OPTIONS, conf)
  var castName = options.master && id ? id : displayName;
  var castOpts = Object.assign({}, options, castOptions);
  return [displayName, castName, conds, classes, castOpts];
}

function generateCast(args) {
  var [displayName, castName, statuses, classes, castOpts] = args;
  var withArgs = (n, fn) => fnMem(n, args, fn)
  var withStatuses = (string, cx) => fnMem('withStatuses', seedClasses)(string, statuses, cx || {});

  var funcs = withArgs('seedAll', function(displayName, castName, classes) {
    return {
      displayFn: withStatuses(displayName, classes),
      displayFnPlain: withStatuses(displayName),
      castFn: withStatuses(castName, classes)
    };
  })(displayName, castName, classes);

  return withArgs('allCreate', withArgs('create', function(n, sx) {
    var fns = [];
    if (castOpts.frozen) fns.push(funcs.displayFn);
    else if (castOpts.overwrite) fns.push(funcs.castFn);
    else {
      fns.push(funcs.castFn);
      if (castOpts.combination && castName !== displayName)
        fns.push(funcs.displayFnPlain);
    }

    return withArgs('render', renderClasses)(fns, n, sx);
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

  return fnMem('seedSingle', [base, statuses, classes], function(className, classStatuses) {
    if (classes[className]) className = classes[className];

    var isString = typeof className === 'string';
    var isSolo = isString && className.charAt(0) === '#';
    var baseClassName = isString
          ? className.replace(/(&|#)/g, base)
          : base + '';

    if (classes[baseClassName]) baseClassName = classes[baseClassName];

    var allStatuses = classStatuses
          ? fnMem('add', addStatuses)(classStatuses, rootStatuses)
          : rootStatuses;

    baseClassName = baseClassName.replace(/&/g, base);

    var statusClasses = allStatuses.length && !isSolo
          ? baseClassName + allStatuses.join(' ' + baseClassName)
          : '';

    var statusString = fnMem('replace', replaceClasses)(base, classes, statusClasses);

    // if (isSolo) debugger
    return `${baseClassName} ${statusString}`.trim();
  });
}

function replaceClasses(base, classes, statusString) {
  var str = statusString + '';
  for (var c in classes) {
    var val = classes[c];
    var re = [c];
    if (~c.indexOf('&')) re.push(c.replace('&', base));
    var find = new RegExp(re.join('|'))
    var replace = val.replace('&', base);
    str = str.replace(find, replace);
  }
  return str.replace(/&/g, base);
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
  if (!fn) {
    fn = rootArgs;
    rootArgs = [];
  }

  var rootKey = JSON.stringify([name, rootArgs]);
  var key = JSON.stringify(['mem', name, rootArgs]);
  if (cache[key]) return cache[key];

  var sweep = context.sweep(this._castId);

  var out = function() {
    var args = [].slice.call(arguments);
    var key = rootKey + JSON.stringify(args);

    if (cache[key] !== undefined) return cache[key];
    sweep.count(key);

    var res = fn.apply(null, args);
    cache[key] = res;
    return res;
  };

  cache[key] = out;
  return out;
}
