/**
 * Module dependencies
 */

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

context.on('garbage', function(key) {
  delete cache[key];
});

module.exports = {
  castCreate: castCreate,
  componentWillMount: function() {
    this._castId = castId++;
  },
  componentWillUnmount: function() {
    context.destroy(this._castId);
  }
};

function castCreate(conds, conf) {
  conds = conds || {};
  conf = conf || {};

  var sweep = context.sweep(this._castId);
  this.done = function() {
    sweep.done();
  };

  var displayName = this.constructor.displayName;
  var props = this.props;

  var args = generateArgs(displayName, conds, conf, props.id, props.classes, props.castOptions);
  return generateCast.apply(null, args);
}

function generateArgs(displayName, conds, conf, id, classes, castOptions) {
  var options = Object.assign({}, DEFAULT_OPTIONS, conf)
  var castName = options.master && id ? id : displayName;
  var castOpts = Object.assign({}, options, castOptions);
  return [displayName, castName, conds || {}, classes || {}, castOpts || {}];
}

function generateCast(displayName, castName, statuses, classes, castOpts) {
  var funcs = {
    displayFn: seedClasses(displayName, statuses, classes),
    displayFnPlain: seedClasses(displayName, statuses, {}),
    castFn: seedClasses(castName, statuses, classes)
  };

  return function(n, sx) {
    var fns = [];
    if (castOpts.frozen) fns.push(funcs.displayFn);
    else if (castOpts.overwrite) fns.push(funcs.castFn);
    else {
      fns.push(funcs.castFn);
      if (castOpts.combination && castName !== displayName)
        fns.push(funcs.displayFnPlain);
    }

    return renderClasses(fns, n, sx);
  };
}

function renderClasses(fns, n, sx) {
  return fns.map(function(fn) {
    return fn(n, sx);
  }).join(' ');
}

function seedClasses(base, statuses, classes) {
  if (classes[base]) base = classes[base];

  var rootStatuses = addStatuses(statuses);

  return function(className, classStatuses) {
    if (classes[className]) className = classes[className];

    var isString = typeof className === 'string';
    var isSolo = isString && className.charAt(0) === '#';
    var baseClassName = isString
          ? className.replace(/(&|#)/g, base)
          : base + '';

    if (classes[baseClassName]) baseClassName = classes[baseClassName];

    var allStatuses = classStatuses
          ? addStatuses(classStatuses, rootStatuses)
          : rootStatuses;

    baseClassName = baseClassName.replace(/&/g, base);

    var statusClasses = allStatuses.length && !isSolo
          ? baseClassName + allStatuses.join(' ' + baseClassName)
          : '';

    var statusString = replaceClasses(base, classes, statusClasses);

    return `${baseClassName} ${statusString}`.trim();
  };
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
