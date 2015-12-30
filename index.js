'use strict';

/**
 * Create an instance of `Parser` with
 * the given `string`, optionally passing
 * a `parent` name for namespacing methods
 *
 * ```js
 * var parser = new Parser('function foo(a, b, c){}');
 * ```
 * @param {String} `str`
 * @param {String} `parent`
 * @api public
 */

function Parser(str, parent) {
  this.string = str;
  this.parent = parent;
  this.fns = [];
}

/**
 * Convenience method for creating a property name
 * that is prefixed with the parent namespace, if defined.
 *
 * @param {String} `name`
 * @return {String}
 * @api public
 */

Parser.prototype.name = function(name) {
  return this.parent ? (this.parent + name) : '';
};

/**
 * Register a parser to use (in addition to those already
 * registered as default parsers) with the given `regex` and
 * function.
 *
 * ```js
 * var parser = new Parser('function foo(a, b, c){}');
 *   .use(/function\s*([\w$]+)\s*\(([^)]+)/, function(match) {
 *     return {
 *        name: match[1],
 *        params: matc(h[2] || '').split(/[, ]/)
 *     };
 *   })
 * ```
 * @param {RegExp} `regex`
 * @param {Function} `fn`
 * @return {Object} The instance for chaining
 * @api public
 */

Parser.prototype.use = function(regex, fn) {
  this.fns.push({regex: regex, fn: fn});
  return this;
};

/**
 * Parse the string passed to the constructor with
 * all registered parsers.
 *
 * @return {Object|Null}
 * @api public
 */

Parser.prototype.parse = function() {
  this.init();
  var len = this.fns.length;
  var i = -1;

  while (++i < len) {
    var parser = this.fns[i];
    var re = parser.regex;
    var fn = parser.fn;
    var match = re.exec(this.string);
    if (match) {
      var ctx = fn.call(this, match, this.parent);
      if (ctx) {
        this.value = ctx;
        return ctx;
      }
    }
  }
  return null;
};

