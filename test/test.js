/*!
 * parse-code-context <https://github.com/jonschlinkert/parse-code-context>
 *
 * Copyright (c) 2014-present Jon Schlinkert.
 * Some of the regex was originally sourced from https://github.com/visionmedia/dox
 * Licensed under the MIT License
 */

'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Parser } = require('..');
let parser;

function fixtures(fp, cb) {
  return fs.readFile(path.join('test/fixtures', fp), 'utf8', cb);
}

describe('parse-code-context', () => {
  beforeEach(() => (parser = new Parser()));

  describe('constructor:', () => {
    it('should create an instance of Parser', () => {
      assert(parser instanceof Parser);
    });

    it('should register parsers for matching', () => {
      parser.capture(/foo\(([^)]+)\)/, m => {
        return {
          params: m[1].split(/[,\s]+/)
        };
      });

      const ctx = parser.parse('foo(a, b, c)');
      assert.deepEqual(ctx.params, ['a', 'b', 'c']);
    });

    it('should support passing the parent name on the constructor', () => {
      const ctx = parser.parse('enabled: true;\nasdf', 'Foo');
      assert.equal(ctx.ctor, 'Foo');
      assert.equal(ctx.type, 'property');
      assert.equal(ctx.name, 'enabled');
      assert.equal(ctx.string, 'Foo.enabled');
    });
  });

  describe('parse context:', () => {
    it('should return null when no matches are found', () => {
      let ctx = parser.parse('foo');
      assert.equal(ctx, null);
    });

    it('should extract function statements', () => {
      let ctx = parser.parse('function app(a, b, c) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'statement');
      assert.equal(ctx.name, 'app');
      assert.deepEqual(ctx.params, [ 'a', 'b', 'c' ]);
    });

    it('should extract function statements', () => {
      let ctx = parser.parse('function app(a, b, c) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'statement');
      assert.equal(ctx.name, 'app');
      assert.deepEqual(ctx.params, [ 'a', 'b', 'c' ]);
    });

    it('should extract function expressions', () => {
      let ctx = parser.parse('let app = function(a, b, c) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'expression');
      assert.equal(ctx.name, 'app');
      assert.deepEqual(ctx.params, [ 'a', 'b', 'c' ]);
    });

    it('should extract `module.exports` function expressions', () => {
      let ctx = parser.parse('module.exports = function foo(a, b, c) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'expression');
      assert.equal(ctx.name, 'foo');
      assert.deepEqual(ctx.params, [ 'a', 'b', 'c' ]);
    });

    it('should support class, extends and is exported as default', () => {
      let ctx = parser.parse('export default class FooBar extends Foo.Baz {');
      assert.equal(ctx.type, 'class');
      assert.equal(ctx.name, 'FooBar');
      assert.equal(ctx.ctor, 'FooBar');
      assert.equal(ctx.extends, 'Foo.Baz');
      assert.equal(ctx.string, 'new FooBar()');
    });

    it('should parse inline prototype properties', () => {
      let ctx = parser.parse('App.prototype = {');
      assert.equal(ctx.type, 'prototype');
      assert.equal(ctx.ctor, 'App');
      assert.equal(ctx.name, 'App');
      assert.equal(ctx.string, 'App.prototype');
    });

    it('should extract prototype methods', () => {
      let ctx = parser.parse('App.prototype.get = function(a, b, c) {}');
      assert.equal(ctx.type, 'prototype method');
      assert.equal(ctx.ctor, 'App');
      assert.equal(ctx.name, 'get');
      assert.deepEqual(ctx.params, [ 'a', 'b', 'c' ]);
    });

    it('should support passing a parent name to properties', () => {
      let ctx = parser.parse('enabled: true;\nasdf', 'Foo');
      assert.equal(ctx.ctor, 'Foo');
      assert.equal(ctx.type, 'property');
      assert.equal(ctx.name, 'enabled');
      assert.equal(ctx.string, 'Foo.enabled');
    });

    it('should extract prototype properties', () => {
      let ctx = parser.parse('App.prototype.enabled = true;\nasdf');
      assert.equal(ctx.type, 'prototype property');
      assert.equal(ctx.ctor, 'App');
      assert.equal(ctx.name, 'enabled');
      assert.equal(ctx.value, 'true');
    });

    it('should extract methods', () => {
      let ctx = parser.parse('option.get = function(a, b, c) {}');
      assert.equal(ctx.type, 'method');
      assert.equal(ctx.receiver, 'option');
      assert.equal(ctx.name, 'get');
      assert.deepEqual(ctx.params, [ 'a', 'b', 'c' ]);
    });

    it('should extract properties', () => {
      let ctx = parser.parse('option.name = "delims";\nasdf');
      assert.equal(ctx.type, 'property');
      assert.equal(ctx.receiver, 'option');
      assert.equal(ctx.name, 'name');
      assert.equal(ctx.value, '"delims"');
    });

    it('should extract declarations', () => {
      let ctx = parser.parse('let name = "delims";\nasdf');
      assert.equal(ctx.type, 'declaration');
      assert.equal(ctx.name, 'name');
      assert.equal(ctx.value, '"delims"');
    });
  });

  describe('context params:', () => {
    it('should extract function statement params', () => {
      let ctx = parser.parse('function app(a, b) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'statement');
      assert.deepEqual(ctx.params, ['a', 'b']);
    });

    it('should extract function statement params with newlines', () => {
      let ctx = parser.parse('function app(\n a,\n b) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'statement');
      assert.deepEqual(ctx.params, ['a', 'b']);
    });

    it('should extract function expression params', () => {
      let ctx = parser.parse('let app = function(foo, bar) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'expression');
      assert.deepEqual(ctx.params, ['foo', 'bar']);
    });

    it('should extract function expression params with newlines', () => {
      let ctx = parser.parse('let app = function(foo,\n bar) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'expression');
      assert.deepEqual(ctx.params, ['foo', 'bar']);
    });

    it('should extract function expression params', () => {
      let ctx = parser.parse('let app=function(foo,bar) {\n\n}');
      assert.equal(ctx.type, 'function');
      assert.equal(ctx.subtype, 'expression');
      assert.deepEqual(ctx.params, ['foo', 'bar']);
    });

    it('should extract prototype method params', () => {
      let ctx = parser.parse('App.prototype.get = function(key, value, options) {}');
      assert.equal(ctx.type, 'prototype method');
      assert.equal(ctx.ctor, 'App');
      assert.deepEqual(ctx.params, ['key', 'value', 'options']);
    });

    it('should extract class', (cb) => {
      fixtures('class.js', (err, str) => {
        if (err) return cb(err);

        let matches = [];
        let i = 0;
        str.split('\n').forEach(function(line) {
          line = line.replace(/^\s+/, '');
          let ctx = parser.parse(line);
          if (ctx) {
            matches.push(ctx);
          }
        });

        assert.equal(matches[i].type, 'class');
        assert.equal(matches[i].ctor, 'FooBar');
        assert.equal(matches[i].name, 'FooBar');
        assert.equal(matches[i].extends, 'Foo.Baz');
        assert.equal(matches[i].string, 'new FooBar()');

        i++;
        assert.equal(matches[i].type, 'constructor');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, 'constructor');
        assert.equal(matches[i].params[0], '');
        assert.equal(matches[i].string, 'constructor()');

        i++;
        assert.equal(matches[i].type, 'property');
        assert.equal(matches[i].receiver, 'this');
        assert.equal(matches[i].name, 'options');
        assert.equal(matches[i].value, 'options');
        assert.equal(matches[i].string, 'this.options');

        i++;
        assert.equal(matches[i].type, 'method');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, 'bar');
        assert.deepEqual(matches[i].params, ['']);
        assert.equal(matches[i].string, 'bar()');

        i++;
        assert.equal(matches[i].type, 'method');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, 'staticMethod');
        assert.deepEqual(matches[i].params, ['']);
        assert.equal(matches[i].string, 'staticMethod()');

        i++;
        assert.equal(matches[i].type, 'method');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, '*staticGeneratorMethod');
        assert.deepEqual(matches[i].params, ['']);
        assert.equal(matches[i].string, '*staticGeneratorMethod()');

        i++;
        assert.equal(matches[i].type, 'method');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, '*[Symbol.iterator]');
        assert.deepEqual(matches[i].params, ['']);
        assert.equal(matches[i].string, '*[Symbol.iterator]()');

        i++;
        assert.equal(matches[i].type, 'method');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, 'for');
        assert.deepEqual(matches[i].params, ['let', 'arg', 'of', 'this.args']);
        assert.equal(matches[i].string, 'for()');

        i++;
        assert.equal(matches[i].type, 'property');
        assert.equal(matches[i].receiver, 'this');
        assert.equal(matches[i].name, '_blah');
        assert.equal(matches[i].value, '"blah"');
        assert.equal(matches[i].string, 'this._blah');

        i++;
        assert.equal(matches[i].type, 'class');
        assert.equal(matches[i].ctor, 'Baz');
        assert.equal(matches[i].name, 'Baz');
        assert.equal(matches[i].extends, 'FooBar');
        assert.equal(matches[i].string, 'new Baz()');

        i++;
        assert.equal(matches[i].type, 'constructor');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, 'constructor');
        assert.deepEqual(matches[6].params, ['']);
        assert.equal(matches[i].string, 'constructor()');

        i++;
        assert.equal(matches[i].type, 'property');
        assert.equal(matches[i].receiver, 'this');
        assert.equal(matches[i].name, 'options');
        assert.equal(matches[i].value, 'options');
        assert.equal(matches[i].string, 'this.options');

        i++;
        assert.equal(matches[i].type, 'class');
        assert.equal(matches[i].ctor, 'Lorem');
        assert.equal(matches[i].name, 'Lorem');
        assert.equal(matches[i].extends, undefined);
        assert.equal(matches[i].string, 'new Lorem()');

        i++;
        assert.equal(matches[i].type, 'constructor');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, 'constructor');
        assert.deepEqual(matches[i].params, ['']);
        assert.equal(matches[i].string, 'constructor()');

        i++;
        assert.equal(matches[i].type, 'property');
        assert.equal(matches[i].receiver, 'this');
        assert.equal(matches[i].name, 'options');
        assert.equal(matches[i].value, 'options');
        assert.equal(matches[i].string, 'this.options');

        i++;
        assert.equal(matches[i].type, 'class');
        assert.equal(matches[i].ctor, 'Ipsum');
        assert.equal(matches[i].name, 'Ipsum');
        assert.equal(matches[i].extends, 'mixin(Foo.Bar, Baz)');
        assert.equal(matches[i].string, 'new Ipsum()');

        i++;
        assert.equal(matches[i].type, 'constructor');
        assert.equal(matches[i].ctor, undefined);
        assert.equal(matches[i].name, 'constructor');
        assert.deepEqual(matches[i].params, ['']);
        assert.equal(matches[i].string, 'constructor()');

        i++;
        assert.equal(matches[i].type, 'property');
        assert.equal(matches[i].receiver, 'this');
        assert.equal(matches[i].name, 'options');
        assert.equal(matches[i].value, 'options');
        assert.equal(matches[i].string, 'this.options');
        cb();
      });
    });
  });
});