Parser.prototype.init = function() {
  // module.exports method
  this.use(/^(module\.exports)\s*=\s*function\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'method',
      receiver: m[1],
      name: '',
      params: (m[2] || '').split(/[, ]+/),
      string: m[1] + '.' + m[2] + '()',
      original: m.input
    };
  });

  this.use(/^(module\.exports)\s*=\s*function\s([\w$]+)\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'function',
      subtype: 'expression',
      receiver: m[1],
      name: m[2],
      params: (m[3] || '').split(/[, ]+/),
      string: m[2] + '()',
      original: m.input
    };
  });

  // class, possibly exported by name or as a default
  this.use(/^\s*(export(\s+default)?\s+)?class\s+([\w$]+)(\s+extends\s+([\w$.]+(?:\(.*\))?))?\s*{/, function(m, parent) {
    return {
      type: 'class',
      ctor: m[3],
      name: m[3],
      extends: m[5],
      string: 'new ' + m[3] + '()'
    };
  });

  // class constructor
  this.use(/^\s*constructor\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'constructor',
      ctor: this.parent,
      name: 'constructor',
      params: (m[4] || '').split(/[, ]+/),
      string: this.name('.prototype.') + 'constructor()'
    };
  });

  // class method
  this.use(/^\s*(static)?\s*(\*)?\s*([\w$]+|\[.*\])\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'method',
      ctor: this.parent,
      name: m[2] + m[3],
      params: (m[4] || '').split(/[, ]+/),
      string: this.name(m[1] ? '.' : '.prototype.') + m[2] + m[3] + '()'
    };
  });

  // named function statement, possibly exported by name or as a default
  this.use(/^\s*(export(\s+default)?\s+)?function\s+([\w$]+)\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'function',
      subtype: 'statement',
      name: m[3],
      params: (m[4] || '').split(/[, ]+/),
      string: m[3] + '()'
    };
  });

  // anonymous function expression exported as a default
  this.use(/^\s*export\s+default\s+function\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'function',
      name: m[1], // undefined
      params: (m[4] || '').split(/[, ]+/),
      string: m[1] + '()'
    };
  });

  // function expression
  this.use(/^return\s+function(?:\s+([\w$]+))?\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'function',
      subtype: 'expression',
      name: m[1],
      params: (m[4] || '').split(/[, ]+/),
      string: m[1] + '()'
    };
  });

  // function expression
  this.use(/^\s*(?:const|let|var)\s+([\w$]+)\s*=\s*function\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'function',
      subtype: 'expression',
      name: m[1],
      params: (m[2] || '').split(/[, ]+/),
      string: (m[1] || '') + '()'
    };
  });

  // prototype method
  this.use(/^\s*([\w$.]+)\s*\.\s*prototype\s*\.\s*([\w$]+)\s*=\s*function\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'prototype method',
      category: 'method',
      ctor: m[1],
      name: m[2],
      params: (m[3] || '').split(/[, ]+/),
      string: m[1] + '.prototype.' + m[2] + '()'
    };
  });

  // prototype property
  this.use(/^\s*([\w$.]+)\s*\.\s*prototype\s*\.\s*([\w$]+)\s*=\s*([^\n;]+)/, function(m, parent) {
    return {
      type: 'prototype property',
      ctor: m[1],
      name: m[2],
      value: trim(m[3]),
      string: m[1] + '.prototype.' + m[2]
    };
  });

  // prototype property without assignment
  this.use(/^\s*([\w$]+)\s*\.\s*prototype\s*\.\s*([\w$]+)\s*/, function(m, parent) {
    return {
      type: 'prototype property',
      ctor: m[1],
      name: m[2],
      string: m[1] + '.prototype.' + m[2]
    };
  });

  // inline prototype
  this.use(/^\s*([\w$.]+)\s*\.\s*prototype\s*=\s*{/, function(m, parent) {
    return {
      type: 'prototype',
      ctor: m[1],
      name: m[1],
      string: m[1] + '.prototype'
    };
  });

  // Fat arrow function
  this.use(/^\s*\(*\s*([\w$.]+)\s*\)*\s*=>/, function(m, parent) {
    return {
      type: 'function',
      ctor: this.parent,
      name: m[1],
      string: this.name('.prototype.') + m[1] + '()'
    };
  });

  // inline method
  this.use(/^\s*([\w$.]+)\s*:\s*function\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'method',
      ctor: this.parent,
      name: m[1],
      string: this.name('.prototype.') + m[1] + '()'
    };
  });

  // inline property
  this.use(/^\s*([\w$.]+)\s*:\s*([^\n;]+)/, function(m, parent) {
    return {
      type: 'property',
      ctor: this.parent,
      name: m[1],
      value: trim(m[2]),
      string: this.name('.') + m[1]
    };
  });

  // inline getter/setter
  this.use(/^\s*(get|set)\s*([\w$.]+)\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'property',
      ctor: this.parent,
      name: m[2],
      string: this.name('.prototype.') + m[2]
    };
  });

  // method
  this.use(/^\s*([\w$.]+)\s*\.\s*([\w$]+)\s*=\s*function\s*\(([^)]+)/, function(m, parent) {
    return {
      type: 'method',
      receiver: m[1],
      name: m[2],
      params: (m[3] || '').split(/[, ]+/),
      string: m[1] + '.' + m[2] + '()'
    };
  });

  // property
  this.use(/^\s*([\w$.]+)\s*\.\s*([\w$]+)\s*=\s*([^\n;]+)/, function(m, parent) {
    return {
      type: 'property',
      receiver: m[1],
      name: m[2],
      value: trim(m[3]),
      string: m[1] + '.' + m[2]
    };
  });

  // declaration
  this.use(/^\s*(?:const|let|var)\s+([\w$]+)\s*=\s*([^\n;]+)/, function(m, parent) {
    return {
      type: 'declaration',
      name: m[1],
      value: trim(m[2]),
      string: m[1]
    };
  });
};

function trim(str) {
  return toString(str).trim();
}

function toString(str) {
  if (!str) return '';
  return str;
}

/**
 * Expose an instance of `Parser`
 */

module.exports = function(str, ctx, i) {
  var parser = new Parser(str, ctx, i);
  return parser.parse();
};

/**
 * Expose `Parser`
 */

module.exports.Parser = Parser;
